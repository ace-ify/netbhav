"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Info, Radio, Database, Archive } from "lucide-react";
import type { Lang, OpportunityResult } from "@/lib/types";
import { inr, t } from "@/lib/i18n";
import InsightBanner from "./InsightBanner";
import MandiCard from "./MandiCard";
import SeasonView from "./SeasonView";

const MandiMap = dynamic(() => import("./MandiMap"), {
  ssr: false,
  loading: () => <div className="h-[340px] animate-pulse rounded-lg bg-neutral-100" />,
});

function FreshnessBadge({ lang, meta }: { lang: Lang; meta: OpportunityResult["priceMeta"] }) {
  const map = {
    live: { icon: Radio, label: t(lang, "freshLive"), cls: "bg-gain/10 text-gain" },
    cached: { icon: Database, label: t(lang, "freshCached"), cls: "bg-cached/10 text-cached" },
    seed: { icon: Archive, label: t(lang, "freshSeed"), cls: "bg-reference/10 text-reference" },
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

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
        <div className="flex flex-wrap items-center gap-2">
          <FreshnessBadge lang={lang} meta={result.priceMeta} />
          {result.confidence && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                result.confidence.level === "high"
                  ? "bg-gain/10 text-gain"
                  : result.confidence.level === "medium"
                    ? "bg-reference/10 text-reference"
                    : "bg-loss/10 text-loss"
              }`}
              title={result.confidence.reasons.join(" · ")}
            >
              {t(lang, "confidence")}:{" "}
              {t(lang, result.confidence.level === "high" ? "confHigh" : result.confidence.level === "medium" ? "confMedium" : "confLow")}
            </span>
          )}
          {result.priceMeta.asOf && (
            <span>
              {t(lang, "pricesAsOf")} {result.priceMeta.asOf}
              {result.priceMeta.lagDays != null &&
                ` · ${result.priceMeta.lagDays === 0 ? t(lang, "today") : `${result.priceMeta.lagDays} ${t(lang, "daysOld")}`}`}
            </span>
          )}
          <span>{result.opportunities.length} {lang === "hi" ? "विकल्प" : "options"}</span>
        </div>
        <button
          onClick={() => setShowAssume((v) => !v)}
          className="flex items-center gap-1 hover:text-neutral-700"
        >
          <Info className="h-3.5 w-3.5" /> {t(lang, "assumptions")}
        </button>
      </div>

      {(result.breakEven || result.pooling) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {result.breakEven && result.breakEven.marginPerQuintal > 0 && (
            <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm">
              <div className="text-xs font-500 uppercase tracking-wide text-neutral-500">
                {t(lang, "breakEvenTitle")}
              </div>
              <p className="mt-1 text-neutral-800">
                {lang === "hi"
                  ? `भाव ₹${result.breakEven.floorPerQuintal}/क्विंटल तक गिरने पर भी यही सबसे अच्छा — ₹${result.breakEven.marginPerQuintal}/क्विंटल की गुंजाइश।`
                  : `Still the best even if its price fell to ₹${result.breakEven.floorPerQuintal}/qtl — a ₹${result.breakEven.marginPerQuintal}/qtl cushion.`}
              </p>
            </div>
          )}
          {result.pooling && result.pooling.gainPerQuintal > 0 && (
            <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 p-3 text-sm">
              <div className="text-xs font-500 uppercase tracking-wide text-yellow-700">
                {t(lang, "poolTitle")}
              </div>
              <p className="mt-1 text-neutral-800">
                {lang === "hi"
                  ? `पूरे ट्रक में मिलाकर बेचें → +₹${result.pooling.gainPerQuintal}/क्विंटल${result.pooling.unlocksFarther ? " (दूर की बेहतर मंडी खुलती है)" : ""}।`
                  : `Pool into a full truckload → +₹${result.pooling.gainPerQuintal}/qtl${result.pooling.unlocksFarther ? " (unlocks a farther, better mandi)" : ""}.`}
              </p>
            </div>
          )}
        </div>
      )}

      {showAssume && (
        <div className="rounded-lg border border-neutral-200 bg-white p-3 text-xs text-neutral-600">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
            <span>{t(lang, "mandiFee")}: {a.mandiFeePercent}%</span>
            <span>{t(lang, "commission")}: 2–8% ({lang === "hi" ? "फसल अनुसार" : "by crop"})</span>
            <span>{t(lang, "cess")}: {a.cessPercent}%</span>
            <span>{t(lang, "hamali")}: {inr(a.hamaliPerQuintal)}/q</span>
            <span className="col-span-2 sm:col-span-3">{t(lang, "freight")}</span>
          </div>
          <p className="mt-2 text-neutral-400">{t(lang, "poweredNote")}</p>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-xs font-500 uppercase tracking-wide text-neutral-500">{t(lang, "map")}</h3>
        <MandiMap
          lang={lang}
          result={result}
          farmer={farmer}
          selectedId={selected}
          onSelect={setSelected}
        />
      </div>

      <SeasonView lang={lang} cropId={cropId} />

      <div>
        <h3 className="mb-2 text-xs font-500 uppercase tracking-wide text-neutral-500">{t(lang, "allMandis")}</h3>
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
