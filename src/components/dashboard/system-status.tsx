import type { ReactNode } from "react";
import { IconActivity } from "@tabler/icons-react";

import { QualityMeter } from "@/components/dashboard/quality-meter";
import { SignalBars } from "@/components/dashboard/signal-bars";
import { GlassCard, PanelHeader } from "@/components/ui/glass-card";
import {
  formatEnergy,
  formatPercent,
  formatPower,
  gridFlow,
} from "@/lib/format";
import type { Snapshot } from "@/lib/types";
import { cn } from "@/lib/utils";

function DataRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: ReactNode;
  detail?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className="text-right text-[11px] font-medium tabular">
        {value}
        {detail && (
          <span className="ml-1 text-[10px] font-normal text-muted">
            {detail}
          </span>
        )}
      </dd>
    </div>
  );
}

const CELL_CLASSES = [
  "p-5",
  "p-5 border-t border-line md:border-t-0 md:border-l",
  "p-5 border-t border-line md:border-l-0 xl:border-l xl:border-t-0",
  "p-5 border-t border-line md:border-l xl:border-t-0",
];

export function SystemStatus({ snapshot }: { snapshot: Snapshot }) {
  const grid = gridFlow(snapshot.grid.powerW);
  const backupQuiet =
    snapshot.backup.powerW < 10 && snapshot.backup.consumptionTotalKWh === 0;
  const commsOnline = snapshot.inverter.commsStatus.toLowerCase() === "online";

  return (
    <GlassCard className="flex h-full flex-col p-0">
      <PanelHeader
        title="System status"
        detail="Electrical quality, firmware and BMS limits"
        icon={<IconActivity size={16} aria-hidden="true" />}
        action={
          <span className="text-[11px] text-muted">
            Inverter{" "}
            <span className="font-medium text-ink-2">
              {snapshot.inverter.firmware || "—"}
            </span>
          </span>
        }
      />

      <div className="grid flex-1 md:grid-cols-2 xl:grid-cols-4">
        <div className={CELL_CLASSES[0]}>
          <h3 className="mb-2 text-xs font-medium">Grid</h3>
          <dl>
            <DataRow
              label="Power"
              value={
                <span className="inline-flex items-baseline gap-1">
                  {formatPower(Math.abs(snapshot.grid.powerW))}
                  <span className="text-[10px] font-normal text-muted">
                    {grid}
                  </span>
                </span>
              }
            />
            <QualityMeter
              label="Voltage L1"
              value={snapshot.grid.voltageV}
              min={200}
              max={260}
              goodMin={216}
              goodMax={253}
              unit="V"
            />
            <QualityMeter
              label="Frequency"
              value={snapshot.grid.frequencyHz}
              min={49}
              max={51}
              goodMin={49.5}
              goodMax={50.5}
              unit="Hz"
              decimals={2}
            />
            <DataRow
              label="Current L1"
              value={`${snapshot.grid.currentA.toFixed(1)} A`}
            />
            <DataRow
              label="Feed-in total"
              value={formatEnergy(snapshot.grid.feedInTotalKWh)}
            />
            <DataRow
              label="Purchased total"
              value={formatEnergy(snapshot.grid.purchasedTotalKWh)}
            />
          </dl>
        </div>

        <div className={CELL_CLASSES[1]}>
          <h3 className="mb-2 text-xs font-medium">Inverter</h3>
          <dl>
            <DataRow
              label="Status"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <i
                    className={cn(
                      "size-1.5 rounded-full",
                      snapshot.inverter.status === "Normal"
                        ? "bg-good"
                        : snapshot.inverter.status === "Warning"
                          ? "bg-warn"
                          : "bg-bad",
                    )}
                    aria-hidden="true"
                  />
                  {snapshot.inverter.status}
                </span>
              }
            />
            <DataRow
              label="Mode"
              value={snapshot.inverter.operatingStatus || "—"}
            />
            <DataRow
              label="Temperature"
              value={`${snapshot.inverter.temperatureC.toFixed(1)} °C`}
            />
            <DataRow label="Firmware" value={snapshot.inverter.firmware || "—"} />
            <DataRow
              label="Communication"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <i
                    className={cn(
                      "size-1.5 rounded-full",
                      commsOnline ? "bg-good" : "bg-muted",
                    )}
                    aria-hidden="true"
                  />
                  {snapshot.inverter.commsStatus || "Not reported"}
                </span>
              }
            />
            <DataRow
              label="WiFi"
              value={<SignalBars strength={snapshot.inverter.signalStrength} />}
            />
          </dl>
        </div>

        <div className={CELL_CLASSES[2]}>
          <h3 className="mb-2 text-xs font-medium">Battery BMS</h3>
          <dl>
            <DataRow
              label="State of health"
              value={
                snapshot.battery.soh > 0
                  ? formatPercent(snapshot.battery.soh)
                  : "—"
              }
            />
            <DataRow
              label="Packs"
              value={
                snapshot.bms.batteryCount > 0 &&
                snapshot.battery.capacityAh > 0
                  ? `${snapshot.bms.batteryCount} × ${snapshot.battery.capacityAh.toFixed(0)} Ah`
                  : "—"
              }
            />
            <DataRow
              label="Charge limit"
              value={
                snapshot.bms.chargeLimitV > 0
                  ? `${snapshot.bms.chargeLimitV.toFixed(1)} V`
                  : "—"
              }
              detail={
                snapshot.bms.chargeLimitA > 0
                  ? `${snapshot.bms.chargeLimitA.toFixed(0)} A`
                  : undefined
              }
            />
            <DataRow
              label="Discharge limit"
              value={
                snapshot.bms.dischargeLimitV > 0
                  ? `${snapshot.bms.dischargeLimitV.toFixed(1)} V`
                  : "—"
              }
              detail={
                snapshot.bms.dischargeLimitA > 0
                  ? `${snapshot.bms.dischargeLimitA.toFixed(0)} A`
                  : undefined
              }
            />
            <DataRow
              label="BMS firmware"
              value={snapshot.bms.firmware || "—"}
            />
            <DataRow
              label="Alarms / protections"
              value={`${snapshot.bms.alarmCount} / ${snapshot.bms.protectCount}`}
            />
          </dl>
        </div>

        <div className={CELL_CLASSES[3]}>
          <h3 className="mb-2 text-xs font-medium">Backup / EPS</h3>
          {backupQuiet ? (
            <p className="py-2 text-[11px] leading-relaxed text-muted">
              EPS output is on standby. No backup load is being drawn right now.
            </p>
          ) : (
            <dl>
              <DataRow
                label="Load"
                value={formatPower(snapshot.backup.powerW)}
              />
              <DataRow
                label="Voltage"
                value={`${snapshot.backup.voltageV.toFixed(1)} V`}
              />
              <DataRow
                label="Current"
                value={`${snapshot.backup.currentA.toFixed(1)} A`}
              />
              <DataRow
                label="Frequency"
                value={`${snapshot.backup.frequencyHz.toFixed(2)} Hz`}
              />
              <DataRow
                label="Consumed today"
                value={formatEnergy(snapshot.backup.consumptionTodayKWh)}
              />
              <DataRow
                label="Lifetime"
                value={formatEnergy(snapshot.backup.consumptionTotalKWh)}
              />
            </dl>
          )}
          <div className="mt-3 grid grid-cols-2 gap-y-1 border-t border-line pt-3 text-[10px] text-muted">
            <span>Self-consumption</span>
            <span className="text-right font-medium text-ink-2">
              {formatPercent(snapshot.inverter.selfConsumptionRate)}
            </span>
            <span>Self-sufficiency</span>
            <span className="text-right font-medium text-ink-2">
              {formatPercent(snapshot.inverter.selfSufficiencyRate)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-line px-5 py-4 sm:grid-cols-4 sm:px-6">
        {[
          ["Lifetime solar", formatEnergy(snapshot.solar.energyTotalKWh)],
          [
            "Lifetime home",
            formatEnergy(
              snapshot.home.consumptionTotalKWh +
                snapshot.backup.consumptionTotalKWh,
            ),
          ],
          ["Lifetime export", formatEnergy(snapshot.grid.feedInTotalKWh)],
          ["Lifetime import", formatEnergy(snapshot.grid.purchasedTotalKWh)],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-[10px] text-muted">{label}</p>
            <p className="mt-0.5 text-xs font-medium">{value}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
