import { Inter, Oswald } from "next/font/google";

// Body: Inter (300–600). Display/headings: Oswald (300–700). Loaded via next/font
// so there's zero layout shift and no external <link>. Variables are wired onto
// <html> in layout.tsx; Tailwind maps `font-sans`→Inter, `font-oswald`→Oswald.
export const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const oswald = Oswald({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});
