// P1 — tests unitaires du moteur de calcul client (vitest, fonctions pures).
import { describe, it, expect } from "vitest"
import {
  entryKcal,
  totalsFor,
  macroTargetsG,
  currentMealSlot,
  buildAdherenceHeatmap,
  buildDailyMacros,
  buildSmoothedWeight,
  postprandial,
  buildDayTimeline,
  detectGlucosePattern,
  computeHealthScore,
} from "@/lib/p1-insights"
import type { MealEntry, GlucoseReading, WeightEntry, User } from "@/lib/types"

function meal(p: Partial<MealEntry> & { cal: number; prot?: number; carb?: number; fat?: number }): MealEntry {
  return {
    id: p.id ?? "m",
    foodId: "f",
    food: {
      id: "f", name: p.food?.name ?? "Aliment", cuisine: "x",
      calories: p.cal, protein: p.prot ?? 0, carbs: p.carb ?? 0, fat: p.fat ?? 0,
      source: "ciqual",
    } as MealEntry["food"],
    amount: 100,
    mealType: p.mealType ?? "lunch",
    date: p.date ?? "2026-07-03",
    createdAt: p.createdAt ?? "2026-07-03T12:30:00Z",
  } as MealEntry
}

function today(offset = 0): string {
  return new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10)
}

const user = {
  targetCalories: 2000,
  macros: { protein: 25, carbs: 45, fat: 30 },
  sex: "male",
  glucoseTarget: { low: 70, high: 180 },
} as unknown as User

describe("helpers de base", () => {
  it("entryKcal = calories × amount/100", () => {
    expect(entryKcal(meal({ cal: 200 }))).toBe(200) // amount 100
  })
  it("totalsFor somme les macros", () => {
    const t = totalsFor([meal({ cal: 100, prot: 10, carb: 20, fat: 5 }), meal({ cal: 50, prot: 5 })])
    expect(t.kcal).toBe(150)
    expect(t.protein).toBe(15)
  })
  it("macroTargetsG dérive P/G/L de la cible", () => {
    const m = macroTargetsG(user)
    expect(m.protein).toBe(Math.round((2000 * 0.25) / 4)) // 125
    expect(m.carbs).toBe(Math.round((2000 * 0.45) / 4)) // 225
    expect(m.fat).toBe(Math.round((2000 * 0.30) / 9)) // 67
  })
  it("currentMealSlot mappe l'heure", () => {
    expect(currentMealSlot(new Date("2026-07-03T08:00:00"))).toBe("breakfast")
    expect(currentMealSlot(new Date("2026-07-03T12:30:00"))).toBe("lunch")
    expect(currentMealSlot(new Date("2026-07-03T21:00:00"))).toBe("dinner")
  })
})

describe("Tendances", () => {
  it("heatmap: 30 cellules, jour à la cible détecté", () => {
    const meals = [meal({ cal: 2000, date: today(0) })]
    const { cells, inTarget } = buildAdherenceHeatmap(meals, user, 30)
    expect(cells).toHaveLength(30)
    expect(cells[29].isToday).toBe(true)
    expect(cells[29].level).toBe("in")
    expect(inTarget).toBeGreaterThanOrEqual(1)
  })
  it("buildDailyMacros: 7 jours", () => {
    expect(buildDailyMacros([meal({ cal: 500, carb: 60, date: today(0) })], 7, "fr")).toHaveLength(7)
  })
  it("buildSmoothedWeight: pente + moyenne mobile", () => {
    const w: WeightEntry[] = [
      { date: "2026-06-01", weight: 80 },
      { date: "2026-06-15", weight: 79.5 },
      { date: "2026-07-01", weight: 79 },
    ] as WeightEntry[]
    const r = buildSmoothedWeight(w)
    expect(r).not.toBeNull()
    expect(r!.points).toHaveLength(3)
    expect(r!.slopePerMonth).toBeLessThan(0) // perte
  })
  it("buildSmoothedWeight: null si < 2 points", () => {
    expect(buildSmoothedWeight([{ date: "2026-07-01", weight: 80 }] as WeightEntry[])).toBeNull()
  })
})

describe("Glycémie × Repas", () => {
  const D = "2026-07-03"
  const g = (h: string, v: number): GlucoseReading =>
    ({ id: h, value: v, timestamp: `${D}T${h}:00Z`, type: "cgm", source: "manual" } as GlucoseReading)

  it("postprandial: delta pic − pré", () => {
    const ms = new Date(`${D}T12:30:00Z`).getTime()
    expect(postprandial(ms, [g("12:15", 100), g("13:30", 175)])).toEqual({ deltaMgDl: 75, peakMgDl: 175 })
  })
  it("buildDayTimeline: marqueur repas + TIR", () => {
    const meals = [meal({ cal: 700, carb: 92, mealType: "lunch", date: D, createdAt: `${D}T12:30:00Z` })]
    const tl = buildDayTimeline(D, [g("12:15", 100), g("13:30", 178)], meals, { low: 70, high: 180 })
    expect(tl.markers).toHaveLength(1)
    expect(tl.markers[0].deltaMgDl).toBe(78)
    expect(tl.tir).toBe(100)
  })
  it("detectGlucosePattern: null si trop peu de données", () => {
    expect(detectGlucosePattern([], [])).toBeNull()
  })
})

describe("Score Santé", () => {
  it("structure + bornes 0..100 + historique 8s", () => {
    const meals: MealEntry[] = []
    for (let i = 0; i < 7; i++) meals.push(meal({ cal: 2000, prot: 100, carb: 225, fat: 67, date: today(i) }))
    const r = computeHealthScore(meals, user)
    expect(r.history).toHaveLength(8)
    expect(r.components.adherence).toBe(100)
    for (const v of [r.total, r.components.adherence, r.components.quality, r.components.micro, r.components.macro]) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(100)
    }
  })
  it("aucune donnée => total 0, prevTotal null", () => {
    const r = computeHealthScore([], user)
    expect(r.total).toBe(0)
    expect(r.prevTotal).toBeNull()
  })
})
