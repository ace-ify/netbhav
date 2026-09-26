import { test } from "node:test";
import assert from "node:assert/strict";
import { parseIntent } from "@/lib/agent/fallbackIntent";

test("English: '50 quintal wheat at Rau'", () => {
  const p = parseIntent("50 quintal wheat at Rau");
  assert.equal(p.crop, "wheat");
  assert.equal(p.quantityQuintals, 50);
  assert.ok(p.locationText?.includes("Rau"), `locationText was: ${p.locationText}`);
  assert.deepEqual(p.missing, []);
});

test("Hindi: 'राऊ में 50 क्विंटल गेहूं'", () => {
  const p = parseIntent("राऊ में 50 क्विंटल गेहूं");
  assert.equal(p.crop, "wheat");
  assert.equal(p.quantityQuintals, 50);
});

test("Bare question: 'prices?' misses crop and quantity", () => {
  const p = parseIntent("prices?");
  assert.ok(p.missing.includes("crop"));
  assert.ok(p.missing.includes("quantity"));
});

test("Tonne conversion: '5 tonne onion in Dewas' → 50 quintal onion", () => {
  const p = parseIntent("5 tonne onion in Dewas");
  assert.equal(p.quantityQuintals, 50);
  assert.equal(p.crop, "onion");
});
