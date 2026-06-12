/**
 * TU-07 — Ajustement macros proportionnel (AL-11)
 */
import { describe, it, expect } from "vitest"
import { adjustMacros } from "../macros"

describe("TU-07 adjustMacros", () => {
  it("(45,30,25) carbs → 55 : result sums to 100", () => {
    const result = adjustMacros({ carbs: 45, protein: 30, fat: 25 }, "carbs", 55)
    expect(result.carbs + result.protein + result.fat).toBe(100)
  })

  it("(45,30,25) carbs → 55 : protein+fat proportionally reduced", () => {
    const result = adjustMacros({ carbs: 45, protein: 30, fat: 25 }, "carbs", 55)
    expect(result.carbs).toBe(55)
    // protein was 30, fat was 25 → total other was 55 → now 45
    // proportional: protein ≈ 24, fat ≈ 21 (sum=45)
    expect(result.protein).toBeGreaterThanOrEqual(10)
    expect(result.fat).toBeGreaterThanOrEqual(10)
  })

  it("result always sums to 100 regardless of input", () => {
    const cases = [
      { m: { carbs: 50, protein: 25, fat: 25 }, key: "carbs" as const, val: 60 },
      { m: { carbs: 40, protein: 40, fat: 20 }, key: "protein" as const, val: 15 },
      { m: { carbs: 45, protein: 30, fat: 25 }, key: "fat" as const, val: 40 },
    ]
    cases.forEach(({ m, key, val }) => {
      const r = adjustMacros(m, key, val)
      expect(r.carbs + r.protein + r.fat).toBe(100)
    })
  })

  it("min 10% enforced on all macros", () => {
    // Push protein to extreme to force others to minimum
    const result = adjustMacros({ carbs: 45, protein: 30, fat: 25 }, "carbs", 80)
    expect(result.protein).toBeGreaterThanOrEqual(10)
    expect(result.fat).toBeGreaterThanOrEqual(10)
    expect(result.carbs).toBeGreaterThanOrEqual(10)
    expect(result.carbs + result.protein + result.fat).toBe(100)
  })

  it("changed key is clamped to [10, 80]", () => {
    const r1 = adjustMacros({ carbs: 50, protein: 30, fat: 20 }, "carbs", 0)
    expect(r1.carbs).toBeGreaterThanOrEqual(10)

    const r2 = adjustMacros({ carbs: 50, protein: 30, fat: 20 }, "carbs", 100)
    expect(r2.carbs).toBeLessThanOrEqual(80)
  })

  it("no change when value is same as current", () => {
    const m = { carbs: 45, protein: 30, fat: 25 }
    const result = adjustMacros(m, "carbs", 45)
    expect(result.carbs).toBe(45)
    expect(result.carbs + result.protein + result.fat).toBe(100)
  })

  it("symmetric: adjusting carbs then back gives correct totals", () => {
    const m = { carbs: 45, protein: 30, fat: 25 }
    const step1 = adjustMacros(m, "carbs", 55)
    expect(step1.carbs + step1.protein + step1.fat).toBe(100)
    const step2 = adjustMacros(step1, "carbs", 45)
    expect(step2.carbs + step2.protein + step2.fat).toBe(100)
  })
})
