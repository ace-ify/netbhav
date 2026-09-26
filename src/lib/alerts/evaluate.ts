// Proactive alert logic — a PURE function so it's fully testable with no network.
// Fires ONLY when something meaningful changed vs the farmer's last snapshot,
// and respects consent + quiet hours. Thresholds live in one config (knobs).
import type { OpportunityResult } from "@/lib/types";
import type { FarmerProfile } from "@/lib/store/farmers";

// ponytail: calibration knobs — tune from real alert-open rates, don't hardcode deeper.
export const ALERT_CONFIG = {
  netJumpPct: 5, // fire if take-home/quintal moves at least this much vs last snapshot
  readyWindowDays: 7, // "harvest is near" window for perishables
};

export interface AlertDecision {
  fire: boolean;
  reason: string;
  message: string;
}

function inQuietHours(hour: number, quiet?: [number, number]): boolean {
  if (!quiet) return false;
  const [start, end] = quiet;
  if (start === end) return false;
  return start < end ? hour >= start && hour < end : hour >= start || hour < end; // wraps midnight
}

function daysUntil(iso: string | undefined, now: Date): number | null {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return null;
  return Math.round((d - now.getTime()) / 86400000);
}

/** Decide whether to alert this farmer given a fresh solve. `now` is injectable. */
export function evaluate(
  profile: FarmerProfile,
  fresh: OpportunityResult,
  now: Date = new Date()
): AlertDecision {
  const best = fresh.best;
  if (!best) return { fire: false, reason: "no result", message: "" };
  if (!profile.consentToCall) return { fire: false, reason: "no consent", message: "" };
  if (inQuietHours(now.getHours(), profile.quietHours))
    return { fire: false, reason: "quiet hours", message: "" };

  const last = profile.lastSnapshot;
  if (!last) return { fire: false, reason: "no baseline yet", message: "" };

  const signal = fresh.advisory?.signal ?? "SELL";
  const jumpPct =
    last.netPerQuintal > 0 ? ((best.netPerQuintal - last.netPerQuintal) / last.netPerQuintal) * 100 : 0;
  const hi = profile.lang === "hi";
  const crop = fresh.crop.name[profile.lang] ?? fresh.crop.id;
  const rupees = Math.round(best.netPerQuintal);

  // 1) Signal flipped to SELL (was holding) — the actionable moment.
  if (signal === "SELL" && last.signal !== "SELL") {
    return {
      fire: true,
      reason: "signal→SELL",
      message: hi
        ? `${crop}: भाव अभी अच्छे हैं — बेचने का समय। ${best.mandi.name} में ₹${rupees}/क्विंटल हाथ में।`
        : `${crop}: prices are peaking — time to sell. ₹${rupees}/qtl take-home at ${best.mandi.name}.`,
    };
  }

  // 2) Take-home jumped meaningfully vs last time.
  if (Math.abs(jumpPct) >= ALERT_CONFIG.netJumpPct) {
    const up = jumpPct > 0;
    return {
      fire: true,
      reason: `net ${up ? "up" : "down"} ${jumpPct.toFixed(0)}%`,
      message: hi
        ? `${crop}: हाथ में आने वाली रकम ${up ? "बढ़कर" : "घटकर"} ₹${rupees}/क्विंटल (${up ? "+" : ""}${jumpPct.toFixed(0)}%). सबसे अच्छी मंडी: ${best.mandi.name}.`
        : `${crop}: take-home ${up ? "up" : "down"} to ₹${rupees}/qtl (${up ? "+" : ""}${jumpPct.toFixed(0)}%). Best: ${best.mandi.name}.`,
    };
  }

  // 3) Perishable near its ready date while prices are strong (WAIT/MONITOR).
  const ready = daysUntil(profile.crops.find((c) => c.cropId === fresh.crop.id)?.readyByISO, now);
  if (ready != null && ready >= 0 && ready <= ALERT_CONFIG.readyWindowDays && signal !== "SELL") {
    return {
      fire: true,
      reason: "harvest near + strong price",
      message: hi
        ? `${crop} ${ready} दिन में तैयार — भाव मज़बूत (₹${rupees}/क्विंटल ${best.mandi.name}). बेचने की तैयारी रखें।`
        : `${crop} ready in ${ready} days — prices strong (₹${rupees}/qtl at ${best.mandi.name}). Plan your sale.`,
    };
  }

  return { fire: false, reason: "no meaningful change", message: "" };
}
