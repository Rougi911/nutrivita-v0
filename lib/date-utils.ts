/**
 * Returns the local date as a YYYY-MM-DD string.
 * Uses getFullYear/getMonth/getDate (local time) instead of toISOString() (UTC)
 * to avoid day-shift bugs for users in UTC+ timezones.
 */
export function getLocalDateStr(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
