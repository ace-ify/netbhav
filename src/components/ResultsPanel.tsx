"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Info, Radio, Database, Archive } from "lucide-react";
import type { Lang, OpportunityResult } from "@/lib/types";
import { inr, t } from "@/lib/i18n";
import InsightBanner from "./InsightBanner";
import MandiCard from "./MandiCard";

const MandiMap = dynamic(() => import("./MandiMap"), {
  ssr: false,
  loading: () => <div className="h-[340px] animate-pulse rounded-xl bg-brand-100" />,
});

function FreshnessBadge({ lang, meta }: { lang: Lang; meta: OpportunityResult["priceMeta"] }) {
  const map = {
    live: { icon: Radio, label: t(lang, "freshLive"), cls: "bg-green-100 text-green-700" },
    cached: { icon: Database, label: t(lang, "freshCached"), cls: "bg-blue-100 text-blue-700" },
    seed: { icon: Archive, label: t(lang, "freshSeed"), cls: "bg-amber-100 text-amber-700" },
  }[meta.freshness];
  const Icon = map.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${map.cls}`}>
      <Icon className="h-3 w-3" /> {map.label}
    </span>
  );
}

export default function ResultsPanel({
  lang,
  result,
  farmer,
}: {
  lang: Lang;
  result: OpportunityResult;
  farmer: { lat: number; lng: number; label?: string };
}) {
  const [selected, setSelected] = useState<string | null>(result.best?.mandi.id ?? null);
  const [showAssume, setShowAssume] = useState(false);
  const a = result.assumptions;
  const cropId = result.crop.id;

  return (
    <div className="space-y-4">
      <InsightBanner lang={lang} result={result} />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-brand-500">
        <div className="flex items-center gap-2">
          <FreshnessBadge lang={lang} meta={result.priceMeta} />
          <span>{result.opportunities.length} {lang === "hi" ? "मंडियाँ" : "mandis"}</span>
        </div>
        <button
          onClick={() => setShowAssume((v) => !v)}
          className="flex items-center gap-1 hover:text-brand-700"
        >
          <Info className="h-3.5 w-3.5" /> {t(lang, "assumptions")}
        </button>
      </div>

      {showAssume && (
        <div className="rounded-xl border border-brand-200 bg-white p-3 text-xs text-brand-600">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
            <span>{t(lang, "mandiFee")}: {a.mandiFeePercent}%</span>
            <span>{t(lang, "commission")}: 2–8% ({lang === "hi" ? "फसल अनुसार" : "by crop"})</span>
            <span>{t(lang, "cess")}: {a.cessPercent}%</span>
            <span>{t(lang, "hamali")}: {inr(a.hamaliPerQuintal)}/q</span>
            <span className="col-span-2 sm:col-span-3">{t(lang, "freight")}</span>
          </div>
          <p className="mt-2 text-brand-400">{t(lang, "poweredNote")}</p>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-brand-700">{t(lang, "map")}</h3>
        <MandiMap
          lang={lang}
          result={result}
          farmer={farmer}
          selectedId={selected}
          onSelect={setSelected}
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-brand-700">{t(lang, "allMandis")}</h3>
        <div className="space-y-2">
          {result.opportunities.map((o) => (
            <MandiCard
              key={o.mandi.id}
              lang={lang}
              o={o}
              crop={cropId}
              open={selected === o.mandi.id}
              onToggle={() => setSelected(selected === o.mandi.id ? null : o.mandi.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
