import { NextResponse } from "next/server";
import { placeOutboundCall } from "@/lib/alerts/dispatch";

// POST /api/call  { "phone": "+918756260291" }  → dials the farmer via LiveKit SIP.
// Manual/admin + test trigger for the outbound voice agent. Returns {sent, reason}.
// ponytail: no auth — gate behind an admin token before production.
export async function POST(req: Request) {
  let phone = "";
  try {
    phone = (await req.json())?.phone ?? "";
  } catch {
    /* ignore */
  }
  if (!/^\+?\d{10,15}$/.test(phone.replace(/\s/g, ""))) {
    return NextResponse.json({ sent: false, reason: "valid E.164 phone required" }, { status: 400 });
  }
  const result = await placeOutboundCall(phone.startsWith("+") ? phone : `+${phone}`);
  return NextResponse.json(result, { status: result.sent ? 200 : 502 });
}
