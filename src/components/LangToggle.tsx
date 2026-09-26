"use client";

import type { Lang } from "@/lib/types";

export default function LangToggle({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-neutral-200 bg-white p-0.5 text-sm shadow-sm">
      {(["hi", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className={`rounded-full px-3 py-1 font-medium transition ${
            lang === l ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
          }`}
          aria-pressed={lang === l}
        >
          {l === "hi" ? "हिंदी" : "EN"}
        </button>
      ))}
    </div>
  );
}
