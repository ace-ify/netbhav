import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // GrainBot aesthetic is neutral-monochrome + one warm accent (yellow-500).
        // Structure uses Tailwind's built-in `neutral` scale; `accent` is the pill.
        accent: {
          DEFAULT: "#eab308", // yellow-500 — "popular"/highlight only, sparingly
        },
        // Semantic layer (design.md §2) — money & data-freshness meaning, kept muted
        // so it sits inside the neutral system rather than fighting it.
        gain: "#059669", // emerald-600 — best take-home / positive delta / live
        loss: "#e11d48", // rose-600 — money lost vs naive pick / negative
        live: "#059669", // emerald-600
        cached: "#2563eb", // blue-600
        reference: "#d97706", // amber-600 — reference/seed

        // Legacy NetBhav palette — retained so untouched screens (dashboard etc.)
        // keep rendering while they migrate. New/reskinned UI uses neutral+semantic.
        brand: {
          50: "#f0f7f0",
          100: "#dceddc",
          200: "#bcdcbd",
          300: "#8ec292",
          400: "#5aa15f",
          500: "#3a8340",
          600: "#2a6830",
          700: "#235329",
          800: "#1e4324",
          900: "#193720",
        },
        gold: {
          400: "#f2b705",
          500: "#e0a800",
          600: "#c48f00",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "Noto Sans Devanagari", "sans-serif"],
        oswald: ["var(--font-oswald)", "Impact", "system-ui", "sans-serif"],
      },
      // Numeric weight utilities (font-300 … font-700) so design.md's class names
      // work verbatim. Merges with Tailwind's named weights (font-medium etc.).
      fontWeight: {
        "300": "300",
        "400": "400",
        "500": "500",
        "600": "600",
        "700": "700",
      },
    },
  },
  plugins: [],
};

export default config;
