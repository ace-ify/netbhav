// The core deterministic money math. No AI here — just honest arithmetic.
// net = gross − commission − mandi fee − cess − hamali − transport − spoilage

import type { CostParams, Mandi, MandiOpportunity } from "@/lib/types";
import { commissionPercentFor, wastageParamsFor } from "@/lib/data/crops";
import { freightQuote } from "./freight";

export interface CostInputs {
  mandi: Mandi;
  cropId: string; // drives class-based commission % and spoilage
  quantityQuintals: number;
  modalPricePerQuintal: number;
  priceSource: string;
  straightLineKm: number;
  roadKm: number;
  routeSource: "osrm" | "haversine";
  params: CostParams;
  fpo?: boolean; // pooled/bulk: pay only your share of a full truck, not a whole trip
}

export function computeOpportunity(input: CostInputs): MandiOpportunity {
  const { mandi, cropId, quantityQuintals: qty, modalPricePerQuintal, params } = input;

  const grossRevenue = modalPricePerQuintal * qty;

  // Commission is class-aware: perishables (vegetable 6%, fruit 8%) cost far
  // more than staples (grain/pulse/oilseed/spice 2%). Falls back to the param.
  const commissionPercent = commissionPercentFor(cropId, params.commissionPercent);
  const commissionCost = round2((grossRevenue * commissionPercent) / 100);
  const mandiFeeCost = round2((grossRevenue * params.mandiFeePercent) / 100);
  const cessCost = round2((grossRevenue * params.cessPercent) / 100);
  const hamaliCost = round2(params.hamaliPerQuintal * qty);

  // Freight = cheapest vehicle for this load/distance (tata-ace → truck), so a
  // small load isn't billed a full truck. FPO pools into a shared full truck.
  const freight = freightQuote(qty, input.roadKm, params.roundTrip, input.fpo ?? false);
  const transportCost = freight.cost;
  const trips = freight.trips;

  // Spoilage in transit: perishables lose value with distance/time; staples 0.
  // fraction = min(cap, base + per100 × roadKm/100).
  const w = wastageParamsFor(cropId);
  const wastageFraction = Math.min(w.cap, w.base + (w.per100 * input.roadKm) / 100);
  const wastageCost = round2(grossRevenue * wastageFraction);

  const totalDeductions = round2(
    commissionCost + mandiFeeCost + cessCost + hamaliCost + transportCost + wastageCost
  );
  const netRealization = round2(grossRevenue - totalDeductions);

  return {
    mandi,
    straightLineKm: round2(input.straightLineKm),
    roadKm: round2(input.roadKm),
    routeSource: input.routeSource,
    modalPricePerQuintal,
    priceSource: input.priceSource,
    grossRevenue: round2(grossRevenue),
    commissionCost,
    mandiFeeCost,
    cessCost,
    hamaliCost,
    transportCost,
    vehicle: freight.vehicle,
    wastageCost,
    wastageFraction: Math.round(wastageFraction * 10000) / 10000,
    trips,
    totalDeductions,
    netRealization,
    netPerQuintal: qty > 0 ? round2(netRealization / qty) : 0,
    effectiveCostPerKm: input.roadKm > 0 ? round2(transportCost / input.roadKm) : 0,
    rank: 0,
    deltaVsBest: 0,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

