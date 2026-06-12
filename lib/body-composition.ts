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
