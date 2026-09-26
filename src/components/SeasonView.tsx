"use client";

import { useState } from "react";
import { CalendarRange, ChevronDown } from "lucide-react";
import type { Lang } from "@/lib/types";
import { getSeason } from "@/lib/data/season";
import { t } from "@/lib/i18n";

// Mentor's "life-year cycle" view: a factual crop calendar + typical soft/firm
// price windows + storage/MSP guidance. Labelled reference, NOT a forecast.
export default function SeasonView({ lang, cropId }: { lang: Lang; cropId: string }) {
  const [open, setOpen] = useState(false);
  const s = getSeason(cropId);
  if (!s) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-brand-200 bg-white">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 p-3 text-left">
        <CalendarRange className="h-4 w-4 text-brand-600" />
        <span className="text-sm font-semibold text-brand-700">{t(lang, "seasonTitle")}</span>
        {s.mspBacked && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase text-green-700">
            {t(lang, "seasonMsp")}
          </span>
        )}
        <ChevronDown className={`ml-auto h-4 w-4 text-brand-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-3 border-t border-brand-100 p-3 text-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
            <Cell label={lang === "hi" ? "मौसम" : "Season"} value={s.season[lang]} />
            <Cell label={t(lang, "seasonSow")} value={s.sow} />
            <Cell label={t(lang, "seasonHarvest")} value={s.harvest} />
            <Cell label={t(lang, "seasonMsp")} value={s.mspBacked ? "✓" : "—"} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg bg-red-50 p-2">
              <div className="text-[11px] font-semibold uppercase text-red-600">{t(lang, "seasonSoft")}</div>
              <div className="text-brand-800">{s.softMonths[lang]}</div>
            </div>
            <div className="rounded-lg bg-green-50 p-2">
              <div className="text-[11px] font-semibold uppercase text-green-700">{t(lang, "seasonFirm")}</div>
              <div className="text-brand-800">{s.firmMonths[lang]}</div>
            </div>
          </div>
          <p className="text-brand-700">{s.note[lang]}</p>
          <p className="text-xs text-brand-400">{t(lang, "seasonDisclaimer")}</p>
        </div>
      )}
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-400">{label}</div>
      <div className="text-brand-800">{value}</div>
    </div>
  );
}
