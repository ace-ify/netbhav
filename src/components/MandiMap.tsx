"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Lang, OpportunityResult } from "@/lib/types";
import { inr, t } from "@/lib/i18n";

function farmerIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="background:#1d4ed8;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px #1d4ed8"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useMemo(() => {
    if (points.length) map.fitBounds(points, { padding: [40, 40] });
  }, [map, points]);
  return null;
}

interface Route {
  geometry: [number, number][];
  km: number;
  durationMin: number;
}

export default function MandiMap({
  lang,
  result,
  farmer,
  selectedId,
  onSelect,
}: {
  lang: Lang;
  result: OpportunityResult;
  farmer: { lat: number; lng: number; label?: string };
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const opps = result.opportunities;
  const best = result.best;
  const points: [number, number][] = [
    [farmer.lat, farmer.lng],
    ...opps.map((o) => [o.mandi.lat, o.mandi.lng] as [number, number]),
  ];

  // The mandi whose road route we draw: the selected one, else the best.
  const target = opps.find((o) => o.mandi.id === (selectedId ?? best?.mandi.id)) ?? best;
  const [route, setRoute] = useState<Route | null>(null);

  useEffect(() => {
    setRoute(null);
    if (!target || target.roadKm === 0) return; // skip doorstep / self
    const ctrl = new AbortController();
    fetch(
      `/api/route?fromLat=${farmer.lat}&fromLng=${farmer.lng}&toLat=${target.mandi.lat}&toLng=${target.mandi.lng}`,
      { signal: ctrl.signal }
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.geometry)) setRoute(d);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [target, farmer.lat, farmer.lng]);

  const maxNet = Math.max(...opps.map((o) => o.netRealization), 1);
  const minNet = Math.min(...opps.map((o) => o.netRealization), 0);
  const color = (net: number) => {
    if (maxNet === minNet) return "#3a8340";
    const f = (net - minNet) / (maxNet - minNet);
    const r = Math.round(220 - f * 178);
    const g = Math.round(90 + f * 70);
    return `rgb(${r},${g},60)`;
  };

  return (
    <div className="relative h-[340px] w-full overflow-hidden rounded-xl border border-brand-200">
      <MapContainer center={[farmer.lat, farmer.lng]} zoom={9} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer attribution="&copy; OpenStreetMap" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds points={points} />

        {/* Real road route (OSRM) to the selected mandi; faint straight line if routing is down. */}
        {target && route ? (
          <Polyline positions={route.geometry} pathOptions={{ color: "#c48f00", weight: 4 }} />
        ) : target && target.roadKm > 0 ? (
          <Polyline
            positions={[[farmer.lat, farmer.lng], [target.mandi.lat, target.mandi.lng]]}
            pathOptions={{ color: "#e0a800", weight: 3, dashArray: "6 6" }}
          />
        ) : null}

        <Marker position={[farmer.lat, farmer.lng]} icon={farmerIcon()}>
          <Popup>{farmer.label || (lang === "hi" ? "आप" : "You")}</Popup>
        </Marker>

        {opps.map((o) => {
          const isBest = o.rank === 1;
          const isSel = o.mandi.id === selectedId;
          return (
            <CircleMarker
              key={o.mandi.id}
              center={[o.mandi.lat, o.mandi.lng]}
              radius={isBest ? 12 : isSel ? 10 : 7}
              pathOptions={{
                color: isBest ? "#c48f00" : "#ffffff",
                weight: isBest ? 3 : 1.5,
                fillColor: isBest ? "#f2b705" : color(o.netRealization),
                fillOpacity: 0.9,
              }}
              eventHandlers={{ click: () => onSelect(o.mandi.id) }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">
                    #{o.rank} {o.mandi.name}
                  </div>
                  <div>{t(lang, "takeHome")}: <b>{inr(o.netRealization)}</b></div>
                  <div className="text-xs text-gray-500">
                    {o.roadKm} {t(lang, "km")} · {t(lang, "price")} {inr(o.modalPricePerQuintal)}
                  </div>
                  {o.roadKm > 0 && o.mandi.id !== (selectedId ?? best?.mandi.id) && (
                    <button
                      onClick={() => onSelect(o.mandi.id)}
                      className="mt-1 inline-block font-medium text-brand-700 underline"
                    >
                      {lang === "hi" ? "रास्ता दिखाएँ" : "Show route"}
                    </button>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* In-platform route summary for the selected mandi (road route drawn above). */}
      {target && target.roadKm > 0 && (
        <div className="absolute bottom-2 left-2 z-[500] flex items-center gap-2 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs shadow">
          <span className="font-medium text-brand-800">
            {target.mandi.name}:{" "}
            {route
              ? `${Math.round(route.km)} ${t(lang, "km")} · ${Math.round(route.durationMin)} min`
              : `~${target.roadKm} ${t(lang, "km")} (${lang === "hi" ? "अनुमानित" : "est."})`}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 font-medium ${
              route ? "bg-brand-600 text-white" : "bg-neutral-200 text-neutral-600"
            }`}
          >
            {route ? (lang === "hi" ? "सड़क मार्ग" : "road") : lang === "hi" ? "अनुमान" : "est."}
          </span>
        </div>
      )}
    </div>
  );
}
