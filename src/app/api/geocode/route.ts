import { NextResponse } from "next/server";
import { geocode } from "@/lib/geo/nominatim";

// GET /api/geocode?q=Rau,Indore — place name → { lat, lng, label }.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ error: "Missing ?q" }, { status: 400 });
  const hit = await geocode(q);
  if (!hit) return NextResponse.json({ error: "Place not found" }, { status: 404 });
  return NextResponse.json(hit);
}
