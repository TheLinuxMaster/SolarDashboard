"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  IconAlertTriangle,
  IconArrowDownLeft,
  IconArrowUpRight,
  IconBattery2,
  IconBatteryCharging,
  IconChartAreaLine,
  IconChevronLeft,
  IconChevronRight,
  IconHome,
  IconLeaf,
  IconRefresh,
  IconSunHigh,
} from "@tabler/icons-react";

import {
  DayLegend,
  EmptyChart,
  LegendValue,
} from "@/components/dashboard/insight-ui";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { InsightsTable } from "@/components/dashboard/insights-table";
import { StatTile } from "@/components/dashboard/stat-tile";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { getInsights, UnauthorizedError } from "@/lib/api-client";
import { formatEnergy } from "@/lib/format";
import type {
  EnergySplit,
  InsightPeriod,
  InsightTotals,
  InsightsResponse,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const DayCurveChart = dynamic(
  () =>
    import("@/components/charts/day-curve-chart").then(
      (module) => module.DayCurveChart,
    ),
  {
    ssr: false,
    loading: () => <div className="skeleton h-[340px] w-full rounded-xl" />,
  },
);

const EnergyBarChart = dynamic(
  () =>
    import("@/components/charts/energy-bar-chart").then(
      (module) => module.EnergyBarChart,
    ),
  {
    ssr: false,
    loading: () => <div className="skeleton h-[340px] w-full rounded-xl" />,
  },
);

const PERIODS: ReadonlyArray<{ value: InsightPeriod; label: string }> = [
  { value: "day", label: "Day" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const SPLIT_TILES: ReadonlyArray<{
  key: keyof EnergySplit;
  label: string;
  icon: typeof IconSunHigh;
  accent: "solar" | "grid" | "home";
}> = [
  { key: "productionKWh", label: "Production", icon: IconSunHigh, accent: "solar" },
  { key: "toGridKWh", label: "To grid", icon: IconArrowUpRight, accent: "grid" },
  {
    key: "selfConsumptionKWh",
    label: "Self-consumption",
    icon: IconHome,
    accent: "home",
  },
  {
    key: "selfProductionKWh",
    label: "Self-production",
    icon: IconSunHigh,
    accent: "solar",
  },
  {
    key: "fromGridKWh",
    label: "From grid",
    icon: IconArrowDownLeft,
    accent: "grid",
  },
  {
    key: "consumptionKWh",
    label: "Consumption",
    icon: IconHome,
    accent: "home",
  },
];

const TOTAL_TILES: ReadonlyArray<{
  key: keyof InsightTotals;
  label: string;
  icon: typeof IconSunHigh;
  accent: "solar" | "grid" | "battery" | "home";
}> = [
  { key: "productionKWh", label: "Production", icon: IconSunHigh, accent: "solar" },
  { key: "consumptionKWh", label: "Consumption", icon: IconHome, accent: "home" },
  { key: "toGridKWh", label: "To grid", icon: IconArrowUpRight, accent: "grid" },
  {
    key: "fromGridKWh",
    label: "From grid",
    icon: IconArrowDownLeft,
    accent: "grid",
  },
  {
    key: "batteryChargeKWh",
    label: "Battery charged",
    icon: IconBatteryCharging,
    accent: "battery",
  },
  {
    key: "batteryDischargeKWh",
    label: "Battery discharged",
    icon: IconBattery2,
    accent: "battery",
  },
  {
    key: "selfConsumedKWh",
    label: "Self-consumed",
    icon: IconLeaf,
    accent: "solar",
  },
];

function dateFor(period: InsightPeriod, anchor: Date): string {
  const year = anchor.getFullYear();
  const month = String(anchor.getMonth() + 1).padStart(2, "0");
  if (period === "day") {
    return `${year}-${month}-${String(anchor.getDate()).padStart(2, "0")}`;
  }
  if (period === "month") return `${year}-${month}`;
  return String(year);
}

function anchorLabel(period: InsightPeriod, anchor: Date): string {
  if (period === "day") {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(anchor);
  }
  if (period === "month") {
    return new Intl.DateTimeFormat("en-GB", {
      month: "long",
      year: "numeric",
    }).format(anchor);
  }
  return String(anchor.getFullYear());
}

function shiftAnchor(
  period: InsightPeriod,
  anchor: Date,
  delta: number,
): Date {
  const next = new Date(anchor);
  if (period === "day") next.setDate(next.getDate() + delta);
  else if (period === "month") next.setMonth(next.getMonth() + delta, 1);
  else next.setFullYear(next.getFullYear() + delta, 0, 1);
  return next;
}

function DayContent({ data }: { data: InsightsResponse }) {
  const split = data.energySplit;
  const latest = data.curve[data.curve.length - 1];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {SPLIT_TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <StatTile
              key={tile.key}
              label={tile.label}
              value={formatEnergy(split?.[tile.key] ?? 0)}
              icon={<Icon size={15} />}
              accent={tile.accent}
            />
          );
        })}
      </div>
      <p className="text-[10px] leading-relaxed text-muted">
        Daily split reported by the inverter. Self-consumption can include
        battery discharge; the backup/EPS load may be counted separately.
      </p>

      <InsightsPanel
        title="Power curve"
        detail={`5-minute cloud samples for ${data.label}`}
        icon={<IconChartAreaLine size={16} aria-hidden="true" />}
        legend={<DayLegend latest={latest} />}
        chart={
          data.curve.length >= 2 ? (
            <DayCurveChart points={data.curve} />
          ) : (
            <EmptyChart message="The inverter has not returned enough 5-minute samples for this day yet." />
          )
        }
        table={<InsightsTable mode="day" curve={data.curve} />}
        footer={
          <>
            <span>Times are shown as reported by the inverter.</span>
            <span>{data.curve.length} samples</span>
          </>
        }
      />
    </>
  );
}

function EnergyContent({ data }: { data: InsightsResponse }) {
  const totals = data.totals;
  const legend = (
    <>
      <LegendValue
        color="var(--color-solar)"
        label="Production"
        value={formatEnergy(totals?.productionKWh ?? 0)}
      />
      <LegendValue
        color="var(--color-home)"
        label="Consumption"
        value={formatEnergy(totals?.consumptionKWh ?? 0)}
      />
      <span className="text-[10px] text-muted">sum for the period</span>
    </>
  );

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {TOTAL_TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <StatTile
              key={tile.key}
              label={tile.label}
              value={formatEnergy(totals?.[tile.key] ?? 0)}
              icon={<Icon size={15} />}
              accent={tile.accent}
            />
          );
        })}
      </div>

      <InsightsPanel
        title="Production vs consumption"
        detail={
          data.period === "month"
            ? `Daily energy for ${data.label}`
            : `Monthly energy for ${data.label}`
        }
        icon={<IconChartAreaLine size={16} aria-hidden="true" />}
        legend={legend}
        chart={
          data.points.length > 0 ? (
            <EnergyBarChart
              points={data.points}
              period={data.period}
              periodLabel={data.label}
            />
          ) : (
            <EmptyChart message="The cloud has no energy rows for this period." />
          )
        }
        table={
          <InsightsTable
            mode="energy"
            points={data.points}
            period={data.period}
          />
        }
        footer={
          <>
            <span>Plant energy from the cloud area curve. Values in kWh.</span>
            <span>
              {data.points.length}{" "}
              {data.period === "month" ? "days" : "months"}
            </span>
          </>
        }
      />
    </>
  );
}

function InsightsSkeleton() {
  return (
    <div
      className="space-y-4"
      aria-busy="true"
      aria-label="Loading cloud insights"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-52" />
          <Skeleton className="mt-2 h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-72 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <GlassCard key={index} tone="flat" className="rounded-panel p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-5 w-24" />
          </GlassCard>
        ))}
      </div>
      <GlassCard className="h-[470px] p-5">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="mt-6 h-[390px] w-full rounded-panel" />
      </GlassCard>
    </div>
  );
}

export function InsightsView() {
  const [period, setPeriod] = useState<InsightPeriod>("day");
  const [anchor, setAnchor] = useState<Date | null>(null);
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAnchor(new Date());
  }, []);

  useEffect(() => {
    if (!anchor) return;
    let cancelled = false;
    const controller = new AbortController();

    setRefreshing(true);
    setError(null);

    getInsights(period, dateFor(period, anchor), controller.signal)
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .catch((reason: unknown) => {
        if (cancelled || reason instanceof UnauthorizedError) return;
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not load cloud insights.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [period, anchor]);

  if (!anchor) return <InsightsSkeleton />;

  const currentKey = dateFor(period, anchor);
  const todayKey = dateFor(period, new Date());
  const atCurrent = currentKey >= todayKey;
  const label = anchorLabel(period, anchor);

  const changePeriod = (next: InsightPeriod) => {
    if (next === period) return;
    setPeriod(next);
    setAnchor(new Date());
    setData(null);
    setError(null);
    setLoading(true);
  };

  const shift = (delta: number) => {
    setAnchor(shiftAnchor(period, anchor, delta));
  };

  const reload = () => {
    setError(null);
    setLoading(data === null);
    setAnchor(new Date(anchor));
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-light tracking-tight sm:text-3xl">
          Cloud insights
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Energy history reported by CloudInverter, independent of whether this
          browser was open.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={period}
          onChange={changePeriod}
          label="Insight period"
          items={PERIODS}
        />
        <div className="glass-flat flex items-center gap-1 rounded-full p-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => shift(-1)}
            aria-label={`Previous ${period}`}
            title={`Previous ${period}`}
          >
            <IconChevronLeft size={15} aria-hidden="true" />
          </Button>
          <span className="min-w-[132px] text-center text-xs font-medium">
            {label}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => shift(1)}
            disabled={atCurrent}
            aria-label={`Next ${period}`}
            title={`Next ${period}`}
          >
            <IconChevronRight size={15} aria-hidden="true" />
          </Button>
          {!atCurrent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAnchor(new Date())}
            >
              Current
            </Button>
          )}
        </div>
      </div>

      {error && data && (
        <div
          role="status"
          className="glass-flat flex flex-wrap items-center gap-3 rounded-panel px-4 py-3 text-xs text-ink-2"
        >
          <IconAlertTriangle
            size={15}
            className="shrink-0 text-warn"
            aria-hidden="true"
          />
          <p className="min-w-0 flex-1">
            Showing the last successful result for {data.label}. {error}
          </p>
          <Button variant="glass" size="sm" onClick={reload}>
            <IconRefresh size={14} aria-hidden="true" />
            Retry
          </Button>
        </div>
      )}

      {loading && !data ? (
        <InsightsSkeleton />
      ) : error && !data ? (
        <GlassCard className="p-6">
          <div className="flex items-start gap-3">
            <IconAlertTriangle
              size={19}
              className="mt-0.5 shrink-0 text-warn"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-base font-medium">
                Cloud insights are unavailable
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-2">
                {error}
              </p>
              <Button variant="glass" size="sm" className="mt-4" onClick={reload}>
                <IconRefresh size={14} aria-hidden="true" />
                Try again
              </Button>
            </div>
          </div>
        </GlassCard>
      ) : data ? (
        <div className={cn("space-y-4", refreshing && "opacity-60")}>
          {data.period === "day" ? (
            <DayContent data={data} />
          ) : (
            <EnergyContent data={data} />
          )}
        </div>
      ) : null}

      <p className="max-w-3xl text-[10px] leading-relaxed text-muted">
        All history here is fetched live from CloudInverter&apos;s day curve and
        group area curve endpoints. No history is stored in this browser.
      </p>
    </div>
  );
}
