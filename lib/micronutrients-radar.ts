/**
 * AL-RADAR — Calcul radar vitamines & minéraux vs VNR ANSES
 *
 * Règle critique sur les NULL :
 * Un champ micronutriment null/undefined dans un aliment ≠ 0.
 * Il signifie "donnée inconnue". Seuls les aliments ayant la donnée
 * (valeur non-null et non-undefined) entrent dans la moyenne pondérée.
 */

import type { MealEntry } from "@/lib/types"

// ─── Types publics ─────────────────────────────────────────────────────────────

export type RadarNutrientKey =
  | "vitC"
  | "vitD"
  | "b9"
  | "b12"
  | "iron"
  | "calcium"
  | "magnesium"
  | "zinc"

export type RadarNutrient = {
  key: RadarNutrientKey
  label: string
  valuePercent: number   // apport moyen / VNR * 100, plafonné à 120
  completeness: number   // 0..100 : % des aliments ayant la donnée
}

export type RadarResult = {
  nutrients: RadarNutrient[]
  overallCompleteness: number  // moyenne des complétudes des 8 axes
}

// ─── VNR ANSES (valeurs par défaut intégrées) ─────────────────────────────────

/** µg pour vitD, B9, B12 ; mg pour les autres. Valeurs ANSES 2021. */
export type VnrEntry = { male: number; female: number } | number

export const DEFAULT_VNR: Record<RadarNutrientKey, VnrEntry> = {
  vitC:      110,                              // mg/j — même hommes/femmes (ANSES 2021)
  vitD:      15,                               // µg/j
  b9:        330,                              // µg/j — EAR adulte ANSES
  b12:       4,                                // µg/j
  iron:      { male: 11, female: 16 },         // mg/j — femmes préménopausées
  calcium:   1000,                             // mg/j
  magnesium: { male: 380, female: 300 },       // mg/j
  zinc:      { male: 11, female: 8 },          // mg/j
}

// ─── Clés CIQUAL dans FoodItem (champs optionnels) ────────────────────────────

/**
 * Correspondance entre RadarNutrientKey et le champ de FoodItem
 * qui stocke la valeur en mg (ou µg) pour 100 g.
 */
export const NUTRIENT_FIELD_MAP: Record<RadarNutrientKey, string> = {
  vitC:      "vit_c_mg",
  vitD:      "vit_d_ug",
  b9:        "b9_ug",
  b12:       "b12_ug",
  iron:      "iron_mg",
  calcium:   "calcium_mg",
  magnesium: "magnesium_mg",
  zinc:      "zinc_mg",
}

/** Libellés courts affichés sur les axes du radar */
export const NUTRIENT_LABELS: Record<RadarNutrientKey, string> = {
  vitC:      "Vit. C",
  vitD:      "Vit. D",
  b9:        "Folates",
  b12:       "Vit. B12",
  iron:      "Fer",
  calcium:   "Calcium",
  magnesium: "Magnésium",
  zinc:      "Zinc",
}

const AXES_ORDER: RadarNutrientKey[] = [
  "vitC", "vitD", "b9", "b12", "iron", "calcium", "magnesium", "zinc",
]

// ─── Algorithme principal ─────────────────────────────────────────────────────

/**
 * Calcule les données radar à partir des entrées journal.
 *
 * @param mealEntries Entrées journal de la période sélectionnée.
 * @param sex         Sexe de l'utilisateur (pour VNR différenciées).
 * @param vnr         Table VNR — accepte DEFAULT_VNR ou une surcharge partielle.
 */
export function calcRadarData(
  mealEntries: MealEntry[],
  sex: "male" | "female" | "other",
  vnr: Record<string, VnrEntry> = DEFAULT_VNR,
): RadarResult {
  const totalEntries = mealEntries.length

  // Résoudre le sexe pour les VNR différenciées
  const effectiveSex: "male" | "female" = sex === "female" ? "female" : "male"

  const nutrients: RadarNutrient[] = AXES_ORDER.map((key) => {
    const field = NUTRIENT_FIELD_MAP[key]
    const vnrEntry = (vnr[key] ?? DEFAULT_VNR[key]) as VnrEntry
    const vnrValue =
      typeof vnrEntry === "number"
        ? vnrEntry
        : vnrEntry[effectiveSex]

    if (totalEntries === 0 || vnrValue <= 0) {
      return {
        key,
        label: NUTRIENT_LABELS[key],
        valuePercent: 0,
        completeness: 0,
      }
    }

    // Accumuler uniquement les aliments ayant la donnée non-null
    let sumIntake = 0     // somme des apports (mg ou µg) sur la période
    let countWithData = 0 // nb aliments ayant la donnée

    for (const entry of mealEntries) {
      const food = entry.food as unknown as Record<string, unknown>
      const rawValue = food[field]
      // null ET undefined = donnée inconnue (ne pas compter)
      if (rawValue === null || rawValue === undefined) continue
      const numValue = Number(rawValue)
      if (!isFinite(numValue)) continue

      countWithData++
      // Valeur pour 100 g → on ramène à entry.amount grams
      sumIntake += (numValue * entry.amount) / 100
    }

    if (countWithData === 0) {
      return {
        key,
        label: NUTRIENT_LABELS[key],
        valuePercent: 0,
        completeness: 0,
      }
    }

    // Apport total sur la période. Pour moyenner sur la période entière,
    // on divise par le nombre de jours distincts dans les entrées.
    const distinctDates = new Set(mealEntries.map((e) => e.date))
    const nbDays = Math.max(1, distinctDates.size)
    const avgDailyIntake = sumIntake / nbDays

    // valuePercent = apport moyen / VNR * 100, plafonné à 120
    const valuePercent = Math.min(120, Math.round((avgDailyIntake / vnrValue) * 100))

    // completeness = nb aliments avec donnée / nb total aliments × 100
    const completeness = Math.round((countWithData / totalEntries) * 100)

    return {
      key,
      label: NUTRIENT_LABELS[key],
      valuePercent,
      completeness,
    }
  })

  const overallCompleteness =
    nutrients.length > 0
      ? Math.round(
          nutrients.reduce((s, n) => s + n.completeness, 0) / nutrients.length
        )
      : 0

  return { nutrients, overallCompleteness }
}
