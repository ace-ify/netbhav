// NetBhav shared domain types — the contract every module depends on.
// Prices are ₹ per quintal (100 kg) unless stated. Distances in km. Money in ₹.

export type Lang = "en" | "hi";

export interface LocalizedText {
  en: string;
  hi: string;
}

export type CropClass = "grain" | "pulse" | "oilseed" | "vegetable" | "fruit" | "spice";

export interface Crop {
  id: string; // kebab-case, e.g. "wheat"
  name: LocalizedText;
  emoji: string;
  class: CropClass; // drives commission rate + spoilage behaviour
}

export interface Mandi {
  id: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
}

/** A daily price observation for one crop at one mandi. */
export interface PriceRecord {
  mandiId: string;
  crop: string; // Crop.id
  modalPricePerQuintal: number;
  minPricePerQuintal: number;
  maxPricePerQuintal: number;
  arrivalDate: string; // ISO yyyy-mm-dd
  source: string; // e.g. "agmarknet" | "seed"
}

/** A single day in a crop's price history at a mandi (for trend charts). */
export interface TrendPoint {
  date: string; // ISO yyyy-mm-dd
  modalPricePerQuintal: number;
}

/**
 * Cost model parameters. Percentages are whole numbers (2 = 2%).
 * These are the *transparent assumptions* behind every rupee we show.
 */
export interface CostParams {
  mandiFeePercent: number; // APMC market fee / mandi shulk
  commissionPercent: number; // arhtiya / commission agent
  cessPercent: number; // any additional cess
  hamaliPerQuintal: number; // loading/unloading (₹/qtl)
  transportPerKm: number; // hired vehicle (₹/km, per trip)
  truckCapacityQuintals: number; // qtl per trip before a second trip is needed
  roundTrip: boolean; // vehicle returns empty → pay for the return leg too
  roadFactor: number; // straight-line km × this ≈ road km (used when no routing API)
}

export interface Farmer {
  name: string;
  lat: number;
  lng: number;
  district?: string;
}

/** What the user asks: "I have <quantity> qtl of <crop> at <location>." */
export interface OpportunityQuery {
  crop: string;
  quantityQuintals: number;
  lat: number;
  lng: number;
  maxDistanceKm?: number; // filter out mandis farther than this
  fpo?: boolean; // bulk/FPO mode — pooled quantity, better per-unit economics
}

/** One mandi, fully costed, ready to rank. This is the honest money math. */
export interface MandiOpportunity {
  mandi: Mandi;
  straightLineKm: number;
  roadKm: number;
  routeSource: "osrm" | "haversine";
  modalPricePerQuintal: number;
  priceSource: string;

  grossRevenue: number; // price × qty
  commissionCost: number;
  mandiFeeCost: number;
  cessCost: number;
  hamaliCost: number;
  transportCost: number;
  vehicle: string; // cheapest freight tier id used (tata-ace|pickup|tractor|truck)
  wastageCost: number; // spoilage-in-transit (perishables, distance-scaled)
  wastageFraction: number; // 0..cap, share of gross lost to spoilage
  trips: number;
  totalDeductions: number;

  netRealization: number; // take-home ₹
  netPerQuintal: number; // netRealization / qty
  effectiveCostPerKm: number; // (gross - net) attributable trace, for transparency

  rank: number; // 1 = best net realization
  deltaVsBest: number; // netRealization - best.netRealization (≤ 0)
}

/** The full ranked answer + the headline insight. */
export interface OpportunityResult {
  query: OpportunityQuery;
  crop: Crop | { id: string; name: LocalizedText; emoji: string };
  opportunities: MandiOpportunity[]; // ranked, best first
  best: MandiOpportunity | null;
  highestPriceMandi: MandiOpportunity | null; // the naive "chase the price" pick
  /** ₹ gained by picking net-best over the highest-sticker-price mandi. */
  insightDeltaRupees: number;
  /** ₹ gained by picking net-best over the nearest mandi. */
  nearestMandi: MandiOpportunity | null;
  savingsVsNearest: number;
  assumptions: CostParams;
  priceMeta: {
    source: "agmarknet" | "seed" | "mixed";
    freshness: "live" | "cached" | "seed";
    fetchedAt: string;
  };
  /** SELL/WAIT/MONITOR signal for the crop. `real` = derived from live history. */
  advisory?: { signal: "SELL" | "WAIT" | "MONITOR"; changePct: number; real: boolean };
}
