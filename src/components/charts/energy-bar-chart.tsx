"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatEnergy } from "@/lib/format";
import type { EnergyPoint, InsightPeriod } from "@/lib/types";

type TooltipEntry = {
  dataKey?: string | number;
  value?: number | string | Array<number | string>;
  payload?: unknown;
};

function formatAxisEnergy(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(Math.round(value));
}

const SERIES = [
  { key: "productionKWh", label: "Production", color: "var(--color-solar)" },
  { key: "consumptionKWh", label: "Consumption", color: "var(--color-home)" },
] as const;

function EnergyTooltip({
  active,
  payload,
  label,
  period,
  periodLabel,
}: {
  active?: boolean;
  payload?: ReadonlyArray<TooltipEntry>;
  label?: string | number;
  period: InsightPeriod;
  periodLabel: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload as EnergyPoint | undefined;
  if (!point) return null;

  const rows = [
    ["Production", point.productionKWh, "var(--color-solar)"],
    ["Consumption", point.consumptionKWh, "var(--color-home)"],
    ["To grid", point.toGridKWh, "var(--color-grid)"],
    ["From grid", point.fromGridKWh, "var(--color-grid)"],
    ["Battery charged", point.batteryChargeKWh, "var(--color-battery)"],
    ["Battery discharged", point.batteryDischargeKWh, "var(--color-battery)"],
    ["Self-consumed", point.selfConsumedKWh, "var(--color-battery)"],
  ] as const;

  return (
    <div className="min-w-[210px] rounded-xl border border-line bg-[#0a111c]/95 px-3 py-2.5 text-xs shadow-2xl backdrop-blur-md">
      <div className="mb-2 text-[10px] text-muted">
        {period === "month" ? `Day ${label}` : label} · {periodLabel}
      </div>
      <div className="grid gap-1.5">
        {rows.map(([name, value, color]) => (
          <div
            key={name}
            className="grid grid-cols-[12px_1fr_auto] items-center gap-2"
          >
            <span className="h-0.5 w-3 rounded" style={{ background: color }} />
            <span className="text-muted">{name}</span>
            <span className="text-right font-medium tabular text-ink">
              {formatEnergy(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EnergyBarChart({
  points,
  period,
  periodLabel,
  height = 340,
}: {
  points: EnergyPoint[];
  period: InsightPeriod;
  periodLabel: string;
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={points}
          margin={{ top: 16, right: 10, bottom: 0, left: 0 }}
          barGap={2}
          barCategoryGap="24%"
          accessibilityLayer
        >
          <CartesianGrid
            vertical={false}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={1}
          />
          <XAxis
            dataKey="label"
            tick={{
              fill: "var(--color-muted)",
              fontSize: 10,
              fontFamily: "var(--font-sora)",
            }}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            interval={points.length > 20 ? 3 : 0}
          />
          <YAxis
            tickFormatter={formatAxisEnergy}
            tick={{
              fill: "var(--color-muted)",
              fontSize: 10,
              fontFamily: "var(--font-sora)",
            }}
            axisLine={false}
            tickLine={false}
            width={46}
            tickMargin={8}
            domain={[0, "auto"]}
          />
          <Tooltip
            content={
              <EnergyTooltip period={period} periodLabel={periodLabel} />
            }
            cursor={{ fill: "rgba(255,255,255,0.035)" }}
            wrapperStyle={{ outline: "none" }}
          />
          {SERIES.map((series) => (
            <Bar
              key={series.key}
              dataKey={series.key}
              name={series.label}
              fill={series.color}
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
