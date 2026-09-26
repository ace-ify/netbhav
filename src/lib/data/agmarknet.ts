import type { PriceRecord, TrendPoint } from "@/lib/types";
import { MANDIS } from "./mandis";
import { getCrop } from "./crops";
import { seedPricesFor } from "./prices.seed";

// Cache-first mandi price client. Order: cache → keyless Mandi API → data.gov.in
// (if a key is set) → bundled seed. The farmer is NEVER blocked by a flaky
// upstream. This is the pitch's "FAST + HONEST + keyless fallback" made real.

const RESOURCE = "9ef84268-d588-465a-a308-a864a43d0070";
const BASE = `https://api.data.gov.in/resource/${RESOURCE}`;
// Public sample key ships with data.gov.in demos; override via env for real use.
const API_KEY =
  process.env.DATA_GOV_API_KEY || "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b";
// Keyless, live Agmarknet mirror (primary source — no key, works out of the box).
const MANDI_API = process.env.MANDI_API_URL || "https://mandi-api.onrender.com";
const STATE = process.env.MANDI_STATE || "Madhya Pradesh";
const TIMEOUT_MS = 3500;
const MANDI_API_TIMEOUT_MS = 9000; // Render free tier can cold-start; give it room
const TTL_MS = 3 * 60 * 60 * 1000; // 3-hour freshness, matching a pg_cron sync cadence
const FAIL_TTL_MS = 2 * 60 * 1000; // re-try a failed/empty live fetch after 2 min

// Both data.gov.in and the Mandi API return these fields (prices as string OR
// number — Number() handles both).
interface AgmarknetRecord {
  market: string;
  commodity: string;
  arrival_date: string;
  min_price: string | number;
  max_price: string | number;
  modal_price: string | number;
}

interface CacheEntry {
  at: number;
  records: PriceRecord[];
  live: boolean;
}
const cache = new Map<string, CacheEntry>();

export interface PriceBundle {
  records: PriceRecord[];
  source: "agmarknet" | "seed" | "mixed";
  fetchedAt: string;
  freshness: "live" | "cached" | "seed";
}

/** Prices for a crop across our mandis, best available source, never throws. */
export async function getPrices(cropId: string): Promise<PriceBundle> {
  const seed = seedPricesFor(cropId);
  const cached = cache.get(cropId);
  // Cache live results for the full 3h; cache misses only briefly, so a Render
  // cold-start timeout doesn't lock us onto seed data for hours.
  const effectiveTtl = cached?.live ? TTL_MS : FAIL_TTL_MS;
  const fresh = cached && Date.now() - cached.at < effectiveTtl;

  if (fresh && cached) {
    return {
      records: mergeWithSeed(cached.records, seed),
      source: cached.live ? "mixed" : "seed",
      fetchedAt: new Date(cached.at).toISOString(),
      freshness: cached.live ? "cached" : "seed",
    };
  }

  const live = await fetchLive(cropId).catch(() => []);
  cache.set(cropId, { at: Date.now(), records: live, live: live.length > 0 });

  if (live.length > 0) {
    return {
      records: mergeWithSeed(live, seed),
      source: "mixed",
      fetchedAt: new Date().toISOString(),
      freshness: "live",
    };
  }
  return {
    records: seed,
    source: "seed",
    fetchedAt: new Date().toISOString(),
    freshness: "seed",
  };
}

// Primary: keyless Mandi API. Secondary: data.gov.in (only if it adds mandis
// the first source missed). Either failing just yields fewer/zero live rows.
async function fetchLive(cropId: string): Promise<PriceRecord[]> {
  const primary = await fetchFromMandiApi(cropId).catch(() => []);
  // If the keyless source covered enough mandis, don't bother the slow gov API.
  if (primary.length >= 3) return primary;
  const gov = await fetchFromDataGov(cropId).catch(() => []);
  return mergeById(primary, gov);
}

// Keyless live Agmarknet mirror — no API key, returns per-market rows.
async function fetchFromMandiApi(cropId: string): Promise<PriceRecord[]> {
  const commodity = getCrop(cropId).agmarknet;
  const url =
    `${MANDI_API}/v1/prices?state=${encodeURIComponent(STATE)}` +
    `&commodity=${encodeURIComponent(commodity)}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), MANDI_API_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as { success?: boolean; data?: AgmarknetRecord[] };
    return mapRecords(cropId, json.data || []);
  } finally {
    clearTimeout(t);
  }
}

async function fetchFromDataGov(cropId: string): Promise<PriceRecord[]> {
  const commodity = getCrop(cropId).agmarknet;
  const url =
    `${BASE}?api-key=${API_KEY}&format=json&limit=500` +
    `&filters[state.keyword]=${encodeURIComponent(STATE)}` +
    `&filters[commodity]=${encodeURIComponent(commodity)}`;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as { records?: AgmarknetRecord[] };
    return mapRecords(cropId, json.records || []);
  } finally {
    clearTimeout(t);
  }
}

function mergeById(a: PriceRecord[], b: PriceRecord[]): PriceRecord[] {
  const byMandi = new Map(a.map((r) => [r.mandiId, r]));
  for (const r of b) if (!byMandi.has(r.mandiId)) byMandi.set(r.mandiId, r);
  return [...byMandi.values()];
}

/** Map Agmarknet market names to our known mandi ids (best-effort fuzzy). */
function mapRecords(cropId: string, recs: AgmarknetRecord[]): PriceRecord[] {
  const out: PriceRecord[] = [];
  const seen = new Set<string>();
  for (const r of recs) {
    const mandi = matchMandi(r.market);
    if (!mandi || seen.has(mandi.id)) continue;
    const modal = Number(r.modal_price);
    if (!Number.isFinite(modal) || modal <= 0) continue;
    seen.add(mandi.id);
    out.push({
      mandiId: mandi.id,
      crop: cropId,
      modalPricePerQuintal: modal,
      minPricePerQuintal: Number(r.min_price) || modal,
      maxPricePerQuintal: Number(r.max_price) || modal,
      arrivalDate: normalizeDate(r.arrival_date),
      source: "agmarknet",
    });
  }
  return out;
}

function matchMandi(market: string) {
  const m = norm(market);
  return MANDIS.find((mn) => {
    const town = norm(mn.name.replace(/\(.*\)/, "")); // drop yard qualifier
    return m.includes(town) || town.includes(m);
  });
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

function normalizeDate(d: string): string {
  const s = (d ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // already ISO (Mandi API)
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s); // data.gov.in dd/mm/yyyy
  return m ? `${m[3]}-${m[2]}-${m[1]}` : new Date().toISOString().slice(0, 10);
}

/** Live records win; seed fills mandis the live feed didn't cover. */
function mergeWithSeed(live: PriceRecord[], seed: PriceRecord[]): PriceRecord[] {
  const byMandi = new Map(live.map((r) => [r.mandiId, r]));
  for (const s of seed) if (!byMandi.has(s.mandiId)) byMandi.set(s.mandiId, s);
  return [...byMandi.values()];
}

// ── Real price history (for trend chart + advisory) ─────────────────────────
interface HistoryRow {
  arrival_date: string;
  avg_modal_price: number | string;
}
const historyCache = new Map<string, { at: number; points: TrendPoint[] }>();

/** REAL state-level daily price history for a crop, from the Mandi API.
 * Returns [] if unavailable (caller falls back to a synthetic reference curve). */
export async function getCropHistory(cropId: string): Promise<TrendPoint[]> {
  const cached = historyCache.get(cropId);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.points;

  const commodity = getCrop(cropId).agmarknet;
  const url =
    `${MANDI_API}/v1/prices/history?state=${encodeURIComponent(STATE)}` +
    `&commodity=${encodeURIComponent(commodity)}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), MANDI_API_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: HistoryRow[] };
    const points: TrendPoint[] = (json.data || [])
      .map((r) => ({
        date: r.arrival_date,
        modalPricePerQuintal: Math.round(Number(r.avg_modal_price)),
      }))
      .filter((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.date) && p.modalPricePerQuintal > 0);
    historyCache.set(cropId, { at: Date.now(), points });
    return points;
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

