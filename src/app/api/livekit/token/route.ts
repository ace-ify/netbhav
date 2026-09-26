import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

// POST /api/livekit/token — mint a short-lived token so the browser can join a
// LiveKit room where the voice agent worker is waiting. Returns { configured:false }
// (not an error) when LiveKit env is absent, so the UI falls back to browser voice.
export async function POST(req: Request) {
  const url = process.env.LIVEKIT_URL;
  const key = process.env.LIVEKIT_API_KEY;
  const secret = process.env.LIVEKIT_API_SECRET;
  if (!url || !key || !secret) {
    return NextResponse.json({ configured: false });
  }

  let body: { lang?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* optional body */
  }

  const room = `netbhav-${Math.random().toString(36).slice(2, 10)}`;
  const identity = `farmer-${Math.random().toString(36).slice(2, 8)}`;

  const at = new AccessToken(key, secret, { identity, ttl: "15m" });
  at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true });
  // Pass the UI language to the agent via room metadata / participant attributes.
  at.attributes = { lang: body.lang === "hi" ? "hi" : "en" };
  const token = await at.toJwt();

  return NextResponse.json({ configured: true, token, url, room });
}

// GET → just report whether LiveKit is configured (frontend uses this to choose
// LiveKit vs browser voice without minting a token).
export async function GET() {
  const configured = Boolean(
    process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET
  );
  return NextResponse.json({ configured });
}
