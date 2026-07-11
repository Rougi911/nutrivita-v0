const CHART_MODE_KEY = "chart-mode-advanced"

/** Mode graphiques par défaut : simple (barres, plus accessible aux non-initiés). */
export const DEFAULT_ADVANCED_CHARTS = false

/**
 * P2 — Persistance du mode graphiques (simple / avancé) pour Glycémie et Bilan.
 * Lit la préférence stockée ; renvoie null si absente (SSR-safe).
 */
export function getStoredChartMode(): boolean | null {
  if (typeof window === "undefined") return null
  const v = localStorage.getItem(CHART_MODE_KEY)
  return v === "1" ? true : v === "0" ? false : null
}

/** Persiste le mode graphiques choisi (SSR-safe). */
export function setStoredChartMode(advanced: boolean): void {
  if (typeof window === "undefined") return
  localStorage.setItem(CHART_MODE_KEY, advanced ? "1" : "0")
}
