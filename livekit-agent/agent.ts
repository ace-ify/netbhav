// NetBhav LiveKit voice agent worker.
//
// Run: `npm run agent`  (needs LIVEKIT_URL / API_KEY / API_SECRET in env).
// LiveKit handles the whole voice pipeline via LiveKit Inference — STT, LLM,
// TTS and turn detection — so no separate provider keys are needed. The ONLY
// thing this agent's LLM is trusted with is LANGUAGE; every rupee comes from
// our deterministic engine via the `findBestMandi` tool.
//
// UNVERIFIED: LiveKit Agents is a fast-moving SDK and this worker can only be
// verified against a live LiveKit Cloud project. The bootstrap (defineAgent /
// ServerOptions / cli.runApp) and llm.tool API are taken from @livekit/agents
// v1.9.0 type defs + docs.livekit.io. The Inference MODEL IDS below are
// examples — confirm Hindi support at docs.livekit.io/agents/models and tune
// via the LIVEKIT_* env vars once creds are in. See README "Voice & channels".
import {
  cli,
  defineAgent,
  voice,
  llm,
  inference,
  ServerOptions,
  type JobContext,
} from '@livekit/agents';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { lookupMandiForVoice } from '@/lib/agent/voiceTool';

const findBestMandi = llm.tool({
  name: 'findBestMandi',
  description:
    'Find the mandi (market) that gives the farmer the highest NET take-home for a crop, ' +
    'after transport, commission and fees. Call this whenever the farmer has given a crop ' +
    'and a quantity. Returns the best mandi, net rupees total and per quintal, distance, ' +
    'how much more it is than the highest-price mandi, a SELL/WAIT/MONITOR trend signal, ' +
    'and the top 3 options. Never compute prices yourself — always use this tool.',
  parameters: z.object({
    crop: z
      .string()
      .describe('Crop id, one of: wheat, soybean, gram, onion, garlic, mustard'),
    quantityQuintals: z.number().describe('Quantity in quintals (1 tonne = 10 quintal)'),
    location: z
      .string()
      .nullable()
      .describe('Village / town / mandi the farmer named, or null if not said'),
    fpo: z.boolean().nullable().describe('true if pooling / FPO / bulk selling is mentioned'),
  }),
  execute: async ({ crop, quantityQuintals, location, fpo }) => {
    return await lookupMandiForVoice({
      crop,
      quantityQuintals,
      location: location ?? undefined,
      fpo: fpo ?? false,
    });
  },
});

function createAgent() {
  return voice.Agent.create({
    instructions:
      'You are NetBhav, a warm, concise mandi advisor for Indian farmers. ' +
      "Detect and MIRROR the farmer's language — reply in Hindi if they speak Hindi, English if English. " +
      'Your goal: tell them which nearby mandi pays the most AFTER transport, commission and fees. ' +
      'When you have crop + quantity (location optional), call findBestMandi. ' +
      'Then say, briefly and naturally: the best mandi and district, the net take-home (total and per quintal), ' +
      'roughly how far it is, and how many more rupees it is than chasing the highest sticker price. ' +
      'Add the SELL/WAIT/MONITOR trend hint in one short phrase. Keep replies short — this is a phone call. ' +
      'Never invent prices or mandi names; only use tool results. Amounts are in rupees.',
    tools: [findBestMandi],
  });
}

export default defineAgent({
  entry: async (ctx: JobContext) => {
    await ctx.connect();

    // LiveKit Inference: STT + LLM + TTS, no separate provider keys.
    // Hindi-first defaults — Deepgram Nova-3 in `multi` mode handles Hindi +
    // English code-switching (Hinglish) in one model. All overridable via env.
    const ttsOpts: { model: string; voice?: string } = {
      model: process.env.LIVEKIT_TTS_MODEL || 'cartesia/sonic-3',
    };
    if (process.env.LIVEKIT_TTS_VOICE) ttsOpts.voice = process.env.LIVEKIT_TTS_VOICE;

    const session = new voice.AgentSession({
      stt: new inference.STT({
        model: process.env.LIVEKIT_STT_MODEL || 'deepgram/nova-3',
        language: process.env.LIVEKIT_STT_LANG || 'multi',
      }),
      llm: new inference.LLM({ model: process.env.LIVEKIT_LLM_MODEL || 'google/gemma-4-31b-it' }),
      tts: new inference.TTS(ttsOpts),
      turnHandling: { turnDetection: new inference.TurnDetector() },
    });

    await session.start({ agent: createAgent(), room: ctx.room });

    session.generateReply({
      instructions:
        'Greet the farmer warmly in Hindi (with a little English) and ask which crop, ' +
        'how many quintals, and which area they are in.',
    });
  },
});

// NOTE: no `agentName` → AUTOMATIC dispatch (the worker auto-joins every room).
// Setting agentName switches to EXPLICIT dispatch, where the agent never joins
// unless dispatched via API — which looks like "connected but no response".
cli.runApp(new ServerOptions({ agent: fileURLToPath(import.meta.url) }));
