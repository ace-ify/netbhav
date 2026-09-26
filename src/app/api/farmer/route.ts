import { NextResponse } from "next/server";
import { z } from "zod";
import * as store from "@/lib/store/farmers";

// GET /api/farmer?phone=+91… → the saved profile (or 404).
export async function GET(req: Request) {
  const phone = new URL(req.url).searchParams.get("phone") || "";
  const p = await store.get(phone);
  if (!p) return NextResponse.json({ error: "No profile for that phone" }, { status: 404 });
  return NextResponse.json(p);
}

const PatchSchema = z.object({
  phone: z.string().min(6),
  name: z.string().max(80).optional(),
  lat: z.number().min(6).max(38).optional(),
  lng: z.number().min(68).max(98).optional(),
  locationLabel: z.string().max(120).optional(),
  lang: z.enum(["hi", "en"]).optional(),
  crops: z
    .array(
      z.object({
        cropId: z.string().min(1),
        expectedQuintals: z.number().positive().max(100000),
        readyByISO: z.string().optional(),
      })
    )
    .optional(),
  fpo: z.boolean().optional(),
  consentToCall: z.boolean().optional(),
  quietHours: z.tuple([z.number().min(0).max(23), z.number().min(0).max(23)]).optional(),
});

// POST /api/farmer — create/edit a profile from the dashboard.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile", details: parsed.error.flatten() }, { status: 400 });
  }
  const { phone, ...patch } = parsed.data;
  try {
    const updated = await store.upsert(phone, patch);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save profile" },
      { status: 400 }
    );
  }
}
