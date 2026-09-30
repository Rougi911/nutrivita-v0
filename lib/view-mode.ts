export type ViewMode = "summary" | "details"
export const VIEW_MODE_KEY = "nutralance-view-mode-v1"
export function readViewMode(): ViewMode {
  if (typeof window === "undefined") return "summary"
  try {
    return window.localStorage.getItem(VIEW_MODE_KEY) === "details"
      ? "details"
      : "summary"
  } catch {
    return "summary"
  }
}
export function writeViewMode(mode: ViewMode): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(VIEW_MODE_KEY, mode)
  } catch {
    /* preference still works in memory */
  }
}
