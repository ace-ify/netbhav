// Geocode an Indian place name → coordinates via Nominatim (OpenStreetMap).
// Free, keyless. Requires a descriptive User-Agent; be gentle on rate limits.

export interface GeoResult {
  lat: number;
  lng: number;
  label: string;
}

const UA = "NetBhav/0.1 (mandi opportunity agent; contact: demo@netbhav.app)";

// Soft bias toward the covered mandi region (central-UP / Awadh belt). Without
// it, ambiguous Devanagari names resolve wrong. bounded=0 keeps it a
// *preference*, so out-of-region places still resolve.
const VIEWBOX = process.env.GEO_VIEWBOX || "78.5,28.5,82.8,25.3"; // lng,lat,lng,lat

async function get<T>(url: string, headers?: Record<string, string>, ms = 5000): Promise<T | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers, cache: "no-store" });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// Nominatim (region-biased) with one retry, then Photon as a keyless fallback.
// Public Nominatim rate-limits aggressively (1 req/s) — a single miss shouldn't
// read as "place not found" during a demo, so we retry + fall back.
export async function geocode(query: string): Promise<GeoResult | null> {
  const q = query.trim();
  if (!q) return null;

  const nomUrl =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in" +
    `&viewbox=${VIEWBOX}&bounded=0&q=${encodeURIComponent(q)}`;
  const nomHeaders = { "User-Agent": UA, "Accept-Language": "en,hi" };

  for (let attempt = 0; attempt < 2; attempt++) {
    const rows = await get<Array<{ lat: string; lon: string; display_name: string }>>(nomUrl, nomHeaders);
    const r = rows?.[0];
    if (r) return { lat: parseFloat(r.lat), lng: parseFloat(r.lon), label: r.display_name };
    if (attempt === 0) await new Promise((res) => setTimeout(res, 700)); // respect 1 req/s
  }

  // Fallback: Photon (Komoot) — keyless, no rate-limit wall. [lng,lat] geometry.
  const photon = await get<{ features?: Array<{ geometry: { coordinates: [number, number] }; properties: Record<string, string> }> }>(
    `https://photon.komoot.io/api/?limit=1&lang=en&q=${encodeURIComponent(q + " India")}`
  );
  const f = photon?.features?.[0];
  if (f) {
    const [lng, lat] = f.geometry.coordinates;
    const p = f.properties;
    const label = [p.name, p.state, p.country].filter(Boolean).join(", ") || q;
    return { lat, lng, label };
  }
  return null;
}
