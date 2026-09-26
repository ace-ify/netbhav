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

// ponytail: high-₹ alerts should escalate to an OUTBOUND VOICE CALL. Wiring the
// trigger here, but end-to-end needs live LiveKit SIP + an Exotel/Plivo India
// number + DLT consent — the WhatsApp path above is the verifiable one.
export async function placeOutboundCall(phone: string): Promise<SendResult> {
  const configured = Boolean(
    process.env.LIVEKIT_SIP_TRUNK_ID && process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY
  );
  if (!configured) return { sent: false, reason: "livekit SIP not configured" };
  // TODO: use livekit-server-sdk SipClient.createSipParticipant(trunk, phone, room)
  // to dial the farmer into the agent room. Left as a stub pending live SIP creds.
  void phone;
  return { sent: false, reason: "SIP dial stub — pending live trunk" };
}
