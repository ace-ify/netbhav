// Outbound channels for alerts. All degrade gracefully with no creds — the
// alert is still recorded to history; we just report sent:false.
export interface SendResult {
  sent: boolean;
  reason?: string;
}

/** Send an outbound WhatsApp via Twilio if creds are configured; else no-op. */
export async function sendWhatsApp(toPhone: string, message: string): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. "+14155238886" (sandbox)
  if (!sid || !token || !from) return { sent: false, reason: "twilio not configured" };
  try {
    const body = new URLSearchParams({
      From: `whatsapp:${from}`,
      To: `whatsapp:${toPhone}`,
      Body: message,
    });
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }).finally(() => clearTimeout(timer));
    return res.ok ? { sent: true } : { sent: false, reason: `twilio ${res.status}` };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : "send failed" };
  }
}

// High-₹ alerts (and manual/admin triggers) escalate to an OUTBOUND VOICE CALL
// via LiveKit SIP: we spin up a room, bring the voice agent in, then dial the
// farmer's phone into that room over the Twilio SIP trunk. Degrades gracefully
// to sent:false if creds are absent. Needs a running agent worker (`npm run agent`).
export async function placeOutboundCall(
  phone: string,
  opts?: { room?: string }
): Promise<SendResult> {
  const url = process.env.LIVEKIT_URL;
  const key = process.env.LIVEKIT_API_KEY;
  const secret = process.env.LIVEKIT_API_SECRET;
  const trunk = process.env.LIVEKIT_SIP_TRUNK_ID;
  if (!url || !key || !secret || !trunk) return { sent: false, reason: "livekit SIP not configured" };

  // SipClient wants an http(s) host, not the wss:// realtime URL.
  const host = url.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
  const room = opts?.room || `netbhav-call-${Date.now()}`;
  try {
    const { SipClient, AgentDispatchClient } = await import("livekit-server-sdk");

    // Bring the NetBhav voice agent into the room (best-effort — needs a
    // registered worker + LIVEKIT_AGENT_NAME; the call still connects without it).
    const agentName = process.env.LIVEKIT_AGENT_NAME;
    if (agentName) {
      try {
        const ad = new AgentDispatchClient(host, key, secret);
        await ad.createDispatch(room, agentName, { metadata: JSON.stringify({ phone }) });
      } catch {
        /* dispatch optional */
      }
    }

    const sip = new SipClient(host, key, secret);
    await sip.createSipParticipant(trunk, phone, room, {
      participantIdentity: `farmer-${phone}`,
      participantName: "Farmer",
      krispEnabled: true,
    });
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : "sip dial failed" };
  }
}
