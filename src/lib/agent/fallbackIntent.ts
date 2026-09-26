// Rule-based intent parser — NO network, NO LLM. The zero-key fallback that
// lets the whole agent work offline. Extracts crop / quantity / location text
// from a Hindi / English / Hinglish sentence. Money math never happens here.
import { CROPS } from "@/lib/data/crops";

export interface ParsedIntent {
  crop?: string; // a CROPS id: wheat|soybean|gram|onion|garlic|mustard
  quantityQuintals?: number;
  locationText?: string; // raw place text; geocoding happens later, not here
  fpo?: boolean;
  missing: ("crop" | "quantity" | "location")[];
}

// Hinglish / Devanagari synonyms per crop id. CROPS names are merged in below.
const SYN: Record<string, string[]> = {
  wheat: ["wheat", "gehu", "gehun", "gehoon", "गेहूं", "गेहूँ"],
  soybean: ["soybean", "soya", "soyabean", "सोयाबीन"],
  gram: ["gram", "chana", "channa", "चना"],
  onion: ["onion", "pyaz", "pyaaz", "kanda", "प्याज"],
  garlic: ["garlic", "lehsun", "lahsun", "लहसुन"],
  mustard: ["mustard", "sarson", "सरसों"],
};

// Fold each crop's own en/hi names into the synonym table so we match them too.
for (const c of CROPS) {
  const bucket = SYN[c.id] ?? (SYN[c.id] = []);
  for (const tok of c.name.en.toLowerCase().split(/[^a-z]+/).filter(Boolean)) bucket.push(tok);
  bucket.push(c.name.hi);
}

const isAscii = (s: string) => /^[\x00-\x7f]+$/.test(s);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function detectCrop(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const c of CROPS) {
    for (const syn of new Set(SYN[c.id])) {
      if (!syn) continue;
      if (isAscii(syn)) {
        if (new RegExp(`\\b${esc(syn.toLowerCase())}\\b`).test(lower)) return c.id;
      } else if (text.includes(syn)) {
        return c.id;
      }
    }
  }
  return undefined;
}

function detectQuantity(text: string): number | undefined {
  // First number + an optional trailing unit word.
  const m = text.match(/(\d+(?:\.\d+)?)\s*([a-zA-Zऀ-ॿ]+)?/);
  if (!m) return undefined;
  const n = parseFloat(m[1]);
  if (!isFinite(n)) return undefined;
  const unit = (m[2] ?? "").toLowerCase();
  if (/^(tonnes?|tons?|टन)$/.test(unit)) return n * 10; // 1 tonne = 10 quintal
  if (/^(boris?|बोरी|बोरे)$/.test(unit)) return n * 0.5; // ponytail: 1 bag ≈ 0.5 quintal heuristic
  // quintal|qtl|क्विंटल|कुंतल, an unrelated word (e.g. crop name), or bare → quintals
  return n;
}

const UNIT_RE = /^(quintals?|qtls?|qtl|क्विंटल|कुंतल|tonnes?|tons?|ton|टन|boris?|बोरी|बोरे)$/i;

function isCropWord(w: string): boolean {
  const lw = w.toLowerCase();
  return Object.values(SYN).some((arr) =>
    arr.some((s) => (isAscii(s) ? s.toLowerCase() === lw : s === w))
  );
}

// Strip numbers, unit words and crop words off a captured location phrase.
function cleanupLoc(raw: string): string | undefined {
  const words = raw
    .replace(/[.,;!?]+$/g, "")
    .split(/\s+/)
    .filter((w) => w && !/^\d/.test(w) && !UNIT_RE.test(w) && !isCropWord(w));
  const out = words.join(" ").trim();
  return out || undefined;
}

function detectLocation(text: string): string | undefined {
  // "at X" / "in X" (X runs to end of string)
  let m = text.match(/\b(?:at|in)\s+(.+)$/i);
  if (m) {
    const loc = cleanupLoc(m[1]);
    if (loc) return loc;
  }
  // Hindi/Hinglish postfix: "X में" / "X मे" / "X से"
  m = text.match(/([A-Za-zऀ-ॿ]+)\s*(?:में|मे|से)/);
  if (m) {
    const loc = cleanupLoc(m[1]);
    if (loc) return loc;
  }
  // Hinglish postfix: "X me"
  m = text.match(/\b([A-Za-z]+)\s+me\b/i);
  if (m) {
    const loc = cleanupLoc(m[1]);
    if (loc) return loc;
  }
  // Fallback: first Capitalized proper noun that isn't a crop word.
  const caps = text.match(/\b[A-Z][a-zA-Z]+\b/g) ?? [];
  for (const w of caps) if (!isCropWord(w)) return w;
  return undefined;
}

export function parseIntent(text: string): ParsedIntent {
  const crop = detectCrop(text);
  const quantityQuintals = detectQuantity(text);
  const locationText = detectLocation(text);
  const fpo = /\b(fpo|bulk|pool(?:ed)?)\b/i.test(text) || /थोक|एफपीओ/.test(text) || undefined;

  const missing: ParsedIntent["missing"] = [];
  if (!crop) missing.push("crop");
  if (quantityQuintals === undefined) missing.push("quantity");
  if (!locationText) missing.push("location");

  return { crop, quantityQuintals, locationText, fpo, missing };
}
