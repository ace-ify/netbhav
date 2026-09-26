// Stat (design.md §5): Oswald number over a small uppercase neutral label.
export default function Stat({
  value,
  label,
  className = "",
}: {
  value: React.ReactNode;
  label: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="font-oswald text-4xl font-600 leading-tight tracking-tight text-neutral-900 md:text-5xl">
        {value}
      </div>
      <div className="mt-1 text-xs font-500 uppercase tracking-wide text-neutral-500">{label}</div>
    </div>
  );
}
