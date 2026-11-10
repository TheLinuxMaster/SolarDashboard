import { IconChartAreaLine } from "@tabler/icons-react";

import { formatPower } from "@/lib/format";
import { POWER_SERIES } from "@/lib/series";
import type { DayCurvePoint } from "@/lib/types";

export function DayLegend({ latest }: { latest?: DayCurvePoint }) {
  return (
    <>
      {POWER_SERIES.map((series) => (
        <span
          key={series.key}
          className="inline-flex items-center gap-1.5 whitespace-nowrap"
        >
          {series.key === "solarW" ? (
            <span
              className="h-2 w-4 rounded-[2px]"
              style={{ background: series.color, opacity: 0.7 }}
              aria-hidden="true"
            />
          ) : (
            <span
              className="h-0.5 w-4 rounded"
              style={{ background: series.color }}
              aria-hidden="true"
            />
          )}
          <span className="text-[11px] text-muted">{series.label}</span>
          <span className="text-[11px] font-medium tabular">
            {latest ? formatPower(latest[series.key]) : "—"}
          </span>
        </span>
      ))}
      {latest && (
        <span className="text-[10px] text-muted">
          latest cloud sample {latest.time.slice(0, 5)}
        </span>
      )}
    </>
  );
}

export function LegendValue({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span
        className="h-2 w-3 rounded-[2px]"
        style={{ background: color, opacity: 0.75 }}
        aria-hidden="true"
      />
      <span className="text-[11px] text-muted">{label}</span>
      <span className="text-[11px] font-medium tabular">{value}</span>
    </span>
  );
}

export function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[300px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line text-center">
      <IconChartAreaLine size={22} className="text-muted" aria-hidden="true" />
      <p className="text-sm font-medium">No cloud samples</p>
      <p className="max-w-sm text-xs leading-relaxed text-muted">{message}</p>
    </div>
  );
}
