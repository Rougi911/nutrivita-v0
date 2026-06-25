import type { MealEntry } from "@/lib/types"

/** Totaux d'un repas (kcal + macros en grammes), mis à l'échelle de la quantité. */
export interface MealTotals {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

/** S14 — Totaux d'un repas à partir de ses entrées de journal (valeurs par 100g × amount/100). */
export function computeMealTotals(entries: MealEntry[]): MealTotals {
  return entries.reduce<MealTotals>(
    (acc, e) => {
      const f = e.amount / 100
      acc.kcal += e.food.calories * f
      acc.protein += e.food.protein * f
      acc.carbs += e.food.carbs * f
      acc.fat += e.food.fat * f
      return acc
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

export interface MacroSegment {
  key: "protein" | "carbs" | "fat"
  grams: number
  /** Apport calorique du macro (protéines/glucides 4 kcal/g, lipides 9 kcal/g). */
  kcal: number
  /** Part de l'apport calorique total des macros (0..1) ; 0 si repas vide. */
  fraction: number
}

const MACRO_KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const

/**
 * S14 — Segments de l'anneau macro d'un repas : arcs proportionnels à l'apport
 * CALORIQUE de chaque macro (cohérent avec l'anneau calorique central).
 * fractions ∈ [0,1], somme = 1 si le repas contient des macros, sinon toutes à 0.
 */
export function macroArcSegments(totals: Pick<MealTotals, "protein" | "carbs" | "fat">): MacroSegment[] {
  const segs = (["protein", "carbs", "fat"] as const).map((key) => {
    const grams = Math.max(0, totals[key] || 0)
    return { key, grams, kcal: grams * MACRO_KCAL_PER_G[key] }
  })
  const total = segs.reduce((s, seg) => s + seg.kcal, 0)
  return segs.map((seg) => ({ ...seg, fraction: total > 0 ? seg.kcal / total : 0 }))
}
