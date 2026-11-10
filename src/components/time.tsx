"use client";

import { useClock } from "@/hooks/use-clock";
import { formatClock, formatDate, formatRelative } from "@/lib/format";

export function Clock({ iso }: { iso: string | null }) {
  const now = useClock(1_000);
  return <>{now ? formatClock(iso) : "—"}</>;
}

export function DateLabel({ iso }: { iso: string | null }) {
  const now = useClock(60_000);
  return <>{now ? formatDate(iso) : "—"}</>;
}

export function Ago({ iso }: { iso: string | null }) {
  const now = useClock(30_000);
  return <>{formatRelative(iso, now)}</>;
}
