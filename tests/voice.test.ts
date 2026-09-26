import { test } from "node:test";
import assert from "node:assert/strict";
import { AccessToken } from "livekit-server-sdk";
import { lookupMandiForVoice } from "@/lib/agent/voiceTool";

// The LiveKit voice agent's tool must return honest, engine-computed numbers.
test("lookupMandiForVoice returns a costed best mandi (deterministic engine)", async () => {
  const r = await lookupMandiForVoice({ crop: "wheat", quantityQuintals: 50 });
  assert.equal(r.found, true);
  if (!r.found) return;
  assert.equal(typeof r.bestMandi, "string");
  assert.ok(r.netPerQuintalInr > 0 && r.netPerQuintalInr < 10000);
  assert.ok(["SELL", "WAIT", "MONITOR"].includes(r.advice));
  assert.ok(r.top3.length >= 1 && r.top3.length <= 3);
  assert.equal(r.usedFallbackLocation, true); // no location → demo village
});

// The token endpoint's core: livekit-server-sdk mints a valid JWT.
test("livekit AccessToken mints a 3-part JWT", async () => {
  const at = new AccessToken("devkey", "devsecret", { identity: "farmer-test" });
  at.addGrant({ roomJoin: true, room: "netbhav-test" });
  const jwt = await at.toJwt();
  assert.equal(typeof jwt, "string");
  assert.equal(jwt.split(".").length, 3);
});
