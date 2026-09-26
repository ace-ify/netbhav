// Twilio WhatsApp / SMS webhook — now profile-aware (Task 4).
//
// Configure in the Twilio console (Messaging → WhatsApp sandbox / a number):
//   "WHEN A MESSAGE COMES IN" → POST  https://<your-domain>/api/whatsapp
// Twilio POSTs application/x-www-form-urlencoded and delivers whatever TwiML
// we return straight back to the farmer on WhatsApp/SMS.
//
// A known sender is greeted by name and can just say "aaj ka bhav?" — we fill
// crop/qty from their saved profile. An unknown sender is onboarded: once they
// send a parseable crop+qty(+place), we create their profile automatically.
//
// TODO (production): validate the `X-Twilio-Signature` header against your
// Twilio auth token + the exact request URL & params before trusting `Body`.
import { runAgent } from "@/lib/agent/agent";
import * as store from "@/lib/store/farmers";
import { persistQueryAndSnapshot } from "@/lib/store/onboard";

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
  let from = "";
  try {
    const form = await req.formData();
    body = String(form.get("Body") ?? "").trim();
    from = String(form.get("From") ?? "");
  } catch {
    return twiml("Sorry, I couldn't read your message. Please try again.");
  }

  const phone = store.normalizePhone(from);
  const profile = phone ? await store.get(phone).catch(() => null) : null;
  const lang: "hi" | "en" = profile?.lang ?? (/[ऀ-ॿ]/.test(body) ? "hi" : "en");
  const greet = profile?.name
    ? lang === "hi"
      ? `नमस्ते ${profile.name}! 🙏\n`
      : `Namaste ${profile.name}! 🙏\n`
    : "";

  if (!body) {
    if (profile) {
      return twiml(
        greet +
          (lang === "hi"
            ? "आज का भाव जानने के लिए बस 'आज का भाव?' भेजें, या नई फसल/मात्रा लिखें।"
            : "Just send 'today's price?' for a fresh check, or type a new crop/quantity.")
      );
    }
    return twiml(
      "Namaste! Send your crop, quantity and place — e.g. '50 quintal wheat at Rau' / 'राऊ में 50 क्विंटल गेहूं'."
    );
  }

  try {
    const defaults = profile?.crops?.[0]
      ? { crop: profile.crops[0].cropId, quantityQuintals: profile.crops[0].expectedQuintals }
      : undefined;
    const out = await runAgent({
      text: body,
      lang,
      location: profile ? { lat: profile.lat, lng: profile.lng } : undefined,
      defaults,
    });

    // Persist / onboard: keep whatever we just resolved for this phone.
    if (phone && out.result?.best && out.query) {
      await persistQueryAndSnapshot({
        phone,
        crop: out.query.crop,
        quantityQuintals: out.query.quantityQuintals,
        lat: out.query.lat,
        lng: out.query.lng,
        lang,
        result: out.result,
      }).catch(() => {});
    }
    return twiml(greet + out.reply);
  } catch {
    return twiml(
      lang === "hi"
        ? "क्षमा करें, कुछ गड़बड़ हो गई। कृपया फिर कोशिश करें।"
        : "Sorry, something went wrong. Please try again."
    );
  }
}
