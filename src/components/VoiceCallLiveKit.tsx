"use client";

import { useEffect, useRef, useState } from "react";
import { PhoneOff, Send, Loader2, MessageCircle } from "lucide-react";
import {
  useVoiceAssistant,
  BarVisualizer,
  useRoomContext,
  RoomAudioRenderer,
  LiveKitRoom,
} from "@livekit/components-react";
import type { Lang } from "@/lib/types";
import { t } from "@/lib/i18n";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

// All pieces below render INSIDE <LiveKitRoom>, so LiveKit hooks are valid.
// One agent, one room: voice + text (lk.chat) both go to the same LiveKit agent.

// Compact call control that sits in the chat header IN PLACE of the "Voice call"
// button: live waveform + state + a small red end button.
export function CallBar({ lang, onEnd }: { lang: Lang; onEnd: () => void }) {
  const { state, audioTrack } = useVoiceAssistant();
  const label =
    state === "speaking"
      ? t(lang, "callSpeaking")
      : state === "thinking"
        ? t(lang, "callThinking")
        : t(lang, "listening");
  return (
    <div className="ml-auto flex items-center gap-2">
      <div className="h-6 w-20">
        <BarVisualizer
          state={state}
          barCount={5}
          trackRef={audioTrack}
          options={{ minHeight: 8 }}
          style={{ ["--lk-va-bar-color" as string]: "#f2b705" }}
        />
      </div>
      <span className="hidden text-[11px] text-brand-100 sm:inline">{label}</span>
      <button
        onClick={onEnd}
        aria-label={t(lang, "endCall")}
        title={t(lang, "endCall")}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700"
      >
        <PhoneOff className="h-4 w-4" />
      </button>
      <RoomAudioRenderer />
    </div>
  );
}

// Live agent transcript line + persists each finalized agent reply as a saved
// chat bubble (via onAgentText) so the conversation history survives the call.
export function CallTranscript({
  lang,
  onAgentText,
}: {
  lang: Lang;
  onAgentText?: (text: string) => void;
}) {
  const va = useVoiceAssistant() as {
    state: string;
    agentTranscriptions?: { id?: string; text?: string; final?: boolean }[];
  };
  const segs = va.agentTranscriptions ?? [];
  const done = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!onAgentText) return;
    for (const s of segs) {
      const id = s?.id ?? "";
      const text = (s?.text ?? "").trim();
      if (s?.final === true && id && text && !done.current.has(id)) {
        done.current.add(id);
        onAgentText(text);
      }
    }
  }, [segs, onAgentText]);

  const last = segs[segs.length - 1];
  const liveText = last && last.final !== true ? (last.text ?? "").trim() : "";
  if (!liveText && va.state !== "thinking") return null;
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl bg-brand-50 px-3 py-2 text-sm text-brand-900">
        {liveText || (
          <span className="inline-flex items-center gap-1 text-brand-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t(lang, "callThinking")}
          </span>
        )}
      </div>
    </div>
  );
}

// Composer used during a call: text is sent to the SAME agent over lk.chat,
// which interrupts/answers by voice. The typed line is echoed to the list.
export function CallComposer({
  lang,
  onUserText,
}: {
  lang: Lang;
  onUserText: (text: string) => void;
}) {
  const room = useRoomContext();
  const [text, setText] = useState("");
  async function send() {
    const q = text.trim();
    if (!q) return;
    setText("");
    onUserText(q);
    try {
      await room.localParticipant.sendText(q, { topic: "lk.chat" });
    } catch {
      /* ignore transient send errors */
    }
  }
  return (
    <div className="flex items-center gap-2 border-t border-brand-100 p-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
        placeholder={lang === "hi" ? "कॉल के दौरान लिखें भी…" : "Type during the call too…"}
        className="flex-1 rounded-full border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
      />
      <button
        onClick={send}
        aria-label={t(lang, "send")}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white"
      >
        <Send className="h-5 w-5" />
      </button>
    </div>
  );
}

// The full in-call panel: same chat shell, but the header's "Voice call" button
// is replaced IN PLACE by the live waveform + end button, and the composer sends
// text to the same LiveKit agent. Lazy-loaded by ChatWidget (keeps bundle lean).
export default function LiveKitCallPanel({
  lang,
  url,
  token,
  title,
  msgs,
  onUserText,
  onAgentText,
  onEnd,
}: {
  lang: Lang;
  url: string;
  token: string;
  title: string;
  msgs: Msg[];
  onUserText: (text: string) => void;
  onAgentText?: (text: string) => void;
  onEnd: () => void;
}) {
  return (
    <LiveKitRoom
      serverUrl={url}
      token={token}
      connect
      audio
      video={false}
      onDisconnected={onEnd}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 bg-brand-600 px-4 py-3 text-white">
          <MessageCircle className="h-5 w-5" />
          <span className="font-semibold">{title}</span>
          <CallBar lang={lang} onEnd={onEnd} />
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                  m.role === "user" ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-900"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          <CallTranscript lang={lang} onAgentText={onAgentText} />
        </div>

        <CallComposer lang={lang} onUserText={onUserText} />
      </div>
    </LiveKitRoom>
  );
}

