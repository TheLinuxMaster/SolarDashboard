import type {
  DashboardState,
  InsightPeriod,
  InsightsResponse,
  NotificationsResponse,
} from "./types";

export class UnauthorizedError extends Error {
  constructor() {
    super("Your session has ended.");
  }
}

function goToLogin(): void {
  if (typeof window === "undefined") return;
  window.location.assign("/login?reason=expired");
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    goToLogin();
    throw new UnauthorizedError();
  }

  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // Keep the HTTP fallback.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function getSummary(signal?: AbortSignal): Promise<DashboardState> {
  const response = await fetch("/api/summary", {
    signal,
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  return parseResponse<DashboardState>(response);
}

export async function postRefresh(): Promise<DashboardState> {
  const response = await fetch("/api/refresh", {
    method: "POST",
    headers: { Accept: "application/json" },
  });
  const body = await parseResponse<{ ok: true; state: DashboardState }>(response);
  return body.state;
}

export async function getInsights(
  period: InsightPeriod,
  date: string,
  signal?: AbortSignal,
): Promise<InsightsResponse> {
  const params = new URLSearchParams({ period, date });
  const response = await fetch(`/api/insights?${params.toString()}`, {
    signal,
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  return parseResponse<InsightsResponse>(response);
}

export async function getNotifications(
  refresh = false,
  days = 7,
  signal?: AbortSignal,
): Promise<NotificationsResponse> {
  const params = new URLSearchParams();
  params.set("days", String(days));
  if (refresh) params.set("refresh", "1");

  const response = await fetch(`/api/notifications?${params.toString()}`, {
    signal,
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  return parseResponse<NotificationsResponse>(response);
}
