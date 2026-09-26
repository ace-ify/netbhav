// Deterministic SELL / WAIT / MONITOR signal from a mandi's recent price trend.
// Transparent and rule-based (never an LLM guess) — it only reads the same
// 30-day series we show the farmer, and is framed as "based on the trend",
// not a directive. ponytail: fixed thresholds; calibrate per-crop volatility
// if this ever drives real money decisions.
import type { TrendPoint } from "@/lib/types";

export type Signal = "SELL" | "WAIT" | "MONITOR";

export interface Advisory {
  signal: Signal;
  changePct: number; // recent window vs earlier window, %
}

export function advise(points: TrendPoint[]): Advisory {
  if (points.length < 8) return { signal: "SELL", changePct: 0 };
  const recent = points.slice(-7);
  const earlier = points.slice(0, -7);
  const avg = (a: TrendPoint[]) =>
    a.reduce((s, p) => s + p.modalPricePerQuintal, 0) / a.length;
  const base = avg(earlier);
  const changePct = base > 0 ? ((avg(recent) - base) / base) * 100 : 0;

  if (changePct >= 3) return { signal: "WAIT", changePct }; // climbing fast
  if (changePct >= 0.75) return { signal: "MONITOR", changePct }; // gently rising
  return { signal: "SELL", changePct }; // flat or falling → lock it in
}
