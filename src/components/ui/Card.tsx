import type { ComponentType } from "react";

// Card (design.md §5): `grid` = white cell inside the gap-px fine-border grid
// (hover reveals via bg shift); `standalone` = rounded, bordered. Title in
// Oswald, body Inter, one lucide icon top-left in neutral-900.
export default function Card({
  icon: Icon,
  title,
  children,
  variant = "standalone",
  className = "",
}: {
  icon?: ComponentType<{ className?: string }>;
  title?: React.ReactNode;
  children?: React.ReactNode;
  variant?: "grid" | "standalone";
  className?: string;
}) {
  const shell =
    variant === "grid"
      ? "bg-white p-8 transition duration-300 hover:bg-neutral-50"
      : "rounded-lg border border-neutral-200 bg-white p-8";
  return (
    <div className={`${shell} ${className}`}>
      {Icon && <Icon className="mb-5 h-6 w-6 text-neutral-900" aria-hidden />}
      {title && (
        <h3 className="font-oswald text-xl font-500 tracking-tight text-neutral-900">{title}</h3>
      )}
      {children && <div className="mt-3 text-neutral-600 leading-relaxed">{children}</div>}
    </div>
  );
}
