"use client";

import Link from "next/link";
import { IconAlertTriangle, IconChartLine } from "@tabler/icons-react";

import { useDashboard } from "@/components/dashboard-provider";
import { BatteryCard } from "@/components/dashboard/battery-card";
import { EnergyLedger } from "@/components/dashboard/energy-ledger";
import { LiveHero } from "@/components/dashboard/live-hero";
import { OverviewCloudDay } from "@/components/dashboard/overview-cloud-day";
import { OverviewSkeleton } from "@/components/dashboard/overview-skeleton";
import { PvStrings } from "@/components/dashboard/pv-strings";
import { RefreshButton } from "@/components/dashboard/refresh-button";
import { SystemStatus } from "@/components/dashboard/system-status";
import { Ago, Clock } from "@/components/time";
import { GlassCard } from "@/components/ui/glass-card";
import type { DashboardState } from "@/lib/types";

function PlantHeading({ state }: { state: DashboardState }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1
          className="truncate text-2xl font-light tracking-tight sm:text-3xl"
          title={state.plant.name}
        >
          {state.plant.name}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {state.plant.model}
          {state.plant.isHybrid ? " hybrid inverter" : " inverter"}
        </p>
      </div>
      <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
        <p className="text-right text-[11px] leading-4 text-muted">
          Updated <Ago iso={state.lastUpdated} />
        </p>
        <RefreshButton />
      </div>
    </header>
  );
}

function Unavailable({
  state,
  message,
}: {
  state: DashboardState;
  message: string;
}) {
  return (
    <div className="space-y-6">
      <PlantHeading state={state} />

      <GlassCard className="p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <IconAlertTriangle
            size={20}
            className="mt-0.5 shrink-0 text-warn"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h2 className="text-lg font-medium tracking-tight">
              No reading from the inverter
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">
              {message}
            </p>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              {state.lastUpdated ? (
                <>
                  Last successful reading at <Clock iso={state.lastUpdated} /> (
                  <Ago iso={state.lastUpdated} />).
                </>
              ) : (
                "No successful reading has been recorded for this account yet."
              )}{" "}
              Your session is still signed in.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <RefreshButton />
              <Link
                href="/history"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-2 transition-colors hover:text-ink"
              >
                <IconChartLine size={14} aria-hidden="true" />
                Open stored history
              </Link>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

export function OverviewView() {
  const { state, pollError } = useDashboard();
  const snapshot = state.snapshot;

  if (!snapshot) {
    if (state.connection === "connecting" && !state.error && !pollError) {
      return <OverviewSkeleton />;
    }

    return (
      <Unavailable
        state={state}
        message={
          state.error ??
          pollError ??
          "The inverter is not reporting yet. This usually clears after the next poll."
        }
      />
    );
  }

  const stale = state.connection === "stale";

  return (
    <div className="space-y-4">
      <PlantHeading state={state} />

      {stale && (
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
            <strong className="font-medium text-ink">
              The last refresh did not reach the inverter.
            </strong>{" "}
            Showing the reading from <Clock iso={state.lastUpdated} />.{" "}
            {state.error}
          </p>
          <RefreshButton />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          <LiveHero snapshot={snapshot} />
        </div>
        <div className="min-w-0 lg:col-span-4">
          <BatteryCard snapshot={snapshot} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          <OverviewCloudDay />
        </div>
        <div className="min-w-0 lg:col-span-5">
          <EnergyLedger snapshot={snapshot} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-4">
          <PvStrings snapshot={snapshot} />
        </div>
        <div className="min-w-0 lg:col-span-8">
          <SystemStatus snapshot={snapshot} />
        </div>
      </div>
    </div>
  );
}
