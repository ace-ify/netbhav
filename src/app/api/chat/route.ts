import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agent/agent";
import type { Lang } from "@/lib/types";

// POST /api/chat — natural-language front door. Accepts a raw `text` or a
// `messages` array (last user turn is used). Returns the composed reply plus
// the deterministic result. Never 500s on normal user input.
interface ChatBody {
  text?: string;
  messages?: { role: string; content: string }[];
  lang?: Lang;
  location?: { lat: number; lng: number } | null;
  maxDistanceKm?: number;
}

export async function POST(req: Request) {
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const lastUser = body.messages?.filter((m) => m.role === "user").at(-1)?.content;
  const text = (body.text ?? lastUser ?? "").trim();
  if (!text) return NextResponse.json({ error: "Missing message text" }, { status: 400 });

  const lang = body.lang === "hi" || body.lang === "en" ? body.lang : undefined;

  try {
    const out = await runAgent({
      text,
      lang,
      location: body.location ?? null,
      maxDistanceKm: body.maxDistanceKm,
    });
    return NextResponse.json({
      reply: out.reply,
      result: out.result,
      query: out.query,
      usedFallbackLocation: out.usedFallbackLocation ?? false,
    });
  } catch {
    // runAgent shouldn't throw, but keep the front door friendly regardless.
    const reply =
      lang === "hi"
        ? "क्षमा करें, कुछ गड़बड़ हो गई। कृपया फिर कोशिश करें।"
        : "Sorry, something went wrong. Please try again.";
    return NextResponse.json({ reply }, { status: 200 });
  }
}
