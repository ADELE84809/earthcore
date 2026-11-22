/**
 * Time handling.
 *
 * Open-Meteo returns *local* time strings (e.g. `2026-11-22T18:15`) together
 * with `utc_offset_seconds`. To preserve scientific meaning we always convert
 * to a true UTC instant before storing a `valid_at`, and we render in the
 * location's own IANA zone for the user.
 */

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** Convert an Open-Meteo local time string + utc offset into an ISO UTC instant. */
export function localTimeToIso(local: string, utcOffsetSeconds: number): string | null {
  const m = LOCAL_RE.exec(local) ?? DATE_RE.exec(local);
  if (!m) return null;
  const [, y, mo, d, hh = "12", mi = "00"] = m;
  const ms = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(hh), Number(mi)) - utcOffsetSeconds * 1000;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function toDate(value: string | Date): Date | null {
  const d = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isoFromDateInput(value: string, endOfDay = false): string | null {
  const m = DATE_RE.exec(value);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), endOfDay ? 23 : 0, endOfDay ? 59 : 0, 0, 0));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function clampDateKey(value: string): string | null {
  return DATE_RE.test(value) ? value : null;
}

const timeFormatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${timeZone}|${JSON.stringify(options)}`;
  let fmt = timeFormatterCache.get(key);
  if (!fmt) {
    try {
      fmt = new Intl.DateTimeFormat("en-GB", { timeZone, ...options });
    } catch {
      fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...options });
    }
    timeFormatterCache.set(key, fmt);
  }
  return fmt;
}

/** "22 Nov 2026" in the location's own zone. */
export function formatDate(iso: string | null, timeZone = "UTC"): string {
  if (!iso) return "—";
  const d = toDate(iso);
  if (!d) return "—";
  return formatter(timeZone, { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

/** "18:15" in the location's own zone. */
export function formatTime(iso: string | null, timeZone = "UTC"): string {
  if (!iso) return "—";
  const d = toDate(iso);
  if (!d) return "—";
  return formatter(timeZone, { hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
}

/** "22 Nov, 18:15" in the location's own zone. */
export function formatDateTime(iso: string | null, timeZone = "UTC"): string {
  if (!iso) return "—";
  const d = toDate(iso);
  if (!d) return "—";
  return formatter(timeZone, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/** "22 Nov 2026, 18:15 UTC" — absolute reference for provenance displays. */
export function formatUtc(iso: string | null): string {
  if (!iso) return "—";
  const d = toDate(iso);
  if (!d) return "—";
  return `${d.toUTCString().slice(5, 16)}, ${d.toISOString().slice(11, 16)} UTC`;
}

export function formatLongDate(iso: string | null, timeZone = "UTC"): string {
  if (!iso) return "—";
  const d = toDate(iso);
  if (!d) return "—";
  return formatter(timeZone, { weekday: "short", day: "numeric", month: "long", year: "numeric" }).format(d);
}

/** Compact relative freshness label: "just now", "4 min ago", "3 h ago". */
export function relativeFromNow(iso: string | null, now: Date = new Date()): string {
  if (!iso) return "unknown";
  const d = toDate(iso);
  if (!d) return "unknown";
  const diff = now.getTime() - d.getTime();
  const abs = Math.abs(diff);
  const suffix = diff >= 0 ? "ago" : "from now";
  if (abs < 60_000) return diff >= 0 ? "just now" : "imminent";
  if (abs < 3_600_000) return `${Math.round(abs / 60_000)} min ${suffix}`;
  if (abs < 86_400_000) return `${Math.round(abs / 3_600_000)} h ${suffix}`;
  if (abs < 2_592_000_000) return `${Math.round(abs / 86_400_000)} d ${suffix}`;
  const months = Math.round(abs / 2_592_000_000);
  return `${months} mo ${suffix}`;
}

/** Age of a value in minutes, or null when the timestamp is unusable. */
export function ageMinutes(iso: string | null, now: Date = new Date()): number | null {
  if (!iso) return null;
  const d = toDate(iso);
  if (!d) return null;
  return Math.max(0, Math.round((now.getTime() - d.getTime()) / 60_000));
}

/** UTC timestamp used by HTTP cache headers. */
export function httpDate(iso: string | null): string | null {
  const d = iso ? toDate(iso) : null;
  return d ? d.toUTCString() : null;
}

/** Current time in an IANA zone, formatted for a dashboard clock. */
export function zoneClock(timeZone: string | null, at: Date = new Date()): { time: string; date: string } {
  const zone = timeZone && timeZone !== "GMT" ? timeZone : "UTC";
  return {
    time: formatTime(at.toISOString(), zone),
    date: formatDate(at.toISOString(), zone),
  };
}
