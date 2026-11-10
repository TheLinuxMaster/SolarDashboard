import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconBattery2,
  IconBatteryCharging,
  IconHome,
  IconSunHigh,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { GlassCard, PanelHeader } from "@/components/ui/glass-card";
import { formatEnergy } from "@/lib/format";
import type { Snapshot } from "@/lib/types";

type Row = {
  label: string;
  value: number;
  icon: typeof IconSunHigh;
  color: string;
  accent?: boolean;
};

export function EnergyLedger({ snapshot }: { snapshot: Snapshot }) {
  const rows: Row[] = [
    {
      label: "Solar generated",
      value: snapshot.solar.energyTodayKWh,
      icon: IconSunHigh,
      color: "var(--color-solar)",
      accent: true,
    },
    {
      label: "Home consumed",
      value:
        snapshot.home.consumptionTodayKWh +
        snapshot.backup.consumptionTodayKWh,
      icon: IconHome,
      color: "var(--color-home)",
    },
    {
      label: "Exported to grid",
      value: snapshot.grid.feedInTodayKWh,
      icon: IconArrowUpRight,
      color: "var(--color-grid)",
    },
    {
      label: "Imported from grid",
      value: snapshot.grid.purchasedTodayKWh,
      icon: IconArrowDownLeft,
      color: "var(--color-grid)",
    },
    {
      label: "Battery charged",
      value: snapshot.battery.dailyChargedKWh,
      icon: IconBatteryCharging,
      color: "var(--color-battery)",
    },
    {
      label: "Battery discharged",
      value: snapshot.battery.dailyDischargedKWh,
      icon: IconBattery2,
      color: "var(--color-battery)",
    },
  ];

  const max = Math.max(1, ...rows.map((row) => row.value));
  const net = snapshot.grid.feedInTodayKWh - snapshot.grid.purchasedTodayKWh;
  const balanced = Math.abs(net) < 0.05;
  const selfConsumed = Math.max(
    0,
    snapshot.solar.energyTodayKWh - snapshot.grid.feedInTodayKWh,
  );

  return (
    <GlassCard className="flex h-full flex-col p-0">
      <PanelHeader
        title="Energy today"
        detail="Metered at the inverter"
        icon={<IconSunHigh size={16} aria-hidden="true" />}
        action={
          balanced ? (
            <Badge tone="neutral">Balanced</Badge>
          ) : (
            <Badge tone={net > 0 ? "info" : "home"}>
              {net > 0 ? "Net export" : "Net import"} {formatEnergy(Math.abs(net))}
            </Badge>
          )
        }
      />

      <div className="flex flex-1 flex-col justify-between px-5 pb-5 pt-4 sm:px-6">
        <div className="space-y-4">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label}>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-xs">
                    <Icon
                      size={14}
                      style={{ color: row.color }}
                      aria-hidden="true"
                    />
                    <span className="truncate text-muted">{row.label}</span>
                  </span>
                  <span className="text-xs font-medium tabular">
                    {formatEnergy(row.value)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full transition-[width] duration-700"
                    style={{
                      width: `${(row.value / max) * 100}%`,
                      background: row.color,
                      opacity: row.accent ? 1 : 0.72,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[11px] text-muted">
          <span>Today&apos;s counters, not lifetime totals.</span>
          <span>
            Self-consumed{" "}
            <strong className="font-medium text-ink">
              {formatEnergy(selfConsumed)}
            </strong>
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
