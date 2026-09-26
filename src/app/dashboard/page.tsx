"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2, Bell, MapPin } from "lucide-react";
import { CROPS } from "@/lib/data/crops";
import type { FarmerProfile, FarmerCrop } from "@/lib/store/farmers";

export default function Dashboard() {
  const [phone, setPhone] = useState("+919999900000");
  const [p, setP] = useState<FarmerProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const hi = (p?.lang ?? "hi") === "hi";

  async function load() {
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch(`/api/farmer?phone=${encodeURIComponent(phone)}`);
      if (r.ok) setP(await r.json());
      else {
        // Unknown phone → start a blank profile to fill in.
        setP({
          phone,
          lat: 26.8106,
          lng: 80.7746,
          lang: "hi",
          crops: [{ cropId: "wheat", expectedQuintals: 50 }],
          consentToCall: false,
          alertHistory: [],
        });
        setMsg(hi ? "नया प्रोफ़ाइल — भरकर सेव करें।" : "New profile — fill in and save.");
      }
    } catch {
      setMsg("Failed to load");
    } finally {
      setBusy(false);
    }
  }

  function set<K extends keyof FarmerProfile>(k: K, v: FarmerProfile[K]) {
    setP((cur) => (cur ? { ...cur, [k]: v } : cur));
  }
  function setCrop(i: number, patch: Partial<FarmerCrop>) {
    setP((cur) => {
      if (!cur) return cur;
      const crops = cur.crops.map((c, j) => (j === i ? { ...c, ...patch } : c));
      return { ...cur, crops };
    });
  }

  async function save() {
    if (!p) return;
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch("/api/farmer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: p.phone,
          name: p.name,
          lat: p.lat,
          lng: p.lng,
          locationLabel: p.locationLabel,
          lang: p.lang,
          crops: p.crops,
          fpo: p.fpo,
          consentToCall: p.consentToCall,
          quietHours: p.quietHours,
        }),
      });
      const d = await r.json();
      if (r.ok) {
        setP(d);
        setMsg(hi ? "सेव हो गया ✓" : "Saved ✓");
      } else setMsg(d.error || "Save failed");
    } catch {
      setMsg("Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function geocode() {
    if (!p?.locationLabel) return;
    const r = await fetch(`/api/geocode?q=${encodeURIComponent(p.locationLabel)}`);
    if (r.ok) {
      const g = await r.json();
      setP((cur) => (cur ? { ...cur, lat: g.lat, lng: g.lng } : cur));
      setMsg(hi ? "स्थान मिल गया ✓" : "Location set ✓");
    } else setMsg(hi ? "स्थान नहीं मिला" : "Place not found");
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-brand-800">
            {hi ? "किसान प्रोफ़ाइल" : "Farmer profile"}
          </h1>
          <p className="text-xs text-brand-500">
            {hi ? "एक प्रोफ़ाइल — वेब, WhatsApp और कॉल तीनों पर" : "One profile — web, WhatsApp & voice"}
          </p>
        </div>
        <Link href="/" className="text-sm font-medium text-brand-600 hover:text-brand-800">
          ← NetBhav
        </Link>
      </header>

      <div className="flex gap-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91XXXXXXXXXX"
          className="flex-1 rounded-xl border border-brand-200 px-3 py-2.5 tabular outline-none focus:border-brand-500"
        />
        <button
          onClick={load}
          disabled={busy}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 font-semibold text-white disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {hi ? "खोलें" : "Load"}
        </button>
      </div>
      {msg && <p className="mt-2 text-sm text-brand-600">{msg}</p>}

      {p && (
        <div className="mt-5 space-y-5">
          <div className="rounded-2xl border border-brand-200 bg-white p-4 sm:p-5">
            <label className="mb-1 block text-sm font-semibold text-brand-700">{hi ? "नाम" : "Name"}</label>
            <input
              value={p.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
              className="mb-4 w-full rounded-xl border border-brand-200 px-3 py-2 outline-none focus:border-brand-500"
            />

            <label className="mb-1 block text-sm font-semibold text-brand-700">
              {hi ? "स्थान" : "Location"}
            </label>
            <div className="mb-1 flex gap-2">
              <div className="relative flex-1">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
                <input
                  value={p.locationLabel ?? ""}
                  onChange={(e) => set("locationLabel", e.target.value)}
                  placeholder={hi ? "गाँव / कस्बा" : "Village / town"}
                  className="w-full rounded-xl border border-brand-200 py-2 pl-9 pr-3 outline-none focus:border-brand-500"
                />
              </div>
              <button onClick={geocode} className="rounded-xl border border-brand-200 bg-brand-50 px-3 text-sm text-brand-700">
                {hi ? "खोजें" : "Find"}
              </button>
            </div>
            <p className="mb-4 text-xs text-brand-400 tabular">
              {p.lat.toFixed(3)}, {p.lng.toFixed(3)}
            </p>

            <label className="mb-1 block text-sm font-semibold text-brand-700">{hi ? "फसलें" : "Crops"}</label>
            <div className="space-y-2">
              {p.crops.map((c, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <select
                    value={c.cropId}
                    onChange={(e) => setCrop(i, { cropId: e.target.value })}
                    className="rounded-lg border border-brand-200 bg-white px-2 py-1.5 text-sm"
                  >
                    {CROPS.map((cr) => (
                      <option key={cr.id} value={cr.id}>
                        {cr.name[hi ? "hi" : "en"]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={c.expectedQuintals}
                    onChange={(e) => setCrop(i, { expectedQuintals: Number(e.target.value) })}
                    className="w-24 rounded-lg border border-brand-200 px-2 py-1.5 text-sm tabular"
                    title={hi ? "अपेक्षित क्विंटल" : "expected quintals"}
                  />
                  <input
                    type="date"
                    value={c.readyByISO?.slice(0, 10) ?? ""}
                    onChange={(e) => setCrop(i, { readyByISO: e.target.value || undefined })}
                    className="rounded-lg border border-brand-200 px-2 py-1.5 text-sm"
                    title={hi ? "कब तक तैयार" : "ready by"}
                  />
                  <button
                    onClick={() => set("crops", p.crops.filter((_, j) => j !== i))}
                    className="text-brand-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => set("crops", [...p.crops, { cropId: "wheat", expectedQuintals: 50 }])}
                className="flex items-center gap-1 text-sm font-medium text-brand-600"
              >
                <Plus className="h-4 w-4" /> {hi ? "फसल जोड़ें" : "Add crop"}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={p.lang === "hi"}
                  onChange={(e) => set("lang", e.target.checked ? "hi" : "en")}
                />
                {hi ? "हिंदी" : "Hindi"}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={p.consentToCall}
                  onChange={(e) => set("consentToCall", e.target.checked)}
                />
                {hi ? "अलर्ट/कॉल की अनुमति" : "Allow alerts / calls"}
              </label>
              <label className="flex items-center gap-2 text-sm">
                {hi ? "शांत घंटे" : "Quiet hours"}
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={p.quietHours?.[0] ?? ""}
                  onChange={(e) =>
                    set("quietHours", [Number(e.target.value || 0), p.quietHours?.[1] ?? 6])
                  }
                  className="w-14 rounded-lg border border-brand-200 px-2 py-1 text-sm tabular"
                />
                –
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={p.quietHours?.[1] ?? ""}
                  onChange={(e) =>
                    set("quietHours", [p.quietHours?.[0] ?? 22, Number(e.target.value || 0)])
                  }
                  className="w-14 rounded-lg border border-brand-200 px-2 py-1 text-sm tabular"
                />
              </label>
            </div>

            <button
              onClick={save}
              disabled={busy}
              className="mt-5 w-full rounded-xl bg-brand-600 py-3 font-semibold text-white disabled:opacity-60"
            >
              {hi ? "सेव करें" : "Save profile"}
            </button>
          </div>

          {p.lastSnapshot && (
            <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-brand-500">
                {hi ? "पिछली सलाह" : "Last recommendation"}
              </div>
              <p className="mt-1 text-brand-800">
                {hi ? "सबसे अच्छी मंडी" : "Best mandi"}: <b>{p.lastSnapshot.bestMandiId}</b> · ₹
                {Math.round(p.lastSnapshot.netPerQuintal)}/{hi ? "क्विंटल" : "qtl"} ·{" "}
                <span className="font-semibold">{p.lastSnapshot.signal}</span>
                <span className="ml-1 text-xs text-brand-400">
                  ({p.lastSnapshot.atISO.slice(0, 10)})
                </span>
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-brand-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-700">
              <Bell className="h-4 w-4" /> {hi ? "अलर्ट इतिहास" : "Alert history"}
            </div>
            {p.alertHistory.length === 0 ? (
              <p className="mt-2 text-sm text-brand-400">
                {hi ? "अभी कोई अलर्ट नहीं।" : "No alerts yet."}
              </p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-brand-700">
                {p.alertHistory
                  .slice()
                  .reverse()
                  .map((a, i) => (
                    <li key={i} className="border-l-2 border-gold-400 pl-2">
                      <span className="text-xs text-brand-400">{a.atISO.slice(0, 16).replace("T", " ")} · {a.channel}</span>
                      <br />
                      {a.message}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

