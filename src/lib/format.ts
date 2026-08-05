const HOUSEHOLD_TIME_ZONE = "America/Chicago";

export function formatDateTime(ts: string): string {
  return new Date(ts).toLocaleString("en-US", { timeZone: HOUSEHOLD_TIME_ZONE });
}
