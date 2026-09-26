import type { Crop, CropClass } from "@/lib/types";

// The six crops NetBhav's seed data covers. `agmarknet` = commodity name in the
// price feed; `class` drives commission rate and spoilage behaviour.
export const CROPS: (Crop & { agmarknet: string })[] = [
  { id: "wheat", name: { en: "Wheat", hi: "गेहूं" }, emoji: "🌾", class: "grain", agmarknet: "Wheat" },
  { id: "soybean", name: { en: "Soybean", hi: "सोयाबीन" }, emoji: "🫘", class: "oilseed", agmarknet: "Soyabean" },
  { id: "gram", name: { en: "Gram (Chana)", hi: "चना" }, emoji: "🟤", class: "pulse", agmarknet: "Bengal Gram(Gram)(Whole)" },
  { id: "onion", name: { en: "Onion", hi: "प्याज" }, emoji: "🧅", class: "vegetable", agmarknet: "Onion" },
  { id: "garlic", name: { en: "Garlic", hi: "लहसुन" }, emoji: "🧄", class: "spice", agmarknet: "Garlic" },
  { id: "mustard", name: { en: "Mustard", hi: "सरसों" }, emoji: "🌱", class: "oilseed", agmarknet: "Mustard" },
];

export const CROP_BY_ID = new Map(CROPS.map((c) => [c.id, c]));

export function getCrop(id: string): Crop & { agmarknet: string } {
  const c = CROP_BY_ID.get(id);
  if (c) return c;
  // Unknown crop → synthesize a passthrough so the engine still works.
  return { id, name: { en: id, hi: id }, emoji: "🌿", class: "grain", agmarknet: id };
}

// ── Crop economics (the heart of PS-02: honest, class-aware money math) ──────

// Arhtiya commission by crop class. Perishables carry far higher commission
// than staples. grain/pulse/oilseed/spice = 2%, vegetable = 6%, fruit = 8%.
const COMMISSION_BY_CLASS: Record<CropClass, number> = {
  grain: 2,
  pulse: 2,
  oilseed: 2,
  spice: 2, // garlic: bulk, storable → staple-tier commission
  vegetable: 6,
  fruit: 8,
};

export interface WastageParams {
  base: number; // fraction lost even at the gate
  per100: number; // extra fraction lost per 100 road km
  cap: number; // max fraction (long hauls plateau)
}

// Distance/time spoilage knobs, as-of 2025-26. Crops absent here spoil 0
// (grain/pulse/oilseed keep for months). Cured garlic also stores for months —
// deliberately LOW, NOT treated like onion.
const WASTAGE_BY_CROP: Record<string, WastageParams> = {
  onion: { base: 0.04, per100: 0.015, cap: 0.12 },
  garlic: { base: 0.01, per100: 0.003, cap: 0.04 },
  tomato: { base: 0.08, per100: 0.03, cap: 0.2 }, // wired for future crops
  potato: { base: 0.04, per100: 0.01, cap: 0.15 }, // wired for future crops
};

export function cropClass(cropId: string): CropClass {
  return CROP_BY_ID.get(cropId)?.class ?? "grain";
}

/** Commission % for a crop's class; falls back to the given default if unknown. */
export function commissionPercentFor(cropId: string, fallback: number): number {
  const c = CROP_BY_ID.get(cropId);
  return c ? COMMISSION_BY_CLASS[c.class] : fallback;
}

export function wastageParamsFor(cropId: string): WastageParams {
  return WASTAGE_BY_CROP[cropId] ?? { base: 0, per100: 0, cap: 0 };
}
