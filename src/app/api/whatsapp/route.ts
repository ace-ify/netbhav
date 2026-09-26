// Twilio WhatsApp / SMS webhook.
//
// Configure in the Twilio console (Messaging → WhatsApp sandbox / a number):
//   "WHEN A MESSAGE COMES IN" → POST  https://<your-domain>/api/whatsapp
// Twilio POSTs application/x-www-form-urlencoded and delivers whatever TwiML
// we return straight back to the farmer on WhatsApp/SMS.
//
// TODO (production): validate the `X-Twilio-Signature` header against your
// Twilio auth token + the exact request URL & params before trusting `Body`,
// so nobody can spoof inbound messages. Not implemented here (demo).
import { runAgent } from "@/lib/agent/agent";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function twiml(message: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
  return new Response(xml, { headers: { "Content-Type": "text/xml" } });
}

export async function POST(req: Request) {
  let body = "";
  try {
    const form = await req.formData();
    body = String(form.get("Body") ?? "").trim();
    // `From` is available for logging / per-farmer context if needed later.
    void form.get("From");
  } catch {
    return twiml("Sorry, I couldn't read your message. Please try again.");
  }

  if (!body) {
    return twiml(
      "Namaste! Send me your crop, quantity and place — e.g. '50 quintal wheat at Rau' / 'राऊ में 50 क्विंटल गेहूं'."
    );
  }

  const lang = /[ऀ-ॿ]/.test(body) ? "hi" : "en";
  try {
    const { reply } = await runAgent({ text: body, lang });
    return twiml(reply);
  } catch {
    return twiml(
      lang === "hi"
        ? "क्षमा करें, कुछ गड़बड़ हो गई। कृपया फिर कोशिश करें।"
        : "Sorry, something went wrong. Please try again."
    );
  }
}
