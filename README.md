# 🌾 NetBhav — Mandi Opportunity Agent

**The best mandi isn't the one with the highest price — it's the one that puts the most money in your pocket.**

> PS-02: Mandi Opportunity Agent. A farmer chases the highest sticker price; the road, the commission and the fees quietly eat the difference. NetBhav does the honest math — **net realization = price − transport − commission − mandi fees** — and ranks every nearby mandi by what you'd actually take home, in Hindi, on any phone.

## The ₹9,500 that hides in plain sight

Real numbers from this app (50 quintal mustard, farmer near Lucknow):

| Mandi | Sticker price | Distance | **Take-home** |
|---|---|---|---|
| Shahjahanpur | ₹5,540/qtl ⬅ *highest price* | ~198 km | ₹2,52,129 |
| **Lucknow (Sitapur Rd)** | ₹5,450/qtl | ~24 km | **₹2,61,686** ⬅ *best take-home* |

Chasing the highest price would cost this farmer **₹9,556**. Same crop. Smarter mandi.

And it's not a rule of thumb — type any crop (Hindi or English, typos welcome) and the app does the real math every time. For a high-value, storable crop it will happily send you the long haul when the price gap dwarfs the transport; for a perishable it won't. Not a slogan — the math, every time.

## What it does (PS-02 MVP — all of it)

- ✅ **Farmer/crop profile** — crop, quantity, location (typed, geolocated, or spoken)
- ✅ **Market-price data source** — Agmarknet (data.gov.in) live, cache-first, with bundled reference fallback
- ✅ **Nearby mandi comparison** — 18 real APMC yards across the central-UP (Awadh) belt
- ✅ **Any crop, no fixed list** — fuzzy search resolves Hindi/English/typos (गेहूं, aloo, sarson…) to the right commodity
- ✅ **Transport-cost calculation** — distance × per-km hire, trips for load size, round-trip aware
- ✅ **Net realization comparison** — every deduction shown, to the rupee
- ✅ **Clear recommendation** — one SELL verdict + the ₹ you gain over the naive choice

### Bonus — every one

- ✅ **Historical price trends** — 30-day trend chart per mandi
- ✅ **Multiple data sources** — live Agmarknet + cache + reference seed, with a freshness badge
- ✅ **Map visualization** — Leaflet map, mandis colored by take-home, route to the best
- ✅ **FPO / bulk-selling mode** — pool into full truckloads, per-quintal transport drops
- ✅ **Hindi / Indic language** — full Hindi UI + a Hindi-speaking voice/chat agent

## Run it (zero keys required)

```bash
npm install
npm run dev        # http://localhost:3000
```

The app works completely offline of any paid service: bundled reference prices,
a rule-based intent parser, and the browser's own speech engine. Add API keys
(see `.env.example`) only to light up live Agmarknet prices and an LLM agent.

```bash
npm test           # engine + agent unit tests (deterministic money math)
npm run build      # production build
```

## Try these

- Type: **crop → quantity → location**, tap *Find best mandi*.
- Tap the mic in the chat bubble and say *"लखनऊ में 50 क्विंटल गेहूं"* or *"50 quintal wheat at Lucknow"*.
- Toggle **हिंदी / EN** top-right. Toggle **FPO / bulk mode**. Expand any mandi for the full math + trend.
- WhatsApp: point a Twilio sandbox webhook at `POST /api/whatsapp`.

## How it works

```
crop + qty + location
      │
      ▼
 ┌─────────────┐   live → cache → seed
 │ Price layer │◀── Agmarknet (data.gov.in), never blocks on a slow gov API
 └─────┬───────┘
       ▼
 ┌───────────────────┐   haversine × road-factor (instant), OSRM for map routes
 │ Net-realization    │   net = gross − commission − mandi fee − cess − hamali − transport
 │ engine (pure TS)   │   unit-tested; the LLM never touches a rupee
 └─────┬─────────────┘
       ▼
 rank by take-home → SELL verdict + ₹ delta vs the naive pick
```

The conversational layer (chat + Hindi voice + WhatsApp) only does **language** —
it extracts intent, then the deterministic engine does all the money math. That's
the "honest" promise: every number is reproducible and shown in full.

### Stack

- **Next.js 14 (App Router) + TypeScript + Tailwind** — one app, PWA, one-click deploy
- **Engine**: pure TS, unit-tested with `node --test`
- **Prices**: keyless live Agmarknet mirror (primary) → data.gov.in Agmarknet (optional key) → bundled reference seed, cache-first
- **Geo**: Nominatim geocoding (region-biased) + OSRM road routes, Haversine fallback
- **Map/chart**: Leaflet + Recharts · **Agent**: any OpenAI-compatible LLM for intent (Groq `gpt-oss-20b` by default; rule-based parser when no key) + deterministic reply · **Voice**: Web Speech API

### API

| Route | Purpose |
|---|---|
| `POST /api/opportunity` | crop+qty+location → ranked mandis (the core) |
| `POST /api/chat` | natural-language agent (text/voice) |
| `POST /api/whatsapp` | Twilio WhatsApp/SMS webhook (TwiML) |
| `GET /api/geocode?q=` | place → coordinates |
| `GET /api/trends?mandiId=&crop=` | 30-day price history |
| `GET /api/meta` | crops, mandis, demo farmer, cost assumptions |
| `GET /api/health` | honest status of every dependency (prices source/freshness, LLM configured) |

## Voice & channels

**LiveKit Agents is the primary voice stack** (real-time WebRTC), with the browser Web Speech loop as a zero-config fallback. When `LIVEKIT_URL/API_KEY/API_SECRET` are set, the "Voice call" button connects the farmer to a LiveKit room where an agent worker runs the full pipeline via **LiveKit Inference — STT + LLM + TTS + turn detection, no extra provider keys.** The agent's LLM only does *language*; it calls our `findBestMandi` tool so every rupee still comes from the deterministic engine.

Pieces:
- `POST /api/livekit/token` — mints a room token (`livekit-server-sdk`); returns `{configured:false}` when env is absent so the UI falls back to browser voice.
- `livekit-agent/agent.ts` — the agent worker. Run it alongside `next`: `npm run agent` (needs the 3 LiveKit creds). Deploy to LiveKit Cloud for production.
- `src/components/VoiceCallLiveKit.tsx` — the in-browser call UI (`@livekit/components-react`), lazy-loaded so its ~160 kB only loads on a call.

**PSTN / phone calls** are a small next step from here: LiveKit SIP bridges a real phone number into the same room + agent — the browser and the phone become two front-ends of one voice brain. WhatsApp stays wired at `POST /api/whatsapp`.

> Note: the LiveKit worker + frontend typecheck against the installed SDK, but a live LiveKit Cloud project is required to run/verify them end-to-end, and the Inference model IDs (esp. Hindi STT/TTS) should be validated and tuned via the `LIVEKIT_*` env vars once connected.



- **Prices** come live from a **keyless Agmarknet mirror** (`mandi-api.onrender.com`) — no signup, ~17–20 of our 24 mandis return yesterday's real modal prices, and bundled reference seed fills any gaps. Optional data.gov.in key (India portal) is a secondary source. The UI badges each result **Live / Cached / Reference**. (Render's free tier can cold-start on the first hit; the client times out gracefully to seed and retries shortly.)
- **Cost model** (tunable, shown in-app): MP mandi fee 1.5% + ~0.2% nirashrit cess,
  hamali ₹15/qtl, transport ₹40/km round-trip, 100-qtl truck. **Commission is
  class-aware** — grain/pulse/oilseed/spice 2%, vegetable 6%, fruit 8% (perishables
  cost more). **Spoilage in transit** is deducted for perishables, scaled by road
  distance and capped (onion 4%→12%, garlic a low 1%→4% since cured garlic stores
  for months; grains 0) — calibration knobs as-of 2025-26. The market fee is legally
  the buyer's but in practice lands on the farmer's realized price, so we deduct it — and say so.
- **Distance** defaults to straight-line × 1.35 (fast, offline); OSRM refines the map route.
- **Trends** are synthesized around the current modal price (no historical store in this
  build). `// ponytail:` swap for a `pg_cron` daily snapshot when persistence matters.

Sources: data.gov.in Agmarknet, MP Mandi Board rules, OpenStreetMap/Nominatim, OSRM.

