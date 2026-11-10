"use client";

import {
  IconAlertTriangle,
  IconBroadcast,
  IconRefresh,
} from "@tabler/icons-react";

import { useDashboard } from "@/components/dashboard-provider";
import { Badge } from "@/components/ui/badge";
import { useClock } from "@/hooks/use-clock";
import { formatRelative } from "@/lib/format";

export function LivePill({ compact = false }: { compact?: boolean }) {
  const { state, pollError } = useDashboard();
  const now = useClock(30_000);
  const updated = formatRelative(state.lastUpdated, now);

  if (pollError) {
    return (
      <Badge
        tone="warn"
        title={pollError}
        aria-label={`Reconnecting. ${pollError}`}
      >
        <IconRefresh size={12} className="spin-slow" aria-hidden="true" />
        {!compact && "Reconnecting"}
      </Badge>
    );
  }

  if (state.connection === "error") {
    return (
      <Badge
        tone="bad"
        title={state.error ?? "No data from the inverter."}
        aria-label="Offline"
      >
        <IconAlertTriangle size={12} aria-hidden="true" />
        {!compact && "Offline"}
      </Badge>
    );
  }

  if (state.connection === "stale") {
    return (
      <Badge
        tone="warn"
        title={state.error ?? "Showing the last successful reading."}
        aria-label="Stale data"
      >
        <IconAlertTriangle size={12} aria-hidden="true" />
        {!compact && "Stale"}
      </Badge>
    );
  }

  if (state.connection === "connecting") {
    return (
      <Badge tone="neutral" aria-label="Connecting">
        <IconRefresh size={12} className="spin-slow" aria-hidden="true" />
        {!compact && "Connecting"}
      </Badge>
    );
  }

  return (
    <Badge tone="good" title={`Updated ${updated}`} aria-label={`Live. Updated ${updated}.`}>
      <span className="live-dot" aria-hidden="true" />
      {!compact && "Live"}
      <IconBroadcast size={11} aria-hidden="true" className="opacity-60" />
    </Badge>
  );
}
