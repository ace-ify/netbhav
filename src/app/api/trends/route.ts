import { NextResponse } from "next/server";
import { trendFor } from "@/lib/data/prices.seed";
import { getCropHistory } from "@/lib/data/agmarknet";
import { MANDI_BY_ID } from "@/lib/data/mandis";

// GET /api/trends?mandiId=..&crop=..&days=30
// Serves REAL state-level daily history from the live Mandi API when available
// (>=5 points); otherwise a labelled synthetic reference curve. `real` says which.
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const mandiId = p.get("mandiId") || "";
  const crop = p.get("crop") || "";
  const days = Math.min(90, Math.max(7, Number(p.get("days")) || 30));

  if (!MANDI_BY_ID.has(mandiId)) {
    return NextResponse.json({ error: "Unknown mandiId" }, { status: 404 });
  }

  const real = await getCropHistory(crop).catch(() => []);
  if (real.length >= 5) {
    return NextResponse.json({ mandiId, crop, real: true, points: real.slice(-days) });
  }
  return NextResponse.json({ mandiId, crop, real: false, points: trendFor(mandiId, crop, days) });
}
