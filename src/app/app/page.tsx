"use client";

import { useEffect, useState } from "react";
import { Route } from "lucide-react";
import type { Lang, OpportunityResult } from "@/lib/types";
import { t } from "@/lib/i18n";
import LangToggle from "@/components/LangToggle";
import InputPanel, { type CropMeta, type SolveInput } from "@/components/InputPanel";
import ResultsPanel from "@/components/ResultsPanel";
import ChatWidget from "@/components/ChatWidget";
import Nav from "@/components/ui/Nav";

interface Meta {
  crops: CropMeta[];
  demoFarmer: { name: string; lat: number; lng: number };
  livekit?: boolean;
}

export default function AppPage() {
  const [lang, setLang] = useState<Lang>("en");
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

  return (
    <>
      <Nav right={<LangToggle lang={lang} onChange={setLang} />} />

      <main className="mx-auto min-h-screen max-w-6xl px-4 pb-24 pt-28 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <h1 className="font-oswald text-3xl font-500 leading-tight tracking-tight text-neutral-900 md:text-4xl">
            {lang === "hi"
              ? "सबसे ज़्यादा हाथ में आने वाली मंडी खोजें"
              : "Find the mandi that pays you most"}
          </h1>
          <p className="mt-2 text-lg text-neutral-600">{t(lang, "tagline")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(340px,420px)_1fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
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
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
                <Route className="mb-3 h-10 w-10 text-neutral-300" />
                <p className="max-w-xs text-lg text-neutral-500">
                  {msg ||
                    (lang === "hi"
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
            location={
              farmer
                ? { lat: farmer.lat, lng: farmer.lng }
                : { lat: meta.demoFarmer.lat, lng: meta.demoFarmer.lng }
            }
            onResult={onChatResult}
            livekitAvailable={Boolean(meta.livekit)}
          />
        )}

        <footer className="mt-10 text-center text-xs text-neutral-400">
          {t(lang, "poweredNote")}
        </footer>
      </main>
    </>
  );
}
