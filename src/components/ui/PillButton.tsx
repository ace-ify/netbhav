import Link from "next/link";
import type { ComponentType } from "react";

// Primary pill (design.md §5): dark rounded-full CTA. Secondary = outlined.
// Renders <Link> for internal/hash hrefs, <a> for external (tel:/mailto:/http),
// or <button> when there's no href. `icon` slides right on group-hover.
type Variant = "primary" | "secondary" | "onDark";

const BASE =
  "group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-500 transition duration-300";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-neutral-900 text-white hover:bg-neutral-800",
  secondary: "border border-neutral-300 bg-transparent text-neutral-900 hover:bg-neutral-100",
  onDark: "bg-white text-neutral-900 hover:bg-neutral-200",
};

export default function PillButton({
  children,
  href,
  onClick,
  variant = "primary",
  icon: Icon,
  className = "",
  type = "button",
  ...rest
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  icon?: ComponentType<{ className?: string }>;
  className?: string;
  type?: "button" | "submit";
  "aria-label"?: string;
}) {
  const cls = `${BASE} ${VARIANTS[variant]} ${className}`;
  const inner = (
    <>
      {children}
      {Icon && <Icon className="h-4 w-4 transition duration-300 group-hover:translate-x-0.5" />}
    </>
  );

  if (href) {
    const external = /^(https?:|mailto:|tel:)/.test(href);
    if (external) {
      return (
        <a href={href} className={cls} {...rest}>
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} className={cls} {...rest}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls} {...rest}>
      {inner}
    </button>
  );
}
