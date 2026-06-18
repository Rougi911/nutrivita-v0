/**
 * TU-RADAR — Tests unitaires : calcRadarData (AL-RADAR)
 *
 * Tracabilité : AL-RADAR → lib/micronutrients-radar.ts
 * Convention : null CIQUAL ≠ 0 (donnée inconnue).
 */

import { describe, it, expect } from "vitest"
import { calcRadarData, DEFAULT_VNR } from "../micronutrients-radar"
import type { MealEntry } from "../types"

// ─── Usine de MealEntry minimal ──────────────────────────────────────────────

function makeMealEntry(
  id: string,
  date: string,
  amount: number,
  micronutrients: Record<string, number | null | undefined>
): MealEntry {
  return {
    id,
    foodId: id,
    food: {
      id,
      name: `Food ${id}`,
      cuisine: "test",
      calories: 100,
      protein: 10,
      carbs: 10,
      fat: 5,
      source: "ciqual",
      ...micronutrients,
    },
    amount,
    mealType: "lunch",
    date,
    createdAt: `${date}T12:00:00Z`,
  }
}

// ─── VNR fer homme = 11 mg/j ──────────────────────────────────────────────────

const IRON_VNR_MALE = 11   // mg/j

// ─── TU-RADAR-01 : nutriment avec 100% données → valuePercent correct ────────

describe("TU-RADAR-01 : 100% données disponibles", () => {
  it("calcule valuePercent = apport_moyen / VNR * 100, plafonné à 120", () => {
    // 1 jour, 1 entrée : 200g de poulet avec iron_mg = 0.8 mg/100g
    // Apport = 0.8 * 200/100 = 1.6 mg
    // Ratio = 1.6 / 11 * 100 ≈ 14.5 → 15 arrondi
    const entries: MealEntry[] = [
      makeMealEntry("e1", "2026-06-12", 200, { iron_mg: 0.8 }),
    ]
    const result = calcRadarData(entries, "male", DEFAULT_VNR)
    const iron = result.nutrients.find((n) => n.key === "iron")!

    // completeness = 1/1 * 100 = 100
    expect(iron.completeness).toBe(100)
    // valuePercent ≈ Math.round(1.6 / 11 * 100) = 15
    expect(iron.valuePercent).toBe(Math.round((1.6 / IRON_VNR_MALE) * 100))
  })

  it("plafonne valuePercent à 120 quand apport > 120% VNR", () => {
    // Calcium VNR = 1000 mg/j. Entrée : 500g * calcium_mg = 300 mg/100g → 1500 mg → 150%
    const entries: MealEntry[] = [
      makeMealEntry("e2", "2026-06-12", 500, { calcium_mg: 300 }),
    ]
    const result = calcRadarData(entries, "male", DEFAULT_VNR)
    const calcium = result.nutrients.find((n) => n.key === "calcium")!
    expect(calcium.valuePercent).toBe(120)
  })

  it("overallCompleteness = 100 quand tous les nutriments ont des données", () => {
    const entries: MealEntry[] = [
      makeMealEntry("e3", "2026-06-12", 100, {
        vit_c_mg: 10, vit_d_ug: 1, b9_ug: 20, b12_ug: 0.5,
        iron_mg: 1.5, calcium_mg: 120, magnesium_mg: 30, zinc_mg: 1.2,
      }),
    ]
    const result = calcRadarData(entries, "male", DEFAULT_VNR)
    expect(result.overallCompleteness).toBe(100)
  })
})

// ─── TU-RADAR-02 : 50% données null → completeness = 50 ──────────────────────

describe("TU-RADAR-02 : 50% des aliments ont une donnée null (inconnue)", () => {
  it("completeness = 50, calcul uniquement sur les non-null", () => {
    // 2 entrées sur le même jour : l'une a iron_mg, l'autre null
    // iron_mg disponible : entrée 1 : 100g * 2 mg/100g = 2 mg (1 jour)
    // Apport moyen = 2 mg/j → ratio = 2/11 * 100 ≈ 18
    const entries: MealEntry[] = [
      makeMealEntry("e4", "2026-06-12", 100, { iron_mg: 2.0 }),   // donnée présente
      makeMealEntry("e5", "2026-06-12", 100, { iron_mg: null }),  // donnée inconnue
    ]
    const result = calcRadarData(entries, "male", DEFAULT_VNR)
    const iron = result.nutrients.find((n) => n.key === "iron")!

    // TU-RADAR-02 : completeness = 1 aliment avec donnée / 2 aliments total = 50%
    expect(iron.completeness).toBe(50)

    // Le calcul n'utilise QUE l'entrée avec la donnée : 2.0 mg/j
    const expected = Math.round((2.0 / IRON_VNR_MALE) * 100)
    expect(iron.valuePercent).toBe(expected)
  })

  it("l'entrée null ne contribue pas à la somme des apports", () => {
    // Si null était traité comme 0, la somme serait la même mais on valide
    // que la valeur n'est pas 0 (ce qui prouverait que null est ignoré).
    const entries: MealEntry[] = [
      makeMealEntry("e6", "2026-06-12", 200, { calcium_mg: 50 }),  // 100 mg
      makeMealEntry("e7", "2026-06-12", 200, { calcium_mg: null }), // inconnu
    ]
    const result = calcRadarData(entries, "male", DEFAULT_VNR)
    const calcium = result.nutrients.find((n) => n.key === "calcium")!

    // Apport = 50 * 200/100 = 100 mg. VNR = 1000. → 10%
    expect(calcium.valuePercent).toBe(10)
    expect(calcium.completeness).toBe(50)
  })
})

// ─── TU-RADAR-03 : 0 aliment avec la donnée → valuePercent = 0, completeness = 0

describe("TU-RADAR-03 : aucun aliment n'a la donnée", () => {
  it("valuePercent = 0 et completeness = 0 quand tous les aliments ont null", () => {
    const entries: MealEntry[] = [
      makeMealEntry("e8", "2026-06-12", 200, { vit_d_ug: null }),
      makeMealEntry("e9", "2026-06-12", 150, { vit_d_ug: null }),
    ]
    const result = calcRadarData(entries, "male", DEFAULT_VNR)
    const vitD = result.nutrients.find((n) => n.key === "vitD")!

    // TU-RADAR-03 : ni apport ni donnée disponible
    expect(vitD.valuePercent).toBe(0)
    expect(vitD.completeness).toBe(0)
  })

  it("valuePercent = 0 et completeness = 0 quand le champ est absent (undefined)", () => {
    const entries: MealEntry[] = [
      // makeMealEntry sans micronutriments → tous les champs sont undefined
      makeMealEntry("e10", "2026-06-12", 200, {}),
    ]
    const result = calcRadarData(entries, "male", DEFAULT_VNR)
    const zinc = result.nutrients.find((n) => n.key === "zinc")!

    expect(zinc.valuePercent).toBe(0)
    expect(zinc.completeness).toBe(0)
  })

  it("aucune entrée → tous valuePercent = 0, overallCompleteness = 0", () => {
    const result = calcRadarData([], "male", DEFAULT_VNR)
    for (const n of result.nutrients) {
      expect(n.valuePercent).toBe(0)
      expect(n.completeness).toBe(0)
    }
    expect(result.overallCompleteness).toBe(0)
  })
})

// ─── Bonus : VNR différenciées selon le sexe ─────────────────────────────────

describe("VNR différenciées : fer selon sexe", () => {
  it("VNR fer femme (16 mg) donne valuePercent inférieur à homme (11 mg) pour même apport", () => {
    const entries: MealEntry[] = [
      makeMealEntry("e11", "2026-06-12", 100, { iron_mg: 5.5 }), // 5.5 mg/j
    ]
    const male   = calcRadarData(entries, "male",   DEFAULT_VNR)
    const female = calcRadarData(entries, "female", DEFAULT_VNR)
    const ironMale   = male.nutrients.find((n) => n.key === "iron")!
    const ironFemale = female.nutrients.find((n) => n.key === "iron")!

    // Homme : 5.5/11 * 100 = 50%  ; Femme : 5.5/16 * 100 ≈ 34%
    expect(ironMale.valuePercent).toBeGreaterThan(ironFemale.valuePercent)
    expect(ironMale.valuePercent).toBe(50)
    expect(ironFemale.valuePercent).toBe(Math.round((5.5 / 16) * 100))
  })
})
