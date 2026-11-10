import type { Snapshot } from "@/lib/types";

export type JsonRecord = Record<string, unknown>;

export type RawPayloads = {
  monitor: JsonRecord;
  plantStats: JsonRecord;
  flow: JsonRecord;
  info: JsonRecord;
};

export const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const obj = (value: unknown): JsonRecord => (isRecord(value) ? value : {});
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const first = (value: unknown): unknown => (arr(value)[0] ?? 0);

/** Mirrors the integration's safe float conversion. */
export const num = (value: unknown, fallback = 0): number => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "null" ||
    value === "-"
  ) {
    return fallback;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const round = (value: number, digits = 0): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

/** Convert a raw CloudInverter poll into the dashboard's normalized shape. */
export function parseSnapshot(
  raw: RawPayloads,
  timestamp = new Date().toISOString(),
): Snapshot {
  const monitor = raw.monitor;
  const ps = raw.plantStats;
  const flow = raw.flow;
  const info = raw.info;

  const lights = obj(monitor.AllLight);
  const data = obj(info.data);
  const esp32 = obj(info.ESP32Version);
  const pbatRaw = num(flow.Pbat);

  const vdc = arr(data.Vdc);
  const idc = arr(data.Idc);
  const pdc = arr(data.Pdc);

  const operatingMode = String(info.Operatingmode ?? "");
  const operatingStatus =
    {
      "0": "Off-grid",
      "1": "On-grid",
      "2": "Backup",
      "4": "Self-consumption",
    }[operatingMode] ?? operatingMode;

  const pv = [0, 1, 2].map((index) => ({
    index: index + 1,
    voltageV: round(num(vdc[index]), 1),
    currentA: round(num(idc[index]), 2),
    powerW: round(num(pdc[index]) * 1000, 0),
  }));

  const inverterStatus =
    num(lights.Green) > 0
      ? "Normal"
      : num(lights.yellow) > 0
        ? "Warning"
        : num(lights.red) > 0
          ? "Alarm"
          : "Offline";

  const solarTodayWh = num(ps.EToday);
  const solarTotalWh = num(ps.ETotal);

  return {
    timestamp,
    solar: {
      powerW: num(ps.CurrPac) || num(info.TotalDCpower),
      energyTodayKWh: round(solarTodayWh / 1000, 2),
      energyTotalKWh: round(solarTotalWh / 1000, 1),
      hoursTotal: num(ps.Htotal),
      peakPowerW: num(info.Peackpower),
    },
    grid: {
      powerW: num(flow.gridCurrpac),
      voltageV: round(num(first(info.gridVac)), 1),
      currentA: round(num(first(info.gridIac)), 2),
      frequencyHz: num(info.gridFac),
      // The CloudInverter portal reports EF* as energy from the grid
      // (purchased) and ET* as energy to the grid (feed-in).
      feedInTodayKWh: num(info.ETDay),
      feedInTotalKWh: num(info.ETTotal),
      purchasedTodayKWh: num(info.EFDay),
      purchasedTotalKWh: num(info.EFTotal),
    },
    home: {
      powerW: num(flow.loadCurrpac),
      voltageV: round(num(first(info.loadVac)), 1),
      currentA: round(num(first(info.loadIac)), 2),
      frequencyHz: num(info.loadFac),
      consumptionTodayKWh: num(info.ELDay),
      consumptionTotalKWh: num(info.ELTotal),
    },
    backup: {
      powerW: round(num(first(info.epsCurrpac)), 0),
      voltageV: round(num(first(info.epsVac)), 1),
      currentA: round(num(first(info.epsIac)), 2),
      frequencyHz: num(info.epsFac),
      consumptionTodayKWh: num(info.EPSDay),
      consumptionTotalKWh: num(info.EPSTotal),
    },
    battery: {
      powerW: Math.abs(pbatRaw),
      charging: pbatRaw < 0,
      soc: num(info.SOC),
      soh: num(info.SOH),
      voltageV: num(info.volt),
      currentA: num(info.cur),
      temperatureC: num(info.BMS_temp),
      chargingPowerW: num(info.toPbat),
      dischargingPowerW: num(info.fromPbat),
      healthStatus: String(info.BMS_Status ?? ""),
      brand: String(info.brand ?? ""),
      capacityAh: num(info.capacity),
      dailyChargedKWh: num(info.batChrg),
      dailyDischargedKWh: num(info.batDischrg),
      totalChargedKWh: num(info.Etotal_batChrg),
      totalDischargedKWh: num(info.Etotal_batDischrg),
    },
    bms: {
      chargeLimitV: num(info.bmsChargeVolLimit),
      chargeLimitA: num(info.bmsChargeCurLimit),
      dischargeLimitV: num(info.bmsDischargeVolLimit),
      dischargeLimitA: num(info.bmsDishargeCurLimit),
      firmware: String(info.BMS_version ?? ""),
      batteryCount: Math.trunc(num(info.Batterynum)),
      alarmCount: 0,
      protectCount: 0,
    },
    inverter: {
      temperatureC: num(info.Tntc),
      status: inverterStatus,
      operatingStatus,
      firmware: String(info.FirmwareVersion ?? ""),
      selfConsumptionRate: num(info.Dailyself_userate),
      selfSufficiencyRate: num(info.Dailyself_sufficiencyrate),
      commsStatus: String(esp32.Status ?? ""),
      signalStrength: num(info.WifiStrength),
    },
    pv,
  };
}
