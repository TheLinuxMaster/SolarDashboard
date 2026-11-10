"use client";

import { useId, useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatAxisPower, formatPower } from "@/lib/format";
import { POWER_SERIES } from "@/lib/series";
import type { DayCurvePoint } from "@/lib/types";

type TooltipEntry = {
  dataKey?: string | number;
  value?: number | string | Array<number | string>;
};

function buildYAxis(values: number[]) {
  let min = 0;
  let max = 0;
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
  }

  if (min === max) {
    return { domain: [0, 1_000] as [number, number], ticks: [0, 500, 1_000] };
  }

  const rough = (max - min) / 5;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  const nice =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = Math.max(1, nice * magnitude);
  const domainMin = Math.floor(min / step) * step;
  const domainMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = domainMin; value <= domainMax + step / 2; value += step) {
    ticks.push(Math.round(value));
  }

  return {
    domain: [domainMin, domainMax] as [number, number],
    ticks,
  };
}

function modeFor(key: string, value: number): string {
  if (Math.abs(value) <= 25) return "idle";
  if (key === "gridW") return value > 0 ? "import" : "export";
  if (key === "batteryW") return value > 0 ? "discharge" : "charge";
  return "";
}

function DayTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<TooltipEntry>;
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const rows = [...payload]
    .filter(
      (entry): entry is TooltipEntry & { dataKey: string; value: number } =>
        typeof entry.dataKey === "string" &&
        POWER_SERIES.some((series) => series.key === entry.dataKey) &&
        typeof entry.value === "number",
    )
    .sort(
      (a, b) =>
        POWER_SERIES.findIndex((series) => series.key === a.dataKey) -
        POWER_SERIES.findIndex((series) => series.key === b.dataKey),
    );

  return (
    <div className="min-w-[190px] rounded-xl border border-line bg-[#0a111c]/95 px-3 py-2.5 text-xs shadow-2xl backdrop-blur-md">
      <div className="mb-2 text-[10px] text-muted">
        {String(label ?? "").slice(0, 5)} · cloud sample
      </div>
      <div className="grid gap-1.5">
        {rows.map((row) => {
          const series = POWER_SERIES.find(
            (item) => item.key === row.dataKey,
          )!;
          const value = Number(row.value);
          const mode = modeFor(series.key, value);

          return (
            <div
              key={series.key}
              className="grid grid-cols-[12px_1fr_auto] items-center gap-2"
            >
              <span
                className="h-0.5 w-3 rounded"
                style={{ background: series.color }}
              />
              <span className="text-muted">{series.label}</span>
              <span className="text-right font-medium tabular text-ink">
                {formatPower(Math.abs(value))}
                {mode && (
                  <em className="ml-1 text-[10px] font-normal not-italic text-muted">
                    {mode}
                  </em>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DayCurveChart({
  points,
  height = 340,
}: {
  points: DayCurvePoint[];
  height?: number;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const gradientId = `${uid}-solar-wash`;
  const yAxis = useMemo(
    () =>
      buildYAxis(
        points.flatMap((point) => [
          point.solarW,
          point.homeW,
          point.gridW,
          point.batteryW,
        ]),
      ),
    [points],
  );

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={points}
          margin={{ top: 16, right: 10, bottom: 0, left: 0 }}
          accessibilityLayer
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-solar)"
                stopOpacity="0.14"
              />
              <stop
                offset="100%"
                stopColor="var(--color-solar)"
                stopOpacity="0.01"
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={1}
          />
          <XAxis
            dataKey="time"
            tickFormatter={(value: string) => String(value).slice(0, 5)}
            tick={{
              fill: "var(--color-muted)",
              fontSize: 10,
              fontFamily: "var(--font-sora)",
            }}
            axisLine={false}
            tickLine={false}
            minTickGap={64}
            tickMargin={10}
          />
          <YAxis
            tickFormatter={formatAxisPower}
            tick={{
              fill: "var(--color-muted)",
              fontSize: 10,
              fontFamily: "var(--font-sora)",
            }}
            axisLine={false}
            tickLine={false}
            width={46}
            tickMargin={8}
            domain={yAxis.domain}
            ticks={yAxis.ticks}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.16)" strokeWidth={1} />
          <Tooltip
            content={<DayTooltip />}
            cursor={{ stroke: "rgba(255,255,255,0.26)", strokeWidth: 1 }}
            wrapperStyle={{ outline: "none" }}
          />
          <Area
            type="monotone"
            dataKey="solarW"
            name="Solar"
            stroke="var(--color-solar)"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{
              r: 4,
              fill: "var(--color-solar)",
              stroke: "#0a1019",
              strokeWidth: 2,
            }}
            isAnimationActive={false}
          />
          {POWER_SERIES.filter((series) => series.key !== "solarW").map(
            (series) => (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.label}
                stroke={series.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: series.color,
                  stroke: "#0a1019",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            ),
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
