import type { TranslationKey } from "@/lib/types"

/**
 * S13 — « Dissipation des calories » (cadrage bien-être REG-05).
 * Information indicative, non médicale : estime une durée d'activité équivalente
 * à un excédent calorique du jour. Jamais culpabilisant, pas un objectif.
 */

export type SportIntensity = "gentle" | "moderate" | "intense"

export interface Sport {
  /** Clé stable (mapping icône lucide côté composant). */
  key: string
  /** Clé i18n du libellé (FR/AR/EN). */
  labelKey: TranslationKey
  /** MET (compendium d'activités physiques). */
  met: number
  intensity: SportIntensity
}

/** Table MET initiale (extensible) — groupée par intensité ressentie. */
export const SPORTS: Sport[] = [
  // Doux
  { key: "stretching",      labelKey: "sportStretching",      met: 2.3,  intensity: "gentle" },
  { key: "yoga",            labelKey: "sportYoga",            met: 2.5,  intensity: "gentle" },
  { key: "walkCasual",      labelKey: "sportWalkCasual",      met: 3.0,  intensity: "gentle" },
  { key: "taiChi",          labelKey: "sportTaiChi",          met: 3.0,  intensity: "gentle" },
  // Modéré
  { key: "walkBrisk",       labelKey: "sportWalkBrisk",       met: 5.0,  intensity: "moderate" },
  { key: "dance",           labelKey: "sportDance",           met: 5.0,  intensity: "moderate" },
  { key: "aquaGym",         labelKey: "sportAquaGym",         met: 5.5,  intensity: "moderate" },
  { key: "swim",            labelKey: "sportSwim",            met: 6.0,  intensity: "moderate" },
  { key: "hiking",          labelKey: "sportHiking",          met: 6.0,  intensity: "moderate" },
  { key: "basketball",      labelKey: "sportBasketball",      met: 6.5,  intensity: "moderate" },
  { key: "cyclingLeisure",  labelKey: "sportCyclingLeisure",  met: 6.8,  intensity: "moderate" },
  { key: "football",        labelKey: "sportFootball",        met: 7.0,  intensity: "moderate" },
  // Intense
  { key: "hiit",            labelKey: "sportHiit",            met: 8.0,  intensity: "intense" },
  { key: "running",         labelKey: "sportRunning",         met: 8.3,  intensity: "intense" },
  { key: "swimFast",        labelKey: "sportSwimFast",        met: 9.8,  intensity: "intense" },
  { key: "cyclingIntense",  labelKey: "sportCyclingIntense",  met: 10.0, intensity: "intense" },
  { key: "jumpRope",        labelKey: "sportJumpRope",        met: 11.0, intensity: "intense" },
]

export const INTENSITY_ORDER: SportIntensity[] = ["gentle", "moderate", "intense"]

/** Sports regroupés par intensité, dans l'ordre Doux → Modéré → Intense. */
export function sportsByIntensity(): Record<SportIntensity, Sport[]> {
  return {
    gentle:   SPORTS.filter((s) => s.intensity === "gentle"),
    moderate: SPORTS.filter((s) => s.intensity === "moderate"),
    intense:  SPORTS.filter((s) => s.intensity === "intense"),
  }
}

/**
 * Durée (minutes, arrondie) pour dissiper `excessKcal` à un MET donné et un poids donné.
 * Formule : durée_min = excédent_kcal ÷ (MET × 3,5 × poids_kg ÷ 200).
 * Retourne 0 si les entrées sont invalides (pas d'excédent, MET/poids ≤ 0).
 */
export function dissipationMinutes(excessKcal: number, met: number, weightKg: number): number {
  if (!(excessKcal > 0) || !(met > 0) || !(weightKg > 0)) return 0
  const kcalPerMin = (met * 3.5 * weightKg) / 200
  return Math.round(excessKcal / kcalPerMin)
}

/**
 * Excédent calorique du jour (consommé − objectif ajusté de l'activité, créditée
 * et plafonnée à 1000 kcal comme AL-03). > 0 = excédent. Sinon 0.
 */
export function dailyExcessKcal(consumed: number, target: number, burned = 0): number {
  const effectiveTarget = target + Math.min(Math.max(0, burned), 1000)
  return Math.max(0, Math.round(consumed - effectiveTarget))
}

/**
 * Le poids du profil est-il périmé (> `maxDays` jours) ou absent ?
 * `weightDateISO` = date YYYY-MM-DD de la dernière pesée ; undefined/null = absent → périmé.
 */
export function isWeightStale(
  weightDateISO: string | null | undefined,
  now: Date = new Date(),
  maxDays = 90
): boolean {
  if (!weightDateISO) return true
  const d = new Date(weightDateISO + "T00:00:00")
  if (Number.isNaN(d.getTime())) return true
  const days = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  return days > maxDays
}
