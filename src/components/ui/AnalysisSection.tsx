"use client";

import { useState } from "react";
import Image from "next/image";
import Accordion, { type AccordionItem } from "./Accordion";

// Analysis section (design.md §6.5): sticky left image cross-fades (opacity) as
// the accordion rows toggle on the right. The accordion drives `active`.
export type PipelineStep = {
  title: React.ReactNode;
  content: React.ReactNode;
  image: string;
  alt: string;
};

export default function AnalysisSection({
  eyebrow,
  heading,
  steps,
}: {
  eyebrow: string;
  heading: React.ReactNode;
  steps: PipelineStep[];
}) {
  const [active, setActive] = useState(0);
  const items: AccordionItem[] = steps.map((s) => ({ title: s.title, content: s.content }));

  return (
    <section id="mandi" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
      <div className="grid items-start gap-12 lg:grid-cols-2">
        <div className="lg:sticky lg:top-32">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-neutral-200">
            {steps.map((s, i) => (
              <Image
                key={i}
                src={s.image}
                alt={s.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className={`object-cover transition-opacity duration-500 ${
                  i === active ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-500 uppercase tracking-widest text-neutral-500">{eyebrow}</p>
          <h2 className="mt-3 font-oswald text-3xl font-500 tracking-tight text-neutral-900 md:text-5xl">
            {heading}
          </h2>
          <div className="mt-8">
            <Accordion
              items={items}
              defaultOpen={0}
              onOpenChange={(i) => i != null && setActive(i)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
