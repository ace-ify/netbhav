// The orchestrator. LLM (or rule-based fallback) extracts intent → the
// deterministic solver does ALL money math → we compose a warm bilingual
// reply. The LLM never computes rupees; inr() + solver numbers do.
import type { Lang, OpportunityQuery, OpportunityResult } from "@/lib/types";
import { solveOpportunity } from "@/lib/service";
import { advise } from "@/lib/engine";
import { trendFor } from "@/lib/data/prices.seed";
import { getCrop } from "@/lib/data/crops";
import { DEMO_FARMER } from "@/lib/data/mandis";
import { geocode } from "@/lib/geo/nominatim";
import { inr } from "@/lib/i18n";
import { parseIntent } from "@/lib/agent/fallbackIntent";
import { extractIntentLLM } from "@/lib/agent/llm";

export interface AgentInput {
  text: string;
  lang?: Lang;
  location?: { lat: number; lng: number } | null;
  maxDistanceKm?: number;
  /** Fallback crop/qty from a saved profile — used only when the message omits them. */
  defaults?: { crop?: string; quantityQuintals?: number };
}

export interface AgentReply {
  reply: string;
  result?: OpportunityResult;
  query?: OpportunityQuery;
  usedFallbackLocation?: boolean;
}

const hasDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);
const round = (n: number) => Math.round(n);

export async function runAgent(input: AgentInput): Promise<AgentReply> {
  const text = (input.text ?? "").trim();
  const lang: Lang = input.lang ?? (hasDevanagari(text) ? "hi" : "en");

  // 1–2. Extract intent: prefer LLM, fill gaps from the rule-based parser.
  const rule = parseIntent(text);
  const llm = await extractIntentLLM(text).catch(() => null);

  let crop = llm?.crop ?? rule.crop ?? input.defaults?.crop;
  // Any crop is allowed — fuzzy-resolve aliases/typos to a canonical id; unknown
  // crops pass through (engine reports "no mandi buying X" if there's no price).
  if (crop) crop = getCrop(crop).id;
  const quantityQuintals =
    llm?.quantityQuintals ?? rule.quantityQuintals ?? input.defaults?.quantityQuintals;
  const locationText = llm?.locationText ?? rule.locationText;
  const fpo = llm?.fpo ?? rule.fpo;

  // 4. Missing essentials (location is never blocking — we can assume the demo village).
  if (!crop || quantityQuintals === undefined) {
    return { reply: clarify(lang, !crop, quantityQuintals === undefined) };
  }

  // 3. Resolve coordinates. A place NAMED in the message wins over any passed-in
  // default (the farmer explicitly said where); else use provided coords; else demo.
  let lat: number, lng: number;
  let usedFallbackLocation = false;
  if (locationText) {
    const geo = await geocode(locationText).catch(() => null);
    if (geo) {
      ({ lat, lng } = geo);
    } else if (input.location) {
      ({ lat, lng } = input.location);
    } else {
      ({ lat, lng } = DEMO_FARMER);
      usedFallbackLocation = true;
    }
  } else if (input.location) {
    ({ lat, lng } = input.location);
  } else {
    ({ lat, lng } = DEMO_FARMER);
    usedFallbackLocation = true;
  }

  const query: OpportunityQuery = {
    crop,
    quantityQuintals,
    lat,
    lng,
    ...(input.maxDistanceKm ? { maxDistanceKm: input.maxDistanceKm } : {}),
    ...(fpo ? { fpo: true } : {}),
  };

  // 5. Deterministic solver + composed reply.
  try {
    const result = await solveOpportunity(query);
    const reply = lang === "hi" ? composeHi(result, usedFallbackLocation) : composeEn(result, usedFallbackLocation);
    return { reply, result, query, usedFallbackLocation };
  } catch {
    return { reply: apology(lang), query, usedFallbackLocation };
  }
}

// ── Reply composers (deterministic, no LLM) ──────────────────────────────

function composeEn(r: OpportunityResult, usedFallback: boolean): string {
  const cropName = r.crop.name.en;
  if (!r.best) {
    return `I couldn't find any mandi trading ${cropName.toLowerCase()} within range. Try widening the distance or picking another crop.`;
  }
  const b = r.best;
  const parts: string[] = [];
  parts.push(
    `For ${r.query.quantityQuintals} quintal ${cropName.toLowerCase()}, your best take-home is ${b.mandi.name} mandi in ${b.mandi.district}.`
  );
  parts.push(
    `After transport, commission and fees you'd net ${inr(b.netRealization)} in total — about ${inr(b.netPerQuintal)} per quintal.`
  );
  parts.push(`It's roughly ${round(b.roadKm)} km away by road.`);
  const hp = r.highestPriceMandi;
  if (r.insightDeltaRupees > 0 && hp && hp.mandi.id !== b.mandi.id) {
    parts.push(
      `That's ${inr(r.insightDeltaRupees)} more than the highest-price mandi (${hp.mandi.name}) after transport & fees.`
    );
  } else {
    parts.push(`Here the highest-price mandi also happens to give you the best take-home.`);
  }
  const adv = r.advisory ?? advise(trendFor(b.mandi.id, r.crop.id, 30));
  if (adv.signal === "WAIT")
    parts.push(`Prices have been climbing (${adv.changePct > 0 ? "+" : ""}${adv.changePct.toFixed(1)}%) — if you can store, holding a few days may pay.`);
  else if (adv.signal === "MONITOR")
    parts.push(`Prices are gently rising — worth watching the trend for a day or two.`);
  else parts.push(`Prices are flat or slipping, so selling now is the safe call.`);
  if (usedFallback) {
    parts.push(`I assumed your location is the demo village near Lucknow — share your location for a more accurate answer.`);
  }
  return parts.join(" ");
}

function composeHi(r: OpportunityResult, usedFallback: boolean): string {
  const cropName = r.crop.name.hi;
  if (!r.best) {
    return `इस दूरी में कोई मंडी ${cropName} नहीं खरीद रही। कृपया दूरी बढ़ाएँ या दूसरी फसल चुनें।`;
  }
  const b = r.best;
  const parts: string[] = [];
  parts.push(
    `${r.query.quantityQuintals} क्विंटल ${cropName} के लिए सबसे ज़्यादा हाथ में आने वाली मंडी है ${b.mandi.name} (${b.mandi.district})।`
  );
  parts.push(
    `परिवहन, कमीशन और शुल्क के बाद आपको कुल ${inr(b.netRealization)} मिलेंगे — यानी करीब ${inr(b.netPerQuintal)} प्रति क्विंटल।`
  );
  parts.push(`यह सड़क मार्ग से लगभग ${round(b.roadKm)} किमी दूर है।`);
  const hp = r.highestPriceMandi;
  if (r.insightDeltaRupees > 0 && hp && hp.mandi.id !== b.mandi.id) {
    parts.push(
      `यह सबसे ऊँचे भाव वाली मंडी (${hp.mandi.name}) से ${inr(r.insightDeltaRupees)} ज़्यादा है — परिवहन व शुल्क के बाद।`
    );
  } else {
    parts.push(`यहाँ सबसे ऊँचे भाव वाली मंडी ही सबसे ज़्यादा हाथ में देती है।`);
  }
  const adv = r.advisory ?? advise(trendFor(b.mandi.id, r.crop.id, 30));
  if (adv.signal === "WAIT")
    parts.push(`भाव चढ़ रहे हैं (${adv.changePct > 0 ? "+" : ""}${adv.changePct.toFixed(1)}%) — भंडारण हो तो कुछ दिन रुकना फ़ायदेमंद हो सकता है।`);
  else if (adv.signal === "MONITOR")
    parts.push(`भाव हल्के चढ़ रहे हैं — एक-दो दिन रुझान देखना ठीक रहेगा।`);
  else parts.push(`भाव स्थिर या गिर रहे हैं, इसलिए अभी बेचना सुरक्षित है।`);
  if (usedFallback) {
    parts.push(`मैंने आपका स्थान लखनऊ के पास वाला डेमो गाँव मान लिया है — सटीक उत्तर के लिए अपना स्थान साझा करें।`);
  }
  return parts.join(" ");
}

function clarify(lang: Lang, needCrop: boolean, needQty: boolean): string {
  if (lang === "hi") {
    if (needCrop && needQty) return "आप कौन सी फसल और कितने क्विंटल बेचना चाहते हैं? (जैसे: लखनऊ में 50 क्विंटल गेहूं)";
    if (needCrop) return "आप कौन सी फसल बेच रहे हैं? कोई भी फसल लिखें — जैसे धान, गेहूं, आलू, सरसों, अरहर, टमाटर…";
    return "आपके पास कितने क्विंटल हैं?";
  }
  if (needCrop && needQty) return "Which crop and how many quintals are you selling? (e.g. 50 quintal wheat at Lucknow)";
  if (needCrop) return "Which crop are you selling? Type any crop — e.g. paddy, wheat, potato, mustard, arhar, tomato…";
  return "How many quintals do you have?";
}

function apology(lang: Lang): string {
  return lang === "hi"
    ? "क्षमा करें, गणना में कुछ गड़बड़ हो गई। कृपया थोड़ी देर बाद फिर कोशिश करें।"
    : "Sorry, something went wrong while calculating. Please try again in a moment.";
}
