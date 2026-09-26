// Freight as the cheapest feasible vehicle for the load, so a small farmer isn't
// billed a full truck. Per-trip minimum charge applies; big loads add trips.
// Rates as-of 2025-26 (MP), round-trip handled by the caller's roundTrip flag.

export interface FreightTier {
  id: string; // maps to a bilingual name in i18n (vehicleName)
  capacityQuintals: number;
  perKm: number; // ₹/km (loaded)
  minCharge: number; // ₹ minimum per trip
}

export const FREIGHT_TIERS: FreightTier[] = [
  { id: "tata-ace", capacityQuintals: 7.5, perKm: 30, minCharge: 250 },
  { id: "pickup", capacityQuintals: 20, perKm: 35, minCharge: 400 },
  { id: "tractor", capacityQuintals: 40, perKm: 35, minCharge: 500 },
  { id: "truck", capacityQuintals: 120, perKm: 40, minCharge: 800 },
];

const TRUCK = FREIGHT_TIERS[FREIGHT_TIERS.length - 1];

export interface FreightQuote {
  cost: number;
  vehicle: string; // FreightTier.id
  trips: number;
}

/** Cheapest vehicle to move `qty` quintals over `roadKm` (one-way). */
export function freightQuote(
  qty: number,
  roadKm: number,
  roundTrip: boolean,
  fpo = false
): FreightQuote {
  const billableKm = roadKm * (roundTrip ? 2 : 1);

  // FPO/bulk: the village fills a full truck and each farmer pays only their
  // proportional share of one truck trip — no per-trip minimum, no half-empty waste.
  if (fpo) {
    const perTrip = Math.max(TRUCK.minCharge, billableKm * TRUCK.perKm);
    return { cost: r2((qty / TRUCK.capacityQuintals) * perTrip), vehicle: "truck", trips: 1 };
  }

  let best: FreightQuote | null = null;
  for (const t of FREIGHT_TIERS) {
    const trips = Math.max(1, Math.ceil(qty / t.capacityQuintals));
    const cost = r2(trips * Math.max(t.minCharge, billableKm * t.perKm));
    if (!best || cost < best.cost) best = { cost, vehicle: t.id, trips };
  }
  return best!;
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}
