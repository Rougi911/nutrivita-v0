import { describe, it, expect } from "vitest"
import {
  kgToLbs, lbsToKg, toWeightUnit, fromWeightUnit, formatWeight,
  cmToFtIn, ftInToCm, formatHeight,
  kcalToKj, toEnergyUnit, formatEnergy,
} from "../units"

// TU-U1 — conversions d'unités (ultrareview). Stockage métrique, affichage converti.
describe("units — poids", () => {
  it("kg ↔ lbs round-trip", () => {
    expect(kgToLbs(70)).toBeCloseTo(154.32, 1)
    expect(lbsToKg(154.32)).toBeCloseTo(70, 1)
    expect(lbsToKg(kgToLbs(83.4))).toBeCloseTo(83.4, 5)
  })
  it("toWeightUnit arrondit à 0,1 et respecte l'unité", () => {
    expect(toWeightUnit(70, "kg")).toBe(70)
    expect(toWeightUnit(70, "lbs")).toBe(154.3)
  })
  it("fromWeightUnit ramène en kg", () => {
    expect(fromWeightUnit(154.3, "lbs")).toBeCloseTo(70, 1)
    expect(fromWeightUnit(70, "kg")).toBe(70)
  })
  it("formatWeight", () => {
    expect(formatWeight(70, "kg")).toBe("70.0 kg")
    expect(formatWeight(70, "lbs")).toBe("154.3 lbs")
  })
})

describe("units — taille", () => {
  it("cmToFtIn", () => {
    expect(cmToFtIn(170)).toEqual({ ft: 5, in: 7 })
    expect(cmToFtIn(183)).toEqual({ ft: 6, in: 0 })
  })
  it("ftInToCm round-trip approx", () => {
    expect(ftInToCm(5, 7)).toBeCloseTo(170.18, 1)
  })
  it("formatHeight", () => {
    expect(formatHeight(170, "cm")).toBe("170 cm")
    expect(formatHeight(170, "ft")).toBe("5'7\"")
  })
})

describe("units — énergie", () => {
  it("kcal → kJ", () => {
    expect(kcalToKj(2000)).toBeCloseTo(8368, 0)
  })
  it("toEnergyUnit / formatEnergy", () => {
    expect(toEnergyUnit(2000, "kcal")).toBe(2000)
    expect(toEnergyUnit(2000, "kJ")).toBe(8368)
    expect(formatEnergy(2000, "kcal")).toBe("2000 kcal")
    expect(formatEnergy(2000, "kJ")).toBe("8368 kJ")
  })
})
