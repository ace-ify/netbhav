"use client";

import type { Lang, MandiOpportunity } from "@/lib/types";
import { inr, t, vehicleName } from "@/lib/i18n";

function Line({
  label,
  value,
  sub,
  strong,
  minus,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  strong?: boolean;
  minus?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={`text-sm ${strong ? "font-semibold text-brand-800" : "text-brand-600"}`}>
        {label}
        {sub && <span className="ml-1 text-xs text-brand-400">{sub}</span>}
      </span>
      <span
        className={`tabular ${strong ? "text-lg font-bold" : "text-sm"} ${
          accent ? "text-gold-600" : minus ? "text-red-600" : "text-brand-800"
        }`}
      >
        {minus ? "−" : ""}
        {value}
      </span>
    </div>
  );
}

export default function NetRealizationBreakdown({
  lang,
  o,
}: {
  lang: Lang;
  o: MandiOpportunity;
}) {
  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4">
      <Line label={t(lang, "grossValue")} value={inr(o.grossRevenue)} strong />
      <div className="my-1 border-t border-brand-200" />
      <Line label={t(lang, "commission")} value={inr(o.commissionCost)} minus />
      <Line label={t(lang, "mandiFee")} value={inr(o.mandiFeeCost)} minus />
      {o.cessCost > 0 && <Line label={t(lang, "cess")} value={inr(o.cessCost)} minus />}
      <Line label={t(lang, "hamali")} value={inr(o.hamaliCost)} minus />
      <Line
        label={t(lang, "transport")}
        value={inr(o.transportCost)}
        minus
        sub={`${vehicleName(lang, o.vehicle)} · ${o.roadKm} ${t(lang, "km")}${o.trips > 1 ? ` · ${o.trips} ${t(lang, "trips")}` : ""}`}
      />
      {o.wastageCost > 0 && (
        <Line
          label={t(lang, "spoilage")}
          value={inr(o.wastageCost)}
          minus
          sub={`${(o.wastageFraction * 100).toFixed(1)}%`}
        />
      )}
      <div className="my-1 border-t border-dashed border-brand-300" />
      <Line label={t(lang, "totalDeductions")} value={inr(o.totalDeductions)} minus />
      <div className="my-1 border-t-2 border-brand-300" />
      <Line label={t(lang, "takeHome")} value={inr(o.netRealization)} strong accent />
    </div>
  );
}
