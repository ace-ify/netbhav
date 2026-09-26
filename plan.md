# Mandi Opportunity Agent — Plan

**PS-02.** Help a farmer decide where to sell: crop + quantity + location →
compare selling options → **net take-home realization** → ranked shortlist.

## Reality check (from 2026-09-26 deep research — see memory)

Net-realization "where to sell" is **not whitespace**. Prior art already exists:
- **Buzzar** (buzzarr.com) — *shipped* MVP, ranks mandis by price − transport.
- **Kisan_Arbitrage** (GitHub) — prototype: transport + ICAR-CIPHET spoilage + APMC + LLM "why".
- **Mandi-Mate** (GitHub) — prototype: net-profit rank + SARIMA sell-now-vs-wait.

So we do **not** pitch any single feature (transport-net, spoilage, voice/Hindi,
AI-why) as novel — they're occupied. We win on structure and rigor, not a gimmick.

## The wedge (defensible, structural)

> A **neutral advisor** (not a buyer) that ranks **every exit a farmer has** on one
> take-home axis — with honest confidence. No incumbent will build this.

1. **Neutral multi-channel comparison** — rank competing APMC mandis **+ eNAM +
   the aggregator's doorstep quote (DeHaat/Ninjacart) + FPO pooling**, side by side.
   Marketplaces can't (it commoditizes their own price); govt tools are four silos
   that never join (Agmarknet=display, eNAM=one-point discovery, Kisan Rath=freight,
   MahaFPC=pooling). **This is the position.**
2. **Pooling as a per-farmer decision lever** — "Alone: best = Kolar ₹X. Pool 40q
   with 2 neighbors → unlock Bangalore → +₹300/q each." Everyone does pooling as
   back-office FPO ops; nobody as a where-to-sell toggle.
3. **Sell-now-vs-wait timing** — the one capability genuinely *unshipped at scale*
   (only prototypes + IFFCO's backward chart). Best real gap.
4. **Honest confidence** — surface Agmarknet's 2–7 day lag (`arrival_date`), the
   spoilage range, and the freight assumption. Prototypes hide these; judges trust it.

Net equation (done with *correct* numbers, unlike the prototypes):
```
net = quantity × (1 − spoilage(transit_hours)) × price
      − transport_cost            # ₹0.38–1.1 per quintal-km (road), default 1.0
      − apmc_commission           # ~1–2% of price
```

## Architecture

Deterministic engine + thin AI shell. FastAPI + single HTML page.

```
index.html ── form (crop, qty, location, rate) [+ 🎤 voice later] ─┐
                                                                    ▼
app.py  /api/opportunities
   fetch_prices(crop,state)   → Agmarknet, fallback sample_prices.json
   geocode(place)             → Nominatim + geo_cache.json
   haversine → transit_hrs → spoilage → net realization → rank
   channels: mandis + eNAM row + aggregator doorstep-quote row
   /api/pool                  → re-rank with combined quantity
   /api/trend                 → Agmarknet date-range → sell-now-vs-wait
   /api/explain               → LLM one-paragraph rationale
sample_prices.json ── offline fallback w/ baked coords
crops.json         ── per-crop: spoilage anchor, storable?, avg transit speed
```

## Phases (ship + validate each; don't build ahead)

- [x] **P0 Scaffold** — FastAPI, one page, Agmarknet+fallback, haversine,
  flat-rate transport, ranked table. *(done)*
- [ ] **P1 Net realization, done right** — fix env (`python3 -m pip/uvicorn`);
  add APMC commission + spoilage decay anchored to ICAR-CIPHET **5–13%** (a knob,
  not 30–40%); keep freight default **1.0 ₹/q-km** (≈₹10/tonne-km, correct for
  small loads — do NOT drop to 0.2); `crops.json`; break-even threshold + a
  **data-freshness/lag flag** in the UI. *Credibility core.*
- [ ] **P2 Neutral multi-channel (Wedge 1)** — add eNAM and an aggregator
  doorstep-quote as comparison rows alongside mandis (aggregator price a manual/
  estimated input for MVP). This is the pitch's spine.
- [ ] **P3 Pooling lever (Wedge 2)** — `/api/pool` combines N nearby farmers'
  quantity, re-ranks, shows per-farmer net gain from pooling.
- [ ] **P4 Timing — sell-now-vs-wait (best real gap)** — Agmarknet date-range
  history → 7-day trend + volatility; suggest holding only for storable crops.
- [ ] **P5 Trust + AI "why"** — confidence/lag surfacing; `/api/explain` → one
  Claude call turning the ranking into a farmer-trustable paragraph.
- [ ] **P6 Table-stakes polish** — Hindi/voice input (Web Speech; Bhashini if
  time) — accessibility, not a headline claim; Leaflet map + price sparkline.

## Data-robustness thread (fold into P1–P2)

Fuzzy crop/variety match, dedupe mandis, graceful empty/rate-limited API,
seed geo cache for common districts so demos are instant.

## Explicitly deferred (YAGNI)

- Accounts / DB — profile is the form input until multi-session is needed.
- Real-time routing API — haversine + tunable rate + transit-hours is enough.
- Price forecasting beyond a trend line; standing price alerts (good pitch line).
- LLM in the ranking loop — arithmetic decides; AI only parses input & explains.
- Voice/Hindi as a *differentiator* — it's commoditized (KisanWorks, Bhashini).

## Environment note

`python3` (3.13) has working pip; default `python` (3.11) is a pip-less venv.
Use `python3 -m pip install -r requirements.txt` and
`python3 -m uvicorn app:app --reload`.
