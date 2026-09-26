import { z } from "zod";
import type { MandiOpportunity, OpportunityQuery, OpportunityResult, PriceRecord } from "@/lib/types";
import { advise, buildResult, computeOpportunity, haversineKm, roadKmFromHaversine } from "@/lib/engine";
import { MANDIS, DEFAULT_COST_PARAMS } from "@/lib/data/mandis";
import { getCrop, isStorable } from "@/lib/data/crops";
import { getPrices, getCropHistory } from "@/lib/data/agmarknet";
import { trendFor } from "@/lib/data/prices.seed";
import type { CostParams } from "@/lib/types";

export const QuerySchema = z.object({
  crop: z.string().min(1),
  quantityQuintals: z.number().positive().max(100000),
  lat: z.number().min(6).max(38), // India bounding box-ish
  lng: z.number().min(68).max(98),
  maxDistanceKm: z.number().positive().max(1000).optional(),
  fpo: z.boolean().optional(),
  doorstepQuotePerQuintal: z.number().positive().max(1000000).optional(),
});

/** Build the costed exits (APMC mandis + optional doorstep quote) for a query. */
function buildOpps(
  query: OpportunityQuery,
  priceByMandi: Map<string, PriceRecord>,
  params: CostParams,
  fpo: boolean
): MandiOpportunity[] {
  const maxKm = query.maxDistanceKm ?? Infinity;
  const opps: MandiOpportunity[] = [];
  for (const mandi of MANDIS) {
    const price = priceByMandi.get(mandi.id);
    if (!price) continue;
    const straight = haversineKm(query.lat, query.lng, mandi.lat, mandi.lng);
    const road = roadKmFromHaversine(straight, params.roadFactor);
    if (road > maxKm) continue;
    opps.push(
      computeOpportunity({
        mandi,
        cropId: query.crop,
        quantityQuintals: query.quantityQuintals,
        modalPricePerQuintal: price.modalPricePerQuintal,
        priceSource: price.source,
        straightLineKm: straight,
        roadKm: road,
        routeSource: "haversine",
        params,
        fpo,
        channel: "apmc",
        enam: mandi.enam,
      })
    );
  }

  // Neutral multi-channel: an aggregator/doorstep quote is a real exit too —
  // buyer picks up at the farm, so no transport, no APMC commission/fee.
  if (query.doorstepQuotePerQuintal && query.doorstepQuotePerQuintal > 0) {
    opps.push(
      computeOpportunity({
        mandi: {
          id: "doorstep",
          name: "Doorstep buyer (aggregator)",
          district: "at your farm",
          state: "",
          lat: query.lat,
          lng: query.lng,
        },
        cropId: query.crop,
        quantityQuintals: query.quantityQuintals,
        modalPricePerQuintal: query.doorstepQuotePerQuintal,
        priceSource: "quote",
        straightLineKm: 0,
        roadKm: 0,
        routeSource: "haversine",
        params,
        channel: "doorstep",
        noTransport: true,
        noCommission: true,
        noSpoilage: true,
      })
    );
  }
  return opps;
}

/** The whole pipeline: crop+qty+location → priced, costed, ranked exits + advice. */
export async function solveOpportunity(
  query: OpportunityQuery,
  overrides?: Partial<CostParams>
): Promise<OpportunityResult> {
  const params: CostParams = { ...DEFAULT_COST_PARAMS, ...overrides };
  const crop = getCrop(query.crop);
  const bundle = await getPrices(query.crop);
  const priceByMandi = new Map(bundle.records.map((r) => [r.mandiId, r]));

  const opps = buildOpps(query, priceByMandi, params, Boolean(query.fpo));

  const result = buildResult(query, crop, opps, params, {
    source: bundle.source,
    freshness: bundle.freshness,
    fetchedAt: bundle.fetchedAt,
  });

  // ── Data-freshness / lag flag (P1): how stale is the freshest price? ────────
  const dates = bundle.records.map((r) => r.arrivalDate).filter(Boolean).sort();
  const asOf = dates[dates.length - 1];
  if (asOf) {
    const lagDays = Math.max(0, Math.round((Date.now() - new Date(asOf).getTime()) / 86400000));
    result.priceMeta.asOf = asOf;
    result.priceMeta.lagDays = lagDays;
  }

  // ── Sell-now-vs-wait (P4): real history → signal, gated on storability ──────
  const history = await getCropHistory(query.crop).catch(() => []);
  const real = history.length >= 8;
  const adv = advise(real ? history : trendFor(result.best?.mandi.id ?? "", query.crop, 30));
  let signal = adv.signal;
  if (!isStorable(query.crop) && signal !== "SELL") signal = "SELL"; // can't hold a perishable
  result.advisory = { signal, changePct: adv.changePct, real };

  // ── Break-even (P1): how far the winner's price could fall & still beat nearest ─
  const best = result.best;
  const nearest = result.nearestMandi;
  if (best && nearest && best.mandi.id !== nearest.mandi.id && best.grossRevenue > 0) {
    const retained =
      (best.grossRevenue - best.commissionCost - best.mandiFeeCost - best.cessCost - best.wastageCost) /
      best.grossRevenue; // fraction of price kept after %-scaling costs
    const fixed = best.transportCost + best.hamaliCost;
    const qty = query.quantityQuintals;
    const floor = retained > 0 ? (nearest.netRealization + fixed) / (qty * retained) : best.modalPricePerQuintal;
    result.breakEven = {
      vsMandiId: nearest.mandi.id,
      bestPricePerQuintal: best.modalPricePerQuintal,
      floorPerQuintal: Math.round(floor),
      marginPerQuintal: Math.round(best.modalPricePerQuintal - floor),
    };
  }

  // ── Pooling as a lever (P3): what pooling into a full load would unlock ─────
  if (!query.fpo && best) {
    const pooledOpps = buildOpps(query, priceByMandi, params, true);
    const pooledBest = [...pooledOpps].sort((a, b) => b.netRealization - a.netRealization)[0];
    if (pooledBest) {
      const gainPerQuintal = Math.round(pooledBest.netPerQuintal - best.netPerQuintal);
      if (gainPerQuintal > 0) {
        result.pooling = {
          soloBestMandiId: best.mandi.id,
          pooledBestMandiId: pooledBest.mandi.id,
          gainPerQuintal,
          unlocksFarther: pooledBest.mandi.id !== best.mandi.id,
        };
      }
    }
  }

  // ── Honest confidence (P5): from freshness + lag + spoilage exposure ────────
  result.confidence = deriveConfidence(result);

  return result;
}

function deriveConfidence(result: OpportunityResult): OpportunityResult["confidence"] {
  const reasons: string[] = [];
  let score = 2; // 2 high, 1 medium, 0 low
  const { freshness, lagDays } = result.priceMeta;
  if (freshness === "live") reasons.push("live prices");
  else if (freshness === "cached") {
    reasons.push("cached prices");
    score = Math.min(score, 1);
  } else {
    reasons.push("reference prices (live feed unavailable)");
    score = 0;
  }
  if (lagDays != null) {
    if (lagDays > 7) {
      reasons.push(`${lagDays} days stale`);
      score = 0;
    } else if (lagDays > 2) {
      reasons.push(`${lagDays} days old`);
      score = Math.min(score, 1);
    }
  }
  const wf = result.best?.wastageFraction ?? 0;
  if (wf >= 0.08) {
    reasons.push("perishable — spoilage estimate is a range");
    score = Math.min(score, 1);
  }
  const level = score >= 2 ? "high" : score === 1 ? "medium" : "low";
  return { level, reasons };
}
