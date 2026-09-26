"use client";

import { useState } from "react";
import { MapPin, Loader2, Search, Users } from "lucide-react";
import type { Lang } from "@/lib/types";
import { t } from "@/lib/i18n";

export interface CropMeta {
  id: string;
  name: { en: string; hi: string };
  emoji: string;
}
export interface SolveInput {
  crop: string;
  quantityQuintals: number;
  lat: number;
  lng: number;
  label?: string;
  maxDistanceKm?: number;
  fpo?: boolean;
}

export default function InputPanel({
  lang,
  crops,
  demoFarmer,
  onSolve,
  loading,
  initial,
}: {
  lang: Lang;
  crops: CropMeta[];
  demoFarmer: { name: string; lat: number; lng: number };
  onSolve: (input: SolveInput) => void;
  loading: boolean;
  initial?: Partial<SolveInput> | null;
}) {
  const [crop, setCrop] = useState(initial?.crop ?? "wheat");
  const [qty, setQty] = useState(initial?.quantityQuintals ?? 50);
  const [text, setText] = useState(initial?.label ?? demoFarmer.name);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initial?.lat != null && initial?.lng != null
      ? { lat: initial.lat, lng: initial.lng }
      : { lat: demoFarmer.lat, lng: demoFarmer.lng }
  );
  const [maxKm, setMaxKm] = useState<number | "">(initial?.maxDistanceKm ?? "");
  const [fpo, setFpo] = useState(Boolean(initial?.fpo));
  const [geoBusy, setGeoBusy] = useState(false);
  const [err, setErr] = useState("");

  async function resolveText(): Promise<{ lat: number; lng: number } | null> {
    if (!text.trim()) return coords;
    setGeoBusy(true);
    setErr("");
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(text)}`);
      if (!r.ok) throw new Error("not found");
      const g = await r.json();
      const c = { lat: g.lat, lng: g.lng };
      setCoords(c);
      return c;
    } catch {
      setErr(lang === "hi" ? "स्थान नहीं मिला" : "Place not found");
      return null;
    } finally {
      setGeoBusy(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setText(lang === "hi" ? "मेरा स्थान" : "My location");
        setGeoBusy(false);
      },
      () => {
        setErr(lang === "hi" ? "स्थान नहीं मिल सका" : "Couldn't get location");
        setGeoBusy(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function submit() {
    let c = coords;
    if (!c) c = await resolveText();
    if (!c) return;
    if (!qty || qty <= 0) {
      setErr(lang === "hi" ? "मात्रा डालें" : "Enter a quantity");
      return;
    }
    onSolve({
      crop,
      quantityQuintals: qty,
      lat: c.lat,
      lng: c.lng,
      label: text,
      maxDistanceKm: maxKm === "" ? undefined : Number(maxKm),
      fpo,
    });
  }

  return (
    <div className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-6">
      <label className="mb-2 block text-sm font-semibold text-brand-700">{t(lang, "crop")}</label>
      <div className="mb-5 flex flex-wrap gap-2">
        {crops.map((c) => (
          <button
            key={c.id}
            onClick={() => setCrop(c.id)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              crop === c.id
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-brand-200 bg-brand-50 text-brand-800 hover:border-brand-400"
            }`}
          >
            <span aria-hidden>{c.emoji}</span>
            {c.name[lang]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-700">
            {t(lang, "quantity")} ({t(lang, "quintals")})
          </label>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-full rounded-xl border border-brand-200 px-3 py-2.5 text-lg tabular outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-700">
            {t(lang, "withinKm")} ({t(lang, "km")})
          </label>
          <select
            value={maxKm}
            onChange={(e) => setMaxKm(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-lg outline-none focus:border-brand-500"
          >
            <option value="">{t(lang, "anyDistance")}</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={150}>150</option>
          </select>
        </div>
      </div>

      <label className="mb-2 mt-4 block text-sm font-semibold text-brand-700">
        {t(lang, "location")}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setCoords(null);
            }}
            onBlur={() => !coords && resolveText()}
            placeholder={t(lang, "locationPlaceholder")}
            className="w-full rounded-xl border border-brand-200 py-2.5 pl-9 pr-3 outline-none focus:border-brand-500"
          />
        </div>
        <button
          onClick={useMyLocation}
          title={t(lang, "useMyLocation")}
          className="flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 text-sm font-medium text-brand-700 hover:border-brand-400"
        >
          {geoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </button>
      </div>

      <button
        onClick={() => setFpo((v) => !v)}
        className={`mt-4 flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
          fpo ? "border-gold-500 bg-gold-400/10" : "border-brand-200 bg-white"
        }`}
      >
        <Users className={`h-5 w-5 ${fpo ? "text-gold-600" : "text-brand-400"}`} />
        <span>
          <span className="font-semibold text-brand-800">{t(lang, "fpoMode")}</span>
          <span className="block text-xs text-brand-600">{t(lang, "fpoHint")}</span>
        </span>
        <span
          className={`ml-auto h-5 w-9 rounded-full p-0.5 transition ${fpo ? "bg-gold-500" : "bg-brand-200"}`}
        >
          <span className={`block h-4 w-4 rounded-full bg-white transition ${fpo ? "translate-x-4" : ""}`} />
        </span>
      </button>

      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

      <button
        onClick={submit}
        disabled={loading}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-lg font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> {t(lang, "finding")}
          </>
        ) : (
          t(lang, "find")
        )}
      </button>
    </div>
  );
}
