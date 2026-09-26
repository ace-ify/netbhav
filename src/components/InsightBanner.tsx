"use client";

import { TrendingUp, MapPin, Truck } from "lucide-react";
import type { Lang, OpportunityResult } from "@/lib/types";
import { inr, t, type StrKey } from "@/lib/i18n";
import { advise } from "@/lib/engine";
import { trendFor } from "@/lib/data/prices.seed";

export default function InsightBanner({
  lang,
  result,
}: {
  lang: Lang;
  result: OpportunityResult;
}) {
  const best = result.best;
  if (!best) return null;

  const adv = result.advisory ?? advise(trendFor(best.mandi.id, result.crop.id, 30));
  const AD: Record<string, { label: StrKey; why: StrKey; cls: string }> = {
    SELL: { label: "adSell", why: "adSellWhy", cls: "bg-green-400/20 text-green-100 ring-green-300/40" },
    WAIT: { label: "adWait", why: "adWaitWhy", cls: "bg-blue-400/20 text-blue-100 ring-blue-300/40" },
    MONITOR: { label: "adMonitor", why: "adMonitorWhy", cls: "bg-gold-400/20 text-gold-100 ring-gold-300/40" },
  };
  const ad = AD[adv.signal];

  const delta = result.insightDeltaRupees;
  const naiveIsBest = delta <= 0; // highest-price mandi also happens to be net-best
  // What the farmer would have earned chasing the sticker price:
  const headlineDelta = naiveIsBest ? result.savingsVsNearest : delta;
  const showTrap = headlineDelta > 0;

  return (
    <div className="animate-pop overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-lg">
      <div className="p-5 sm:p-7">
        <div className="flex items-center gap-2 text-brand-100">
          <TrendingUp className="h-5 w-5 text-gold-400" />
          <span className="text-sm font-medium">
            {lang === "hi" ? "समझदार फ़ैसला" : "The smart call"}
          </span>
        </div>

        {showTrap ? (
          <>
            <p className="mt-3 text-lg font-medium text-brand-50">
              {naiveIsBest
                ? lang === "hi"
                  ? "सबसे नज़दीकी मंडी के बजाय यहाँ बेचकर"
                  : "Sell here instead of the nearest mandi and keep"
                : lang === "hi"
                  ? "सबसे ऊँचे भाव के पीछे भागने के बजाय यहाँ बेचकर"
                  : "Skip the highest-price mandi, sell here and keep"}
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-gold-400 tabular sm:text-5xl">
                +{inr(headlineDelta)}
              </span>
              <span className="text-brand-100">
                {naiveIsBest ? t(lang, "vsNearest") : t(lang, "extraInPocket")}
              </span>
            </div>
            <p className="mt-1 text-sm text-brand-100">
              {naiveIsBest ? "" : t(lang, "vsHighestPrice")} · {t(lang, "sameCrop")}
            </p>
          </>
        ) : (
          <p className="mt-3 text-2xl font-bold">{t(lang, "sameCrop")}</p>
        )}

        <div className="mt-5 rounded-xl bg-white/10 p-4 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-brand-100">
                {t(lang, "sell")}
              </div>
              <div className="text-2xl font-bold">{best.mandi.name}</div>
              <div className="flex items-center gap-3 text-sm text-brand-100">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {best.mandi.district}
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" /> {best.roadKm} {t(lang, "km")}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wide text-brand-100">
                {t(lang, "takeHome")}
              </div>
              <div className="text-3xl font-extrabold text-gold-400 tabular">
                {inr(best.netRealization)}
              </div>
              <div className="text-sm text-brand-100 tabular">
                {inr(best.netPerQuintal)}/{t(lang, "quintals").replace(/s$/, "")}
              </div>
            </div>
          </div>

          <div className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ring-1 ${ad.cls}`}>
            <span className="font-bold uppercase tracking-wide">{adv.signal}</span>
            <span className="opacity-90">
              {t(lang, ad.label)} — {t(lang, ad.why)}
              {adv.changePct !== 0 && ` (${adv.changePct > 0 ? "+" : ""}${adv.changePct.toFixed(1)}%)`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
