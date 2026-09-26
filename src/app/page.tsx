"use client";

import { useEffect, useState } from "react";
import { Sprout, Route, Coins, TrendingDown } from "lucide-react";
import type { Lang, OpportunityResult } from "@/lib/types";
import { t, STR } from "@/lib/i18n";
import LangToggle from "@/components/LangToggle";
import InputPanel, { type CropMeta, type SolveInput } from "@/components/InputPanel";
import ResultsPanel from "@/components/ResultsPanel";
import ChatWidget from "@/components/ChatWidget";

interface Meta {
  crops: CropMeta[];
  demoFarmer: { name: string; lat: number; lng: number };
  livekit?: boolean;
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("hi");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [result, setResult] = useState<OpportunityResult | null>(null);
  const [farmer, setFarmer] = useState<{ lat: number; lng: number; label?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [initialInput, setInitialInput] = useState<Partial<SolveInput> | null>(null);

  useEffect(() => {
    // Restore the farmer's last crop/qty/location + language (no DB needed).
    try {
      const savedLang = localStorage.getItem("netbhav:lang");
      if (savedLang === "hi" || savedLang === "en") setLang(savedLang);
      const savedQuery = localStorage.getItem("netbhav:lastQuery");
      if (savedQuery) setInitialInput(JSON.parse(savedQuery));
    } catch {
      /* ignore corrupt/unavailable storage */
    }
    fetch("/api/meta")
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => setMsg("Failed to load"));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("netbhav:lang", lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  async function solve(input: SolveInput) {
    setLoading(true);
    setMsg("");
    try {
      localStorage.setItem("netbhav:lastQuery", JSON.stringify(input));
    } catch {
      /* ignore */
    }
    try {
      const r = await fetch("/api/opportunity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await r.json();
      if (data?.best) {
        setResult(data);
        setFarmer({ lat: input.lat, lng: input.lng, label: input.label });
      } else {
        setResult(null);
        setMsg(t(lang, "noResults"));
      }
    } catch {
      setMsg(t(lang, "noResults"));
    } finally {
      setLoading(false);
    }
  }

  function onChatResult(r: OpportunityResult) {
    setResult(r);
    setFarmer({ lat: r.query.lat, lng: r.query.lng, label: lang === "hi" ? "आपका क्षेत्र" : "Your area" });
    setMsg("");
  }

  const problems = [
    { icon: Coins, en: "Fragmented prices", hi: "बिखरे भाव" },
    { icon: Route, en: "Distance ignored", hi: "दूरी अनदेखी" },
    { icon: TrendingDown, en: "Hidden cuts", hi: "छिपी कटौती" },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 pb-24 pt-5 sm:px-6">
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold leading-none text-brand-800">
              {STR.appName[lang]}
            </h1>
            <p className="text-[11px] text-brand-500">
              {lang === "hi" ? "मंडी अवसर एजेंट" : "Mandi Opportunity Agent"}
            </p>
          </div>
        </div>
        <LangToggle lang={lang} onChange={setLang} />
      </header>

      <section className="mb-6 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-600 p-5 text-white sm:p-7">
        <h2 className="text-2xl font-bold leading-tight sm:text-3xl">{t(lang, "tagline")}</h2>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-brand-100">
          {problems.map((p, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <p.icon className="h-4 w-4 text-gold-400" /> {p[lang]}
            </span>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(340px,420px)_1fr]">
        <div className="lg:sticky lg:top-4 lg:self-start">
          {meta && (
            <InputPanel
              lang={lang}
              crops={meta.crops}
              demoFarmer={meta.demoFarmer}
              onSolve={solve}
              loading={loading}
              initial={initialInput}
            />
          )}
        </div>

        <div>
          {result && farmer ? (
            <ResultsPanel lang={lang} result={result} farmer={farmer} />
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-brand-300 bg-white/50 p-8 text-center">
              <Route className="mb-3 h-10 w-10 text-brand-300" />
              <p className="max-w-xs text-brand-500">
                {msg || (lang === "hi"
                  ? "फसल, मात्रा और स्थान डालें — हम हर मंडी की शुद्ध आय की गणना करेंगे।"
                  : "Enter crop, quantity & location — we'll rank every mandi by your real take-home.")}
              </p>
            </div>
          )}
        </div>
      </div>

      {meta && (
        <ChatWidget
          lang={lang}
          location={farmer ? { lat: farmer.lat, lng: farmer.lng } : { lat: meta.demoFarmer.lat, lng: meta.demoFarmer.lng }}
          onResult={onChatResult}
          livekitAvailable={Boolean(meta.livekit)}
        />
      )}

      <footer className="mt-10 text-center text-xs text-brand-400">
        {t(lang, "poweredNote")}
      </footer>
    </main>
  );
}
