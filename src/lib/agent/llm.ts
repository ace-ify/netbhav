// Provider-flexible, OpenAI-compatible chat completion — used ONLY to extract
// structured intent as JSON. The LLM handles language, never money. No SDK,
// just fetch. Zero keys → returns null and the caller falls back to rules.

interface ExtractedIntent {
  crop?: string;
  quantityQuintals?: number;
  locationText?: string;
  fpo?: boolean;
}

export function llmConfigured(): boolean {
  return Boolean(process.env.LLM_BASE_URL || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY);
}

function provider(): { base: string; key: string; model: string } | null {
  // Explicit base URL override: self-hosted / proxy / local mock (key optional).
  if (process.env.LLM_BASE_URL) {
    return {
      base: process.env.LLM_BASE_URL.replace(/\/$/, ""),
      key: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || "local",
      model: process.env.LLM_MODEL || "local-model",
    };
  }
  if (process.env.GROQ_API_KEY) {
    return {
      base: "https://api.groq.com/openai/v1",
      key: process.env.GROQ_API_KEY,
      // Groq retired llama-3.3-70b-versatile; gpt-oss-20b is a current, fast,
      // JSON-mode-capable model — plenty for intent extraction. Override via LLM_MODEL.
      model: process.env.LLM_MODEL || "openai/gpt-oss-20b",
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      base: "https://api.openai.com/v1",
      key: process.env.OPENAI_API_KEY,
      model: process.env.LLM_MODEL || "gpt-4o-mini",
    };
  }
  return null;
}

const SYSTEM_PROMPT =
  "You extract structured intent from an Indian farmer's message (Hindi, English, " +
  "or Hinglish). Reply with STRICT JSON only, no prose: " +
  '{"crop": <the crop as a lowercase English word (e.g. paddy, wheat, potato, mustard, arhar, gram, maize, onion, garlic, tomato, or ANY other crop the farmer names — carrot, methi, bajra, etc.); null if none>, ' +
  '"quantityQuintals": <number in quintals (1 tonne = 10 quintal) or null>, ' +
  '"locationText": <village/town/mandi name as written, or null>, ' +
  '"fpo": <true if bulk/FPO/pooled selling is mentioned, else false>}. ' +
  "Use null for anything not stated. Never invent values.";

export async function extractIntentLLM(text: string): Promise<ExtractedIntent | null> {
  const p = provider();
  if (!p) return null;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(`${p.base}/chat/completions`, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${p.key}`,
      },
      body: JSON.stringify({
        model: p.model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const raw = JSON.parse(content) as Record<string, unknown>;
    const out: ExtractedIntent = {};
    if (typeof raw.crop === "string" && raw.crop) out.crop = raw.crop;
    if (typeof raw.quantityQuintals === "number" && isFinite(raw.quantityQuintals) && raw.quantityQuintals > 0)
      out.quantityQuintals = raw.quantityQuintals;
    if (typeof raw.locationText === "string" && raw.locationText.trim()) out.locationText = raw.locationText.trim();
    if (typeof raw.fpo === "boolean") out.fpo = raw.fpo;
    return out;
  } catch {
    return null; // network, timeout, bad JSON — caller falls back. Never throw.
  } finally {
    clearTimeout(timer);
  }
}
