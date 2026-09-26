import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // NetBhav palette — earthy green + honest gold
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
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
