import { NextResponse } from "next/server";
import { getPrices } from "@/lib/data/agmarknet";
import { llmConfigured } from "@/lib/agent/llm";

// GET /api/health — honest status of every dependency. `ok` is always true:
// the app degrades, it never hard-fails. Use it to see what's actually live.
export async function GET() {
  const bundle = await getPrices("wheat").catch(() => null);
  return NextResponse.json({
    ok: true,
    prices: {
      source: bundle?.source ?? "seed",
      freshness: bundle?.freshness ?? "seed",
      agmarknetLive: bundle?.freshness === "live",
    },
    agent: { llmConfigured: llmConfigured(), fallback: "rule-based intent parser" },
    time: new Date().toISOString(),
  });
}
