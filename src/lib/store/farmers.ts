// Farmer profile store — a tiny JSON file with ATOMIC writes (temp + rename),
// writes serialized through an in-process queue so concurrent API calls can't
// corrupt the file or lose updates. Path is env-overridable for tests.
// ponytail: swap for Turso/Postgres (DATABASE_URL) on serverless deploy — fs is
// ephemeral there. Single writer per process is the known ceiling.
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

export const DEMO_PHONE = "+919999900000";

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

function demoProfile(): FarmerProfile {
  return {
    phone: DEMO_PHONE,
    name: "Ramesh (demo)",
    lat: DEMO_FARMER.lat,
    lng: DEMO_FARMER.lng,
    locationLabel: DEMO_FARMER.name,
    lang: "hi",
    crops: [{ cropId: "wheat", expectedQuintals: 50 }],
    consentToCall: false,
    alertHistory: [],
  };
}

/** Seed an empty store with the demo farmer so the dashboard shows something. */
function withSeed(store: Store): Store {
  if (Object.keys(store).length === 0) store[DEMO_PHONE] = demoProfile();
  return store;
}

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Store) : {};
  } catch {
    return {}; // missing or corrupt → empty; seed fills first run
  }
}

async function writeStore(store: Store): Promise<void> {
  const target = storePath();
  await fs.mkdir(path.dirname(target), { recursive: true });
  const tmp = `${target}.tmp.${process.pid}.${Math.random().toString(36).slice(2)}`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tmp, target); // atomic on the same filesystem
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
