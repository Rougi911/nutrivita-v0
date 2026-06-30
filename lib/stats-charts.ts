/**
 * Helpers purs pour les graphes du Bilan (testables hors React).
 * Voir SPEC-TEST-GRAPHES-BILAN : BUG-1/2/3 + EVO-1/2/3.
 */

export type MetricId = "poids" | "calories" | "ecart" | "glycemie"

// ── Calories : code couleur des barres vs cible (BUG-1) ────────────────────────
export const TARGET_BAND = 100 // kcal de tolérance autour de la cible
export const HIGH_OVER = 300 // au-delà de cible + ce seuil → trop haut (rouge)

/**
 * Couleur d'une barre calorie selon l'écart à la cible.
 * `target` DOIT être > 0 (sinon repli neutre, jamais une couleur fausse) — corrige
 * le bug « toutes les barres marron » quand la cible n'était pas définie (NaN).
 */
export function getBarFill(calories: number, target: number): string {
  if (!calories) return "var(--muted)" // aucune saisie ce jour
  if (!target || !Number.isFinite(target) || target <= 0) return "var(--muted)" // cible invalide
  const diff = calories - target
  if (Math.abs(diff) <= TARGET_BAND) return "var(--primary)" // vert : dans la cible
  if (diff > HIGH_OVER) return "var(--risk)" // rouge : trop haut
  return "var(--amber)" // orange : trop bas / modérément haut
}

// ── Glycémie : bande de référence fixe (EVO-2) ─────────────────────────────────
// ⚠️ Seuils à confirmer médicalement. Zone de référence à jeun, en g/L.
export const GLUCOSE_BAND = { low: 0.7, high: 1.1 } as const

export type GlucoseZone = "low" | "in" | "high"

/** Classe une valeur de glycémie (g/L) par rapport à la zone de référence. */
export function classifyGlucose(
  value: number,
  band: { low: number; high: number } = GLUCOSE_BAND
): GlucoseZone {
  if (value < band.low) return "low"
  if (value > band.high) return "high"
  return "in"
}

// ── Poids : bande dynamique + variations rapides (EVO-3) ───────────────────────
export const WEIGHT_BAND_PCT = 0.01 // ±1 % autour de la moyenne mobile
export const WEIGHT_RAPID_KG_PER_WEEK = 1.5 // au-delà → variation « rapide » (à confirmer)

export interface DatedValue {
  date: string // YYYY-MM-DD
  value: number
}
export interface WeightBandPoint extends DatedValue {
  low: number // borne basse de la bande dynamique
  high: number // borne haute
  rapid: boolean // variation rapide vs point précédent
}

/**
 * Bande dynamique « qui suit le poids » : moyenne mobile (fenêtre glissante `window`
 * points) ± `pct`, et drapeau `rapid` si la pente dépasse `rapidPerWeek` kg/semaine.
 * Les points doivent être triés par date croissante.
 */
export function computeWeightBand(
  points: DatedValue[],
  pct: number = WEIGHT_BAND_PCT,
  rapidPerWeek: number = WEIGHT_RAPID_KG_PER_WEEK,
  window = 7
): WeightBandPoint[] {
  return points.map((p, i) => {
    const from = Math.max(0, i - window + 1)
    const slice = points.slice(from, i + 1)
    const ma = slice.reduce((s, x) => s + x.value, 0) / slice.length
    let rapid = false
    if (i > 0) {
      const prev = points[i - 1]
      const days = Math.max(
        1,
        (new Date(p.date).getTime() - new Date(prev.date).getTime()) / 86400000
      )
      const ratePerWeek = Math.abs(p.value - prev.value) / (days / 7)
      rapid = ratePerWeek > rapidPerWeek
    }
    return { date: p.date, value: p.value, low: ma * (1 - pct), high: ma * (1 + pct), rapid }
  })
}

// ── Écart calorique (BUG-3) ────────────────────────────────────────────────────
/**
 * Écart = dépense totale − apport = (TDEE de maintien + exercice brûlé) − ingéré.
 * Positif = déficit. Distinct des calories ingérées même sans exercice (≠ ancien bug
 * où écart = ingéré − exercice = ingéré quand exercice = 0).
 */
export function computeEcart(intake: number, tdeeMaintain: number, burned: number): number {
  return Math.round(tdeeMaintain + burned - intake)
}

// ── Fusion multi-séries pour la superposition (EVO-1) ──────────────────────────
/** Unité d'une métrique (sert à regrouper les axes Y). */
export function metricUnit(m: MetricId): string {
  return m === "poids" ? "kg" : m === "glycemie" ? "g/L" : "kcal"
}

/**
 * Fusionne plusieurs séries datées en lignes { date, [metric]: value } sur l'union
 * des dates, triées. Les dates manquantes pour une série restent absentes (→ courbe
 * interrompue / connectNulls côté graphe).
 */
export function mergeSeries(
  series: Partial<Record<MetricId, DatedValue[]>>
): Array<Record<string, number | string>> {
  const dates = new Set<string>()
  for (const arr of Object.values(series)) for (const p of arr ?? []) dates.add(p.date)
  const rows = [...dates].sort().map((date) => {
    const row: Record<string, number | string> = { date }
    for (const [m, arr] of Object.entries(series) as [MetricId, DatedValue[]][]) {
      const hit = arr?.find((p) => p.date === date)
      if (hit) row[m] = hit.value
    }
    return row
  })
  return rows
}

/** Axes distincts (unités) pour les métriques sélectionnées : 1ʳᵉ à gauche, autres à droite. */
export function axisLayout(metrics: MetricId[]): { unit: string; orientation: "left" | "right" }[] {
  const units: string[] = []
  for (const m of metrics) {
    const u = metricUnit(m)
    if (!units.includes(u)) units.push(u)
  }
  return units.map((unit, i) => ({ unit, orientation: i === 0 ? "left" : "right" }))
}
