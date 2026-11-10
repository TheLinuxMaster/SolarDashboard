import type {
  InverterNotification,
  NotificationSeverity,
  NotificationsResponse,
} from "@/lib/types";
import { FAULT_CODES, messageForCode } from "./error-codes";
import type { ActiveAlertEntry, InverterLogEntry } from "./log-types";

function severityFor(code: number): NotificationSeverity {
  return FAULT_CODES.has(code) ? "fault" : "notice";
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function deviceName(entry: InverterLogEntry): string {
  return text(entry.GoodsName) || "Inverter";
}

/**
 * Normalize the web log search (`infoerror`) into the dashboard's alert shape.
 * `status: "0"` means the log is still open; `"1"` means it has cleared.
 */
export function normalizeNotifications(
  logs: InverterLogEntry[],
  activeAlerts: ActiveAlertEntry[] = [],
  rangeDays = 7,
): NotificationsResponse {
  const notifications: InverterNotification[] = [];
  const seen = new Set<string>();

  for (const [index, entry] of logs.entries()) {
    const code = Number(entry.ErrorCode);
    if (!Number.isFinite(code) || code < 0) continue;

    const message = messageForCode(code);
    if (message === "Reserved") continue;

    const device = deviceName(entry);
    const time = text(entry.Time);
    const key = `${device}|${code}|${time}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const active = String(entry.status) === "0";

    notifications.push({
      id: `log-${key}-${index}`,
      code,
      message,
      severity: severityFor(code),
      active,
      device,
      model: text(entry.ModelName),
      time,
      source: active ? "active" : "history",
    });
  }

  for (const [index, alert] of activeAlerts.entries()) {
    const code = Number(alert.ErrorCode);
    if (!Number.isFinite(code) || code < 0) continue;

    const message = messageForCode(code);
    if (message === "Reserved") continue;

    const device = text(alert.GoodsName) || "Inverter";
    const time = text(alert.Time);
    const key = `${device}|${code}|${time}`;
    if (seen.has(key)) {
      const existing = notifications.find(
        (item) => `${item.device}|${item.code}|${item.time}` === key,
      );
      if (existing) {
        existing.active = true;
        existing.source = "active";
      }
      continue;
    }
    seen.add(key);

    notifications.push({
      id: `active-${key}-${index}`,
      code,
      message,
      severity: severityFor(code),
      active: true,
      device,
      model: "",
      time,
      source: "active",
    });
  }

  notifications.sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return b.time.localeCompare(a.time);
  });

  return {
    notifications,
    fetchedAt: new Date().toISOString(),
    total: notifications.length,
    faults: notifications.filter((item) => item.severity === "fault").length,
    notices: notifications.filter((item) => item.severity === "notice").length,
    activeCount: notifications.filter((item) => item.active).length,
    rangeDays,
  };
}
