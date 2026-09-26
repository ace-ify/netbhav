import { z } from "zod";
import type { MandiOpportunity, OpportunityQuery, OpportunityResult } from "@/lib/types";
import { advise, buildResult, computeOpportunity, haversineKm, roadKmFromHaversine } from "@/lib/engine";
import { MANDIS } from "@/lib/data/mandis";
import { DEFAULT_COST_PARAMS } from "@/lib/data/mandis";
import { getCrop } from "@/lib/data/crops";
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
});

/** The whole pipeline: crop+qty+location → priced, costed, ranked mandis. */
export async function solveOpportunity(
  query: OpportunityQuery,
  overrides?: Partial<CostParams>
): Promise<OpportunityResult> {
  const params: CostParams = { ...DEFAULT_COST_PARAMS, ...overrides };
  const crop = getCrop(query.crop);
  const bundle = await getPrices(query.crop);

  const priceByMandi = new Map(bundle.records.map((r) => [r.mandiId, r]));
  const maxKm = query.maxDistanceKm ?? Infinity;

  const opps: MandiOpportunity[] = [];
  for (const mandi of MANDIS) {
    const price = priceByMandi.get(mandi.id);
    if (!price) continue; // this mandi doesn't trade the crop
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
        fpo: query.fpo,
      })
    );
  }

  const result = buildResult(query, crop, opps, params, {
    source: bundle.source,
    freshness: bundle.freshness,
    fetchedAt: bundle.fetchedAt,
  });

  // Advisory from REAL price history when available (>=8 pts), else a labelled
  // synthetic reference curve. The signal is honest about which it used.
  const history = await getCropHistory(query.crop).catch(() => []);
  const real = history.length >= 8;
  const adv = advise(real ? history : trendFor(result.best?.mandi.id ?? "", query.crop, 30));
  result.advisory = { signal: adv.signal, changePct: adv.changePct, real };

  return result;
}

