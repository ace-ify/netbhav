import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

// Point the store at a throwaway temp file BEFORE calling it (path is read lazily).
const TMP = path.join(os.tmpdir(), `farmers-test-${process.pid}-${Date.now()}.json`);
process.env.FARMERS_STORE_PATH = TMP;

import * as store from "@/lib/store/farmers";
import { persistQueryAndSnapshot } from "@/lib/store/onboard";

before(async () => {
  await fs.rm(TMP, { force: true });
});
after(async () => {
  await fs.rm(TMP, { force: true });
});

test("normalizePhone handles common Indian formats", () => {
  assert.equal(store.normalizePhone("9876543210"), "+919876543210");
  assert.equal(store.normalizePhone("whatsapp:+919876543210"), "+919876543210");
  assert.equal(store.normalizePhone("+91 98765 43210"), "+919876543210");
  assert.equal(store.normalizePhone("garbage"), "");
});

test("first read is seeded with the demo farmer", async () => {
  const demo = await store.get(store.DEMO_PHONE);
  assert.ok(demo, "demo profile should exist on first run");
  assert.equal(demo?.crops[0]?.cropId, "wheat");
});

test("upsert → get round-trip persists atomically to disk", async () => {
  const phone = "+919000000001";
  await store.upsert(phone, { name: "Test Farmer", lat: 22.7, lng: 75.8, lang: "en" });
  const back = await store.get(phone);
  assert.equal(back?.name, "Test Farmer");
  assert.equal(back?.lang, "en");
  // and it's really on disk as valid JSON (atomic write left no partial file)
  const onDisk = JSON.parse(await fs.readFile(TMP, "utf8"));
  assert.equal(onDisk[phone].name, "Test Farmer");
});

test("mergeCrop adds then updates a crop's quantity", async () => {
  const phone = "+919000000002";
  await store.upsert(phone, { lat: 22, lng: 75, lang: "hi" });
  await store.mergeCrop(phone, "onion", 30);
  assert.equal((await store.get(phone))?.crops.find((c) => c.cropId === "onion")?.expectedQuintals, 30);
  await store.mergeCrop(phone, "onion", 80); // update, not duplicate
  const p = await store.get(phone);
  assert.equal(p?.crops.filter((c) => c.cropId === "onion").length, 1);
  assert.equal(p?.crops.find((c) => c.cropId === "onion")?.expectedQuintals, 80);
});

test("recordSnapshot + appendAlert store the latest state", async () => {
  const phone = "+919000000003";
  await store.upsert(phone, { lat: 22, lng: 75, lang: "hi" });
  await store.recordSnapshot(phone, { bestMandiId: "ratlam", netPerQuintal: 2500, signal: "WAIT" });
  await store.appendAlert(phone, { atISO: new Date().toISOString(), channel: "whatsapp", message: "hi" });
  const p = await store.get(phone);
  assert.equal(p?.lastSnapshot?.bestMandiId, "ratlam");
  assert.equal(p?.lastSnapshot?.signal, "WAIT");
  assert.equal(p?.alertHistory.length, 1);
});

test("persistQueryAndSnapshot creates a profile for a new phone (lazy builder)", async () => {
  const phone = "+919000000004";
  const fakeResult = {
    best: { mandi: { id: "dewas" }, netPerQuintal: 2600 },
    advisory: { signal: "SELL" },
  } as unknown as import("@/lib/types").OpportunityResult;
  await persistQueryAndSnapshot({
    phone,
    crop: "maize",
    quantityQuintals: 40,
    lat: 22.9,
    lng: 76.0,
    lang: "hi",
    result: fakeResult,
  });
  const p = await store.get(phone);
  assert.ok(p, "profile created from a query");
  assert.equal(p?.crops[0]?.cropId, "maize");
  assert.equal(p?.crops[0]?.expectedQuintals, 40);
  assert.equal(p?.lastSnapshot?.bestMandiId, "dewas");
  assert.equal(p?.lastSnapshot?.signal, "SELL");
});
