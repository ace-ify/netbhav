import wpi from "./wpi.json";

// Wholesale Price Index (Office of the Economic Adviser, DPIIT) — monthly, all-
// India, 2012→2026. A THIRD, independent, fully-offline data source: no API, no
// key, never down. It's an INDEX (base 2011-12=100), not ₹/quintal — so it can't
// give a mandi's sticker price, but it gives a real, official long-term price
// TREND per crop (seasonality + momentum) that our synthetic curve only guessed.
type Point = { ym: string; idx: number };
const DATA = wpi as Record<string, Point[]>;

// Our crop ids → WPI series key (only the crops the index actually tracks).
const MAP: Record<string, string> = {
  paddy: "paddy", wheat: "wheat", maize: "maize", gram: "gram",
  onion: "onion", potato: "potato", peas: "peas", tomato: "tomato",
};

export function wpiCovers(cropId: string): boolean {
  return Boolean(DATA[MAP[cropId] ?? cropId]);
}

/** Recent monthly WPI series for a crop, or [] if the index doesn't track it. */
export function wpiSeries(cropId: string): Point[] {
  return DATA[MAP[cropId] ?? cropId] ?? [];
}

/** Real price momentum from the WPI: % change of the latest month vs 3 months
 * back. Positive = rising. null when the crop isn't tracked or data is thin. */
export function wpiMomentumPct(cropId: string): number | null {
  const s = wpiSeries(cropId);
  if (s.length < 4) return null;
  const last = s[s.length - 1].idx;
  const prior = s[s.length - 4].idx;
  if (!prior) return null;
  return Math.round(((last - prior) / prior) * 1000) / 10;
}
