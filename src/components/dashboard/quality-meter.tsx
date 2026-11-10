import { IconAlertTriangle } from "@tabler/icons-react";

import { clamp } from "@/lib/format";

export function QualityMeter({
  label,
  value,
  min,
  max,
  goodMin,
  goodMax,
  unit,
  decimals = 1,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  goodMin: number;
  goodMax: number;
  unit: string;
  decimals?: number;
}) {
  const position = clamp((value - min) / (max - min), 0, 1) * 100;
  const goodStart = clamp((goodMin - min) / (max - min), 0, 1) * 100;
  const goodWidth = clamp((goodMax - goodMin) / (max - min), 0, 1) * 100;
  const inRange = value >= goodMin && value <= goodMax;
  const missing = !Number.isFinite(value) || value === 0;

  return (
    <div className="py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] text-muted">{label}</span>
        <span className="flex items-center gap-1.5 text-[11px] font-medium tabular">
          {missing ? (
            <span className="text-muted">Not reported</span>
          ) : (
            <>
              {!inRange && (
                <IconAlertTriangle
                  size={11}
                  className="text-warn"
                  aria-label="Outside the expected range"
                />
              )}
              {value.toFixed(decimals)}
              <span className="text-[10px] font-normal text-muted">{unit}</span>
            </>
          )}
        </span>
      </div>
      <div className="relative mt-2 h-1.5 rounded-full bg-white/[0.06]">
        <span
          className="absolute inset-y-0 rounded-full bg-good/20"
          style={{ left: `${goodStart}%`, width: `${goodWidth}%` }}
        />
        {!missing && (
          <span
            className={`absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-plane ${
              inRange ? "bg-good" : "bg-warn"
            }`}
            style={{ left: `${position}%` }}
          />
        )}
      </div>
      <div className="mt-1 flex justify-between text-[9px] text-muted/80">
        <span>{min}</span>
        <span>
          {goodMin}–{goodMax} {unit}
        </span>
        <span>{max}</span>
      </div>
    </div>
  );
}
