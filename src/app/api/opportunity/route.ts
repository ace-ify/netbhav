import { NextResponse } from "next/server";
import { QuerySchema, solveOpportunity } from "@/lib/service";
import { z } from "zod";

// POST /api/opportunity — the core endpoint. crop+qty+location → ranked mandis.
const BodySchema = QuerySchema.extend({
  overrides: z
    .object({
      mandiFeePercent: z.number().min(0).max(20),
      commissionPercent: z.number().min(0).max(20),
      cessPercent: z.number().min(0).max(20),
      hamaliPerQuintal: z.number().min(0).max(500),
      transportPerKm: z.number().min(0).max(500),
      truckCapacityQuintals: z.number().positive().max(1000),
      roundTrip: z.boolean(),
      roadFactor: z.number().min(1).max(2),
    })
    .partial()
    .optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { overrides, ...query } = parsed.data;
  try {
    const result = await solveOpportunity(query, overrides);
    if (!result.best) {
      return NextResponse.json(
        { error: "No mandis trade this crop within range. Widen the distance or pick another crop.", result },
        { status: 200 }
      );
    }
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to compute opportunities" },
      { status: 500 }
    );
  }
}
