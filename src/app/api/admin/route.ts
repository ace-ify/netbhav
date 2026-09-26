import { NextResponse } from "next/server";
import * as store from "@/lib/store/farmers";
import { queryFromProfile } from "@/lib/store/onboard";
import { solveOpportunity } from "@/lib/service";
import { MANDIS } from "@/lib/data/mandis";

// GET /api/admin — farmers + govt/PS-relevant metrics for the operator console.
// ponytail: no auth — gate behind an admin token/SSO before production.
export async function GET() {
  const farmers = await store.list();

  // Per-farmer opportunity (income the honest-math surfaces vs naive highest-sticker).
  const rows = await Promise.all(
    farmers.map(async (p) => {
      const q = queryFromProfile(p);
      let incomeProtected = 0;
      let bestMandi = "";
      let takeHome = 0;
      let freshness = "seed";
      if (q) {
        try {
          const r = await solveOpportunity(q);
          incomeProtected = Math.max(0, Math.round(r.insightDeltaRupees));
          bestMandi = r.best?.mandi.name ?? "";
          takeHome = Math.round(r.best?.netRealization ?? 0);
          freshness = r.priceMeta.freshness;
        } catch {
          /* leave zeros */
        }
      }
      return {
        phone: p.phone,
        name: p.name ?? "",
        location: p.locationLabel ?? `${p.lat.toFixed(2)},${p.lng.toFixed(2)}`,
        crops: (p.crops ?? []).map((c) => c.cropId),
        quintals: (p.crops ?? []).reduce((s, c) => s + (c.expectedQuintals || 0), 0),
        consentToCall: Boolean(p.consentToCall),
        lastSignal: p.lastSnapshot?.signal ?? null,
        alerts: (p.alertHistory ?? []).length,
        bestMandi,
        takeHome,
        incomeProtected,
        freshness,
      };
    })
  );

  const cropsCovered = new Set(rows.flatMap((r) => r.crops));
  const metrics = {
    farmers: rows.length,
    consenting: rows.filter((r) => r.consentToCall).length,
    quintalsTracked: rows.reduce((s, r) => s + r.quintals, 0),
    cropsCovered: cropsCovered.size,
    mandiYards: MANDIS.length,
    alertsSent: rows.reduce((s, r) => s + r.alerts, 0),
    // Headline govt/PS metric: extra ₹ the platform surfaces vs the naive
    // "chase the highest sticker" choice, summed across tracked farmers.
    incomeProtected: rows.reduce((s, r) => s + r.incomeProtected, 0),
  };

  return NextResponse.json({ metrics, farmers: rows });
}
