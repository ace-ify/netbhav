"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import type { Lang, TrendPoint } from "@/lib/types";
import { trendFor } from "@/lib/data/prices.seed";
import { inr, t } from "@/lib/i18n";

export default function TrendChart({
  lang,
  mandiId,
  crop,
}: {
  lang: Lang;
  mandiId: string;
  crop: string;
}) {
  // Instant synthetic fallback; replaced by REAL history once /api/trends returns.
  const [points, setPoints] = useState<TrendPoint[]>(() => trendFor(mandiId, crop, 30));
  const [real, setReal] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/trends?mandiId=${encodeURIComponent(mandiId)}&crop=${encodeURIComponent(crop)}&days=30`)
      .then((r) => r.json())
      .then((d) => {
        if (alive && Array.isArray(d.points) && d.points.length) {
          setPoints(d.points);
          setReal(Boolean(d.real));
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [mandiId, crop]);

  const data = points.map((p) => ({ date: p.date.slice(5), price: p.modalPricePerQuintal }));
  if (data.length === 0) return null;
  const prices = data.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const first = prices[0];
  const last = prices[prices.length - 1];
  const up = last >= first;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-brand-600">
          {t(lang, "trend")}
          <span className={`ml-1 font-normal ${real ? "text-green-600" : "text-amber-600"}`}>
            · {real ? t(lang, "freshLive") : t(lang, "freshSeed")}
          </span>
        </span>
        <span className={`text-xs font-medium ${up ? "text-brand-600" : "text-red-600"}`}>
          {up ? "▲" : "▼"} {inr(Math.abs(last - first))} ({(((last - first) / (first || 1)) * 100).toFixed(1)}%)
        </span>
      </div>
      <ResponsiveContainer width="100%" height={110}>
        <LineChart data={data} margin={{ top: 5, right: 6, left: 6, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={Math.ceil(data.length / 5)} stroke="#8ec292" />
          <YAxis
            domain={[Math.floor(min * 0.98), Math.ceil(max * 1.02)]}
            tick={{ fontSize: 9 }}
            width={44}
            stroke="#8ec292"
            tickFormatter={(v) => `₹${v}`}
          />
          <Tooltip
            formatter={(v: number) => [inr(v), t(lang, "price")]}
            labelStyle={{ fontSize: 11 }}
            contentStyle={{ fontSize: 11, borderRadius: 8 }}
          />
          <ReferenceLine y={first} stroke="#cbd5cb" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="price" stroke={up ? "#2a6830" : "#dc2626"} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
