/**
 * TU-05 — Composition corporelle Deurenberg (AL-06)
 */
import { describe, it, expect } from "vitest"
import { deurenbergBodyFat, leanBodyMass, bmi } from "../body-composition"

describe("TU-05 deurenbergBodyFat", () => {
  it("male 34y BMI 24.6 → ~21.0% ±0.5", () => {
    // weight 78kg height 178cm → BMI ≈ 24.6
    const bf = deurenbergBodyFat(78, 178, 34, "male")
    expect(bf).toBeCloseTo(21.0, 0)
  })

  it("female same params → higher body fat", () => {
    const bfMale   = deurenbergBodyFat(78, 178, 34, "male")
    const bfFemale = deurenbergBodyFat(78, 178, 34, "female")
    expect(bfFemale).toBeGreaterThan(bfMale)
  })

  it("older age → higher body fat (same weight/height/sex)", () => {
    const young = deurenbergBodyFat(78, 178, 25, "male")
    const older = deurenbergBodyFat(78, 178, 50, "male")
    expect(older).toBeGreaterThan(young)
  })

  it("returns value between 0 and 60", () => {
    const bf = deurenbergBodyFat(70, 170, 30, "male")
    expect(bf).toBeGreaterThan(0)
    expect(bf).toBeLessThan(60)
  })
})

describe("TU-05 leanBodyMass", () => {
  it("80kg 20% bf → 64kg LBM", () => {
    expect(leanBodyMass(80, 20)).toBeCloseTo(64, 1)
  })

  it("lbm < weight always", () => {
    const lbm = leanBodyMass(75, 25)
    expect(lbm).toBeLessThan(75)
  })
})

describe("TU-05 bmi", () => {
  it("70kg 175cm → BMI ≈ 22.9", () => {
    expect(bmi(70, 175)).toBeCloseTo(22.9, 1)
  })

  it("obese reference 100kg 170cm → BMI > 30", () => {
    expect(bmi(100, 170)).toBeGreaterThan(30)
  })
})
