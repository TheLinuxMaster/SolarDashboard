import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  note,
  icon,
  accent,
  className,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  icon?: ReactNode;
  accent?: "solar" | "grid" | "battery" | "home" | "none";
  className?: string;
}) {
  const accentClass = {
    solar: "text-solar-bright",
    grid: "text-grid-bright",
    battery: "text-battery-bright",
    home: "text-home-bright",
    none: "text-ink-2",
  }[accent ?? "none"];

  return (
    <div className={cn("glass-flat rounded-panel p-4", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] leading-4 text-muted">{label}</p>
        {icon && (
          <span className={cn("shrink-0", accentClass)} aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-xl font-medium tracking-tight">{value}</p>
      {note && <p className="mt-1 text-[11px] text-muted">{note}</p>}
    </div>
  );
}
