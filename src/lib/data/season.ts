import type { LocalizedText } from "@/lib/types";

// Season view (mentor's "life-year cycle" ask) — a FACTUAL crop calendar, not a
// price forecast. Typical sowing/harvest windows + when prices are usually soft
// (harvest glut) vs firm (lean season) + storage/MSP guidance. Clearly reference
// data ("typical pattern, not a prediction"); tunable. MSP shown as a flag only
// (exact ₹ changes yearly — we don't hardcode a possibly-stale number).
export interface CropSeason {
  season: LocalizedText; // rabi / kharif
  sow: string;
  harvest: string;
  softMonths: LocalizedText; // prices usually lowest (at/after harvest)
  firmMonths: LocalizedText; // prices usually firmer (lean season)
  mspBacked: boolean; // govt MSP procurement applies (staples)
  note: LocalizedText;
}

export const SEASON: Record<string, CropSeason> = {
  wheat: {
    season: { en: "Rabi", hi: "रबी" },
    sow: "Nov–Dec",
    harvest: "Mar–Apr",
    softMonths: { en: "Apr–May (harvest glut)", hi: "अप्रैल–मई (आवक ज़्यादा)" },
    firmMonths: { en: "Sep–Dec", hi: "सितंबर–दिसंबर" },
    mspBacked: true,
    note: { en: "Storable for months; if the mandi is below MSP, govt procurement is an option.", hi: "महीनों तक भंडारित; भाव MSP से नीचे हो तो सरकारी खरीद एक विकल्प है।" },
  },
  soybean: {
    season: { en: "Kharif", hi: "खरीफ" },
    sow: "Jun–Jul",
    harvest: "Oct–Nov",
    softMonths: { en: "Oct–Nov (harvest)", hi: "अक्टूबर–नवंबर (कटाई)" },
    firmMonths: { en: "Feb–Jun", hi: "फरवरी–जून" },
    mspBacked: true,
    note: { en: "Oilseed, storable; prices often firm months after harvest.", hi: "तिलहन, भंडारण योग्य; कटाई के कुछ महीने बाद भाव अक्सर मज़बूत।" },
  },
  gram: {
    season: { en: "Rabi", hi: "रबी" },
    sow: "Oct–Nov",
    harvest: "Feb–Mar",
    softMonths: { en: "Mar–Apr (harvest)", hi: "मार्च–अप्रैल (कटाई)" },
    firmMonths: { en: "Aug–Nov", hi: "अगस्त–नवंबर" },
    mspBacked: true,
    note: { en: "Pulse, storable; MSP-backed — hold if well below MSP.", hi: "दलहन, भंडारण योग्य; MSP समर्थित — MSP से काफ़ी नीचे हो तो रुकें।" },
  },
  mustard: {
    season: { en: "Rabi", hi: "रबी" },
    sow: "Oct–Nov",
    harvest: "Feb–Mar",
    softMonths: { en: "Mar–Apr (harvest)", hi: "मार्च–अप्रैल (कटाई)" },
    firmMonths: { en: "Aug–Nov", hi: "अगस्त–नवंबर" },
    mspBacked: true,
    note: { en: "Oilseed, storable; MSP-backed.", hi: "तिलहन, भंडारण योग्य; MSP समर्थित।" },
  },
  onion: {
    season: { en: "Rabi + Kharif", hi: "रबी + खरीफ" },
    sow: "—",
    harvest: "Mar–May (rabi) · Oct–Nov (kharif)",
    softMonths: { en: "at harvest (Mar–May)", hi: "कटाई पर (मार्च–मई)" },
    firmMonths: { en: "Aug–Oct (lean)", hi: "अगस्त–अक्टूबर (कमी)" },
    mspBacked: false,
    note: { en: "Rabi onion stores a few months; prices often spike Aug–Oct. Very volatile — no MSP.", hi: "रबी प्याज कुछ महीने टिकता है; अगस्त–अक्टूबर में भाव अक्सर उछलते हैं। बहुत अस्थिर — कोई MSP नहीं।" },
  },
  garlic: {
    season: { en: "Rabi", hi: "रबी" },
    sow: "Oct–Nov",
    harvest: "Mar–Apr",
    softMonths: { en: "Mar–May (harvest)", hi: "मार्च–मई (कटाई)" },
    firmMonths: { en: "highly variable", hi: "बहुत परिवर्तनशील" },
    mspBacked: false,
    note: { en: "Cured garlic stores for months; prices are highly volatile — no MSP.", hi: "सूखा लहसुन महीनों टिकता है; भाव बहुत अस्थिर — कोई MSP नहीं।" },
  },
};

export function getSeason(cropId: string): CropSeason | null {
  return SEASON[cropId] ?? null;
}
