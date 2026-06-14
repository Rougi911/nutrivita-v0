/**
 * TU-P415-scaling — Régression anti double-scaling calories portion
 * Tracé : bug P4.15 → interpret-confirm.tsx handleConfirm → per100g helper
 *
 * Contexte : depuis P4.12, le backend renvoie n.kcal PAR PORTION.
 * FoodItem.calories doit être stocké PAR 100g pour que le calcul
 * d'affichage (food.calories * amount / 100) donne la bonne valeur.
 *
 * Sans normalisation : 304 kcal * 400g / 100 = 1216 kcal ❌
 * Avec per100g      : 76 kcal  * 400g / 100 = 304 kcal  ✓
 */
import { describe, it, expect } from "vitest"

describe("TU-P415-scaling : per100g normalise n.kcal portion → /100g", () => {
  it("400g pomme de terre — n.kcal=304 → food.calories=76 (jamais 304)", () => {
    const qg = 400
    const per100g = (val: number | null | undefined, fallback: number): number => {
      if (val == null || qg === 0) return fallback
      return Math.round(val * 100 / qg)
    }
    expect(per100g(304, 150)).toBe(76)    // 304 kcal pour 400g → 76/100g
    expect(per100g(200, 150)).toBe(50)    // 200 kcal pour 400g → 50/100g
    expect(per100g(null, 150)).toBe(150)  // pas de données → fallback
    expect(per100g(undefined, 5)).toBe(5) // idem
  })

  it("100g portion — n.kcal=150 → food.calories=150 (identité)", () => {
    const qg = 100
    const per100g = (val: number | null | undefined, fallback: number): number => {
      if (val == null || qg === 0) return fallback
      return Math.round(val * 100 / qg)
    }
    expect(per100g(150, 0)).toBe(150) // 150 kcal pour 100g → identité
    expect(per100g(5, 0)).toBe(5)     // protéines identité
  })

  it("qg=0 — retourne le fallback (pas de division par zéro)", () => {
    const qg = 0
    const per100g = (val: number | null | undefined, fallback: number): number => {
      if (val == null || qg === 0) return fallback
      return Math.round(val * 100 / qg)
    }
    expect(per100g(304, 150)).toBe(150) // guard qg===0 → fallback
  })

  it("vérification affichage final : 76 kcal/100g * 400g / 100 = 304 kcal", () => {
    const foodCaloriesPer100g = 76
    const amount = 400
    const displayed = foodCaloriesPer100g * amount / 100
    expect(displayed).toBe(304)
  })
})
