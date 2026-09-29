const KEY = "nutrivita-profile-name"
function storage(): Storage | null {
  if (process.env.NEXT_PUBLIC_UI_DEMO === "true" || typeof window === "undefined") return null
  try { return window.localStorage } catch { return null }
}
export function readProfileName(): string | null {
  try { return storage()?.getItem(KEY) ?? null } catch { return null }
}
export function writeProfileName(name: string): void {
  try { storage()?.setItem(KEY, name) } catch { /* storage unavailable */ }
}
export function clearProfileName(): void {
  try { storage()?.removeItem(KEY) } catch { /* storage unavailable */ }
}
