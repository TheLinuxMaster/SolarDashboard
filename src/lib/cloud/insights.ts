import { num } from "./parse";
import type {
  DayCurvePoint,
  EnergyPoint,
  EnergySplit,
  InsightPeriod,
  InsightTotals,
} from "@/lib/types";

type Row = Record<string, unknown>;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function toEnergySplit(row: Row | null | undefined): EnergySplit {
  const source = row ?? {};
  return {
    productionKWh: num(source.Production),
    toGridKWh: num(source.ToGrid),
    selfConsumptionKWh: num(source.SelfConsumption),
    consumptionKWh: num(source.Consumption),
    fromGridKWh: num(source.FromGrid),
    selfProductionKWh: num(source.SelfProduction),
  };
}

export function toDayCurve(rows: Row[]): DayCurvePoint[] {
  const points: DayCurvePoint[] = [];

  for (const row of rows) {
    const time = typeof row.inTime === "string" ? row.inTime : "";
    if (!time) continue;

    const fromGrid = num(row.powerFromGrid);
    const toGrid = num(row.powerToGrid);
    const signedGrid = fromGrid - toGrid || num(row.powerGrid);

    points.push({
      time,
      solarW: Math.round(num(row.Production)),
      homeW: Math.round(
        num(row.Consumption) || num(row.epsload) || num(row.load),
      ),
      gridW: Math.round(signedGrid),
      batteryW: Math.round(num(row.Battery)),
      soc: num(row.SOC),
    });
  }

  return points;
}

export function toEnergyPoints(
  rows: Row[],
  period: "month" | "year",
): EnergyPoint[] {
  const points: EnergyPoint[] = [];

  for (const row of rows) {
    const index = period === "month" ? num(row.day) : num(row.month);
    if (!Number.isFinite(index) || index <= 0) continue;

    points.push({
      key: String(Math.trunc(index)),
      label:
        period === "month"
          ? String(Math.trunc(index))
          : (MONTHS[Math.trunc(index) - 1] ?? String(Math.trunc(index))),
      productionKWh: num(row.Production),
      consumptionKWh: num(row.Consumption) || num(row.epsload),
      toGridKWh: num(row.powerToGrid),
      fromGridKWh: num(row.powerFromGrid),
      batteryChargeKWh: num(row.powerToBattery),
      batteryDischargeKWh: num(row.powerFromBattery),
      selfConsumedKWh: num(row.ConsumedDirectly),
    });
  }

  return points.sort((a, b) => Number(a.key) - Number(b.key));
}

export function sumEnergyPoints(points: EnergyPoint[]): InsightTotals {
  return points.reduce<InsightTotals>(
    (totals, point) => ({
      productionKWh: totals.productionKWh + point.productionKWh,
      consumptionKWh: totals.consumptionKWh + point.consumptionKWh,
      toGridKWh: totals.toGridKWh + point.toGridKWh,
      fromGridKWh: totals.fromGridKWh + point.fromGridKWh,
      batteryChargeKWh: totals.batteryChargeKWh + point.batteryChargeKWh,
      batteryDischargeKWh:
        totals.batteryDischargeKWh + point.batteryDischargeKWh,
      selfConsumedKWh: totals.selfConsumedKWh + point.selfConsumedKWh,
    }),
    {
      productionKWh: 0,
      consumptionKWh: 0,
      toGridKWh: 0,
      fromGridKWh: 0,
      batteryChargeKWh: 0,
      batteryDischargeKWh: 0,
      selfConsumedKWh: 0,
    },
  );
}

export function insightLabel(period: InsightPeriod, date: string): string {
  try {
    if (period === "day") {
      return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${date}T00:00:00Z`));
    }
    if (period === "month") {
      return new Intl.DateTimeFormat("en-GB", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${date}-01T00:00:00Z`));
    }
    return date;
  } catch {
    return date;
  }
}
