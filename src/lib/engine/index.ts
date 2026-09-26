// Ranking + the headline insight. Pure functions over already-costed mandis.

export { computeOpportunity } from "./netRealization";
export type { CostInputs } from "./netRealization";
export { haversineKm, roadKmFromHaversine } from "./distance";
export { advise } from "./advisory";
export type { Advisory, Signal } from "./advisory";
export { freightQuote, FREIGHT_TIERS } from "./freight";
export type { FreightTier, FreightQuote } from "./freight";

import type {
  CostParams,
  Crop,
  MandiOpportunity,
  OpportunityQuery,
  OpportunityResult,
} from "@/lib/types";

/** Sort by net realization (take-home), best first, and stamp rank + delta. */
export function rankOpportunities(opps: MandiOpportunity[]): MandiOpportunity[] {
  const sorted = [...opps].sort((a, b) => b.netRealization - a.netRealization);
  const best = sorted[0];
  return sorted.map((o, i) => ({
    ...o,
    rank: i + 1,
    deltaVsBest: best ? round2(o.netRealization - best.netRealization) : 0,
  }));
}

export function buildResult(
  query: OpportunityQuery,
  crop: Crop,
  opps: MandiOpportunity[],
  assumptions: CostParams,
  priceMeta: OpportunityResult["priceMeta"] = {
    source: "seed",
    freshness: "seed",
    fetchedAt: new Date().toISOString(),
  }
): OpportunityResult {
  const ranked = rankOpportunities(opps);
  const best = ranked[0] ?? null;

  // The naive choices a farmer makes today:
  const highestPriceMandi = pickBy(ranked, (o) => o.modalPricePerQuintal, "max");
  const nearestMandi = pickBy(ranked, (o) => o.roadKm, "min");

  const insightDeltaRupees =
    best && highestPriceMandi
      ? round2(best.netRealization - highestPriceMandi.netRealization)
      : 0;
  const savingsVsNearest =
    best && nearestMandi
      ? round2(best.netRealization - nearestMandi.netRealization)
      : 0;

  return {
    query,
    crop,
    opportunities: ranked,
    best,
    highestPriceMandi,
    insightDeltaRupees,
    nearestMandi,
    savingsVsNearest,
    assumptions,
    priceMeta,
  };
}

function pickBy(
  opps: MandiOpportunity[],
  key: (o: MandiOpportunity) => number,
  dir: "max" | "min"
): MandiOpportunity | null {
  if (opps.length === 0) return null;
  return opps.reduce((acc, o) => {
    const better = dir === "max" ? key(o) > key(acc) : key(o) < key(acc);
    return better ? o : acc;
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
