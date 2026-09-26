import type { PriceRecord, TrendPoint } from "@/lib/types";

// Seed prices (₹/quintal) reflecting 2024-25 MP mandi bands. Used as the
// cache-first primary for the demo and as the fallback when Agmarknet is
// unreachable (it often is). [mandiId, modal, min, max].
type Row = [string, number, number, number];

const TODAY = new Date().toISOString().slice(0, 10);

const WHEAT: Row[] = [
  ["indore-choithram", 2620, 2400, 2950], ["indore-chhawni", 2650, 2420, 3050],
  ["mhow", 2550, 2380, 2820], ["sanwer", 2580, 2400, 2860],
  ["depalpur", 2540, 2360, 2800], ["dewas", 2600, 2400, 2900],
  ["sonkatch", 2720, 2450, 3250], ["bagli", 2560, 2380, 2820],
  ["kannod", 2570, 2380, 2830], ["khategaon", 2590, 2400, 2880],
  ["ujjain-chimanganj", 2610, 2400, 2950], ["badnagar", 2560, 2380, 2840],
  ["tarana", 2570, 2390, 2850], ["nagda", 2540, 2360, 2800],
  ["dhar", 2530, 2350, 2790], ["badnawar", 2560, 2380, 2860],
  ["ratlam", 2580, 2380, 2900], ["jaora", 2560, 2380, 2860],
  ["shajapur", 2590, 2400, 2900], ["shujalpur", 2600, 2400, 2950],
  ["sehore", 2780, 2480, 3400], ["ashta", 2740, 2450, 3300],
  ["agar-malwa", 2560, 2380, 2850], ["bhopal-karond", 2650, 2420, 3100],
];

const SOYBEAN: Row[] = [
  ["indore-choithram", 4550, 4000, 4850], ["mhow", 4450, 3950, 4750],
  ["sanwer", 4480, 3980, 4780], ["depalpur", 4420, 3920, 4720],
  ["dewas", 4520, 4000, 4820], ["sonkatch", 4500, 3980, 4800],
  ["bagli", 4460, 3950, 4760], ["kannod", 4440, 3930, 4740],
  ["khategaon", 4470, 3950, 4770], ["ujjain-chimanganj", 4530, 4000, 4830],
  ["badnagar", 4460, 3950, 4760], ["tarana", 4470, 3950, 4770],
  ["nagda", 4430, 3920, 4730], ["dhar", 4410, 3900, 4710],
  ["badnawar", 4450, 3950, 4750], ["ratlam", 4500, 3980, 4820],
  ["jaora", 4480, 3960, 4780], ["shajapur", 4510, 3980, 4810],
  ["shujalpur", 4520, 3990, 4820], ["sehore", 4540, 4000, 4850],
  ["ashta", 4530, 4000, 4840], ["agar-malwa", 4490, 3960, 4790],
  ["bhopal-karond", 4520, 3990, 4820],
];

const GRAM: Row[] = [
  ["indore-choithram", 6600, 5600, 7200], ["indore-chhawni", 6650, 5650, 7300],
  ["mhow", 6350, 5500, 6900], ["sanwer", 6400, 5500, 6950],
  ["depalpur", 6300, 5450, 6850], ["dewas", 6500, 5550, 7050],
  ["sonkatch", 6450, 5500, 7000], ["bagli", 6300, 5450, 6850],
  ["kannod", 6280, 5450, 6830], ["khategaon", 6350, 5500, 6900],
  ["ujjain-chimanganj", 6550, 5550, 7100], ["badnagar", 6350, 5500, 6900],
  ["tarana", 6380, 5500, 6930], ["nagda", 6320, 5480, 6870],
  ["dhar", 6280, 5450, 6820], ["badnawar", 6360, 5500, 6910],
  ["ratlam", 6480, 5550, 7000], ["jaora", 6420, 5520, 6950],
  ["shajapur", 6500, 5550, 7050], ["shujalpur", 6520, 5550, 7080],
  ["sehore", 6550, 5580, 7100], ["ashta", 6530, 5560, 7080],
  ["agar-malwa", 6400, 5500, 6950], ["bhopal-karond", 6600, 5600, 7200],
];

const ONION: Row[] = [
  ["indore-choithram", 1700, 600, 3200], ["mhow", 1500, 500, 2800],
  ["sanwer", 1550, 500, 2900], ["dewas", 1600, 550, 3000],
  ["khategaon", 1450, 500, 2700], ["ujjain-chimanganj", 1650, 600, 3100],
  ["ratlam", 1600, 550, 3000], ["shajapur", 1500, 500, 2850],
  ["ashta", 1480, 500, 2800], ["agar-malwa", 1520, 500, 2850],
  ["bhopal-karond", 1750, 650, 3300],
];

const GARLIC: Row[] = [
  ["indore-choithram", 10500, 5000, 18000], ["ujjain-chimanganj", 11000, 5200, 19000],
  ["badnagar", 11500, 5500, 20000], ["tarana", 10000, 4800, 17000],
  ["nagda", 11800, 5500, 20500], ["ratlam", 12500, 6000, 21000],
  ["jaora", 12000, 5800, 20500], ["agar-malwa", 10800, 5000, 18500],
];

const MUSTARD: Row[] = [
  ["dewas", 5750, 5200, 6200], ["sonkatch", 5780, 5250, 6250],
  ["ujjain-chimanganj", 5800, 5250, 6300], ["tarana", 5760, 5200, 6250],
  ["shajapur", 5820, 5300, 6300], ["shujalpur", 5830, 5300, 6320],
  ["sehore", 5850, 5300, 6350], ["ashta", 5840, 5300, 6330],
  ["agar-malwa", 5790, 5250, 6280], ["bhopal-karond", 5870, 5350, 6380],
  ["badnawar", 5740, 5200, 6220],
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
  ...toRecords("soybean", SOYBEAN),
  ...toRecords("gram", GRAM),
  ...toRecords("onion", ONION),
  ...toRecords("garlic", GARLIC),
  ...toRecords("mustard", MUSTARD),
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

