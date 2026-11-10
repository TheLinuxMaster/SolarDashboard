"use client";

import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconHome,
  IconSunHigh,
  IconThermometer,
} from "@tabler/icons-react";

import { EnergyFlow } from "@/components/dashboard/energy-flow";
import { InverterStatusBadge } from "@/components/dashboard/status-badge";
import { GlassCard } from "@/components/ui/glass-card";
import { Meter } from "@/components/ui/meter";
import { clamp, formatEnergy, formatPercent, splitPower } from "@/lib/format";
import type { Snapshot } from "@/lib/types";

const DAILY = [
  {
    key: "production",
    label: "Produced today",
    icon: IconSunHigh,
    tone: "text-solar-bright",
  },
  {
    key: "consumption",
    label: "Consumed today",
    icon: IconHome,
    tone: "text-home-bright",
  },
  {
    key: "purchase",
    label: "Imported",
    icon: IconArrowDownLeft,
    tone: "text-grid-bright",
  },
  {
    key: "feedin",
    label: "Exported",
    icon: IconArrowUpRight,
    tone: "text-grid-bright",
  },
] as const;

export function LiveHero({ snapshot }: { snapshot: Snapshot }) {
  const { value, unit } = splitPower(snapshot.solar.powerW);
  const producing = snapshot.pv.filter((string) => string.powerW > 0).length;
  const active = snapshot.solar.powerW > 25;

  const daily = {
    production: snapshot.solar.energyTodayKWh,
    consumption:
      snapshot.home.consumptionTodayKWh +
      snapshot.backup.consumptionTodayKWh,
    purchase: snapshot.grid.purchasedTodayKWh,
    feedin: snapshot.grid.feedInTodayKWh,
  };

  return (
    <GlassCard className="relative overflow-hidden p-0">
      <div
        className="pointer-events-none absolute -left-28 -top-40 size-[520px] rounded-full bg-[radial-gradient(circle,rgba(255,198,109,0.16),transparent_64%)] blur-2xl"
        aria-hidden="true"
      />
      <div className="relative px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <InverterStatusBadge status={snapshot.inverter.status} />
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
            <IconThermometer size={13} aria-hidden="true" />
            {snapshot.inverter.temperatureC.toFixed(1)} °C inverter
          </span>
        </div>

        <div className="mt-4 grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-6">
          <div className="min-w-0">
            <p className="text-xs text-muted">Live solar output</p>
            <div className="mt-1 flex items-end gap-2">
              <span className="hero-figure text-[clamp(3.6rem,8vw,6.4rem)]">
                {value}
              </span>
              <span className="mb-3 text-xl font-light text-ink-2">{unit}</span>
            </div>
            <p className="mt-2 text-sm text-ink-2">
              {active
                ? `${producing} of ${snapshot.pv.length} arrays producing`
                : "Standing by — no array output right now"}
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="flex items-baseline justify-between gap-2 text-[11px]">
                  <span className="text-muted">Self-sufficiency</span>
                  <span className="font-medium tabular">
                    {formatPercent(snapshot.inverter.selfSufficiencyRate)}
                  </span>
                </div>
                <Meter
                  className="mt-2"
                  value={clamp(snapshot.inverter.selfSufficiencyRate, 0, 100)}
                  label="Daily self-sufficiency"
                  tone="solar"
                />
              </div>
              <div>
                <div className="flex items-baseline justify-between gap-2 text-[11px]">
                  <span className="text-muted">Solar used on site</span>
                  <span className="font-medium tabular">
                    {formatPercent(snapshot.inverter.selfConsumptionRate)}
                  </span>
                </div>
                <Meter
                  className="mt-2"
                  value={clamp(snapshot.inverter.selfConsumptionRate, 0, 100)}
                  label="Daily self-consumption"
                  tone="home"
                />
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <EnergyFlow snapshot={snapshot} />
          </div>
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line px-5 py-5 sm:grid-cols-4 sm:px-6">
        {DAILY.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] text-muted">
                <Icon
                  size={13}
                  className={item.tone}
                  stroke={1.8}
                  aria-hidden="true"
                />
                {item.label}
              </div>
              <p className="mt-1 text-lg font-medium tracking-tight">
                {formatEnergy(daily[item.key])}
              </p>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
