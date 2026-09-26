import type { Lang } from "@/lib/types";

// Lightweight bilingual dictionary. No i18n framework — a typed dict + t().
// ponytail: dict lookup covers 2 languages cleanly; add a lib only past ~5.
type Dict = Record<string, { en: string; hi: string }>;

export const STR = {
  appName: { en: "NetBhav", hi: "नेटभाव" },
  tagline: {
    en: "The best mandi isn't the highest price — it's the highest take-home.",
    hi: "सबसे अच्छी मंडी सबसे ऊँचे भाव वाली नहीं — सबसे ज़्यादा हाथ में आने वाली होती है।",
  },
  crop: { en: "Crop", hi: "फसल" },
  quantity: { en: "Quantity", hi: "मात्रा" },
  quintals: { en: "quintals", hi: "क्विंटल" },
  location: { en: "Your location", hi: "आपका स्थान" },
  useMyLocation: { en: "Use my location", hi: "मेरा स्थान इस्तेमाल करें" },
  locationPlaceholder: { en: "Village / town (e.g. Lucknow)", hi: "गाँव / कस्बा (जैसे लखनऊ)" },
  find: { en: "Find best mandi", hi: "सबसे अच्छी मंडी खोजें" },
  finding: { en: "Calculating net realization…", hi: "शुद्ध आय की गणना…" },
  bestTakeHome: { en: "Best take-home", hi: "सबसे ज़्यादा हाथ में" },
  netRealization: { en: "Net realization", hi: "शुद्ध आय" },
  perQuintal: { en: "per quintal", hi: "प्रति क्विंटल" },
  grossValue: { en: "Gross value", hi: "कुल मूल्य" },
  commission: { en: "Commission (arhtiya)", hi: "कमीशन (आढ़तिया)" },
  mandiFee: { en: "Mandi fee", hi: "मंडी शुल्क" },
  cess: { en: "Cess", hi: "उपकर" },
  hamali: { en: "Hamali (loading)", hi: "हमाली (लदान)" },
  transport: { en: "Transport", hi: "परिवहन" },
  freight: { en: "Freight: cheapest vehicle", hi: "भाड़ा: सबसे सस्ता वाहन" },
  spoilage: { en: "Spoilage in transit", hi: "रास्ते में खराबी" },
  totalDeductions: { en: "Total deductions", hi: "कुल कटौती" },
  takeHome: { en: "You take home", hi: "आपको मिलेंगे" },
  distance: { en: "Distance", hi: "दूरी" },
  km: { en: "km", hi: "किमी" },
  price: { en: "Mandi price", hi: "मंडी भाव" },
  rank: { en: "Rank", hi: "क्रम" },
  vsHighestPrice: {
    en: "more than the highest-price mandi — after transport & fees",
    hi: "सबसे ऊँचे भाव वाली मंडी से ज़्यादा — परिवहन व शुल्क के बाद",
  },
  vsNearest: { en: "more than the nearest mandi", hi: "सबसे नज़दीकी मंडी से ज़्यादा" },
  extraInPocket: { en: "extra in your pocket", hi: "आपकी जेब में अतिरिक्त" },
  sameCrop: { en: "Same crop. Smarter mandi.", hi: "वही फसल। समझदार मंडी।" },
  breakdown: { en: "How we got this number", hi: "यह रकम कैसे बनी" },
  showBreakdown: { en: "Show the math", hi: "गणित दिखाएँ" },
  hideBreakdown: { en: "Hide the math", hi: "गणित छिपाएँ" },
  allMandis: { en: "All mandis, ranked by take-home", hi: "सभी मंडियाँ, हाथ में आने के क्रम में" },
  trips: { en: "trips", hi: "फेरे" },
  trend: { en: "30-day price trend", hi: "30-दिन भाव रुझान" },
  map: { en: "Mandi map", hi: "मंडी नक्शा" },
  freshLive: { en: "Live", hi: "लाइव" },
  freshCached: { en: "Cached", hi: "कैश्ड" },
  freshSeed: { en: "Reference data", hi: "संदर्भ डेटा" },
  assumptions: { en: "Assumptions", hi: "मान्यताएँ" },
  fpoMode: { en: "FPO / bulk mode", hi: "एफपीओ / थोक मोड" },
  fpoHint: {
    en: "Pool the village's produce into full truckloads — transport per quintal drops sharply.",
    hi: "गाँव की उपज को पूरे ट्रक में मिलाएँ — प्रति क्विंटल परिवहन तेज़ी से घटता है।",
  },
  advice: { en: "Advice", hi: "सलाह" },
  sell: { en: "SELL here", hi: "यहाँ बेचें" },
  adSell: { en: "Sell now", hi: "अभी बेचें" },
  adWait: { en: "Consider waiting", hi: "रुकने पर विचार करें" },
  adMonitor: { en: "Watch daily", hi: "रोज़ देखें" },
  adSellWhy: { en: "prices are flat or slipping — lock it in", hi: "भाव स्थिर या गिर रहे हैं — अभी तय कर लें" },
  adWaitWhy: { en: "prices climbing; a few days may pay if you can store", hi: "भाव चढ़ रहे हैं; भंडारण हो तो कुछ दिन रुकना फ़ायदेमंद" },
  adMonitorWhy: { en: "gently rising — check the trend daily", hi: "हल्का चढ़ाव — रुझान रोज़ देखें" },
  chatTitle: { en: "Ask NetBhav", hi: "नेटभाव से पूछें" },
  chatPlaceholder: { en: "Type or speak: '50 quintal wheat at Lucknow'", hi: "लिखें या बोलें: 'लखनऊ में 50 क्विंटल गेहूं'" },
  send: { en: "Send", hi: "भेजें" },
  speak: { en: "Speak", hi: "बोलें" },
  listening: { en: "Listening…", hi: "सुन रहे हैं…" },
  voiceCall: { en: "Voice call", hi: "वॉइस कॉल" },
  callStart: { en: "Start voice call", hi: "वॉइस कॉल शुरू करें" },
  callThinking: { en: "Thinking…", hi: "सोच रहे हैं…" },
  callSpeaking: { en: "Speaking…", hi: "बोल रहे हैं…" },
  callTapToStart: { en: "Tap to start talking", hi: "बात शुरू करने के लिए टैप करें" },
  endCall: { en: "End call", hi: "कॉल समाप्त" },
  callHint: { en: "Speak naturally — I answer, then keep listening.", hi: "स्वाभाविक बोलें — मैं जवाब देता हूँ, फिर सुनता रहता हूँ।" },
  callUnsupported: { en: "Voice needs Chrome or Edge on this device.", hi: "आवाज़ के लिए इस डिवाइस पर Chrome या Edge चाहिए।" },
  youLabel: { en: "You", hi: "आप" },
  noResults: {
    en: "No mandis trade this crop within range. Widen the distance or pick another crop.",
    hi: "इस दूरी में कोई मंडी यह फसल नहीं खरीदती। दूरी बढ़ाएँ या दूसरी फसल चुनें।",
  },
  withinKm: { en: "Within", hi: "के भीतर" },
  anyDistance: { en: "Any distance", hi: "कोई भी दूरी" },
  poweredNote: {
    en: "Prices: Agmarknet (data.gov.in) with reference fallback. Math is deterministic and shown in full.",
    hi: "भाव: एगमार्कनेट (data.gov.in) संदर्भ फॉलबैक के साथ। गणना निश्चित है और पूरी दिखाई गई है।",
  },
  confidence: { en: "Confidence", hi: "भरोसा" },
  confHigh: { en: "High", hi: "उच्च" },
  confMedium: { en: "Medium", hi: "मध्यम" },
  confLow: { en: "Low", hi: "कम" },
  pricesAsOf: { en: "Prices as of", hi: "भाव इस तिथि तक" },
  daysOld: { en: "days old", hi: "दिन पुराने" },
  today: { en: "today", hi: "आज" },
  breakEvenTitle: { en: "Break-even cushion", hi: "ब्रेक-ईवन गुंजाइश" },
  poolTitle: { en: "Pool with neighbours", hi: "पड़ोसियों के साथ मिलाएँ" },
  extraPerQtl: { en: "extra / quintal", hi: "अतिरिक्त / क्विंटल" },
  doorstepQuote: { en: "Doorstep buyer quote (optional)", hi: "घर-पहुँच खरीदार का भाव (वैकल्पिक)" },
  chApmc: { en: "APMC", hi: "मंडी" },
  chEnam: { en: "eNAM", hi: "ई-नाम" },
  chDoorstep: { en: "Doorstep", hi: "घर-पहुँच" },
  seasonTitle: { en: "Season view — plan the year", hi: "सीज़न व्यू — साल की योजना" },
  seasonSow: { en: "Sowing", hi: "बुवाई" },
  seasonHarvest: { en: "Harvest", hi: "कटाई" },
  seasonSoft: { en: "Prices usually softest", hi: "भाव आम तौर पर सबसे कम" },
  seasonFirm: { en: "Prices usually firmer", hi: "भाव आम तौर पर मज़बूत" },
  seasonMsp: { en: "MSP-backed", hi: "MSP समर्थित" },
  seasonDisclaimer: {
    en: "Typical pattern from the crop calendar — not a price prediction.",
    hi: "फसल कैलेंडर से सामान्य रुझान — भाव की भविष्यवाणी नहीं।",
  },
} satisfies Dict;

export type StrKey = keyof typeof STR;

export function t(lang: Lang, key: StrKey): string {
  return STR[key][lang];
}

// Format ₹ with Indian digit grouping (lakh/crore).
export function inr(n: number, withSymbol = true): string {
  const s = Math.round(n).toLocaleString("en-IN");
  return withSymbol ? `₹${s}` : s;
}

// Freight vehicle names (by FreightTier.id).
const VEHICLES: Record<string, { en: string; hi: string }> = {
  "tata-ace": { en: "Tata Ace", hi: "टाटा ऐस" },
  pickup: { en: "Pickup", hi: "पिकअप" },
  tractor: { en: "Tractor-trolley", hi: "ट्रैक्टर-ट्रॉली" },
  truck: { en: "Truck", hi: "ट्रक" },
};

export function vehicleName(lang: Lang, id: string): string {
  return VEHICLES[id]?.[lang] ?? id;
}

