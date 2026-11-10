export type PlantInfo = {
  groupId: string;
  goodsId: string;
  name: string;
  model: string;
  isHybrid: boolean;
};

export type PvString = {
  index: number;
  voltageV: number;
  currentA: number;
  powerW: number;
};

export type Snapshot = {
  timestamp: string;
  solar: {
    powerW: number;
    energyTodayKWh: number;
    energyTotalKWh: number;
    hoursTotal: number;
    peakPowerW: number;
  };
  grid: {
    powerW: number;
    voltageV: number;
    currentA: number;
    frequencyHz: number;
    feedInTodayKWh: number;
    feedInTotalKWh: number;
    purchasedTodayKWh: number;
    purchasedTotalKWh: number;
  };
  home: {
    powerW: number;
    voltageV: number;
    currentA: number;
    frequencyHz: number;
    consumptionTodayKWh: number;
    consumptionTotalKWh: number;
  };
  backup: {
    powerW: number;
    voltageV: number;
    currentA: number;
    frequencyHz: number;
    consumptionTodayKWh: number;
    consumptionTotalKWh: number;
  };
  battery: {
    powerW: number;
    charging: boolean;
    soc: number;
    soh: number;
    voltageV: number;
    currentA: number;
    temperatureC: number;
    chargingPowerW: number;
    dischargingPowerW: number;
    healthStatus: string;
    brand: string;
    capacityAh: number;
    dailyChargedKWh: number;
    dailyDischargedKWh: number;
    totalChargedKWh: number;
    totalDischargedKWh: number;
  };
  bms: {
    chargeLimitV: number;
    chargeLimitA: number;
    dischargeLimitV: number;
    dischargeLimitA: number;
    firmware: string;
    batteryCount: number;
    alarmCount: number;
    protectCount: number;
  };
  inverter: {
    temperatureC: number;
    status: string;
    operatingStatus: string;
    firmware: string;
    selfConsumptionRate: number;
    selfSufficiencyRate: number;
    commsStatus: string;
    signalStrength: number;
  };
  pv: PvString[];
};

export type NotificationSeverity = "fault" | "notice";

export type InverterNotification = {
  id: string;
  code: number;
  message: string;
  severity: NotificationSeverity;
  active: boolean;
  device: string;
  model: string;
  time: string;
  source: "history" | "active";
};

export type NotificationsResponse = {
  notifications: InverterNotification[];
  fetchedAt: string;
  total: number;
  faults: number;
  notices: number;
  activeCount: number;
  rangeDays: number;
};

export const NOTIFICATION_RANGES = [7, 30, 90] as const;

export type NotificationRange = (typeof NOTIFICATION_RANGES)[number];

export type InsightPeriod = "day" | "month" | "year";

export type EnergySplit = {
  productionKWh: number;
  toGridKWh: number;
  selfConsumptionKWh: number;
  consumptionKWh: number;
  fromGridKWh: number;
  selfProductionKWh: number;
};

export type DayCurvePoint = {
  time: string;
  solarW: number;
  homeW: number;
  gridW: number;
  batteryW: number;
  soc: number;
};

export type EnergyPoint = {
  key: string;
  label: string;
  productionKWh: number;
  consumptionKWh: number;
  toGridKWh: number;
  fromGridKWh: number;
  batteryChargeKWh: number;
  batteryDischargeKWh: number;
  selfConsumedKWh: number;
};

export type InsightTotals = {
  productionKWh: number;
  consumptionKWh: number;
  toGridKWh: number;
  fromGridKWh: number;
  batteryChargeKWh: number;
  batteryDischargeKWh: number;
  selfConsumedKWh: number;
};

export type InsightsResponse = {
  period: InsightPeriod;
  date: string;
  label: string;
  fetchedAt: string;
  energySplit: EnergySplit | null;
  curve: DayCurvePoint[];
  points: EnergyPoint[];
  totals: InsightTotals | null;
};

export type ConnectionState = "connecting" | "online" | "stale" | "error";

export type DashboardState = {
  connection: ConnectionState;
  plant: PlantInfo;
  snapshot: Snapshot | null;
  lastUpdated: string | null;
  lastAttempt: string | null;
  error: string | null;
  pollIntervalMs: number;
  serverTime: string;
};

export const DEFAULT_POLL_INTERVAL_MS = 30_000;

/** Below this, a flow is treated as idle rather than active. */
export const ACTIVE_POWER_W = 25;
