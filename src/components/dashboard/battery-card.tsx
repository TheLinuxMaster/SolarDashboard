"use client";

import type { CSSProperties } from "react";
import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconBatteryCharging,
  IconBolt,
  IconCircleMinus,
  IconTemperature,
} from "@tabler/icons-react";

import { PanelHeader } from "@/components/ui/glass-card";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import {
  batteryFlow,
  clamp,
  formatEnergy,
  formatPercent,
  formatPower,
} from "@/lib/format";
import type { Snapshot } from "@/lib/types";

const CENTER = 80;
const RADIUS = 62;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SWEEP = 0.75;

function BatteryRing({ soc }: { soc: number }) {
  const value = clamp(soc, 0, 100);
  const color =
    value < 20
      ? "var(--color-bad)"
      : value < 40
        ? "var(--color-warn)"
        : "var(--color-battery-bright)";
  const arc = CIRCUMFERENCE * SWEEP;
  const progress = arc * (value / 100);
  const angle = 135 + (value / 100) * 270;
  const radians = (angle * Math.PI) / 180;
  const dotX = CENTER + Math.cos(radians) * RADIUS;
  const dotY = CENTER + Math.sin(radians) * RADIUS;

  return (
    <div
      className="relative size-40 shrink-0"
      role="meter"
      aria-label="Battery state of charge"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      style={{ "--ring-color": color } as CSSProperties}
    >
      <div
        className="absolute inset-6 rounded-full bg-[var(--ring-color)] opacity-20 blur-2xl"
        aria-hidden="true"
      />
      <svg viewBox="0 0 160 160" className="relative size-full" aria-hidden="true">
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.11)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${arc} ${CIRCUMFERENCE}`}
          transform={`rotate(135 ${CENTER} ${CENTER})`}
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="var(--ring-color)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${CIRCUMFERENCE}`}
          transform={`rotate(135 ${CENTER} ${CENTER})`}
          className="transition-[stroke-dasharray] duration-700"
        />
        <circle
          cx={dotX}
          cy={dotY}
          r="4"
          fill="var(--ring-color)"
          stroke="#0a1019"
          strokeWidth="2.5"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-baseline">
          <span className="text-[2.6rem] font-light leading-none tracking-tight">
            {Math.round(value)}
          </span>
          <span className="ml-0.5 text-sm text-muted">%</span>
        </div>
        <span className="mt-1.5 text-[10px] text-muted">state of charge</span>
      </div>
    </div>
  );
}

export function BatteryCard({ snapshot }: { snapshot: Snapshot }) {
  const battery = snapshot.battery;
  const mode = batteryFlow(battery.charging, battery.powerW);
  const low = battery.soc > 0 && battery.soc < 20;

  const modeBadge =
    mode === "charge" ? (
      <Badge tone="good">
        <IconBatteryCharging size={12} aria-hidden="true" />
        Charging
      </Badge>
    ) : mode === "discharge" ? (
      <Badge tone="home">
        <IconArrowUpRight size={12} aria-hidden="true" />
        Discharging
      </Badge>
    ) : (
      <Badge tone="neutral">
        <IconCircleMinus size={12} aria-hidden="true" />
        Idle
      </Badge>
    );

  const metrics = [
    ["Voltage", battery.voltageV > 1 ? `${battery.voltageV.toFixed(1)} V` : "—"],
    ["Current", `${battery.currentA.toFixed(1)} A`],
    ["Temperature", `${battery.temperatureC.toFixed(1)} °C`],
    ["State of health", battery.soh > 0 ? formatPercent(battery.soh) : "—"],
    [
      "Capacity",
      battery.capacityAh > 0 ? `${battery.capacityAh.toFixed(0)} Ah` : "—",
    ],
    ["Packs", snapshot.bms.batteryCount > 0 ? `${snapshot.bms.batteryCount}` : "—"],
  ];

  return (
    <GlassCard className="flex h-full flex-col p-0">
      <PanelHeader
        title="Battery"
        detail={`${battery.brand || "Storage"} battery`}
        action={modeBadge}
        icon={<IconBatteryCharging size={16} aria-hidden="true" />}
      />

      <div className="flex flex-1 flex-col justify-between px-5 pb-5 pt-4 sm:px-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <BatteryRing soc={battery.soc} />

          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-muted">
              {mode === "charge"
                ? "Charging at"
                : mode === "discharge"
                  ? "Discharging at"
                  : "Battery power"}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <strong className="text-2xl font-medium tracking-tight">
                {formatPower(battery.powerW)}
              </strong>
              {mode !== "idle" && (
                <span
                  className={`grid size-7 place-items-center rounded-full ${
                    battery.charging
                      ? "bg-battery/10 text-battery-bright"
                      : "bg-home/10 text-home-bright"
                  }`}
                >
                  {battery.charging ? (
                    <IconArrowDownLeft size={15} aria-hidden="true" />
                  ) : (
                    <IconArrowUpRight size={15} aria-hidden="true" />
                  )}
                </span>
              )}
            </div>

            {low && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-medium text-warn">
                <IconBolt size={11} aria-hidden="true" />
                Battery charge is low
              </p>
            )}

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4">
              {metrics.map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-[10px] text-muted">{label}</dt>
                  <dd className="mt-0.5 truncate text-xs font-medium">{value}</dd>
                </div>
              ))}
            </dl>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4">
              <div className="min-w-0">
                <dt className="text-[10px] text-muted">Charge limit</dt>
                <dd className="mt-0.5 truncate text-xs font-medium">
                  {snapshot.bms.chargeLimitV > 0 ? (
                    <>
                      {snapshot.bms.chargeLimitV.toFixed(1)} V
                      {snapshot.bms.chargeLimitA > 0
                        ? ` · ${snapshot.bms.chargeLimitA.toFixed(0)} A`
                        : ""}
                    </>
                  ) : (
                    <span className="font-normal text-muted">Not reported</span>
                  )}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] text-muted">Discharge limit</dt>
                <dd className="mt-0.5 truncate text-xs font-medium">
                  {snapshot.bms.dischargeLimitV > 0 ? (
                    <>
                      {snapshot.bms.dischargeLimitV.toFixed(1)} V
                      {snapshot.bms.dischargeLimitA > 0
                        ? ` · ${snapshot.bms.dischargeLimitA.toFixed(0)} A`
                        : ""}
                    </>
                  ) : (
                    <span className="font-normal text-muted">Not reported</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-battery/10 text-battery-bright">
              <IconBatteryCharging size={15} aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] text-muted">Charged today</p>
              <p className="text-xs font-medium">
                {formatEnergy(battery.dailyChargedKWh)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-home/10 text-home-bright">
              <IconArrowUpRight size={15} aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] text-muted">Discharged today</p>
              <p className="text-xs font-medium">
                {formatEnergy(battery.dailyDischargedKWh)}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-[10px] text-muted">
          <IconTemperature size={11} aria-hidden="true" />
          BMS status{" "}
          <span className="font-medium text-ink-2">
            {battery.healthStatus || "not reported"}
          </span>
        </p>
      </div>
    </GlassCard>
  );
}
