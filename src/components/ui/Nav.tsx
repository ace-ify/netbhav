"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Sprout, ArrowRight } from "lucide-react";
import PillButton from "./PillButton";

// Glass nav (design.md §5): fixed, h-20, blur. Logo left (tracking-widest),
// center links (desktop), right = CTA pill or a custom `right` node (the app
// shell passes its LangToggle here). Mobile collapses links into a menu panel.
export type NavLink = { label: string; href: string };

export default function Nav({
  links = [],
  cta,
  right,
}: {
  links?: NavLink[];
  cta?: { label: string; href: string };
  right?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="glass-nav fixed inset-x-0 top-0 z-50 h-20 border-b border-neutral-200/70">
      <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-neutral-900">
          <Sprout className="h-5 w-5" aria-hidden />
          <span className="font-600 text-sm uppercase tracking-widest">NetBhav</span>
        </Link>

        {links.length > 0 && (
          <div className="hidden items-center gap-8 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-500 text-neutral-600 transition duration-300 hover:text-neutral-900"
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          {right}
          {cta && (
            <div className="hidden md:block">
              <PillButton href={cta.href} icon={ArrowRight}>
                {cta.label}
              </PillButton>
            </div>
          )}
          {(links.length > 0 || cta) && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-neutral-900 transition hover:bg-neutral-100 md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </nav>

      {open && (
        <div className="glass-nav border-b border-neutral-200 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4 sm:px-8">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-base font-500 text-neutral-700 transition hover:bg-neutral-100"
              >
                {l.label}
              </Link>
            ))}
            {cta && (
              <PillButton href={cta.href} icon={ArrowRight} className="mt-2 w-full">
                {cta.label}
              </PillButton>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
