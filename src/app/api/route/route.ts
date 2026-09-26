import { NextResponse } from "next/server";
import { osrmRoute } from "@/lib/geo/routing";

// GET /api/route?fromLat=..&fromLng=..&toLat=..&toLng=.. → road polyline + km.
// Best-effort (public OSRM). Returns 204 if routing is unavailable; the map
// then just draws a straight line — never a hard failure.
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const nums = ["fromLat", "fromLng", "toLat", "toLng"].map((k) => Number(p.get(k)));
  if (nums.some((n) => !Number.isFinite(n))) {
    return NextResponse.json({ error: "Need fromLat,fromLng,toLat,toLng" }, { status: 400 });
  }
  const [fromLat, fromLng, toLat, toLng] = nums;
  const route = await osrmRoute({ lat: fromLat, lng: fromLng }, { lat: toLat, lng: toLng });
  if (!route) return new NextResponse(null, { status: 204 });
  return NextResponse.json(route);
}
