# 🌾 NetBhav — Mandi Opportunity Agent (PS-02)

**The best mandi isn't the one with the highest price — it's the one that puts the most money in your pocket.**

NetBhav does the honest math — **net realization = price − transport − commission − mandi fee − cess − hamali − spoilage** — and ranks every nearby mandi by what a farmer would actually *take home*, in Hindi, on any phone.

Live demo: https://netbhav.vercel.app · Region: central-UP (Awadh) belt around Lucknow.

---

## The problem (PS-02)

Farmers decide where to sell using fragmented mandi price boards. A higher sticker price often earns *less* once transport, commission and fees are subtracted. NetBhav takes a farmer's **crop + quantity + location**, pulls **live mandi prices from multiple sources**, computes **transport + all deductions**, and returns a **ranked shortlist by real take-home** plus one clear recommendation — and how many ₹ it beats the naive "chase the highest price" choice.

Example (50 quintal mustard, near Lucknow): highest sticker at Shahjahanpur (~198 km) nets **₹2,52,129**; nearby Lucknow (~24 km) nets **₹2,61,686** — chasing the sticker price loses **₹9,556**.

## Approach

- A **pure-TypeScript, unit-tested engine** does every rupee (distance → freight → class-aware commission → mandi fee/cess/hamali → distance-scaled spoilage → net realization → ranking). The LLM never touches a number.
- A **cache-first, multi-source price layer** (live → reference) that never blocks the farmer on a slow government API.
- A **conversational layer** (text chat, Hindi voice, WhatsApp, phone call) that only does *language* — it extracts intent, then the deterministic engine answers.
- **Graceful degradation everywhere**: zero paid keys required to run; every dependency has a fallback.

---

## Run it (zero keys required)

```bash
npm install
npm run dev        # http://localhost:3000  (functional tool at /app)
```

```bash
npm test           # 31 engine + agent + store tests (deterministic money math)
npm run build      # production build
npm run agent      # (optional) LiveKit voice agent worker — needs LIVEKIT_* keys
```

All keys are **optional** — see `.env.example`. Without any keys: reference prices + rule-based intent parser + browser voice. Keys just light up live prices, an LLM agent, WhatsApp, phone calls, and cloud persistence.

---

## What's working — features

**Core (PS-02 MVP — all of it)**
- ✅ Farmer / crop / quantity / location profile (typed, geolocated, or spoken)
- ✅ Live market-price data (multi-source, see below) with a **Live / Cached / Reference** freshness badge
- ✅ Nearby mandi comparison — 18 real APMC yards across the central-UP belt
- ✅ Transport cost — distance × per-km hire, sized to the load, round-trip aware
- ✅ Net-realization comparison — every deduction shown to the rupee
- ✅ Clear recommendation — one SELL verdict + ₹ gained vs the naive highest-price pick

**Any crop, no fixed list** — fuzzy search resolves Hindi/English/typos/aliases (गेहूं, aloo, sarson, gajar…) to the right commodity; unknown crops pass through gracefully.

**Bonus**
- ✅ Historical price trend chart per mandi + WPI-based momentum
- ✅ **Multiple data sources** with provenance (see `/api/health`)
- ✅ Map visualization — Leaflet, mandis colored by take-home, **real road route (OSRM)** drawn in-platform to the best mandi
- ✅ FPO / bulk-selling mode — pool into full truckloads; per-quintal transport drops (auto-recomputes)
- ✅ Hindi / English UI + Hindi-speaking voice & chat agent
- ✅ **Proactive advisory** — detects a sell-worthy move per farmer and alerts them
- ✅ **Operator/admin console** (`/admin`) — farmers, income surfaced, run alerts, place calls

## Data sources (multiple, independent)

| Source | Role | Key? |
|---|---|---|
| Agmarknet keyless mirror | **Primary — live daily** mandi modal/min/max (covers ~13/18 of our mandis live) | none |
| data.gov.in Agmarknet | Official secondary, 300+ commodities | free key |
| CEDA (Ashoka University) | Broad coverage + independent academic provenance + history | free OTP key |
| WPI — Office of the Economic Adviser (2012–2026) | Offline fallback: official long-term price trend / momentum | none (bundled) |
| Bundled reference bands | Last-resort ₹ fallback so the app never blanks | none |

`GET /api/health` reports which sources are live/configured — the honest, machine-readable provenance.

## How a farmer can use it (communication layers)

1. **Web / PWA** (`/app`) — type or tap crop → quantity → location, get the ranked mandis, map route, and take-home breakdown. Works on any phone browser, Hindi-first.
2. **Voice (in-app)** — tap the mic; browser Web Speech loop asks and answers in Hindi. Zero setup.
3. **Voice (real phone call, LiveKit + Twilio SIP)** — a real WebRTC/PSTN call to a Hindi-speaking agent that runs the same engine (`npm run agent` + LIVEKIT_* / SIP env). Outbound too: the system can **call the farmer** (`POST /api/call`).
4. **WhatsApp / SMS (Twilio)** — the farmer sends "लखनऊ में 50 क्विंटल गेहूं"; a known sender is greeted by name and can just say "aaj ka bhav?" (`POST /api/whatsapp`). Unknown senders are onboarded conversationally.
5. **Proactive alerts** — once opted in, NetBhav watches prices and pings the farmer (WhatsApp, escalating to a voice call for high-value moves) when it's time to sell. Managed from `/admin`.

One profile, many doors — the farmer's crop/location, entered once (web, WhatsApp, or a call), is remembered and reused across every channel.

## Persistence

Farmer profiles persist to **Supabase** when `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` are set (one table: `create table netbhav_kv (key text primary key, value jsonb);`), else to a local JSON file for dev/tests.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · pure-TS engine (node:test) · Leaflet + OSRM · Recharts · LiveKit Agents (voice) · Twilio (WhatsApp/SIP) · Supabase (persistence) · optional OpenAI-compatible LLM (Groq) for intent.

## API

`POST /api/opportunity` · `POST /api/chat` · `POST /api/whatsapp` · `POST /api/call` · `POST /api/alerts/run` · `GET /api/geocode` · `GET /api/route` · `GET /api/trends` · `GET /api/meta` · `GET /api/admin` · `GET /api/health`

## License

MIT — see [LICENSE](LICENSE).
