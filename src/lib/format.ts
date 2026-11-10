const LOCALE = "en-GB";

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function splitPower(watts: number): { value: string; unit: string } {
  const abs = Math.abs(watts);
  if (abs >= 1000) {
    const digits = abs >= 10_000 ? 1 : 2;
    return { value: (watts / 1000).toFixed(digits), unit: "kW" };
  }
  return { value: String(Math.round(watts)), unit: "W" };
}

export function formatPower(watts: number): string {
  const { value, unit } = splitPower(watts);
  return `${value} ${unit}`;
}

export function splitEnergy(kwh: number): { value: string; unit: string } {
  if (Math.abs(kwh) >= 1000) {
    return { value: (kwh / 1000).toFixed(2), unit: "MWh" };
  }
  return {
    value: kwh.toFixed(Math.abs(kwh) < 10 ? 2 : 1),
    unit: "kWh",
  };
}

export function formatEnergy(kwh: number): string {
  const { value, unit } = splitEnergy(kwh);
  return `${value} ${unit}`;
}

export function formatPercent(value: number, digits = 0): string {
  const rounded = Number.isFinite(value) ? value : 0;
  return `${rounded.toFixed(digits)}%`;
}

export function formatAxisPower(watts: number): string {
  if (Math.abs(watts) >= 1000) {
    const value = watts / 1000;
    return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}k`;
  }
  return String(Math.round(watts));
}

export function formatClock(iso: string | number | null): string {
  if (iso === null) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function formatDate(iso: string | number | null): string {
  if (iso === null) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatRelative(iso: string | null, now: number): string {
  if (!iso) return "waiting for data";
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "waiting for data";
  if (!now) return "just now";
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 8) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function gridFlow(powerW: number): "import" | "export" | "idle" {
  if (powerW > 25) return "import";
  if (powerW < -25) return "export";
  return "idle";
}

export function batteryFlow(
  charging: boolean,
  powerW: number,
): "charge" | "discharge" | "idle" {
  if (powerW < 25) return "idle";
  return charging ? "charge" : "discharge";
}

export function wifiLevel(strength: number): number {
  if (!Number.isFinite(strength) || strength === 0) return 0;
  if (strength >= -55) return 4;
  if (strength >= -65) return 3;
  if (strength >= -75) return 2;
  return 1;
}
