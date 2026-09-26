import type { PriceRecord, TrendPoint } from "@/lib/types";

// Seed prices (₹/quintal) reflecting 2024-25 central-UP mandi bands. Used as the
// cache-first primary for the demo and as the fallback when Agmarknet is
// unreachable. [mandiId, modal, min, max]. Mandi ids match data/mandis.ts.
type Row = [string, number, number, number];

const TODAY = new Date().toISOString().slice(0, 10);

// WHEAT — the headline demo. A far mandi (Gonda ~125km, Shahjahanpur ~140km)
// posts the highest sticker, but transport eats it: near Lucknow/Unnao win take-home.
const WHEAT: Row[] = [
  ["lucknow", 2510, 2350, 2720], ["barabanki", 2530, 2360, 2740],
  ["unnao", 2540, 2370, 2760], ["sitapur", 2560, 2380, 2780],
  ["hardoi", 2570, 2390, 2800], ["raebareli", 2545, 2370, 2760],
  ["lakhimpur", 2555, 2380, 2780], ["kanpur", 2600, 2400, 2860],
  ["fatehpur", 2560, 2380, 2790], ["sultanpur", 2540, 2360, 2760],
  ["amethi", 2535, 2360, 2750], ["ayodhya", 2580, 2390, 2820],
  ["gonda", 2720, 2450, 3050], ["bahraich", 2690, 2440, 3000],
  ["pratapgarh", 2550, 2370, 2770], ["kannauj", 2565, 2385, 2790],
  ["farrukhabad", 2575, 2390, 2810], ["shahjahanpur", 2700, 2450, 3020],
];

// PADDY (Dhan) — UP flagship kharif crop.
const PADDY: Row[] = [
  ["lucknow", 2280, 2100, 2450], ["barabanki", 2300, 2120, 2480],
  ["unnao", 2260, 2080, 2430], ["sitapur", 2320, 2150, 2500],
  ["hardoi", 2330, 2160, 2520], ["raebareli", 2290, 2110, 2460],
  ["lakhimpur", 2350, 2180, 2540], ["kanpur", 2310, 2130, 2490],
  ["fatehpur", 2280, 2100, 2450], ["sultanpur", 2295, 2110, 2470],
  ["ayodhya", 2340, 2160, 2520], ["gonda", 2360, 2180, 2560],
  ["bahraich", 2370, 2190, 2580], ["shahjahanpur", 2355, 2180, 2550],
  ["kannauj", 2300, 2120, 2480], ["farrukhabad", 2310, 2130, 2490],
];

// POTATO — UP is India's #1 producer; low per-quintal, storable tuber.
const POTATO: Row[] = [
  ["lucknow", 1150, 700, 1600], ["barabanki", 1120, 680, 1560],
  ["unnao", 1100, 660, 1540], ["hardoi", 1180, 720, 1650],
  ["kanpur", 1200, 740, 1680], ["farrukhabad", 1250, 780, 1720],
  ["kannauj", 1230, 760, 1700], ["fatehpur", 1140, 700, 1580],
  ["sitapur", 1160, 710, 1600], ["shahjahanpur", 1210, 750, 1690],
];

// MUSTARD (Sarson) — rabi oilseed.
const MUSTARD: Row[] = [
  ["lucknow", 5450, 5000, 5900], ["barabanki", 5480, 5050, 5950],
  ["hardoi", 5500, 5080, 5980], ["sitapur", 5470, 5030, 5930],
  ["unnao", 5440, 5000, 5880], ["kanpur", 5520, 5100, 6000],
  ["fatehpur", 5460, 5020, 5900], ["shahjahanpur", 5540, 5120, 6050],
  ["farrukhabad", 5510, 5090, 5990], ["gonda", 5490, 5060, 5960],
];

// ARHAR (Tur) — pulse.
const ARHAR: Row[] = [
  ["lucknow", 7400, 6800, 8000], ["kanpur", 7500, 6900, 8100],
  ["barabanki", 7420, 6820, 8020], ["raebareli", 7380, 6780, 7980],
  ["fatehpur", 7450, 6850, 8050], ["sultanpur", 7360, 6760, 7960],
  ["hardoi", 7470, 6870, 8070], ["unnao", 7410, 6810, 8010],
];

// GRAM (Chana) — pulse.
const GRAM: Row[] = [
  ["lucknow", 5600, 5100, 6100], ["kanpur", 5700, 5200, 6200],
  ["hardoi", 5650, 5150, 6150], ["sitapur", 5620, 5120, 6120],
  ["unnao", 5580, 5080, 6080], ["fatehpur", 5660, 5160, 6160],
  ["shahjahanpur", 5720, 5220, 6220], ["farrukhabad", 5680, 5180, 6180],
];

// MAIZE (Makka).
const MAIZE: Row[] = [
  ["lucknow", 2050, 1800, 2300], ["bahraich", 2120, 1850, 2380],
  ["lakhimpur", 2100, 1840, 2360], ["gonda", 2110, 1850, 2370],
  ["sitapur", 2080, 1820, 2340], ["hardoi", 2070, 1810, 2330],
  ["kanpur", 2090, 1830, 2350], ["shahjahanpur", 2130, 1860, 2390],
];

// ONION — perishable (spoilage demo). Volatile band.
const ONION: Row[] = [
  ["lucknow", 1800, 700, 3200], ["kanpur", 1750, 650, 3100],
  ["barabanki", 1700, 620, 3000], ["hardoi", 1650, 600, 2900],
  ["sitapur", 1680, 610, 2950], ["ayodhya", 1720, 630, 3050],
  ["gonda", 1620, 590, 2880], ["shahjahanpur", 1760, 660, 3120],
];

// GARLIC — high-value, low spoilage (cured stores for months).
const GARLIC: Row[] = [
  ["lucknow", 11000, 5000, 18000], ["kanpur", 11500, 5200, 19000],
  ["hardoi", 10800, 4900, 17500], ["farrukhabad", 12000, 5500, 20000],
  ["kannauj", 11800, 5400, 19500], ["shahjahanpur", 11200, 5100, 18500],
];

// TOMATO — most perishable of the set.
const TOMATO: Row[] = [
  ["lucknow", 1900, 800, 3500], ["barabanki", 1850, 780, 3400],
  ["kanpur", 1950, 820, 3600], ["unnao", 1820, 760, 3350],
  ["sitapur", 1880, 790, 3450], ["hardoi", 1830, 770, 3380],
];

function toRecords(crop: string, rows: Row[]): PriceRecord[] {
  return rows.map(([mandiId, modal, min, max]) => ({
    mandiId,
    crop,
    modalPricePerQuintal: modal,
    minPricePerQuintal: min,
    maxPricePerQuintal: max,
    arrivalDate: TODAY,
    source: "seed",
  }));
}

export const SEED_PRICES: PriceRecord[] = [
  ...toRecords("wheat", WHEAT),
  ...toRecords("paddy", PADDY),
  ...toRecords("potato", POTATO),
  ...toRecords("mustard", MUSTARD),
  ...toRecords("arhar", ARHAR),
  ...toRecords("gram", GRAM),
  ...toRecords("maize", MAIZE),
  ...toRecords("onion", ONION),
  ...toRecords("garlic", GARLIC),
  ...toRecords("tomato", TOMATO),
];

export function seedPricesFor(crop: string): PriceRecord[] {
  return SEED_PRICES.filter((p) => p.crop === crop);
}

// Deterministic 30-day trend around a mandi's modal price. Seeded by
// mandiId+crop so the chart is stable across renders (no DB needed).
// ponytail: synthetic history; swap for pg_cron daily snapshots when live.
export function trendFor(mandiId: string, crop: string, days = 30): TrendPoint[] {
  const rec = SEED_PRICES.find((p) => p.mandiId === mandiId && p.crop === crop);
  const base = rec?.modalPricePerQuintal ?? 2500;
  let seed = hash(mandiId + crop);
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const out: TrendPoint[] = [];
  const today = new Date();
  let price = base * (0.9 + rand() * 0.08); // start a bit below current
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const drift = (rand() - 0.45) * base * 0.03; // small daily wiggle + slight uptrend
    price = Math.max(base * 0.75, Math.min(base * 1.2, price + drift));
    out.push({ date: d.toISOString().slice(0, 10), modalPricePerQuintal: Math.round(price) });
  }
  // Pin the last point to the current modal price so chart end == shown price.
  if (out.length) out[out.length - 1].modalPricePerQuintal = base;
  return out;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h & 0x7fffffff;
}
