// Farmer profile store. Persists to Supabase (PostgREST, no SDK dep) when
// SUPABASE_URL + SUPABASE_SERVICE_KEY are set — survives serverless restarts on
// Vercel. Falls back to a local atomic-write JSON file when they're absent
// (local dev / tests). Whole store lives in one jsonb row (demo-scale simple).
// ponytail: single kv row + per-process write queue; move to per-farmer rows +
// row locks if farmer count or write concurrency grows.
import { promises as fs } from "fs";
import path from "path";
import { DEMO_FARMER } from "@/lib/data/mandis";

export interface FarmerCrop {
  cropId: string;
  expectedQuintals: number;
  readyByISO?: string;
}
export interface AlertEntry {
  atISO: string;
  channel: "whatsapp" | "voice" | "sms" | "dashboard";
  message: string;
}
export interface FarmerSnapshot {
  atISO: string;
  bestMandiId: string;
  netPerQuintal: number;
  signal: "SELL" | "WAIT" | "MONITOR";
}
export interface FarmerProfile {
  phone: string; // normalized +91XXXXXXXXXX (the key)
  name?: string;
  lat: number;
  lng: number;
  locationLabel?: string;
  lang: "hi" | "en";
  crops: FarmerCrop[];
  storable?: boolean;
  fpo?: boolean;
  consentToCall: boolean;
  quietHours?: [number, number]; // [startHour, endHour] 0-23, local
  lastSnapshot?: FarmerSnapshot;
  alertHistory: AlertEntry[];
}

type Store = Record<string, FarmerProfile>;

// Path is read lazily (not a module const) so tests can point it at a temp file.
function storePath(): string {
  return process.env.FARMERS_STORE_PATH || path.join(process.cwd(), "data", "farmers.json");
}

export const DEMO_PHONE = "+918756260291";

/** Normalize any Indian phone / WhatsApp id to +91XXXXXXXXXX (or "" if unusable). */
export function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/[^\d]/g, "");
  let d = digits;
  if (d.length === 10) d = "91" + d;
  else if (d.length === 12 && d.startsWith("91")) {
    /* ok */
  } else if (d.length === 11 && d.startsWith("0")) d = "91" + d.slice(1);
  else if (d.length > 12 && d.endsWith(d.slice(-10))) d = "91" + d.slice(-10);
  if (d.length !== 12 || !d.startsWith("91")) return "";
  return "+" + d;
}

// Seed farmers across the central-UP belt so the dashboard + admin console show
// real, varied data on first run (persisted to Supabase on the first write).
function seedFarmers(): FarmerProfile[] {
  const now = new Date().toISOString();
  return [
    {
      phone: DEMO_PHONE, // Naimish — the primary demo farmer
      name: "Naimish",
      lat: DEMO_FARMER.lat,
      lng: DEMO_FARMER.lng,
      locationLabel: DEMO_FARMER.name,
      lang: "en",
      crops: [{ cropId: "wheat", expectedQuintals: 50 }, { cropId: "mustard", expectedQuintals: 20 }],
      consentToCall: true,
      quietHours: [21, 7],
      lastSnapshot: { atISO: now, bestMandiId: "lucknow", netPerQuintal: 2380, signal: "WAIT" },
      alertHistory: [],
    },
    {
      phone: "+919820010002", name: "Ramesh Yadav",
      lat: 26.42, lng: 80.33, locationLabel: "Kanpur Nagar", lang: "hi",
      crops: [{ cropId: "paddy", expectedQuintals: 80 }],
      consentToCall: true, alertHistory: [],
    },
    {
      phone: "+919820010003", name: "Sunita Devi",
      lat: 27.57, lng: 80.68, locationLabel: "Sitapur", lang: "hi",
      crops: [{ cropId: "potato", expectedQuintals: 120 }],
      consentToCall: false, alertHistory: [],
    },
    {
      phone: "+919820010004", name: "Imran Khan",
      lat: 26.92, lng: 81.18, locationLabel: "Barabanki", lang: "hi",
      crops: [{ cropId: "arhar", expectedQuintals: 30 }],
      consentToCall: true, alertHistory: [],
    },
    {
      phone: "+919820010005", name: "Lakshmi Prasad",
      lat: 27.13, lng: 81.96, locationLabel: "Gonda", lang: "hi",
      crops: [{ cropId: "tomato", expectedQuintals: 15 }],
      consentToCall: true, alertHistory: [],
    },
    {
      phone: "+919820010006", name: "Vijay Singh",
      lat: 26.22, lng: 81.23, locationLabel: "Rae Bareli", lang: "hi",
      crops: [{ cropId: "mustard", expectedQuintals: 40 }],
      consentToCall: false, alertHistory: [],
    },
  ];
}

/** Seed an empty store so the dashboard/admin show something on first run. */
function withSeed(store: Store): Store {
  if (Object.keys(store).length === 0) {
    for (const f of seedFarmers()) store[f.phone] = f;
  }
  return store;
}

async function readStore(): Promise<Store> {
  const sb = await supabaseRead();
  if (sb !== null) return sb;
  try {
    const raw = await fs.readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Store) : {};
  } catch {
    return {}; // missing or corrupt → empty; seed fills first run
  }
}

async function writeStore(store: Store): Promise<void> {
  if (await supabaseWrite(store)) return;
  const target = storePath();
  await fs.mkdir(path.dirname(target), { recursive: true });
  const tmp = `${target}.tmp.${process.pid}.${Math.random().toString(36).slice(2)}`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tmp, target); // atomic on the same filesystem
}

// ── Supabase (PostgREST) backend — whole store in one jsonb row `key='farmers'`.
// Table: netbhav_kv(key text primary key, value jsonb). Returns null when
// Supabase isn't configured so the file fallback kicks in.
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
function sbEnabled() {
  return Boolean(SB_URL && SB_KEY);
}
function sbHeaders() {
  return { apikey: SB_KEY as string, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };
}
async function supabaseRead(): Promise<Store | null> {
  if (!sbEnabled()) return null;
  try {
    const res = await fetch(`${SB_URL}/rest/v1/netbhav_kv?key=eq.farmers&select=value`, {
      headers: sbHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return {};
    const rows = (await res.json()) as { value: Store }[];
    return rows[0]?.value ?? {};
  } catch {
    return {}; // reachable-but-erroring → treat as empty (seed fills)
  }
}
async function supabaseWrite(store: Store): Promise<boolean> {
  if (!sbEnabled()) return false;
  try {
    await fetch(`${SB_URL}/rest/v1/netbhav_kv`, {
      method: "POST",
      headers: { ...sbHeaders(), Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify([{ key: "farmers", value: store }]),
    });
    return true;
  } catch {
    return true; // configured → don't silently fall back to a stale local file
  }
}

// Serialize all read-modify-write mutations so parallel requests don't clobber.
let writeChain: Promise<unknown> = Promise.resolve();
function mutate<T>(fn: (store: Store) => T): Promise<T> {
  const run = writeChain.then(async () => {
    const store = withSeed(await readStore());
    const result = fn(store);
    await writeStore(store);
    return result;
  });
  writeChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export async function get(phone: string): Promise<FarmerProfile | null> {
  const key = normalizePhone(phone);
  if (!key) return null;
  return withSeed(await readStore())[key] ?? null;
}

export async function list(): Promise<FarmerProfile[]> {
  return Object.values(withSeed(await readStore()));
}

/** Create or shallow-merge a profile. `crops` fully replaces if provided. */
export async function upsert(phone: string, patch: Partial<FarmerProfile>): Promise<FarmerProfile> {
  const key = normalizePhone(phone);
  if (!key) throw new Error("invalid phone");
  return mutate((store) => {
    const existing: FarmerProfile =
      store[key] ??
      {
        phone: key,
        lat: DEMO_FARMER.lat,
        lng: DEMO_FARMER.lng,
        lang: "hi",
        crops: [],
        consentToCall: false,
        alertHistory: [],
      };
    const merged: FarmerProfile = { ...existing, ...patch, phone: key };
    store[key] = merged;
    return merged;
  });
}

/** Merge one queried crop+qty into the profile (the lazy profile-builder). */
export async function mergeCrop(phone: string, cropId: string, expectedQuintals: number): Promise<void> {
  const key = normalizePhone(phone);
  if (!key) return;
  await mutate((store) => {
    const p = store[key];
    if (!p) return;
    const found = p.crops.find((c) => c.cropId === cropId);
    if (found) found.expectedQuintals = expectedQuintals;
    else p.crops.push({ cropId, expectedQuintals });
  });
}

export interface SnapshotInput {
  bestMandiId: string;
  netPerQuintal: number;
  signal: "SELL" | "WAIT" | "MONITOR";
}
export async function recordSnapshot(phone: string, snap: SnapshotInput): Promise<void> {
  const key = normalizePhone(phone);
  if (!key) return;
  await mutate((store) => {
    const p = store[key];
    if (!p) return;
    p.lastSnapshot = { atISO: new Date().toISOString(), ...snap };
  });
}

export async function appendAlert(phone: string, entry: AlertEntry): Promise<void> {
  const key = normalizePhone(phone);
  if (!key) return;
  await mutate((store) => {
    const p = store[key];
    if (!p) return;
    p.alertHistory = [...(p.alertHistory ?? []), entry].slice(-50);
  });
}
