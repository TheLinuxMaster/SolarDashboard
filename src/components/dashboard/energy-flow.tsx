"use client";

import { useId } from "react";
import {
  IconBatteryCharging,
  IconBolt,
  IconHome,
  IconSunHigh,
} from "@tabler/icons-react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { formatPercent, formatPower, gridFlow } from "@/lib/format";
import { ACTIVE_POWER_W, type Snapshot } from "@/lib/types";
import { cn } from "@/lib/utils";

const C = {
  solar: "#ffc66d",
  grid: "#7dd1ff",
  battery: "#6ae8bb",
  home: "#c0afff",
} as const;

type NodeKind = keyof typeof C;

function FlowGlyph({ kind, color }: { kind: NodeKind; color: string }) {
  const common = {
    stroke: color,
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  if (kind === "solar") {
    return (
      <g {...common}>
        <circle cx="0" cy="0" r="4.4" />
        <path d="M0-9v2.4M0 6.6v2.4M-9 0h2.4M6.6 0h2.4M-6.4-6.4l1.7 1.7M4.7 4.7l1.7 1.7M-6.4 6.4l1.7-1.7M4.7-4.7l1.7-1.7" />
      </g>
    );
  }

  if (kind === "home") {
    return (
      <g {...common}>
        <path d="M-7.5 1 0-6.3 7.5 1" />
        <path d="M-5.6 0v7.4h11.2V0" />
        <path d="M-1 7.4V3.7h2v3.7" />
      </g>
    );
  }

  if (kind === "grid") {
    return (
      <g {...common}>
        <path d="M-8 8h16M-5.5 8-2-7M5.5 8 2-7" />
        <path d="M-4.2 1.4h8.4M-3.2-2.2h6.4M-2.2 5.6h4.4" />
      </g>
    );
  }

  return (
    <g {...common}>
      <rect x="-7.5" y="-5.4" width="13.2" height="10.8" rx="2.2" />
      <path d="M6-2h2v4H6" />
      <path d="M-1-3.4-3.3.9h2L-1.8 4.6 1.5-.2H-.5Z" fill={color} stroke="none" />
    </g>
  );
}

function Node({
  cx,
  cy,
  r,
  kind,
  label,
  caption,
  value,
  color,
  active,
  labelY,
  captionY,
}: {
  cx: number;
  cy: number;
  r: number;
  kind: NodeKind;
  label: string;
  caption?: string;
  value: string;
  color: string;
  active: boolean;
  labelY: number;
  captionY?: number;
}) {
  return (
    <g>
      <title>{`${label}: ${value}${caption ? `, ${caption}` : ""}`}</title>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="rgba(8,13,22,0.74)"
        stroke={active ? color : "rgba(255,255,255,0.14)"}
        strokeOpacity={active ? 0.45 : 1}
        strokeWidth="1"
      />
      {active && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 6}
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.14"
        />
      )}
      <g transform={`translate(${cx} ${cy - 10})`}>
        <FlowGlyph kind={kind} color={color} />
      </g>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        fill="var(--color-ink)"
        fontSize="13"
        fontWeight="600"
      >
        {value}
      </text>
      <text
        x={cx}
        y={labelY}
        textAnchor="middle"
        fill="var(--color-muted)"
        fontSize="10.5"
      >
        {label}
      </text>
      {caption && (
        <text
          x={cx}
          y={captionY ?? labelY + 14}
          textAnchor="middle"
          fill="var(--color-muted)"
          fontSize="9.5"
          opacity="0.8"
        >
          {caption}
        </text>
      )}
    </g>
  );
}

function Edge({
  d,
  color,
  active,
  power,
  markerId,
  glowId,
  reducedMotion,
}: {
  d: string;
  color: string;
  active: boolean;
  power: number;
  markerId: string;
  glowId: string;
  reducedMotion: boolean;
}) {
  if (!active) {
    return (
      <path
        d={d}
        fill="none"
        stroke="rgba(255,255,255,0.11)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    );
  }

  const duration = Math.max(
    1.25,
    4.1 - Math.log10(Math.max(power, 100)) * 0.8,
  );

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        opacity="0.12"
        filter={`url(#${glowId})`}
      />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        markerEnd={`url(#${markerId})`}
        opacity="0.95"
      />
      {!reducedMotion &&
        [0, 1, 2].map((index) => (
          <g key={index}>
            <animateMotion
              dur={`${duration}s`}
              begin={`${(-index * duration) / 3}s`}
              repeatCount="indefinite"
              path={d}
            />
            <circle r="5" fill={color} opacity="0.16" />
            <circle r="2.4" fill={color} />
          </g>
        ))}
    </g>
  );
}

function MobileNode({
  icon: Icon,
  label,
  value,
  caption,
  tone,
  active,
}: {
  icon: typeof IconSunHigh;
  label: string;
  value: string;
  caption: string;
  tone: string;
  active: boolean;
}) {
  return (
    <div className="glass-flat rounded-panel flex items-center gap-3 p-3">
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl border",
          active
            ? "border-line-strong bg-white/[0.06]"
            : "border-line bg-white/[0.03]",
          tone,
        )}
      >
        <Icon size={17} stroke={1.8} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] text-muted">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
        <p className="truncate text-[10px] text-muted">{caption}</p>
      </div>
    </div>
  );
}

export function EnergyFlow({ snapshot }: { snapshot: Snapshot }) {
  const reducedMotion = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const solarW = snapshot.solar.powerW;
  const homeW = snapshot.home.powerW + snapshot.backup.powerW;
  const gridW = snapshot.grid.powerW;
  const batteryW = snapshot.battery.powerW;
  const grid = gridFlow(gridW);
  const batteryMode =
    batteryW < ACTIVE_POWER_W
      ? "idle"
      : snapshot.battery.charging
        ? "charging"
        : "discharging";

  const solarActive = solarW > ACTIVE_POWER_W;
  const homeActive = homeW > ACTIVE_POWER_W;
  const gridActive = grid !== "idle";
  const batteryActive = batteryMode !== "idle";

  const gridPath =
    grid === "export" ? "M242 220H118" : "M118 220H242";
  const batteryPath =
    batteryMode === "discharging" ? "M300 342V278" : "M300 278V342";

  const summary = [
    `Solar produces ${formatPower(solarW)}.`,
    `Home load is ${formatPower(homeW)}.`,
    `Grid is ${grid === "idle" ? "idle" : `${formatPower(Math.abs(gridW))} ${grid === "import" ? "importing" : "exporting"}`}.`,
    `Battery is ${batteryMode === "idle" ? "idle" : `${formatPower(batteryW)} ${batteryMode}`} at ${formatPercent(snapshot.battery.soc)}.`,
  ].join(" ");

  return (
    <div>
      <svg
        viewBox="0 0 600 460"
        role="img"
        aria-labelledby={`${uid}-flow-title ${uid}-flow-desc`}
        className="hidden h-auto w-full sm:block"
      >
        <title id={`${uid}-flow-title`}>Live power flow</title>
        <desc id={`${uid}-flow-desc`}>{summary}</desc>
        <defs>
          {(
            [
              ["solar", C.solar],
              ["grid", C.grid],
              ["battery", C.battery],
              ["home", C.home],
            ] as const
          ).map(([key, color]) => (
            <marker
              key={key}
              id={`${uid}-arrow-${key}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M0 0 10 5 0 10Z" fill={color} />
            </marker>
          ))}
          <filter id={`${uid}-glow`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <linearGradient id={`${uid}-ring`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={C.solar} stopOpacity="0.8" />
            <stop offset="100%" stopColor={C.grid} stopOpacity="0.5" />
          </linearGradient>
          <radialGradient id={`${uid}-core`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff12" />
            <stop offset="100%" stopColor="#ffffff03" />
          </radialGradient>
        </defs>

        <Edge
          d="M300 104V162"
          color={C.solar}
          active={solarActive}
          power={solarW}
          markerId={`${uid}-arrow-solar`}
          glowId={`${uid}-glow`}
          reducedMotion={reducedMotion}
        />
        <Edge
          d="M358 220H482"
          color={C.home}
          active={homeActive}
          power={homeW}
          markerId={`${uid}-arrow-home`}
          glowId={`${uid}-glow`}
          reducedMotion={reducedMotion}
        />
        <Edge
          d={gridPath}
          color={C.grid}
          active={gridActive}
          power={Math.abs(gridW)}
          markerId={`${uid}-arrow-grid`}
          glowId={`${uid}-glow`}
          reducedMotion={reducedMotion}
        />
        <Edge
          d={batteryPath}
          color={C.battery}
          active={batteryActive}
          power={batteryW}
          markerId={`${uid}-arrow-battery`}
          glowId={`${uid}-glow`}
          reducedMotion={reducedMotion}
        />

        <g>
          <circle
            cx="300"
            cy="220"
            r="88"
            fill="none"
            stroke={`url(#${uid}-ring)`}
            strokeWidth="1"
            strokeDasharray="2 7"
            opacity="0.55"
          />
          <circle
            cx="300"
            cy="220"
            r="72"
            fill={`url(#${uid}-core)`}
            className={reducedMotion ? undefined : "core-breathe"}
          />
          <circle
            cx="300"
            cy="220"
            r="58"
            fill="rgba(8,13,22,0.82)"
            stroke={`url(#${uid}-ring)`}
            strokeWidth="1.3"
          />
          <path
            d="M308 188l-26 42h20l-10 32 36-48h-22l12-26z"
            fill="#ffc66d"
            opacity="0.9"
          />
          <circle
            cx="300"
            cy="220"
            r="30"
            fill="none"
            stroke="#ffc66d"
            strokeWidth="1"
            opacity="0.14"
          />
        </g>

        <Node
          cx={300}
          cy={62}
          r={36}
          kind="solar"
          label="Solar"
          value={formatPower(solarW)}
          color={C.solar}
          active={solarActive}
          labelY={14}
        />
        <Node
          cx={78}
          cy={220}
          r={40}
          kind="grid"
          label="Grid"
          caption={grid === "idle" ? "idle" : grid}
          value={formatPower(Math.abs(gridW))}
          color={C.grid}
          active={gridActive}
          labelY={288}
          captionY={302}
        />
        <Node
          cx={522}
          cy={220}
          r={40}
          kind="home"
          label="Home"
          caption="current load"
          value={formatPower(homeW)}
          color={C.home}
          active={homeActive}
          labelY={288}
          captionY={302}
        />
        <Node
          cx={300}
          cy={378}
          r={36}
          kind="battery"
          label="Battery"
          caption={
            batteryMode === "idle"
              ? `${formatPercent(snapshot.battery.soc)} state of charge`
              : `${formatPercent(snapshot.battery.soc)} · ${batteryMode}`
          }
          value={formatPower(Math.abs(batteryW))}
          color={C.battery}
          active={batteryActive}
          labelY={434}
          captionY={448}
        />
      </svg>

      <div className="grid grid-cols-2 gap-2 sm:hidden">
        <MobileNode
          icon={IconSunHigh}
          label="Solar"
          value={formatPower(solarW)}
          caption={solarActive ? "producing" : "standby"}
          tone="text-solar-bright"
          active={solarActive}
        />
        <MobileNode
          icon={IconBolt}
          label="Grid"
          value={formatPower(Math.abs(gridW))}
          caption={grid === "idle" ? "idle" : grid}
          tone="text-grid-bright"
          active={gridActive}
        />
        <MobileNode
          icon={IconHome}
          label="Home"
          value={formatPower(homeW)}
          caption="current load"
          tone="text-home-bright"
          active={homeActive}
        />
        <MobileNode
          icon={IconBatteryCharging}
          label="Battery"
          value={formatPower(Math.abs(batteryW))}
          caption={
            batteryMode === "idle"
              ? `${formatPercent(snapshot.battery.soc)} charge`
              : `${formatPercent(snapshot.battery.soc)} ${batteryMode}`
          }
          tone="text-battery-bright"
          active={batteryActive}
        />
      </div>
    </div>
  );
}
