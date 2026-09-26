import { NextResponse } from "next/server";
import { getPrices } from "@/lib/data/agmarknet";
import { llmConfigured } from "@/lib/agent/llm";

// GET /api/health — honest status of every dependency. `ok` is always true:
// the app degrades, it never hard-fails. Use it to see what's actually live.
export async function GET() {
  const bundle = await getPrices("wheat").catch(() => null);
  const cedaConfigured = Boolean(process.env.CEDA_API_KEY);
  return NextResponse.json({
    ok: true,
    prices: {
      source: bundle?.source ?? "seed",
      freshness: bundle?.freshness ?? "seed",
      agmarknetLive: bundle?.freshness === "live",
    },
    // Multiple, independent price/data sources — priced live-first, then
    // corroborated/back-filled. This is what powers the "multiple sources" claim.
    sources: [
      {
        id: "agmarknet-mirror",
        name: "Agmarknet mirror (keyless)",
        role: "primary · live daily mandi modal prices",
        keyless: true,
        status: bundle?.freshness === "live" ? "live" : "fallback",
      },
      {
        id: "ceda-ashoka",
        name: "CEDA, Ashoka University",
        role: "coverage + independent provenance + history",
        keyless: false,
        status: cedaConfigured ? "configured" : "available (add CEDA_API_KEY)",
      },
      {
        id: "wpi-oea",
        name: "WPI — Office of the Economic Adviser (2012–2026)",
        role: "fallback · official long-term price trend/momentum (offline)",
        keyless: true,
        status: "bundled",
      },
      {
        id: "seed-reference",
        name: "Bundled reference bands",
        role: "last-resort ₹ fallback so the app never blanks",
        keyless: true,
        status: "bundled",
      },
    ],
    agent: { llmConfigured: llmConfigured(), fallback: "rule-based intent parser" },
    time: new Date().toISOString(),
  });
}
