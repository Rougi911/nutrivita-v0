/**
 * Conversions et formatage d'unités (ultrareview U1).
 * Stockage interne TOUJOURS métrique : poids en kg, taille en cm, énergie en kcal.
 * Conversion uniquement à l'AFFICHAGE (display*) et à la SAISIE (from*), comme glucose-units.ts.
 */

export type WeightUnit = "kg" | "lbs"
export type HeightUnit = "cm" | "ft"
export type EnergyUnit = "kcal" | "kJ"

const LB_PER_KG = 2.2046226218
const CM_PER_INCH = 2.54
const KJ_PER_KCAL = 4.184

// ── Poids ────────────────────────────────────────────────────────────────────
export const kgToLbs = (kg: number): number => kg * LB_PER_KG
export const lbsToKg = (lbs: number): number => lbs / LB_PER_KG

/** Valeur numérique du poids (kg stocké) dans l'unité d'affichage, arrondie à 0,1. */
export function toWeightUnit(kg: number, unit: WeightUnit): number {
  const v = unit === "lbs" ? kgToLbs(kg) : kg
  return Math.round(v * 10) / 10
}
/** Saisie utilisateur (dans son unité) → kg pour le stockage. */
export function fromWeightUnit(value: number, unit: WeightUnit): number {
  return unit === "lbs" ? lbsToKg(value) : value
}
/** Chaîne « 70.0 kg » / « 154.3 lbs ». */
export function formatWeight(kg: number, unit: WeightUnit): string {
  return `${toWeightUnit(kg, unit).toFixed(1)} ${unit}`
}

// ── Taille ───────────────────────────────────────────────────────────────────
export const cmToInches = (cm: number): number => cm / CM_PER_INCH
export const inchesToCm = (inches: number): number => inches * CM_PER_INCH

/** { ft, in } depuis des cm (pouces arrondis). */
export function cmToFtIn(cm: number): { ft: number; in: number } {
  const totalInches = Math.round(cmToInches(cm))
  return { ft: Math.floor(totalInches / 12), in: totalInches % 12 }
}
export function ftInToCm(ft: number, inches: number): number {
  return inchesToCm(ft * 12 + inches)
}
/** Chaîne « 170 cm » / « 5'7" ». */
export function formatHeight(cm: number, unit: HeightUnit): string {
  if (unit === "ft") {
    const { ft, in: inch } = cmToFtIn(cm)
    return `${ft}'${inch}"`
  }
  return `${Math.round(cm)} cm`
}

// ── Énergie ──────────────────────────────────────────────────────────────────
export const kcalToKj = (kcal: number): number => kcal * KJ_PER_KCAL
export const kjToKcal = (kj: number): number => kj / KJ_PER_KCAL

/** Valeur numérique de l'énergie (kcal stockée) dans l'unité d'affichage, arrondie à l'entier. */
export function toEnergyUnit(kcal: number, unit: EnergyUnit): number {
  return Math.round(unit === "kJ" ? kcalToKj(kcal) : kcal)
}
/** Chaîne « 2000 kcal » / « 8368 kJ ». */
export function formatEnergy(kcal: number, unit: EnergyUnit): string {
  return `${toEnergyUnit(kcal, unit)} ${unit}`
}
