// Shared onboarding / profile-query glue so web, WhatsApp, voice and the alert
// runner all read+write the SAME profile with one logic path (no divergence).
import type { OpportunityQuery, OpportunityResult } from "@/lib/types";
import * as store from "./farmers";
import type { FarmerProfile } from "./farmers";

/** Turn a saved profile into a solvable query (first crop, or a named one). */
export function queryFromProfile(p: FarmerProfile, cropId?: string): OpportunityQuery | null {
  const crop = cropId ? p.crops.find((c) => c.cropId === cropId) : p.crops[0];
  if (!crop) return null;
  return {
    crop: crop.cropId,
    quantityQuintals: crop.expectedQuintals,
    lat: p.lat,
    lng: p.lng,
    ...(p.fpo ? { fpo: true } : {}),
  };
}

/** The lazy profile-builder: after any solve for a known phone, keep the data. */
export async function persistQueryAndSnapshot(input: {
  phone: string;
  crop: string;
  quantityQuintals: number;
  lat: number;
  lng: number;
  lang?: "hi" | "en";
  locationLabel?: string;
  result: OpportunityResult;
}): Promise<void> {
  const phone = store.normalizePhone(input.phone);
  if (!phone) return;
  await store.upsert(phone, {
    lat: input.lat,
    lng: input.lng,
    ...(input.lang ? { lang: input.lang } : {}),
    ...(input.locationLabel ? { locationLabel: input.locationLabel } : {}),
  });
  await store.mergeCrop(phone, input.crop, input.quantityQuintals);
  const best = input.result.best;
  if (best) {
    await store.recordSnapshot(phone, {
      bestMandiId: best.mandi.id,
      netPerQuintal: best.netPerQuintal,
      signal: input.result.advisory?.signal ?? "SELL",
    });
  }
}
