# NetBhav — Design System (`design.md`)

Baseline aesthetic: **"GrainBot Agro Analytics"** reference — editorial, high-contrast,
Oswald display + Inter body, neutral palette, glassmorphism nav, grayscale photo breaks.
This doc is the single source of truth. Iterate here first, then in code.

> **Golden rule:** we adopt the template's *design language*, re-implemented in our
> **Next.js + React + compiled Tailwind + lucide-react** stack. We do **not** paste the
> reference's Tailwind-CDN / vanilla-JS / Iconify HTML. Fidelity of *look*, not of *code*.

---

## 0. Stack adaptation (template → our repo)

| Reference uses | We use instead |
|---|---|
| Tailwind **CDN** (`cdn.tailwindcss.com`) | our existing compiled Tailwind (`tailwind.config.ts` + PostCSS). **Never add the CDN.** |
| **Iconify** CDN (`lucide:*`) | `lucide-react` (already installed) — same icons as React components |
| Google Fonts `<link>` (Inter, Oswald) | `next/font/google` (Inter + Oswald), zero layout shift |
| Vanilla `toggleService(i)` accordion | a React `<Accordion>` component with `useState` |
| Unsplash hotlinks | `next/image` + optimize; keep heavy heroes on the **landing only** |

Two page *families*, one token set:
- **Landing** (`/`, public/investor) → full template polish, hero-driven.
- **App** (`/app`, `/dashboard`, functional) → same tokens, but farmer-first layout
  (big touch targets, Hindi-first, light images). See §8–9.

---

## 1. Fonts

`src/app/fonts.ts`:
```ts
import { Inter, Oswald } from "next/font/google";
export const inter = Inter({ subsets: ["latin"], weight: ["300","400","500","600"], variable: "--font-inter" });
export const oswald = Oswald({ subsets: ["latin"], weight: ["300","400","500","600","700"], variable: "--font-oswald" });
```
Apply both `variable`s on `<html>`; set Inter as the default sans.

- **Body:** Inter. **All large headings:** Oswald (`font-oswald`).
- Body gets `font-feature-settings: "cv11", "ss01";` (template quirk — keep it).

### Type scale
| Role | Font | Classes |
|---|---|---|
| Hero H1 | Oswald | `font-oswald font-600 text-5xl md:text-7xl tracking-tighter leading-[0.95]` |
| Section H2 | Oswald | `font-oswald font-500 text-3xl md:text-5xl tracking-tight` |
| Card title | Oswald | `font-oswald font-500 text-xl tracking-tight` |
| Stat number | Oswald | `font-oswald font-600 text-4xl md:text-5xl leading-tight` |
| Nav logo | Inter | `font-600 text-sm tracking-widest uppercase` |
| Body | Inter | `font-400 text-base leading-relaxed` |
| Small/label | Inter | `font-500 text-xs tracking-wide uppercase text-neutral-500` |

Tracking is deliberate & mixed: **`tracking-widest`** for nav logo / eyebrow labels,
**`tracking-tighter`** for hero display. Don't normalize it.

---

## 2. Color

Template is a **neutral monochrome** system with a single warm accent. Keep it.

| Token | Value | Use |
|---|---|---|
| `bg` | `neutral-50` | page background |
| `ink` | `neutral-900` | primary text, dark sections, primary buttons |
| `muted` | `neutral-500` | secondary text, labels |
| `line` | `neutral-200` | borders, the `gap-px` grid bg, selection (`selection:bg-neutral-200`) |
| `surface` | `white` | cards |
| `accent` | `yellow-500` | "popular"/highlight only — sparingly, like the template |

### Semantic layer (NetBhav extension — the only added colors)
Money & data-freshness need meaning the template didn't have. Keep them muted so they
sit inside the neutral system, not fight it:
| Token | Value | Meaning |
|---|---|---|
| `gain` | `emerald-600` | best take-home / positive delta |
| `loss` | `rose-600` | money lost vs naive pick |
| `live` | `emerald-600` | live prices badge |
| `cached` | `blue-600` | cached badge |
| `reference` | `amber-600` | reference/seed badge |

Rule: charts/maps use these semantics; everything structural stays neutral.

---

## 3. Signature effects (copy these exactly — they define the look)

In `globals.css`:
```css
/* Glass nav — template value, do not tweak */
.glass-nav { background: rgba(255,255,255,0.85); backdrop-filter: blur(12px); }

/* Diagonal photo clip */
.clip-image { clip-path: polygon(0 0, 100% 0, 100% 90%, 0 100%); }

/* Accordion smooth height */
.acc-row { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .3s ease; }
.acc-row[data-open="true"] { grid-template-rows: 1fr; }
.acc-row > div { overflow: hidden; }
```

- **Grayscale photo sections** (Visual Break, Trust): `grayscale opacity-90` (+ `bg-neutral-900/10`
  overlay on the break). Other images stay in color. Don't grayscale everything.
- **Fine-border grid** (features): NOT borders — a `bg-neutral-200` parent with `gap-px`
  and white cards, so the background shows through as 1px lines. `hover:bg-neutral-50` per card.
- **Accordion arrow:** active `rotate-0 text-neutral-900`, inactive `-rotate-45 text-neutral-400`.

---

## 4. Icons (lucide-react)

Same set as template, imported from `lucide-react`:
`ArrowRight, Menu, Database, TrendingUp, Sprout, Globe, Bell, ShieldCheck, CheckCircle,
MapPin, Mail, Send`. (Skip `twitter` — dead brand; use your real channel.)

---

## 5. Components

**Nav** — `fixed top-0 z-50 h-20 glass-nav`, flex, logo left (`tracking-widest uppercase`),
links center (Features/Analysis/Pricing → for us: **Kaise / Mandi / Pricing / App**),
right = primary pill CTA.

**Primary pill button** — `inline-flex items-center gap-2 rounded-full bg-neutral-900
text-white px-5 py-2.5 text-sm font-500 transition duration-300 hover:bg-neutral-800`;
arrow uses `group-hover:translate-x-0.5 transition`.

**Secondary** — same shape, `bg-transparent border border-neutral-300 text-neutral-900
hover:bg-neutral-100`.

**Card** — `bg-white p-8` (in the gap-px grid) or `rounded-lg border border-neutral-200`
standalone. Title in Oswald, body Inter, one lucide icon top-left in `text-neutral-900`.

**Stat** — Oswald number + `tracking-wide uppercase text-xs text-neutral-500` label.

**Badge** (freshness/rank) — `rounded-full px-2.5 py-1 text-xs font-500` in the semantic color.

**Form input** — `w-full bg-transparent border-b border-neutral-300 py-3 focus:border-neutral-900
outline-none transition`; label `sr-only` on the landing CTA, visible on app forms.

---

## 6. Landing page (`/`) — section by section (faithful to template)

Keep the template's structure; swap Telegram-bot content for NetBhav's story.

1. **Nav** — glass, h-20. CTA pill: **"App kholo"** (`ArrowRight`), not "Open Telegram".
2. **Hero** — 12-col grid, left 7 / right 5.
   - H1 split by a physical `rounded-full` image pill in the flow:
     **"स्मार्ट मंडी"** → `[grain pill image w-32/56]` → **"— असली कमाई"**.
   - Sub (`max-w-sm`): "सबसे ऊँचा भाव नहीं — सबसे ज़्यादा घर ले जाने वाली मंडी. Transport,
     commission, fee ke baad ki asli kamai."
   - Stats (Oswald): **24 मंडी**, **₹8,402 बचत** (demo), **0 keys**.
   - Right column: `relative h-[600px] overflow-hidden`, absolute overlays — social/channel
     top-6 right-6, floating "live price" info card top-6 left-6, bottom photo overlay `bottom-0`.
3. **Visual Break** — `h-96 md:h-[600px]`, full-width farm photo `grayscale opacity-90`
   + `bg-neutral-900/10` overlay. One line over it: the honest-math promise.
4. **Advantage / Features** — 3-col `gap-px` on `bg-neutral-200`, white cards, `hover:bg-neutral-50`.
   Cards: **Net realization** (`TrendingUp`), **24 मंडी compare** (`MapPin`),
   **Hindi voice + WhatsApp** (`Sprout`), **Live Agmarknet** (`Database`),
   **FPO/bulk** (`Globe`), **Proactive alerts** (`Bell`).
5. **Analysis / Accordion** — desktop `lg:sticky lg:top-32` left image that cross-fades
   (opacity) as rows toggle; rows animate via `grid-rows-[0fr]→[1fr]`. Rows = the pipeline:
   *Price → Transport → Net realization → Recommendation.*
6. **Pricing** — `bg-neutral-900` white text, 4-col. **Reframe from "Telegram Stars":**
   Free (farmer, always), FPO, Partner/API. Popular plan `bg-neutral-800/20 rounded-r-lg`
   + `text-yellow-500` label. "How it works" guide column stays.
7. **Trust & CTA** — 2-col; left photo `grayscale opacity-80`; `CheckCircle` rows:
   AI-assisted, Zero-key, Reference-backed. CTA = phone/WhatsApp signup (`sr-only` label,
   `bg-neutral-900` button, `Send` icon).

Assets: reuse the template's Unsplash URLs as placeholders; swap for real farm/mandi
photos before demo. Serve via `next/image`.

---

## 7. Functional app pages — same tokens, farmer-first layout

The app screens (`/app`, `/dashboard`) inherit **fonts, colors, glass nav, card style,
buttons** from above — so it feels like one product — but drop the hero/marketing
scaffolding. Layout is a clean two-column tool, Hindi-first.

- **Shell:** same glass nav (logo + lang toggle + FPO toggle), `bg-neutral-50`, generous
  whitespace. No full-bleed grayscale heroes here (they're heavy + distracting in a tool).
- **InputPanel** — a standalone `rounded-lg border border-neutral-200 bg-white p-6` card.
  Crop → quantity → location. Oswald label headers, big inputs (see §8 touch sizes),
  primary pill "सबसे अच्छी मंडी खोजें".
- **ResultsPanel / MandiCard** — cards in a single column (not gap-px grid; results need
  breathing room). Best mandi card gets a `ring-1 ring-emerald-600` + `gain` rank badge.
  Sticker price in `muted`, **take-home in Oswald `text-2xl` `gain`**. Expand → full
  NetRealizationBreakdown (line items, Inter tabular) + TrendChart.
- **MandiMap** — Leaflet; markers colored by take-home (`gain` scale), route polyline to
  best in `neutral-900`. Map chrome minimal, rounded-lg, `border-neutral-200`.
- **TrendChart** — Recharts, single `neutral-900` line, `emerald-600` for the "sell" marker,
  no gridline clutter. Oswald axis labels.
- **ChatWidget / VoiceCall** — floating pill launcher (`bg-neutral-900`, `Bell`/mic icon),
  panel uses card style + glass. Hindi transcript, big mic button.
- **Dashboard** (`/dashboard`) — phone → profile. Sections as gap-px cards: profile
  (name/location/lang/consent), crops (chips), last recommendation (reuse MandiCard),
  alert history (timeline). This is where "one profile, three doors" is shown.

---

## 8. Farmer-accessibility rules (non-negotiable, inside the aesthetic)

The polish stays; these are additive constraints on the **app** screens:
- **Touch targets ≥ 48px** — buttons/inputs `min-h-12`, list rows `py-4`.
- **Hindi-first** — Devanagari renders bigger; bump app body to `text-lg`, never below `text-base`.
- **Contrast** — never `muted` text on `muted` bg; keep neutral-900/700 on neutral-50 for
  anything a farmer must read. Hero `muted` is fine on landing, not on results.
- **Image weight** — no multi-MB Unsplash heroes on app screens; icons/illustration only.
  Landing may be heavy; app must load on 3G.
- **Focus states visible** — keep `focus:border-neutral-900`; don't remove outlines.

---

## 9. Motion / interaction
- `scroll-smooth` on `<html>`. All buttons/links `transition duration-300`.
- Accordion: React state drives `data-open`; arrow rotates; sticky image cross-fades via opacity.
- Respect `prefers-reduced-motion` — disable cross-fades/transforms when set.

---

## 10. Do / Don't
**Do:** Oswald for every large heading · gap-px fine-border grid · grayscale only on
break/trust photos · glass nav exact values · neutral base + single accent.
**Don't:** add Tailwind CDN · use Iconify · put vanilla-JS accordions in React · grayscale
every image · use Oswald for body · push the glossy heavy-image landing look onto the
farmer tool · introduce new accent colors beyond the semantic set.

