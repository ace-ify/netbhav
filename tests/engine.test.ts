import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeOpportunity,
  haversineKm,
  rankOpportunities,
  buildResult,
  advise,
  freightQuote,
} from "../src/lib/engine/index.ts";

const params = {
  mandiFeePercent: 1.5,
  commissionPercent: 2,
  cessPercent: 0.5,
  hamaliPerQuintal: 10,
  transportPerKm: 35,
  truckCapacityQuintals: 100,
  roundTrip: true,
  roadFactor: 1.35,
};

const mandi = (id: string, lat: number, lng: number) => ({
  id,
  name: id,
  district: "Test",
  state: "MP",
  lat,
  lng,
});

test("haversine gives a sane distance (Indore↔Ujjain ≈ 46-60km)", () => {
  const d = haversineKm(22.7196, 75.8577, 23.1793, 75.7849);
  assert.ok(d > 40 && d < 70, `expected ~55km, got ${d}`);
});

test("computeOpportunity: every cost line is correct (grain: 2% commission, 0 spoilage)", () => {
  const o = computeOpportunity({
    mandi: mandi("m", 0, 0),
    cropId: "wheat",
    quantityQuintals: 50,
    modalPricePerQuintal: 2500,
    priceSource: "seed",
    straightLineKm: 20,
    roadKm: 27,
    routeSource: "haversine",
    params,
  });
  // gross = 2500 * 50 = 125000
  assert.equal(o.grossRevenue, 125000);
  assert.equal(o.commissionCost, 2500); // grain class → 2%
  assert.equal(o.mandiFeeCost, 1875); // 1.5%
  assert.equal(o.cessCost, 625); // 0.5%
  assert.equal(o.hamaliCost, 500); // 10 * 50
  // transport = cheapest vehicle: truck, 1 trip × max(800, 27×2×40) = 2160
  assert.equal(o.trips, 1);
  assert.equal(o.vehicle, "truck");
  assert.equal(o.transportCost, 2160);
  assert.equal(o.wastageCost, 0); // grain doesn't spoil in transit
  assert.equal(o.wastageFraction, 0);
  assert.equal(o.totalDeductions, 2500 + 1875 + 625 + 500 + 2160);
  assert.equal(o.netRealization, 125000 - (2500 + 1875 + 625 + 500 + 2160));
});

test("big loads need multiple trips", () => {
  const o = computeOpportunity({
    mandi: mandi("m", 0, 0),
    cropId: "wheat",
    quantityQuintals: 250, // > 2× capacity
    modalPricePerQuintal: 2500,
    priceSource: "seed",
    straightLineKm: 10,
    roadKm: 10,
    routeSource: "haversine",
    params,
  });
  assert.equal(o.trips, 3); // truck: ceil(250/120) = 3
  assert.equal(o.vehicle, "truck");
  // 3 trips × max(800, 10×2×40) = 3 × 800 = 2400
  assert.equal(o.transportCost, 2400);
});

test("THE INSIGHT: higher sticker price can lose after transport", () => {
  const qty = 50;
  // Far mandi pays MORE per quintal but is 180km away.
  const far = computeOpportunity({
    mandi: mandi("far", 0, 0),
    cropId: "wheat",
    quantityQuintals: qty,
    modalPricePerQuintal: 2700,
    priceSource: "seed",
    straightLineKm: 133,
    roadKm: 180,
    routeSource: "haversine",
    params,
  });
  // Near mandi pays LESS but is 15km away.
  const near = computeOpportunity({
    mandi: mandi("near", 0, 0),
    cropId: "wheat",
    quantityQuintals: qty,
    modalPricePerQuintal: 2550,
    priceSource: "seed",
    straightLineKm: 11,
    roadKm: 15,
    routeSource: "haversine",
    params,
  });
  const ranked = rankOpportunities([far, near]);
  // Net-best should be the NEARER, cheaper-sticker mandi.
  assert.equal(ranked[0].mandi.id, "near");
  assert.ok(far.modalPricePerQuintal > near.modalPricePerQuintal); // sticker trap confirmed
});

test("FPO/bulk mode: pooling into full trucks cuts transport per quintal", () => {
  const base = {
    mandi: mandi("m", 0, 0),
    cropId: "wheat",
    quantityQuintals: 50, // half of a 100-qtl truck
    modalPricePerQuintal: 2500,
    priceSource: "seed",
    straightLineKm: 100,
    roadKm: 135,
    routeSource: "haversine" as const,
    params,
  };
  const solo = computeOpportunity(base);
  const pooled = computeOpportunity({ ...base, fpo: true });
  // Solo pays a whole (truck) trip; pooled pays only its share of a full truck.
  assert.ok(pooled.transportCost < solo.transportCost);
  assert.ok(pooled.netRealization > solo.netRealization);
});

test("freight: a small load uses a small vehicle, not a full truck", () => {
  const small = freightQuote(5, 10, true); // 5q, 10km round trip
  assert.equal(small.vehicle, "tata-ace"); // 1 × max(250, 20×30) = 600
  assert.equal(small.cost, 600);
  // 50q one-way 27km → a single truck trip beats two tractor trips
  assert.equal(freightQuote(50, 27, true).vehicle, "truck");
  // the small load isn't billed the full truck it doesn't need
  assert.ok(small.cost < freightQuote(200, 10, true).cost);
});

test("advisory: rising trend → WAIT/MONITOR, falling → SELL", () => {
  const series = (vals: number[]) =>
    vals.map((v, i) => ({ date: `2026-09-${String(i + 1).padStart(2, "0")}`, modalPricePerQuintal: v }));
  // earlier ~2500, last 7 ~2650 → strong rise
  const rising = series([...Array(15).fill(2500), ...Array(7).fill(2650)]);
  assert.equal(advise(rising).signal, "WAIT");
  // earlier ~2650, last 7 ~2500 → falling
  const falling = series([...Array(15).fill(2650), ...Array(7).fill(2500)]);
  assert.equal(advise(falling).signal, "SELL");
  // flat → SELL (lock in)
  const flat = series(Array(22).fill(2500));
  assert.equal(advise(flat).signal, "SELL");
});

test("buildResult surfaces the ₹ delta vs chasing the highest price", () => {
  const crop = { id: "wheat", name: { en: "Wheat", hi: "गेहूं" }, emoji: "🌾", class: "grain" as const };
  const qty = 50;
  const mk = (id: string, price: number, roadKm: number) =>
    computeOpportunity({
      mandi: mandi(id, 0, 0),
      cropId: "wheat",
      quantityQuintals: qty,
      modalPricePerQuintal: price,
      priceSource: "seed",
      straightLineKm: roadKm / 1.35,
      roadKm,
      routeSource: "haversine",
      params,
    });
  const res = buildResult(
    { crop: "wheat", quantityQuintals: qty, lat: 0, lng: 0 },
    crop,
    [mk("far-high", 2750, 200), mk("near-mid", 2600, 12), mk("mid", 2650, 60)],
    params
  );
  assert.ok(res.best);
  assert.equal(res.highestPriceMandi?.mandi.id, "far-high");
  // Picking net-best over the highest-sticker mandi should be a real gain.
  assert.ok(res.insightDeltaRupees > 0, `expected positive delta, got ${res.insightDeltaRupees}`);
  assert.equal(res.best?.rank, 1);
});

test("onion carries 6% commission (perishable), not the 2% staple rate", () => {
  const common = {
    mandi: mandi("m", 0, 0),
    quantityQuintals: 50,
    modalPricePerQuintal: 2000,
    priceSource: "seed",
    straightLineKm: 5,
    roadKm: 5,
    routeSource: "haversine" as const,
    params,
  };
  const onion = computeOpportunity({ ...common, cropId: "onion" });
  const wheat = computeOpportunity({ ...common, cropId: "wheat" });
  // gross = 2000 * 50 = 100000
  assert.equal(onion.grossRevenue, 100000);
  assert.equal(onion.commissionCost, 6000); // vegetable class → 6%
  assert.equal(wheat.commissionCost, 2000); // grain class → 2%
  assert.ok(onion.wastageCost > 0); // onion spoils even at the gate
  assert.equal(wheat.wastageCost, 0); // wheat doesn't
});

test("spoilage: a far high-price onion mandi loses more net than a near cheaper one", () => {
  const qty = 50;
  const near = computeOpportunity({
    mandi: mandi("near", 0, 0),
    cropId: "onion",
    quantityQuintals: qty,
    modalPricePerQuintal: 1800,
    priceSource: "seed",
    straightLineKm: 8,
    roadKm: 10,
    routeSource: "haversine",
    params,
  });
  const far = computeOpportunity({
    mandi: mandi("far", 0, 0),
    cropId: "onion",
    quantityQuintals: qty,
    modalPricePerQuintal: 2000, // higher sticker price
    priceSource: "seed",
    straightLineKm: 150,
    roadKm: 200,
    routeSource: "haversine",
    params,
  });
  // Spoilage scales with distance and is capped.
  assert.ok(far.wastageFraction > near.wastageFraction);
  assert.ok(far.wastageCost > near.wastageCost);
  // Despite the higher price, the far mandi nets less once spoilage + transport bite.
  const ranked = rankOpportunities([far, near]);
  assert.equal(ranked[0].mandi.id, "near");
});

// garlic stores for months — spoilage must stay LOW, unlike onion.
test("garlic spoilage stays low even on a long haul (not treated like onion)", () => {
  const mk = (cropId: string) =>
    computeOpportunity({
      mandi: mandi("far", 0, 0),
      cropId,
      quantityQuintals: 20,
      modalPricePerQuintal: 12000,
      priceSource: "seed",
      straightLineKm: 150,
      roadKm: 200,
      routeSource: "haversine",
      params,
    });
  const garlic = mk("garlic");
  const onion = mk("onion");
  assert.ok(garlic.wastageFraction <= 0.04); // capped low
  assert.ok(garlic.wastageFraction < onion.wastageFraction);
});
