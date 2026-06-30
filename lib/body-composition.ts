/** AL-06 — Body composition estimates (Deurenberg + Forbes). */

/**
 * Deurenberg body fat % estimate.
 * BF% = 1.20*BMI + 0.23*age - 10.8*sex - 5.4
 * sex: 1 = male, 0 = female
 */
export function deurenbergBodyFat(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: "male" | "female" | "other"
): number {
  const heightM = heightCm / 100
  const bmi = weightKg / (heightM * heightM)
  const sexFactor = sex === "male" ? 1 : 0
  const bf = 1.2 * bmi + 0.23 * age - 10.8 * sexFactor - 5.4
  return Math.max(0, parseFloat(bf.toFixed(1)))
}

/** Lean body mass (LBM) = weight * (1 - BF%/100). */
export function leanBodyMass(weightKg: number, bodyFatPercent: number): number {
  return parseFloat((weightKg * (1 - bodyFatPercent / 100)).toFixed(1))
}

/** BMI */
export function bmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1))
}

/**
 * Métabolisme de base (Mifflin-St Jeor), kcal/jour.
 * BMR = 10*kg + 6.25*cm − 5*age + s  (s = +5 homme, −161 femme, −78 autre = moyenne).
 */
export function bmr(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: "male" | "female" | "other"
): number {
  const s = sex === "male" ? 5 : sex === "female" ? -161 : -78
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + s)
}

/** Facteurs d'activité par niveau (1 sédentaire → 5 très intense). */
const ACTIVITY_FACTORS = [1.2, 1.375, 1.55, 1.725, 1.9] as const

/**
 * Dépense énergétique totale (TDEE) de maintien, kcal/jour = BMR × facteur d'activité.
 * `activityLevel` ∈ 1..5 ; valeurs hors plage repliées sur « sédentaire ».
 */
export function tdee(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: "male" | "female" | "other",
  activityLevel: number
): number {
  const factor = ACTIVITY_FACTORS[Math.min(4, Math.max(0, (activityLevel || 1) - 1))]
  return Math.round(bmr(weightKg, heightCm, age, sex) * factor)
}
