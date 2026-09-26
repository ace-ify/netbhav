import type { Metadata, Viewport } from "next";
import { inter, oswald } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "NetBhav — the mandi that pays you most",
  description:
    "NetBhav ranks nearby mandis by net realization — live prices minus transport, commission & fees — in Hindi, in one tap.",
  manifest: "/manifest.json",
  applicationName: "NetBhav",
};

export const viewport: Viewport = {
  themeColor: "#2a6830",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${oswald.variable}`}>
      <body className="bg-neutral-50 font-sans text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
