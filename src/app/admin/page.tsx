"use client";

import { useEffect, useState } from "react";

interface FarmerRow {
  phone: string;
  name: string;
  location: string;
  crops: string[];
  quintals: number;
  consentToCall: boolean;
  lastSignal: string | null;
  alerts: number;
  bestMandi: string;
  takeHome: number;
  incomeProtected: number;
  freshness: string;
}
interface Metrics {
  farmers: number;
  consenting: number;
  quintalsTracked: number;
  cropsCovered: number;
  mandiYards: number;
  alertsSent: number;
  incomeProtected: number;
}

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export default function AdminConsole() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [farmers, setFarmers] = useState<FarmerRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function load() {
    const r = await fetch("/api/admin");
    if (r.ok) {
      const d = await r.json();
      setMetrics(d.metrics);
      setFarmers(d.farmers);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function runAlerts() {
    setBusy(true);
    setNote("Running alert check across all consenting farmers…");
    try {
      const r = await fetch("/api/alerts/run", { method: "POST" });
      const d = await r.json();
      const fired = (d.results || []).filter((x: { fired?: boolean }) => x.fired).length;
      setNote(`Checked ${d.ran} farmers · ${fired} alert(s) fired.`);
      await load();
    } catch {
      setNote("Alert run failed.");
    } finally {
      setBusy(false);
    }
  }

  async function callFarmer(phone: string) {
    setNote(`Dialing ${phone}…`);
    try {
      const r = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const d = await r.json();
      setNote(d.sent ? `Call placed to ${phone}.` : `Call not placed: ${d.reason}`);
    } catch {
      setNote("Call request failed.");
    }
  }

  const metricCards = metrics
    ? [
        { label: "Farmer income surfaced", value: inr(metrics.incomeProtected), hero: true },
        { label: "Registered farmers", value: metrics.farmers },
        { label: "Opted in to alerts", value: metrics.consenting },
        { label: "Quintals tracked", value: metrics.quintalsTracked.toLocaleString("en-IN") },
        { label: "Crops covered", value: metrics.cropsCovered },
        { label: "Mandi yards", value: metrics.mandiYards },
        { label: "Alerts sent", value: metrics.alertsSent },
      ]
    : [];

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-8 text-neutral-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-oswald text-3xl font-semibold tracking-tight">NetBhav — Operator Console</h1>
            <p className="text-sm text-neutral-500">
              Proactive advisory control room · alerts &amp; outbound calls · income surfaced for farmers
            </p>
          </div>
          <button
            onClick={runAlerts}
            disabled={busy}
            className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {busy ? "Running…" : "Run alert check now"}
          </button>
        </header>

        {note && (
          <div className="mb-5 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700">
            {note}
          </div>
        )}

        <section className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-neutral-200 sm:grid-cols-3 lg:grid-cols-4">
          {metricCards.map((m) => (
            <div key={m.label} className={`bg-white p-5 ${m.hero ? "col-span-2 lg:col-span-2" : ""}`}>
              <div className={`font-oswald font-semibold tracking-tight ${m.hero ? "text-4xl text-emerald-600" : "text-2xl"}`}>
                {m.value}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wide text-neutral-500">{m.label}</div>
            </div>
          ))}
        </section>

        <h2 className="mb-3 font-oswald text-xl font-medium tracking-tight">Farmers</h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Farmer</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Crops</th>
                <th className="px-4 py-3">Best mandi</th>
                <th className="px-4 py-3 text-right">Take-home</th>
                <th className="px-4 py-3 text-right">Income surfaced</th>
                <th className="px-4 py-3">Signal</th>
                <th className="px-4 py-3">Consent</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {farmers.map((f) => (
                <tr key={f.phone} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{f.name || "—"}</div>
                    <div className="text-xs text-neutral-400">{f.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{f.location}</td>
                  <td className="px-4 py-3 text-neutral-600">{f.crops.join(", ") || "—"} · {f.quintals}q</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {f.bestMandi || "—"}{" "}
                    {f.freshness && (
                      <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] uppercase text-neutral-500">{f.freshness}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{f.takeHome ? inr(f.takeHome) : "—"}</td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-600">{f.incomeProtected ? "+" + inr(f.incomeProtected) : "—"}</td>
                  <td className="px-4 py-3">{f.lastSignal ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${f.consentToCall ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
                      {f.consentToCall ? "yes" : "no"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => callFarmer(f.phone)}
                      className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium transition hover:bg-neutral-100"
                    >
                      Call now
                    </button>
                  </td>
                </tr>
              ))}
              {farmers.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-neutral-400">
                    No farmers yet — they register via the app, WhatsApp, or a voice call.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-neutral-400">
          &ldquo;Income surfaced&rdquo; = extra ₹ the honest-math engine finds vs the naive &ldquo;chase the highest sticker&rdquo; choice, per farmer. Prices tagged live/cached/reference.
        </p>
      </div>
    </main>
  );
}
