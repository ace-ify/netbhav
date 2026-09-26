// Road distance + geometry via public OSRM. Optional refinement/visual only —
// ranking itself uses instant haversine×roadFactor so it's never network-bound.

export interface Route {
  km: number;
  durationMin: number;
  geometry: [number, number][]; // [lat, lng] polyline for the map
}

const OSRM = process.env.OSRM_URL || "https://router.project-osrm.org";

export async function osrmRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<Route | null> {
  const url =
    `${OSRM}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=geojson`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
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
