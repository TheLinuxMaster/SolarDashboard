"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  IconAlertTriangle,
  IconChartAreaLine,
  IconRefresh,
} from "@tabler/icons-react";

import {
  DayLegend,
  EmptyChart,
} from "@/components/dashboard/insight-ui";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { InsightsTable } from "@/components/dashboard/insights-table";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getInsights, UnauthorizedError } from "@/lib/api-client";
import type { InsightsResponse } from "@/lib/types";

const DayCurveChart = dynamic(
  () =>
    import("@/components/charts/day-curve-chart").then(
      (module) => module.DayCurveChart,
    ),
  {
    ssr: false,
    loading: () => <div className="skeleton h-[270px] w-full rounded-xl" />,
  },
);

function localToday(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

export function OverviewCloudDay() {
  const [date, setDate] = useState<string | null>(null);
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setDate(localToday());
  }, []);

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    const controller = new AbortController();

    setLoading(true);

    getInsights("day", date, controller.signal)
      .then((next) => {
        if (cancelled) return;
        setData(next);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (cancelled || reason instanceof UnauthorizedError) return;
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not load today's cloud history.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [date, reloadKey]);

  if (loading && !data) {
    return (
      <GlassCard className="h-full p-5 sm:p-6">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-2 h-3 w-56" />
        <div className="mt-6 flex flex-wrap gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-3 w-24" />
          ))}
        </div>
        <Skeleton className="mt-4 h-[250px] w-full rounded-xl" />
      </GlassCard>
    );
  }

  if (error && !data) {
    return (
      <GlassCard className="flex h-full flex-col justify-center p-6">
        <div className="flex items-start gap-3">
          <IconAlertTriangle
            size={18}
            className="mt-0.5 shrink-0 text-warn"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-base font-medium">
              Today&apos;s cloud history is unavailable
            </h2>
            <p className="mt-1.5 max-w-md text-xs leading-relaxed text-ink-2">
              {error}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                variant="glass"
                size="sm"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  setReloadKey((key) => key + 1);
                }}
              >
                <IconRefresh size={14} aria-hidden="true" />
                Try again
              </Button>
              <Link
                href="/insights"
                className="text-xs font-medium text-ink-2 underline-offset-4 hover:text-ink hover:underline"
              >
                Open insights
              </Link>
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (!data) return null;

  const latest = data.curve[data.curve.length - 1];

  return (
    <InsightsPanel
      title="Today's power"
      detail={`5-minute cloud samples for ${data.label}`}
      icon={<IconChartAreaLine size={16} aria-hidden="true" />}
      legend={<DayLegend latest={latest} />}
      chart={
        data.curve.length >= 2 ? (
          <DayCurveChart points={data.curve} height={270} />
        ) : (
          <EmptyChart message="The cloud has not returned enough 5-minute samples for today yet." />
        )
      }
      table={<InsightsTable mode="day" curve={data.curve} />}
      footer={
        <>
          <span>Live from the CloudInverter API.</span>
          <Link
            href="/insights"
            className="font-medium text-ink-2 underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            Open insights
          </Link>
        </>
      }
    />
  );
}
