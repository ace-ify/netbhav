"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

// Accordion (design.md §3/§5): React state drives `data-open`; height animates
// via the `.acc-row` grid-rows trick. Arrow straightens (rotate-0) when active,
// tilts (-rotate-45) when inactive. `onOpenChange` lets a parent (e.g. the
// Analysis section's sticky image) react to the active row.
export type AccordionItem = { title: React.ReactNode; content: React.ReactNode };

export default function Accordion({
  items,
  defaultOpen = 0,
  onOpenChange,
}: {
  items: AccordionItem[];
  defaultOpen?: number | null;
  onOpenChange?: (index: number | null) => void;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);

  function toggle(i: number) {
    const next = open === i ? null : i;
    setOpen(next);
    onOpenChange?.(next);
  }

  return (
    <div>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="border-t border-neutral-200 last:border-b">
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-6 text-left"
            >
              <span
                className={`font-oswald text-xl font-500 tracking-tight transition duration-300 md:text-2xl ${
                  isOpen ? "text-neutral-900" : "text-neutral-500"
                }`}
              >
                {item.title}
              </span>
              <ArrowRight
                className={`h-5 w-5 shrink-0 transition duration-300 ${
                  isOpen ? "rotate-0 text-neutral-900" : "-rotate-45 text-neutral-400"
                }`}
                aria-hidden
              />
            </button>
            <div className="acc-row" data-open={isOpen}>
              <div>
                <div className="pb-6 pr-8 text-neutral-600 leading-relaxed">{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
