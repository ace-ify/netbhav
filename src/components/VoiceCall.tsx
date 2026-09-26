"use client";

import { useEffect, useRef, useState } from "react";
import { PhoneOff, Mic, Loader2, Volume2 } from "lucide-react";
import type { Lang, OpportunityResult } from "@/lib/types";
import { t } from "@/lib/i18n";

type Phase = "idle" | "listening" | "thinking" | "speaking";

// Hands-free, call-like voice loop built entirely on the browser's Web Speech
// API — no LiveKit, no server audio, no keys. STT (SpeechRecognition) →
// /api/chat → TTS (speechSynthesis) → listen again, until you hang up.
// LiveKit/Twilio are only for real PSTN phone calls; the browser IS the phone here.
export default function VoiceCall({
  lang,
  location,
  onResult,
  onClose,
}: {
  lang: Lang;
  location: { lat: number; lng: number } | null;
  onResult: (r: OpportunityResult) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [heard, setHeard] = useState("");
  const [reply, setReply] = useState("");
  const active = useRef(true);
  const phaseRef = useRef<Phase>("idle");
  const recRef = useRef<any>(null);
  const setP = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const SR =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  useEffect(() => {
    active.current = true;
    if (SR) listen();
    return () => {
      active.current = false;
      try {
        recRef.current?.stop();
      } catch {}
      window.speechSynthesis?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function listen() {
    if (!active.current || !SR) return;
    setHeard("");
    setP("listening");
    const rec = new SR();
    rec.lang = lang === "hi" ? "hi-IN" : "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setHeard((finalText + " " + interim).trim());
    };
    rec.onend = () => {
      if (!active.current || phaseRef.current !== "listening") return;
      const said = finalText.trim();
      if (said) ask(said);
      else listen(); // silence → keep the line open
    };
    rec.onerror = () => {};
    recRef.current = rec;
    try {
      rec.start();
    } catch {}
  }

  async function ask(text: string) {
    setP("thinking");
    setHeard(text);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang, location }),
      });
      const data = await r.json();
      const say: string = data.reply || (lang === "hi" ? "फिर से कहें।" : "Please say that again.");
      if (data.result?.best) onResult(data.result as OpportunityResult);
      speak(say);
    } catch {
      speak(lang === "hi" ? "नेटवर्क त्रुटि। दोबारा बोलें।" : "Network error. Please try again.");
    }
  }

  function speak(text: string) {
    setReply(text);
    setP("speaking");
    const synth = window.speechSynthesis;
    if (!synth) {
      if (active.current) listen();
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "hi" ? "hi-IN" : "en-IN";
    u.onend = () => {
      if (active.current) listen();
    };
    u.onerror = () => {
      if (active.current) listen();
    };
    synth.cancel();
    synth.speak(u);
  }

  function hangUp() {
    active.current = false;
    try {
      recRef.current?.stop();
    } catch {}
    window.speechSynthesis?.cancel();
    setP("idle");
    onClose();
  }

  const status =
    phase === "thinking"
      ? t(lang, "callThinking")
      : phase === "speaking"
        ? t(lang, "callSpeaking")
        : phase === "listening"
          ? t(lang, "listening")
          : t(lang, "callTapToStart");

  return (
    <div className="fixed inset-0 z-[1100] flex flex-col items-center justify-between bg-brand-800/95 p-6 text-white backdrop-blur">
      <div className="mt-6 text-center">
        <div className="text-sm uppercase tracking-widest text-brand-200">{t(lang, "voiceCall")}</div>
        <div className="mt-1 text-lg font-semibold">NetBhav</div>
      </div>

      {!SR ? (
        <p className="max-w-xs text-center text-brand-100">{t(lang, "callUnsupported")}</p>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <button
            onClick={() => (phase === "idle" ? listen() : phase === "speaking" ? listen() : undefined)}
            className={`relative flex h-32 w-32 items-center justify-center rounded-full transition ${
              phase === "listening"
                ? "bg-red-500"
                : phase === "speaking"
                  ? "bg-gold-500"
                  : "bg-brand-500"
            }`}
          >
            {phase === "listening" && (
              <span className="absolute inset-0 animate-ping rounded-full bg-red-400/50" />
            )}
            {phase === "thinking" ? (
              <Loader2 className="h-12 w-12 animate-spin" />
            ) : phase === "speaking" ? (
              <Volume2 className="h-12 w-12" />
            ) : (
              <Mic className="h-12 w-12" />
            )}
          </button>
          <div className="text-lg font-medium">{status}</div>
          <div className="min-h-[3rem] max-w-md text-center">
            {heard && <p className="text-brand-100">“{heard}”</p>}
            {reply && phase !== "listening" && (
              <p className="mt-2 text-sm text-brand-200">{reply}</p>
            )}
          </div>
        </div>
      )}

      <button
        onClick={hangUp}
        className="mb-4 flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 font-semibold shadow-lg transition hover:bg-red-700"
      >
        <PhoneOff className="h-5 w-5" /> {t(lang, "endCall")}
      </button>
    </div>
  );
}
