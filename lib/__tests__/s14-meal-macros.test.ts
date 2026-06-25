/**
 * S14 — Frontend : totaux par repas + segments de l'anneau macros.
 * Trace : EB-05 (bilan journalier) · maquette onglets repas.
 *
 * TU-S14-1 : computeMealTotals met à l'échelle kcal+macros selon la quantité
 * TU-S14-2 : repas vide → totaux à zéro (état vide géré)
 * TU-S14-3 : macroArcSegments — fractions caloriques (4/4/9), somme = 1
 * TU-S14-4 : repas sans macro → toutes fractions à 0 (pas de division par zéro)
 * TU-S14-5 : bascule d'onglet = recalcul (totaux distincts par mealType)
 */
import { describe, it, expect } from "vitest"
import { computeMealTotals, macroArcSegments } from "../meal-macros"
import type { MealEntry, FoodItem } from "../types"

function food(over: Partial<FoodItem>): FoodItem {
  return {
    id: "f", name: "X", cuisine: "International",
    calories: 0, protein: 0, carbs: 0, fat: 0, source: "ciqual",
    ...over,
  }
}

function entry(mealType: MealEntry["mealType"], f: FoodItem, amount: number, id = "e"): MealEntry {
  return { id, foodId: f.id, food: f, amount, mealType, date: "2026-06-25", createdAt: `${id}-ts` }
}

describe("computeMealTotals", () => {
  it("TU-S14-1 : met à l'échelle selon la quantité", () => {
    // 200g de poulet (165 kcal, 31 P, 0 C, 3.6 L /100g) → ×2
    const e = entry("lunch", food({ calories: 165, protein: 31, carbs: 0, fat: 3.6 }), 200)
    const t = computeMealTotals([e])
    expect(t.kcal).toBeCloseTo(330, 5)
    expect(t.protein).toBeCloseTo(62, 5)
    expect(t.fat).toBeCloseTo(7.2, 5)
  })

  it("additionne plusieurs entrées d'un même repas", () => {
    const e1 = entry("breakfast", food({ calories: 100, protein: 10, carbs: 5, fat: 2 }), 100, "a")
    const e2 = entry("breakfast", food({ calories: 200, protein: 0, carbs: 40, fat: 1 }), 50, "b")
    const t = computeMealTotals([e1, e2])
    expect(t.kcal).toBeCloseTo(100 + 100, 5)   // 100 + (200×0.5)
    expect(t.carbs).toBeCloseTo(5 + 20, 5)
  })

  it("TU-S14-2 : repas vide → zéros", () => {
    expect(computeMealTotals([])).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 })
  })
})

describe("macroArcSegments", () => {
  it("TU-S14-3 : fractions caloriques 4/4/9, somme = 1", () => {
    // 10 P (40 kcal), 10 C (40 kcal), 10 L (90 kcal) → total 170
    const segs = macroArcSegments({ protein: 10, carbs: 10, fat: 10 })
    const byKey = Object.fromEntries(segs.map((s) => [s.key, s]))
    expect(byKey.protein.kcal).toBe(40)
    expect(byKey.fat.kcal).toBe(90)
    expect(byKey.protein.fraction).toBeCloseTo(40 / 170, 5)
    expect(byKey.fat.fraction).toBeCloseTo(90 / 170, 5)
    expect(segs.reduce((s, x) => s + x.fraction, 0)).toBeCloseTo(1, 5)
  })

  it("TU-S14-4 : repas sans macro → fractions 0 (pas de NaN)", () => {
    const segs = macroArcSegments({ protein: 0, carbs: 0, fat: 0 })
    expect(segs.every((s) => s.fraction === 0)).toBe(true)
    expect(segs.some((s) => Number.isNaN(s.fraction))).toBe(false)
  })
})

describe("bascule d'onglet (filtrage par mealType)", () => {
  it("TU-S14-5 : totaux distincts selon le repas sélectionné", () => {
    const all = [
      entry("breakfast", food({ calories: 100, protein: 5, carbs: 10, fat: 2 }), 100, "a"),
      entry("dinner",    food({ calories: 400, protein: 20, carbs: 30, fat: 15 }), 100, "b"),
    ]
    const bf = computeMealTotals(all.filter((e) => e.mealType === "breakfast"))
    const dn = computeMealTotals(all.filter((e) => e.mealType === "dinner"))
    expect(bf.kcal).toBe(100)
    expect(dn.kcal).toBe(400)
  })
})
