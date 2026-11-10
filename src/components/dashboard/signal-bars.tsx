import { wifiLevel } from "@/lib/format";

export function SignalBars({ strength }: { strength: number }) {
  if (!Number.isFinite(strength) || strength === 0) {
    return <span className="text-[11px] text-muted">Not reported</span>;
  }

  const level = wifiLevel(strength);

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-end gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4].map((bar) => (
          <i
            key={bar}
            className={`w-0.5 rounded-sm ${
              bar <= level ? "bg-good" : "bg-white/15"
            }`}
            style={{ height: `${3 + bar * 2}px` }}
          />
        ))}
      </span>
      <span className="text-[11px] text-muted">{strength.toFixed(0)} dBm</span>
    </span>
  );
}
