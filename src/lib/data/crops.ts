import type { Crop, CropClass } from "@/lib/types";

// The six crops NetBhav's seed data covers. `agmarknet` = commodity name in the
// price feed; `class` drives commission rate and spoilage behaviour.
export const CROPS: (Crop & { agmarknet: string })[] = [
  { id: "wheat", name: { en: "Wheat", hi: "गेहूं" }, emoji: "🌾", class: "grain", storable: true, agmarknet: "Wheat" },
  { id: "soybean", name: { en: "Soybean", hi: "सोयाबीन" }, emoji: "🫘", class: "oilseed", storable: true, agmarknet: "Soyabean" },
  { id: "gram", name: { en: "Gram (Chana)", hi: "चना" }, emoji: "🟤", class: "pulse", storable: true, agmarknet: "Bengal Gram(Gram)(Whole)" },
  { id: "onion", name: { en: "Onion", hi: "प्याज" }, emoji: "🧅", class: "vegetable", storable: true, agmarknet: "Onion" },
  { id: "garlic", name: { en: "Garlic", hi: "लहसुन" }, emoji: "🧄", class: "spice", storable: true, agmarknet: "Garlic" },
  { id: "mustard", name: { en: "Mustard", hi: "सरसों" }, emoji: "🌱", class: "oilseed", storable: true, agmarknet: "Mustard" },
];

export const CROP_BY_ID = new Map(CROPS.map((c) => [c.id, c]));

export function getCrop(id: string): Crop & { agmarknet: string } {
  const c = CROP_BY_ID.get(id);
  if (c) return c;
  // Unknown crop → synthesize a passthrough so the engine still works.
  return { id, name: { en: id, hi: id }, emoji: "🌿", class: "grain", storable: true, agmarknet: id };
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

// Whole-chain spoilage anchors from the national post-harvest loss studies —
// ICAR-CIPHET (2015) and NABCONS (2022): Vegetables 4.6–12.4%, Fruits 6.7–15.9%,
// cereals/pulses/oilseeds low single digits. We deliberately anchor to THESE
// (NOT the inflated 30–40% review-paper figure). Distance-scaled: fraction =
// min(cap, base + per100 × roadKm/100). All tunable. `cap` stays inside the
// study range for that class. Cured garlic stores for months → deliberately low.
const WASTAGE_BY_CROP: Record<string, WastageParams> = {
  onion: { base: 0.04, per100: 0.015, cap: 0.12 }, // veg range 4.6–12.4%
  garlic: { base: 0.01, per100: 0.003, cap: 0.04 }, // storable spice, well below range
  tomato: { base: 0.05, per100: 0.02, cap: 0.13 }, // perishable end of the veg range
  potato: { base: 0.03, per100: 0.008, cap: 0.1 }, // storable tuber, low end
};

export function cropClass(cropId: string): CropClass {
  return CROP_BY_ID.get(cropId)?.class ?? "grain";
}

/** Can this crop be held to wait for a better price? Gates WAIT/hold advice. */
export function isStorable(cropId: string): boolean {
  return CROP_BY_ID.get(cropId)?.storable ?? true;
}

/** Commission % for a crop's class; falls back to the given default if unknown. */
export function commissionPercentFor(cropId: string, fallback: number): number {
  const c = CROP_BY_ID.get(cropId);
  return c ? COMMISSION_BY_CLASS[c.class] : fallback;
}

export function wastageParamsFor(cropId: string): WastageParams {
  return WASTAGE_BY_CROP[cropId] ?? { base: 0, per100: 0, cap: 0 };
}
