// Geocode an Indian place name → coordinates via Nominatim (OpenStreetMap).
// Free, keyless. Requires a descriptive User-Agent; be gentle on rate limits.

export interface GeoResult {
  lat: number;
  lng: number;
  label: string;
}

const UA = "NetBhav/0.1 (mandi opportunity agent; contact: demo@netbhav.app)";

// Soft bias toward the covered mandi region (MP Malwa belt). Without it,
// ambiguous Devanagari names resolve wrong — e.g. "राऊ" → Pune, not Rau/Indore.
// bounded=0 keeps it a *preference*, so out-of-region places still resolve.
const VIEWBOX = process.env.GEO_VIEWBOX || "74.0,25.5,80.5,21.0"; // lng,lat,lng,lat

export async function geocode(query: string): Promise<GeoResult | null> {
  const q = query.trim();
  if (!q) return null;
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in" +
    `&viewbox=${VIEWBOX}&bounded=0` +
    `&q=${encodeURIComponent(q)}`;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": UA, "Accept-Language": "en,hi" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    const r = rows[0];
    if (!r) return null;
    return { lat: parseFloat(r.lat), lng: parseFloat(r.lon), label: r.display_name };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
