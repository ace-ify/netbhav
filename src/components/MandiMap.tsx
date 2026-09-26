"use client";

import { useMemo } from "react";
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

  const maxNet = Math.max(...opps.map((o) => o.netRealization), 1);
  const minNet = Math.min(...opps.map((o) => o.netRealization), 0);
  const color = (net: number) => {
    if (maxNet === minNet) return "#3a8340";
    const f = (net - minNet) / (maxNet - minNet); // 0..1
    // red-ish (low) → green (high)
    const r = Math.round(220 - f * 178);
    const g = Math.round(90 + f * 70);
    return `rgb(${r},${g},60)`;
  };

  return (
    <div className="h-[340px] w-full overflow-hidden rounded-xl border border-brand-200">
      <MapContainer center={[farmer.lat, farmer.lng]} zoom={9} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />

        {best && (
          <Polyline
            positions={[[farmer.lat, farmer.lng], [best.mandi.lat, best.mandi.lng]]}
            pathOptions={{ color: "#e0a800", weight: 3, dashArray: "6 6" }}
          />
        )}

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
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
