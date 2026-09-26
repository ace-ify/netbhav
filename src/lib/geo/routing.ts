// Road distance + geometry. Primary: self-hostable OSRM via OSRM_URL (set it to
// your own instance in prod — one env, zero code change). Default is FOSSGIS's
// keyless public OSRM (more reliable than the project-osrm demo); project-osrm
// is a secondary fallback. Ranking never blocks on this — see distance.ts.

export interface Route {
  km: number;
  durationMin: number;
  geometry: [number, number][]; // [lat, lng] polyline for the map
}

// self-host → set OSRM_URL (e.g. https://osrm.yourdomain.com). Public fallbacks otherwise.
const PRIMARY = process.env.OSRM_URL || "https://routing.openstreetmap.de/routed-car";
const FALLBACK = "https://router.project-osrm.org";
const ENDPOINTS = Array.from(new Set([PRIMARY, FALLBACK]));

async function fetchRoute(base: string, url: string, ms: number): Promise<Route | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(base + url, { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
    };
    const r = json.routes?.[0];
    if (!r) return null;
    return {
      km: r.distance / 1000,
      durationMin: r.duration / 60,
      geometry: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function osrmRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<Route | null> {
  const path =
    `/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=geojson`;
  // Try each endpoint in order; first that answers wins. 6s each (cold public servers).
  for (const base of ENDPOINTS) {
    const r = await fetchRoute(base, path, 6000);
    if (r) return r;
  }
  return null;
}
