import { cn } from "@/lib/utils";
import { clamp } from "@/lib/format";

export function Meter({
  value,
  label,
  tone = "solar",
  className,
}: {
  value: number;
  label: string;
  tone?: "solar" | "good" | "warn" | "bad" | "grid" | "battery" | "home";
  className?: string;
}) {
  const safe = clamp(Number.isFinite(value) ? value : 0, 0, 100);
  const fill = {
    solar: "bg-gradient-to-r from-solar to-solar-bright",
    good: "bg-good",
    warn: "bg-warn",
    bad: "bg-bad",
    grid: "bg-grid-bright",
    battery: "bg-battery-bright",
    home: "bg-home-bright",
  }[tone];

  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]",
        className,
      )}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safe)}
    >
      <span
        className={cn(
          "block h-full rounded-full transition-[width] duration-700",
          fill,
        )}
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}
