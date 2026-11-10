"use client";

import { useEffect, useState } from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatEnergy, formatPercent, formatPower } from "@/lib/format";
import type { DayCurvePoint, EnergyPoint, InsightPeriod } from "@/lib/types";

const PAGE_SIZE = 50;

export function InsightsTable(
  props:
    | { mode: "day"; curve: DayCurvePoint[] }
    | { mode: "energy"; points: EnergyPoint[]; period: InsightPeriod },
) {
  const total = props.mode === "day" ? props.curve.length : props.points.length;
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [props.mode, total]);

  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted">
        No samples in this period.
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);

  return (
    <div>
      <div className="max-h-[420px] overflow-auto rounded-xl border border-line">
        <Table>
          <caption className="sr-only">
            Cloud energy samples for the selected period
          </caption>
          <TableHeader>
            {props.mode === "day" ? (
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Time</TableHead>
                <TableHead className="text-right">Solar</TableHead>
                <TableHead className="text-right">Home</TableHead>
                <TableHead className="text-right">Grid</TableHead>
                <TableHead className="text-right">Battery</TableHead>
                <TableHead className="pr-4 text-right">SOC</TableHead>
              </TableRow>
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">
                  {props.period === "month" ? "Day" : "Month"}
                </TableHead>
                <TableHead className="text-right">Production</TableHead>
                <TableHead className="text-right">Consumption</TableHead>
                <TableHead className="text-right">To grid</TableHead>
                <TableHead className="text-right">From grid</TableHead>
                <TableHead className="text-right">Battery in</TableHead>
                <TableHead className="text-right">Battery out</TableHead>
                <TableHead className="pr-4 text-right">Self-used</TableHead>
              </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {props.mode === "day"
              ? props.curve.slice(start, end).map((point) => (
                  <TableRow key={point.time}>
                    <TableCell className="pl-4 text-[11px] text-muted">
                      {point.time.slice(0, 5)}
                    </TableCell>
                    <TableCell className="text-right text-[11px] tabular">
                      {formatPower(point.solarW)}
                    </TableCell>
                    <TableCell className="text-right text-[11px] tabular">
                      {formatPower(point.homeW)}
                    </TableCell>
                    <TableCell className="text-right text-[11px] tabular">
                      {formatPower(point.gridW)}
                    </TableCell>
                    <TableCell className="text-right text-[11px] tabular">
                      {formatPower(point.batteryW)}
                    </TableCell>
                    <TableCell className="pr-4 text-right text-[11px] tabular">
                      {formatPercent(point.soc)}
                    </TableCell>
                  </TableRow>
                ))
              : props.points.slice(start, end).map((point) => (
                  <TableRow key={point.key}>
                    <TableCell className="pl-4 text-[11px] text-muted">
                      {point.label}
                    </TableCell>
                    <TableCell className="text-right text-[11px] tabular">
                      {formatEnergy(point.productionKWh)}
                    </TableCell>
                    <TableCell className="text-right text-[11px] tabular">
                      {formatEnergy(point.consumptionKWh)}
                    </TableCell>
                    <TableCell className="text-right text-[11px] tabular">
                      {formatEnergy(point.toGridKWh)}
                    </TableCell>
                    <TableCell className="text-right text-[11px] tabular">
                      {formatEnergy(point.fromGridKWh)}
                    </TableCell>
                    <TableCell className="text-right text-[11px] tabular">
                      {formatEnergy(point.batteryChargeKWh)}
                    </TableCell>
                    <TableCell className="text-right text-[11px] tabular">
                      {formatEnergy(point.batteryDischargeKWh)}
                    </TableCell>
                    <TableCell className="pr-4 text-right text-[11px] tabular">
                      {formatEnergy(point.selfConsumedKWh)}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted">
        <span>
          Showing {start + 1}–{end} of {total}
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
    </div>
  );
}
