import type { Crop, CropClass } from "@/lib/types";

// Curated crops give good defaults (class → commission/spoilage), Hindi names,
// quick-picks, and the Agmarknet commodity name. But crop input is NOT limited
// to these: `getCrop` fuzzy-resolves any query (Hindi/English/typo/alias) and
// falls back to a sane grain-tier passthrough so ANY crop stays searchable.
export const CROPS: (Crop & { agmarknet: string; aliases?: string[] })[] = [
  { id: "paddy", name: { en: "Paddy (Dhan)", hi: "धान" }, emoji: "🌾", class: "grain", storable: true, agmarknet: "Paddy(Dhan)(Common)", aliases: ["dhan", "dhaan", "धान", "rice", "chawal", "चावल", "paddy"] },
  { id: "wheat", name: { en: "Wheat", hi: "गेहूं" }, emoji: "🌾", class: "grain", storable: true, agmarknet: "Wheat", aliases: ["gehu", "gehun", "गेहू", "गेहूं", "kanak", "kanuk"] },
  { id: "potato", name: { en: "Potato", hi: "आलू" }, emoji: "🥔", class: "vegetable", storable: true, agmarknet: "Potato", aliases: ["aloo", "alu", "आलू", "batata"] },
  { id: "mustard", name: { en: "Mustard", hi: "सरसों" }, emoji: "🌱", class: "oilseed", storable: true, agmarknet: "Mustard", aliases: ["sarson", "सरसों", "rai", "raya", "sarason"] },
  { id: "arhar", name: { en: "Arhar (Tur)", hi: "अरहर" }, emoji: "🟠", class: "pulse", storable: true, agmarknet: "Arhar (Tur/Red Gram)(Whole)", aliases: ["tur", "toor", "arhar", "अरहर", "तूर", "red gram", "pigeon pea"] },
  { id: "gram", name: { en: "Gram (Chana)", hi: "चना" }, emoji: "🟤", class: "pulse", storable: true, agmarknet: "Bengal Gram(Gram)(Whole)", aliases: ["chana", "channa", "चना", "bengal gram", "chickpea"] },
  { id: "maize", name: { en: "Maize", hi: "मक्का" }, emoji: "🌽", class: "grain", storable: true, agmarknet: "Maize", aliases: ["makka", "makai", "मक्का", "corn"] },
  { id: "sugarcane", name: { en: "Sugarcane", hi: "गन्ना" }, emoji: "🎋", class: "grain", storable: false, agmarknet: "Sugarcane", aliases: ["ganna", "गन्ना", "cane"] },
  { id: "onion", name: { en: "Onion", hi: "प्याज" }, emoji: "🧅", class: "vegetable", storable: true, agmarknet: "Onion", aliases: ["pyaz", "pyaaz", "प्याज", "kanda"] },
  { id: "garlic", name: { en: "Garlic", hi: "लहसुन" }, emoji: "🧄", class: "spice", storable: true, agmarknet: "Garlic", aliases: ["lahsun", "lehsun", "लहसुन"] },
  { id: "tomato", name: { en: "Tomato", hi: "टमाटर" }, emoji: "🍅", class: "vegetable", storable: false, agmarknet: "Tomato", aliases: ["tamatar", "टमाटर"] },
  { id: "carrot", name: { en: "Carrot", hi: "गाजर" }, emoji: "🥕", class: "vegetable", storable: true, agmarknet: "Carrot", aliases: ["gajar", "gaajar", "गाजर"] },
  { id: "peas", name: { en: "Peas", hi: "मटर" }, emoji: "🟢", class: "vegetable", storable: false, agmarknet: "Green Peas", aliases: ["matar", "mutter", "मटर"] },
];

export const CROP_BY_ID = new Map(CROPS.map((c) => [c.id, c]));

const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");

// One-edit Levenshtein check (typo tolerance for short queries). Cheap, no dep.
function within1Edit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (a.length < b.length) j++;
    else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

function terms(c: (typeof CROPS)[number]): string[] {
  return [c.id, c.name.en, c.name.hi, ...(c.aliases ?? [])].map(norm);
}

/** Rank curated crops against a free-text query (autocomplete). Best first. */
export function searchCrops(query: string, limit = 8): (typeof CROPS)[number][] {
  const q = norm(query);
  if (!q) return CROPS.slice(0, limit);
  const scored = CROPS.map((c) => {
    const ts = terms(c);
    let score = 0;
    for (const t of ts) {
      if (t === q) score = Math.max(score, 100);
      else if (t.startsWith(q)) score = Math.max(score, 80);
      else if (t.includes(q)) score = Math.max(score, 60);
      else if (q.length >= 3 && within1Edit(t, q)) score = Math.max(score, 40);
    }
    return { c, score };
  }).filter((s) => s.score > 0);
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.c);
}

/** Resolve ANY crop query → canonical curated crop, else a grain-tier passthrough. */
export function getCrop(idOrQuery: string): Crop & { agmarknet: string } {
  const exact = CROP_BY_ID.get(idOrQuery);
  if (exact) return exact;
  const hit = searchCrops(idOrQuery, 1)[0];
  if (hit) return hit;
  // Unknown crop → passthrough so the engine still works (no seed prices; relies
  // on live feed). Grain-tier defaults: 2% commission, storable, no spoilage.
  const label = idOrQuery.trim() || "crop";
  return { id: label.toLowerCase(), name: { en: label, hi: label }, emoji: "🌿", class: "grain", storable: true, agmarknet: label };
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

// Whole-chain spoilage anchors from national post-harvest loss studies —
// ICAR-CIPHET (2015) and NABCONS (2022): Vegetables 4.6–12.4%, Fruits 6.7–15.9%,
// cereals/pulses/oilseeds low single digits. Distance-scaled: fraction =
// min(cap, base + per100 × roadKm/100). All tunable. Cured garlic stores for
// months → deliberately low. Sugarcane must move fast → high, capped.
const WASTAGE_BY_CROP: Record<string, WastageParams> = {
  onion: { base: 0.04, per100: 0.015, cap: 0.12 }, // veg range 4.6–12.4%
  garlic: { base: 0.01, per100: 0.003, cap: 0.04 }, // storable spice, well below range
  tomato: { base: 0.05, per100: 0.02, cap: 0.13 }, // perishable end of the veg range
  potato: { base: 0.03, per100: 0.008, cap: 0.1 }, // storable tuber, low end
  sugarcane: { base: 0.03, per100: 0.02, cap: 0.14 }, // loses sucrose by the hour
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
