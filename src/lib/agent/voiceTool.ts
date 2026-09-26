// Shared voice-agent tool: the deterministic mandi lookup the LiveKit agent's
// LLM calls. LiveKit handles STT/LLM/TTS + turn-taking; THIS keeps the money
// math in our tested engine. Returns a compact object the LLM speaks aloud.
import { solveOpportunity } from "@/lib/service";
import { geocode } from "@/lib/geo/nominatim";
import { DEMO_FARMER } from "@/lib/data/mandis";
import { advise } from "@/lib/engine";
import { trendFor } from "@/lib/data/prices.seed";

export interface VoiceLookup {
  crop: string;
  quantityQuintals: number;
  location?: string | null;
  fpo?: boolean;
}

export async function lookupMandiForVoice(q: VoiceLookup) {
  let lat = DEMO_FARMER.lat;
  let lng = DEMO_FARMER.lng;
  let usedFallbackLocation = true;
  if (q.location) {
    const g = await geocode(q.location).catch(() => null);
    if (g) {
      lat = g.lat;
      lng = g.lng;
      usedFallbackLocation = false;
    }
  }

  const result = await solveOpportunity({
    crop: q.crop,
    quantityQuintals: q.quantityQuintals,
    lat,
    lng,
    ...(q.fpo ? { fpo: true } : {}),
  });

  if (!result.best) {
    return { found: false, crop: q.crop, reason: "no mandi trades this crop in range" };
  }

  const b = result.best;
  const adv = result.advisory ?? advise(trendFor(b.mandi.id, result.crop.id, 30));
  return {
    found: true,
    crop: result.crop.id,
    cropNameEn: result.crop.name.en,
    cropNameHi: result.crop.name.hi,
    quantityQuintals: q.quantityQuintals,
    bestMandi: b.mandi.name,
    district: b.mandi.district,
    netTotalInr: Math.round(b.netRealization),
    netPerQuintalInr: Math.round(b.netPerQuintal),
    roadKm: Math.round(b.roadKm),
    deltaVsHighestPriceInr: Math.round(result.insightDeltaRupees),
    highestPriceMandi: result.highestPriceMandi?.mandi.name ?? null,
    advice: adv.signal, // SELL | WAIT | MONITOR
    trendChangePct: Number(adv.changePct.toFixed(1)),
    usedFallbackLocation,
    top3: result.opportunities.slice(0, 3).map((o) => ({
      mandi: o.mandi.name,
      netInr: Math.round(o.netRealization),
      km: Math.round(o.roadKm),
    })),
  };
}
