import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate } from "@/lib/alerts/evaluate";
import type { FarmerProfile } from "@/lib/store/farmers";
import type { OpportunityResult } from "@/lib/types";

function profile(patch: Partial<FarmerProfile> = {}): FarmerProfile {
  return {
    phone: "+919000000000",
    lat: 22.6,
    lng: 75.8,
    lang: "en",
    crops: [{ cropId: "wheat", expectedQuintals: 50 }],
    consentToCall: true,
    alertHistory: [],
    lastSnapshot: { atISO: "2026-09-01T00:00:00Z", bestMandiId: "ratlam", netPerQuintal: 2000, signal: "WAIT" },
    ...patch,
  };
}

function fresh(netPerQuintal: number, signal: "SELL" | "WAIT" | "MONITOR"): OpportunityResult {
  return {
    best: { mandi: { name: "Ratlam", id: "ratlam" }, netPerQuintal },
    advisory: { signal, changePct: 0, real: true },
    crop: { id: "wheat", name: { en: "Wheat", hi: "गेहूं" }, emoji: "🌾" },
  } as unknown as OpportunityResult;
}

const NOON = new Date(2026, 0, 1, 12, 0, 0); // outside typical quiet hours

test("fires when the signal flips to SELL", () => {
  const d = evaluate(profile(), fresh(2010, "SELL"), NOON);
  assert.equal(d.fire, true);
  assert.equal(d.reason, "signal→SELL");
});

test("fires when take-home jumps past the threshold", () => {
  const d = evaluate(profile(), fresh(2200, "WAIT"), NOON); // +10% vs 2000, same signal
  assert.equal(d.fire, true);
  assert.match(d.reason, /net up/);
});

test("does NOT fire on small noise", () => {
  const d = evaluate(profile(), fresh(2020, "WAIT"), NOON); // +1%, same signal
  assert.equal(d.fire, false);
  assert.equal(d.reason, "no meaningful change");
});

test("respects consent (no consent → never fires)", () => {
  const d = evaluate(profile({ consentToCall: false }), fresh(2010, "SELL"), NOON);
  assert.equal(d.fire, false);
  assert.equal(d.reason, "no consent");
});

test("respects quiet hours", () => {
  const at11pm = new Date(2026, 0, 1, 23, 0, 0);
  const d = evaluate(profile({ quietHours: [22, 7] }), fresh(2010, "SELL"), at11pm);
  assert.equal(d.fire, false);
  assert.equal(d.reason, "quiet hours");
});

test("no baseline yet → never fires", () => {
  const d = evaluate(profile({ lastSnapshot: undefined }), fresh(3000, "SELL"), NOON);
  assert.equal(d.fire, false);
  assert.equal(d.reason, "no baseline yet");
});
