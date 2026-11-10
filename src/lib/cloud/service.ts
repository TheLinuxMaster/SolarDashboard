import "server-only";
import { createHash } from "node:crypto";
import { CloudAuthError, CloudInverterClient } from "./cloudinverter";
import {
  insightLabel,
  sumEnergyPoints,
  toDayCurve,
  toEnergyPoints,
  toEnergySplit,
} from "./insights";
import { normalizeNotifications } from "./notifications";
import { parseSnapshot } from "./parse";
import {
  NOTIFICATION_RANGES,
  type DashboardState,
  type InsightPeriod,
  type InsightsResponse,
  type NotificationRange,
  type NotificationsResponse,
  type PlantInfo,
} from "@/lib/types";

export type Credentials = {
  username: string;
  password: string;
};

export class RefreshTooSoonError extends Error {}

const FALLBACK_PLANT: PlantInfo = {
  groupId: "",
  goodsId: "",
  name: "Solar plant",
  model: "SolarMax Onyx",
  isHybrid: true,
};

const NOTIFICATIONS_TTL_MS = 60_000;
const INSIGHTS_TTL_MS = 5 * 60_000;
const REFRESH_COOLDOWN_MS = 3_000;
const MAX_ENTRIES = 40;

type Entry = {
  key: string;
  client: CloudInverterClient;
  plant: PlantInfo | null;
  state: DashboardState;
  lastAttemptAt: number;
  nextAttemptAt: number;
  failures: number;
  inflight: Promise<DashboardState> | null;
  notifications: Map<
    NotificationRange,
    { at: number; data: NotificationsResponse }
  >;
  notificationsInflight: Map<
    NotificationRange,
    Promise<NotificationsResponse>
  >;
  insights: Map<string, { at: number; data: InsightsResponse }>;
  lastManualRefreshAt: number;
};

/**
 * Per-process cache. Vercel may start and stop instances, so nothing here is
 * treated as durable storage — it only dedupes upstream calls for warm
 * instances. Durable history lives in the browser.
 */
const entries = new Map<string, Entry>();

export function pollIntervalMs(): number {
  const parsed = Number(process.env.POLL_INTERVAL_MS);
  if (!Number.isFinite(parsed)) return 30_000;
  return Math.min(15 * 60_000, Math.max(15_000, Math.round(parsed)));
}

function cacheKey(credentials: Credentials): string {
  return createHash("sha256")
    .update(`${credentials.username}\u0000${credentials.password}`)
    .digest("base64url");
}

function newEntry(key: string, credentials: Credentials): Entry {
  const interval = pollIntervalMs();
  const state: DashboardState = {
    connection: "connecting",
    plant: FALLBACK_PLANT,
    snapshot: null,
    lastUpdated: null,
    lastAttempt: null,
    error: null,
    pollIntervalMs: interval,
    serverTime: new Date().toISOString(),
  };

  return {
    key,
    client: new CloudInverterClient({
      username: credentials.username,
      password: credentials.password,
    }),
    plant: null,
    state,
    lastAttemptAt: 0,
    nextAttemptAt: 0,
    failures: 0,
    inflight: null,
    notifications: new Map(),
    notificationsInflight: new Map(),
    insights: new Map(),
    lastManualRefreshAt: 0,
  };
}

function getEntry(credentials: Credentials): Entry {
  const key = cacheKey(credentials);
  let entry = entries.get(key);
  if (entry) {
    // Refresh insertion order so the map behaves as a small LRU.
    entries.delete(key);
    entries.set(key, entry);
    return entry;
  }

  entry = newEntry(key, credentials);
  entries.set(key, entry);
  if (entries.size > MAX_ENTRIES) {
    const oldest = entries.keys().next().value;
    if (oldest) entries.delete(oldest);
  }
  return entry;
}

function publicState(entry: Entry): DashboardState {
  return { ...entry.state, serverTime: new Date().toISOString() };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown CloudInverter error.";
}

async function poll(entry: Entry): Promise<DashboardState> {
  const interval = pollIntervalMs();
  const attemptAt = new Date().toISOString();
  entry.lastAttemptAt = Date.now();
  entry.state = { ...entry.state, lastAttempt: attemptAt, pollIntervalMs: interval };

  try {
    if (!entry.plant) {
      entry.plant = (await entry.client.discoverPlants())[0];
    }

    const raw = await entry.client.fetchAll(entry.plant);
    const snapshot = parseSnapshot(raw);

    entry.state = {
      connection: "online",
      plant: entry.plant,
      snapshot,
      lastUpdated: snapshot.timestamp,
      lastAttempt: attemptAt,
      error: null,
      pollIntervalMs: interval,
      serverTime: new Date().toISOString(),
    };
    entry.failures = 0;
    entry.nextAttemptAt = Date.now() + interval;
  } catch (error) {
    if (error instanceof CloudAuthError) {
      entries.delete(entry.key);
      throw error;
    }

    const message = errorMessage(error);
    entry.failures += 1;
    const backoff = Math.min(
      5 * 60_000,
      interval * 2 ** Math.min(entry.failures, 4),
    );
    entry.nextAttemptAt = Date.now() + backoff;
    entry.state = {
      ...entry.state,
      connection: entry.state.snapshot ? "stale" : "error",
      lastAttempt: attemptAt,
      error: message,
      pollIntervalMs: interval,
      serverTime: new Date().toISOString(),
    };
    console.error(`[onyx] poll failed: ${message}`);
  }

  return publicState(entry);
}

function pollOnce(entry: Entry): Promise<DashboardState> {
  if (!entry.inflight) {
    entry.inflight = poll(entry).finally(() => {
      entry.inflight = null;
    });
  }
  return entry.inflight;
}

export async function getDashboard(
  credentials: Credentials,
): Promise<DashboardState> {
  const entry = getEntry(credentials);
  const maxAgeMs = Math.max(10_000, Math.round(pollIntervalMs() * 0.8));

  const hasFreshData =
    entry.state.snapshot !== null &&
    Date.now() - entry.lastAttemptAt < maxAgeMs;

  if (hasFreshData) return publicState(entry);

  // After a failure, respect the backoff instead of hammering the upstream.
  const useBackoff = entry.state.snapshot === null && Date.now() < entry.nextAttemptAt;
  if (useBackoff) return publicState(entry);

  return pollOnce(entry);
}

export async function refreshDashboard(
  credentials: Credentials,
): Promise<DashboardState> {
  const entry = getEntry(credentials);
  const now = Date.now();
  if (now - entry.lastManualRefreshAt < REFRESH_COOLDOWN_MS) {
    throw new RefreshTooSoonError("Refresh requested too recently.");
  }
  entry.lastManualRefreshAt = now;
  return pollOnce(entry);
}

async function ensurePlant(entry: Entry): Promise<PlantInfo> {
  if (entry.plant) return entry.plant;
  const plants = await entry.client.discoverPlants();
  entry.plant = plants[0];
  entry.state = { ...entry.state, plant: entry.plant };
  return entry.plant;
}

function normalizeRange(rangeDays: number): NotificationRange {
  return (NOTIFICATION_RANGES as readonly number[]).includes(rangeDays)
    ? (rangeDays as NotificationRange)
    : 7;
}

export async function getNotificationFeed(
  credentials: Credentials,
  force = false,
  rangeDays: number = 7,
): Promise<NotificationsResponse> {
  const entry = getEntry(credentials);
  const range = normalizeRange(rangeDays);
  const now = Date.now();

  const cached = entry.notifications.get(range);
  if (!force && cached && now - cached.at < NOTIFICATIONS_TTL_MS) {
    return cached.data;
  }

  const inflight = entry.notificationsInflight.get(range);
  if (inflight) return inflight;

  const promise = (async () => {
    const plant = await ensurePlant(entry);
    const [logs, activeAlerts] = await Promise.all([
      entry.client.fetchLogs(plant, range),
      entry.client.fetchActiveAlerts(plant).catch(() => []),
    ]);
    const data = normalizeNotifications(logs, activeAlerts, range);
    entry.notifications.set(range, { at: Date.now(), data });
    return data;
  })().finally(() => {
    entry.notificationsInflight.delete(range);
  });

  entry.notificationsInflight.set(range, promise);
  return promise;
}

/**
 * Validate credentials against CloudInverter before creating a session. The
 * successful client is cached so the first dashboard render skips re-login.
 */
export async function validateLogin(
  credentials: Credentials,
): Promise<PlantInfo> {
  const client = new CloudInverterClient({
    username: credentials.username,
    password: credentials.password,
  });
  await client.login();
  const plants = await client.discoverPlants();

  const entry = getEntry(credentials);
  entry.client = client;
  entry.plant = plants[0];
  entry.state = {
    ...entry.state,
    plant: entry.plant,
    pollIntervalMs: pollIntervalMs(),
    serverTime: new Date().toISOString(),
  };
  return entry.plant;
}

function normalizeInsightDate(period: InsightPeriod, input: string): string {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");

  if (period === "day") {
    return /^\d{4}-\d{2}-\d{2}$/.test(input)
      ? input
      : `${year}-${month}-${day}`;
  }
  if (period === "month") {
    return /^\d{4}-\d{2}$/.test(input) ? input : `${year}-${month}`;
  }
  return /^\d{4}$/.test(input) ? input : year;
}

export async function getInsights(
  credentials: Credentials,
  periodInput: string,
  dateInput: string,
): Promise<InsightsResponse> {
  const period: InsightPeriod =
    periodInput === "month" || periodInput === "year" ? periodInput : "day";
  const date = normalizeInsightDate(period, dateInput ?? "");
  const key = `${period}:${date}`;
  const entry = getEntry(credentials);

  const cached = entry.insights.get(key);
  if (cached && Date.now() - cached.at < INSIGHTS_TTL_MS) {
    return cached.data;
  }

  const plant = await ensurePlant(entry);
  let data: InsightsResponse;

  if (period === "day") {
    const [split, curve] = await Promise.all([
      entry.client.fetchDaySplit(plant, date),
      entry.client.fetchDayCurve(plant, date),
    ]);
    data = {
      period,
      date,
      label: insightLabel(period, date),
      fetchedAt: new Date().toISOString(),
      energySplit: toEnergySplit(split),
      curve: toDayCurve(curve),
      points: [],
      totals: null,
    };
  } else {
    const rows = await entry.client.fetchAreaCurve(plant, date);
    const points = toEnergyPoints(rows, period);
    data = {
      period,
      date,
      label: insightLabel(period, date),
      fetchedAt: new Date().toISOString(),
      energySplit: null,
      curve: [],
      points,
      totals: sumEnergyPoints(points),
    };
  }

  entry.insights.set(key, { at: Date.now(), data });
  if (entry.insights.size > 30) {
    const oldest = entry.insights.keys().next().value;
    if (oldest) entry.insights.delete(oldest);
  }
  return data;
}

/** Drop cached tokens and data when a user signs out. */
export function forgetCredentials(credentials: Credentials): void {
  entries.delete(cacheKey(credentials));
}

export { CloudAuthError };
