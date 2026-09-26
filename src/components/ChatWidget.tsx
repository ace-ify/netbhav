"use client";

import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MessageCircle, X, Send, Mic, Volume2, Loader2, Phone } from "lucide-react";
import type { Lang, OpportunityResult } from "@/lib/types";
import { t } from "@/lib/i18n";
import VoiceCall from "./VoiceCall";

// LiveKit in-call panel is lazy-loaded (livekit-client ~160 kB) — only fetched
// when a farmer actually starts a call.
const LiveKitCallPanel = dynamic(() => import("./VoiceCallLiveKit"), { ssr: false });

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const PANEL =
  "fixed bottom-24 right-5 z-[1000] flex h-[70vh] max-h-[560px] w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl";

export default function ChatWidget({
  lang,
  location,
  onResult,
  livekitAvailable = false,
}: {
  lang: Lang;
  location: { lat: number; lng: number } | null;
  onResult: (r: OpportunityResult) => void;
  livekitAvailable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [lkConn, setLkConn] = useState<{ url: string; token: string } | null>(null);
  const [browserCall, setBrowserCall] = useState(false);
  const recRef = useRef<any>(null);

  useEffect(() => {
    setMicSupported(
      typeof window !== "undefined" &&
        Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    );
  }, []);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: q }]);
    setBusy(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: q, lang, location }),
      });
      const data = await r.json();
      const reply: string = data.reply || (lang === "hi" ? "क्षमा करें, दोबारा कहें।" : "Sorry, try again.");
      setMsgs((m) => [...m, { role: "assistant", content: reply }]);
      if (data.result?.best) onResult(data.result as OpportunityResult);
      speak(reply);
    } catch {
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: lang === "hi" ? "नेटवर्क त्रुटि।" : "Network error." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "hi" ? "hi-IN" : "en-IN";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function toggleMic() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (listening) return recRef.current?.stop();
    const rec = new SR();
    rec.lang = lang === "hi" ? "hi-IN" : "en-IN";
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const said = e.results[0][0].transcript;
      setInput(said);
      send(said);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  async function startCall() {
    if (livekitAvailable) {
      try {
        const r = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lang }),
        });
        const d = await r.json();
        if (d.configured && d.token && d.url) {
          setLkConn({ url: d.url, token: d.token });
          setCallActive(true);
          return;
        }
      } catch {
        /* fall through to browser voice */
      }
    }
    setBrowserCall(true);
  }

  function endCall() {
    setCallActive(false);
    setLkConn(null);
  }

  const canCall = micSupported || livekitAvailable;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-[1000] flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg transition hover:bg-neutral-800"
        aria-label={t(lang, "chatTitle")}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && callActive && lkConn ? (
        <div className={PANEL}>
          <LiveKitCallPanel
            lang={lang}
            url={lkConn.url}
            token={lkConn.token}
            title={t(lang, "chatTitle")}
            msgs={msgs}
            onUserText={(txt) => setMsgs((m) => [...m, { role: "user", content: txt }])}
            onAgentText={(txt) => setMsgs((m) => [...m, { role: "assistant", content: txt }])}
            onEnd={endCall}
          />
        </div>
      ) : open ? (
        <div className={PANEL}>
          <div className="flex items-center gap-2 bg-neutral-900 px-4 py-3 text-white">
            <MessageCircle className="h-5 w-5" />
            <span className="font-semibold">{t(lang, "chatTitle")}</span>
            {canCall && (
              <button
                onClick={startCall}
                className="ml-auto flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-sm font-medium hover:bg-white/25"
                aria-label={t(lang, "callStart")}
              >
                <Phone className="h-4 w-4" /> {t(lang, "voiceCall")}
              </button>
            )}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {msgs.length === 0 && (
              <p className="mt-6 text-center text-sm text-neutral-400">{t(lang, "chatPlaceholder")}</p>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-900"
                  }`}
                >
                  {m.content}
                  {m.role === "assistant" && (
                    <button
                      onClick={() => speak(m.content)}
                      className="ml-2 text-neutral-400 hover:text-neutral-700"
                      aria-label={lang === "hi" ? "सुनें" : "Listen"}
                    >
                      <Volume2 className="inline h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-neutral-100 px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-neutral-100 p-2">
            <button
              onClick={toggleMic}
              disabled={!micSupported}
              title={micSupported ? t(lang, "speak") : t(lang, "callUnsupported")}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full disabled:opacity-40 ${
                listening ? "animate-pulse bg-loss text-white" : "bg-neutral-100 text-neutral-700"
              }`}
              aria-label={t(lang, "speak")}
            >
              <Mic className="h-5 w-5" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder={listening ? t(lang, "listening") : t(lang, "chatPlaceholder")}
              className="flex-1 rounded-full border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
            <button
              onClick={() => send(input)}
              disabled={busy}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white disabled:opacity-50"
              aria-label={t(lang, "send")}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}

      {browserCall && (
        <VoiceCall
          lang={lang}
          location={location}
          onResult={onResult}
          onClose={() => setBrowserCall(false)}
        />
      )}
    </>
  );
}

