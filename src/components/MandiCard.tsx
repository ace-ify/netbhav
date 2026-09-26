"use client";

import { ChevronDown, Award } from "lucide-react";
import type { Lang, MandiOpportunity } from "@/lib/types";
import { inr, t } from "@/lib/i18n";
import NetRealizationBreakdown from "./NetRealizationBreakdown";
import TrendChart from "./TrendChart";

export default function MandiCard({
  lang,
  o,
  crop,
  open,
  onToggle,
}: {
  lang: Lang;
  o: MandiOpportunity;
  crop: string;
  open: boolean;
  onToggle: () => void;
}) {
  const best = o.rank === 1;
  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white transition ${
        best ? "border-gold-500 ring-1 ring-gold-400" : "border-brand-200"
      }`}
    >
      <button onClick={onToggle} className="flex w-full items-center gap-3 p-3 text-left sm:p-4">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            best ? "bg-gold-500 text-white" : "bg-brand-100 text-brand-700"
          }`}
        >
          {best ? <Award className="h-5 w-5" /> : o.rank}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-brand-900">{o.mandi.name}</span>
            {best && (
              <span className="rounded-full bg-gold-400/20 px-2 py-0.5 text-[10px] font-bold uppercase text-gold-600">
                {t(lang, "bestTakeHome")}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-brand-500">
            <span>{o.mandi.district}</span>
            <span>· {o.roadKm} {t(lang, "km")}</span>
            <span className="tabular">· {t(lang, "price")} {inr(o.modalPricePerQuintal)}</span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="tabular text-lg font-bold text-brand-800">{inr(o.netRealization)}</div>
          {best ? (
            <div className="text-xs font-medium text-gold-600">{t(lang, "takeHome")}</div>
          ) : (
            <div className="tabular text-xs font-medium text-red-500">{inr(o.deltaVsBest)}</div>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-brand-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="space-y-3 border-t border-brand-100 p-3 sm:p-4">
          <NetRealizationBreakdown lang={lang} o={o} />
          <TrendChart lang={lang} mandiId={o.mandi.id} crop={crop} />
        </div>
      )}
    </div>
  );
}
