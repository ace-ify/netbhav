import { NextResponse } from "next/server";
import { CROPS } from "@/lib/data/crops";
import { MANDIS, DEMO_FARMER, DEFAULT_COST_PARAMS } from "@/lib/data/mandis";

// Bootstrap payload for the UI: crops, mandis, demo farmer, cost assumptions.
export async function GET() {
  return NextResponse.json({
    crops: CROPS.map(({ id, name, emoji }) => ({ id, name, emoji })),
    mandis: MANDIS,
    demoFarmer: DEMO_FARMER,
    costParams: DEFAULT_COST_PARAMS,
    livekit: Boolean(
      process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET
    ),
  });
}
