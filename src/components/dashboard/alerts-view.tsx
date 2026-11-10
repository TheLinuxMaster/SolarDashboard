"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconAlertTriangle,
  IconBell,
  IconBellOff,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheck,
  IconRefresh,
  IconShieldExclamation,
} from "@tabler/icons-react";

import { Ago } from "@/components/time";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Segmented } from "@/components/ui/segmented";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getNotifications, UnauthorizedError } from "@/lib/api-client";
import { INVERTER_ERROR_MESSAGES } from "@/lib/cloud/error-codes";
import type {
  InverterNotification,
  NotificationsResponse,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "fault" | "notice" | "active";
type RangeKey = "7" | "30" | "90";

const PAGE_SIZE = 25;

const FILTERS: ReadonlyArray<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "fault", label: "Faults" },
  { value: "notice", label: "Notices" },
  { value: "active", label: "Active" },
];

const RANGES: ReadonlyArray<{ value: RangeKey; label: string }> = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
];

const ERROR_TYPES = Object.entries(INVERTER_ERROR_MESSAGES)
  .filter(([, message]) => message !== "Reserved")
  .map(([code, message]) => ({ code: Number(code), message }))
  .sort((a, b) => a.code - b.code);

function matches(item: InverterNotification, filter: Filter): boolean {
  if (filter === "active") return item.active;
  if (filter === "all") return true;
  return item.severity === filter;
}

function splitTime(value: string): { date: string; time: string } {
  const [date, ...rest] = value.split(" ");
  return { date: date || "—", time: rest.join(" ") || "" };
}

function SummaryCard({
  label,
  value,
  note,
  icon,
  tone,
}: {
  label: string;
  value: number;
  note: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="glass-flat rounded-panel p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted">{label}</p>
        <span
          className={cn(
            "grid size-8 place-items-center rounded-xl border border-line",
            tone,
          )}
        >
          {icon}
        </span>
      </div>
      <p className="mt-2 text-2xl font-medium tracking-tight">
        {value.toLocaleString("en-GB")}
      </p>
      <p className="mt-1 text-[11px] text-muted">{note}</p>
    </div>
  );
}

export function AlertsView({
  initial,
  initialError,
}: {
  initial: NotificationsResponse | null;
  initialError: string | null;
}) {
  const [data, setData] = useState<NotificationsResponse | null>(initial);
  const [error, setError] = useState<string | null>(initialError);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [rangeKey, setRangeKey] = useState<RangeKey>("7");
  const [page, setPage] = useState(1);

  const load = useCallback(async (days: number, force: boolean) => {
    setRefreshing(true);
    try {
      const next = await getNotifications(force, days);
      setData(next);
      setError(null);
    } catch (reason) {
      if (reason instanceof UnauthorizedError) return;
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not load the inverter logs.",
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void load(Number(rangeKey), false);
      }
    }, 5 * 60_000);
    return () => window.clearInterval(timer);
  }, [load, rangeKey]);

  useEffect(() => {
    setPage(1);
  }, [filter, typeFilter]);

  const changeRange = (next: RangeKey) => {
    setRangeKey(next);
    setPage(1);
    void load(Number(next), false);
  };

  const typeCounts = useMemo(() => {
    const map = new Map<number, number>();
    for (const item of data?.notifications ?? []) {
      map.set(item.code, (map.get(item.code) ?? 0) + 1);
    }
    return map;
  }, [data]);

  const typeFiltered = useMemo(() => {
    if (!data) return [];
    if (typeFilter === "all") return data.notifications;
    const code = Number(typeFilter);
    return data.notifications.filter((item) => item.code === code);
  }, [data, typeFilter]);

  const filtered = useMemo(
    () => typeFiltered.filter((item) => matches(item, filter)),
    [typeFiltered, filter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);
  const end = Math.min(start + PAGE_SIZE, filtered.length);

  const counts: Record<Filter, number> = {
    all: typeFiltered.length,
    fault: typeFiltered.filter((item) => item.severity === "fault").length,
    notice: typeFiltered.filter((item) => item.severity === "notice").length,
    active: typeFiltered.filter((item) => item.active).length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
          <Segmented
            value={rangeKey}
            onChange={changeRange}
            label="Alert range"
            items={RANGES}
          />
          <label className="relative block w-full sm:w-auto">
            <span className="sr-only">Error type</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              aria-label="Error type"
              className="h-10 w-full appearance-none rounded-full border border-line bg-[#0a111c] pl-3.5 pr-9 text-xs font-medium text-ink-2 transition-colors hover:border-line-strong focus:border-solar-bright/50 sm:w-auto sm:min-w-[200px]"
            >
              <option value="all">All error types</option>
              {ERROR_TYPES.map((type) => {
                const count = typeCounts.get(type.code) ?? 0;
                return (
                  <option key={type.code} value={String(type.code)}>
                    {type.message}
                    {count > 0 ? ` (${count})` : ""}
                  </option>
                );
              })}
            </select>
            <IconChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
          </label>
        </div>
        <p className="text-[11px] text-muted">
          Inverter log search for the last {rangeKey} days
        </p>
      </div>

      {data && (
        <div
          className={cn(
            "grid grid-cols-2 gap-3 transition-opacity xl:grid-cols-4",
            refreshing && "opacity-60",
          )}
        >
          <SummaryCard
            label="Total events"
            value={counts.all}
            note="In this view"
            icon={<IconBell size={15} aria-hidden="true" />}
            tone="text-ink-2"
          />
          <SummaryCard
            label="Faults"
            value={counts.fault}
            note="Inverter faults"
            icon={<IconShieldExclamation size={15} aria-hidden="true" />}
            tone="text-bad"
          />
          <SummaryCard
            label="Notices"
            value={counts.notice}
            note="Warnings and events"
            icon={<IconBell size={15} aria-hidden="true" />}
            tone="text-warn"
          />
          <SummaryCard
            label="Active now"
            value={counts.active}
            note="Log status still open"
            icon={<IconAlertTriangle size={15} aria-hidden="true" />}
            tone="text-bad"
          />
        </div>
      )}

      {error && !data ? (
        <GlassCard className="p-6">
          <div className="flex items-start gap-3">
            <IconAlertTriangle
              size={19}
              className="mt-0.5 shrink-0 text-warn"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-base font-medium">
                Notification logs are unavailable
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-2">
                {error}
              </p>
              <Button
                variant="glass"
                size="sm"
                className="mt-4"
                onClick={() => void load(Number(rangeKey), true)}
                disabled={refreshing}
              >
                <IconRefresh
                  size={14}
                  className={refreshing ? "spin" : undefined}
                  aria-hidden="true"
                />
                Try again
              </Button>
            </div>
          </div>
        </GlassCard>
      ) : null}

      {data ? (
        <GlassCard className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <Segmented
              value={filter}
              onChange={setFilter}
              label="Alert filter"
              stretch
              items={FILTERS.map((item) => ({
                value: item.value,
                label: item.label,
                count: counts[item.value],
              }))}
            />
            <div className="flex items-center gap-3 text-[11px] text-muted">
              <span>
                Checked <Ago iso={data.fetchedAt} />
              </span>
              <Button
                variant="glass"
                size="icon-sm"
                onClick={() => void load(Number(rangeKey), true)}
                disabled={refreshing}
                aria-label="Refresh notification logs"
                title="Refresh notification logs"
              >
                <IconRefresh
                  size={14}
                  className={refreshing ? "spin" : undefined}
                  aria-hidden="true"
                />
              </Button>
            </div>
          </div>

          {error && (
            <div className="mx-5 mt-4 rounded-xl border border-warn/25 bg-warn/[0.06] px-3.5 py-2.5 text-[11px] leading-relaxed text-ink-2">
              {error} Showing the last successful result.
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center gap-2 px-5 py-10 text-center">
              <IconBellOff size={22} className="text-muted" aria-hidden="true" />
              <p className="text-sm font-medium">
                No events match these filters
              </p>
              <p className="max-w-md text-xs leading-relaxed text-muted">
                {filter === "all" && typeFilter === "all"
                  ? "The inverter has not reported any events yet."
                  : "Try another error type, status filter or refresh the feed."}
              </p>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "hidden transition-opacity md:block",
                  refreshing ? "opacity-60" : undefined,
                )}
              >
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-5">Time</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead className="pr-5 text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((item) => {
                      const { date, time } = splitTime(item.time);
                      const isFault = item.severity === "fault";
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="pl-5 align-top">
                            <div className="text-[11px] tabular text-muted">
                              {date}
                            </div>
                            <div className="text-[11px] tabular">{time}</div>
                          </TableCell>
                          <TableCell className="min-w-[260px] align-top whitespace-normal">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[13px] font-medium">
                                {item.message}
                              </span>
                              {item.source === "active" && (
                                <Badge tone="info" className="h-5 px-1.5 text-[9px]">
                                  current
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted">
                              <span>Code {item.code}</span>
                              {item.model &&
                                !item.device.includes(item.model) && (
                                  <span>{item.model}</span>
                                )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[220px] truncate align-top text-[11px] text-muted">
                            {item.device}
                          </TableCell>
                          <TableCell className="align-top">
                            <Badge tone={isFault ? "bad" : "warn"}>
                              {isFault ? (
                                <IconShieldExclamation size={11} aria-hidden="true" />
                              ) : (
                                <IconBell size={11} aria-hidden="true" />
                              )}
                              {isFault ? "Fault" : "Notice"}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-5 text-right align-top">
                            <Badge tone={item.active ? "bad" : "good"}>
                              {item.active ? (
                                <IconAlertTriangle size={11} aria-hidden="true" />
                              ) : (
                                <IconCircleCheck size={11} aria-hidden="true" />
                              )}
                              {item.active ? "Active" : "Cleared"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div
                className={cn(
                  "divide-y divide-line transition-opacity md:hidden",
                  refreshing ? "opacity-60" : undefined,
                )}
              >
                {rows.map((item) => {
                  const { date, time } = splitTime(item.time);
                  const isFault = item.severity === "fault";
                  return (
                    <div key={item.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[13px] font-medium">{item.message}</p>
                        <Badge tone={item.active ? "bad" : "good"}>
                          {item.active ? "Active" : "Cleared"}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge tone={isFault ? "bad" : "warn"}>
                          {isFault ? "Fault" : "Notice"}
                        </Badge>
                        <span className="text-[10px] text-muted">
                          Code {item.code}
                        </span>
                        <span className="text-[10px] text-muted">
                          {date} {time}
                        </span>
                      </div>
                      <p className="mt-2 truncate text-[11px] text-muted">
                        {item.device}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-[11px] text-muted">
                <span>
                  Showing {start + 1}–{end} of {filtered.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="glass"
                    size="icon-sm"
                    onClick={() => setPage(safePage - 1)}
                    disabled={safePage <= 1}
                    aria-label="Previous page"
                  >
                    <IconChevronLeft size={14} aria-hidden="true" />
                  </Button>
                  <span className="tabular">
                    {safePage} / {totalPages}
                  </span>
                  <Button
                    variant="glass"
                    size="icon-sm"
                    onClick={() => setPage(safePage + 1)}
                    disabled={safePage >= totalPages}
                    aria-label="Next page"
                  >
                    <IconChevronRight size={14} aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </GlassCard>
      ) : null}

      <p className="max-w-3xl text-[10px] leading-relaxed text-muted">
        These are the inverter error logs from CloudInverter&apos;s web log
        search. The range control changes the queried date window. An event is
        marked active while its log status is still open; severity follows the
        SolarTouch catalog.
      </p>
    </div>
  );
}
