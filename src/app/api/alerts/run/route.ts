import { NextResponse } from "next/server";
import * as store from "@/lib/store/farmers";
import { queryFromProfile } from "@/lib/store/onboard";
import { solveOpportunity } from "@/lib/service";
import { evaluate } from "@/lib/alerts/evaluate";
import { sendWhatsApp, placeOutboundCall } from "@/lib/alerts/dispatch";

// POST /api/alerts/run — cron-triggerable. For each consenting farmer, re-solve
// their saved query, evaluate() vs their last snapshot, and if it fires, send a
// WhatsApp (cheap channel) + log it. High-₹ SELL flips also try a voice call.
// ponytail: schedule via Vercel Cron / pg_cron daily; this is the manual trigger.
export async function POST() {
  const farmers = await store.list();
  const results: unknown[] = [];

  for (const p of farmers) {
    if (!p.consentToCall) {
      results.push({ phone: p.phone, skipped: "no consent" });
      continue;
    }
    const q = queryFromProfile(p);
    if (!q) {
      results.push({ phone: p.phone, skipped: "no saved crop" });
      continue;
    }
    try {
      const fresh = await solveOpportunity(q);
      const decision = evaluate(p, fresh);
      if (!decision.fire || !fresh.best) {
        results.push({ phone: p.phone, fired: false, reason: decision.reason });
        continue;
      }
      const wa = await sendWhatsApp(p.phone, decision.message);
      await store.appendAlert(p.phone, {
        atISO: new Date().toISOString(),
        channel: "whatsapp",
        message: decision.message,
      });
      // Escalate the actionable "time to sell" moment to a voice call (stub).
      const call = decision.reason.startsWith("signal") ? await placeOutboundCall(p.phone) : null;
      // Reset the baseline so we don't re-fire the same move next run.
      await store.recordSnapshot(p.phone, {
        bestMandiId: fresh.best.mandi.id,
        netPerQuintal: fresh.best.netPerQuintal,
        signal: fresh.advisory?.signal ?? "SELL",
      });
      results.push({
        phone: p.phone,
        fired: true,
        reason: decision.reason,
        whatsappSent: wa.sent,
        whatsappNote: wa.reason,
        call: call?.reason ?? null,
      });
    } catch (e) {
      results.push({ phone: p.phone, error: e instanceof Error ? e.message : "solve failed" });
    }
  }

  return NextResponse.json({ ran: farmers.length, results });
}
