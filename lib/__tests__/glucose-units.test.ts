/**
 * TU-01 — Conversions unités glycémie (AL-04)
 */
import { describe, it, expect } from "vitest"
import {
  toGlucoseUnit,
  fromGlucoseUnit,
  formatGlucose,
  convertThreshold,
} from "../glucose-units"

describe("TU-01 toGlucoseUnit", () => {
  it("g/L : 120 mg/dL → 1.20", () => {
    expect(toGlucoseUnit(120, "g/L")).toBeCloseTo(1.2, 2)
  })

  it("mmol/L : 120 mg/dL → 6.66 ±0.01", () => {
    expect(toGlucoseUnit(120, "mmol/L")).toBeCloseTo(6.66, 1)
  })

  it("mg/dL : identity", () => {
    expect(toGlucoseUnit(120, "mg/dL")).toBe(120)
  })

  it("g/L : 180 mg/dL → 1.80", () => {
    expect(toGlucoseUnit(180, "g/L")).toBeCloseTo(1.8, 2)
  })

  it("mmol/L : 54 mg/dL (hypo seuil) → 3.00 ±0.01", () => {
    expect(toGlucoseUnit(54, "mmol/L")).toBeCloseTo(3.0, 1)
  })
})

describe("TU-01 fromGlucoseUnit", () => {
  it("g/L : 1.2 → 120 mg/dL", () => {
    expect(fromGlucoseUnit(1.2, "g/L")).toBeCloseTo(120, 0)
  })

  it("mmol/L : 6.66 → 120 mg/dL ±1", () => {
    expect(fromGlucoseUnit(6.66, "mmol/L")).toBeCloseTo(120, 0)
  })

  it("mg/dL : identity", () => {
    expect(fromGlucoseUnit(120, "mg/dL")).toBe(120)
  })
})

describe("TU-01 round-trip", () => {
  const cases = [70, 100, 120, 180, 250] as const
  const units = ["g/L", "mmol/L", "mg/dL"] as const

  cases.forEach((mgDl) => {
    units.forEach((unit) => {
      it(`round-trip ${mgDl} mg/dL via ${unit}`, () => {
        const converted = toGlucoseUnit(mgDl, unit)
        const back = fromGlucoseUnit(converted, unit)
        expect(back).toBeCloseTo(mgDl, 0)
      })
    })
  })
})

describe("TU-01 formatGlucose", () => {
  it("g/L format shows 2 decimals", () => {
    expect(formatGlucose(120, "g/L")).toBe("1.20")
  })

  it("mg/dL format shows integer", () => {
    expect(formatGlucose(120, "mg/dL")).toBe("120")
  })
})

describe("TU-01 convertThreshold", () => {
  it("70 mg/dL → '0.70' g/L", () => {
    expect(convertThreshold(70, "g/L")).toBe("0.70")
  })

  it("180 mg/dL → '180' mg/dL", () => {
    expect(convertThreshold(180, "mg/dL")).toBe("180")
  })
})
