// Date helpers. Meals are keyed by calendar day, so we normalize everything to
// midnight UTC and pass dates around as "YYYY-MM-DD" strings to avoid timezone
// drift between the server and the browser.

/** "YYYY-MM-DD" for a Date, using its UTC calendar day. */
export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Today's date as "YYYY-MM-DD" in the user's local timezone. */
export function todayKey(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/** Parse a "YYYY-MM-DD" key into a Date at 00:00:00 UTC (for DB storage). */
export function dateKeyToUTC(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

/** Human-friendly label, e.g. "Jul 1, 2026". */
export function formatDate(key: string): string {
  return dateKeyToUTC(key).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Short label for chart axes, e.g. "Jul 1". */
export function formatDateShort(key: string): string {
  return dateKeyToUTC(key).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Full timestamp label, e.g. "Jul 1, 2026, 2:30 PM". */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
