import type { ComponentType } from "react";

// Badge (design.md §5): rounded-full pill in a semantic tone. Freshness/rank
// meaning lives in `tone`; everything structural stays neutral.
type Tone = "gain" | "loss" | "live" | "cached" | "reference" | "neutral" | "accent";

const TONES: Record<Tone, string> = {
  gain: "bg-gain/10 text-gain",
  loss: "bg-loss/10 text-loss",
  live: "bg-live/10 text-live",
  cached: "bg-cached/10 text-cached",
  reference: "bg-reference/10 text-reference",
  neutral: "bg-neutral-100 text-neutral-600",
  accent: "bg-accent/20 text-neutral-900",
};

export default function Badge({
  tone = "neutral",
  icon: Icon,
  children,
  className = "",
}: {
  tone?: Tone;
  icon?: ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-500 ${TONES[tone]} ${className}`}
    >
      {Icon && <Icon className="h-3 w-3" aria-hidden />}
      {children}
    </span>
  );
}
