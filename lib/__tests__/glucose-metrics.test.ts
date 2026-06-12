/**
 * TU-02 — Métriques glycémiques (AL-05)
 */
import { describe, it, expect } from "vitest"
import { computeGlucoseMetrics, MIN_READINGS_FOR_METRICS } from "../glucose-metrics"

// Fixed 20-value dataset (no Math.random)
const FIXED_20 = [
  95, 148, 112, 172, 103, 158,  // day 1
  88, 136, 115, 175, 107, 160,  // day 2
  91, 142, 109, 168, 100, 154,  // day 3
  86, 138                        // day 4
]

describe("TU-02 GMI", () => {
  it("GMI(154 mg/dL avg) ≈ 7.0 ±0.05", () => {
    const allSame = Array(12).fill(154)
    const m = computeGlucoseMetrics(allSame)
    // GMI = 3.31 + 0.02392 * 154 = 3.31 + 3.684 = 6.994
    expect(m.gmi).toBeCloseTo(6.99, 1)
  })

  it("GMI on 20-value dataset is in expected range", () => {
    const m = computeGlucoseMetrics(FIXED_20)
    expect(m.gmi).toBeGreaterThan(6)
    expect(m.gmi).toBeLessThan(8)
  })
})

describe("TU-02 TIR", () => {
  it("all values in [70,180] → TIR = 100", () => {
    const m = computeGlucoseMetrics(Array(12).fill(120))
    expect(m.tir).toBe(100)
  })

  it("all values < 70 → TIR = 0", () => {
    const m = computeGlucoseMetrics(Array(12).fill(50))
    expect(m.tir).toBe(0)
  })

  it("half in range → TIR ≈ 50", () => {
    const half = [...Array(6).fill(100), ...Array(6).fill(200)]
    const m = computeGlucoseMetrics(half)
    expect(m.tir).toBe(50)
  })
})

describe("TU-02 CV", () => {
  it("all same values → CV = 0", () => {
    const m = computeGlucoseMetrics(Array(12).fill(120))
    expect(m.cv).toBe(0)
  })

  it("20-value dataset → CV between 10 and 40", () => {
    const m = computeGlucoseMetrics(FIXED_20)
    expect(m.cv).toBeGreaterThan(10)
    expect(m.cv).toBeLessThan(40)
  })
})

describe("TU-02 insufficientData guard (AL-05 N<12)", () => {
  it("11 readings → insufficientData = true", () => {
    const m = computeGlucoseMetrics(Array(11).fill(100))
    expect(m.insufficientData).toBe(true)
  })

  it("12 readings → insufficientData = false", () => {
    const m = computeGlucoseMetrics(Array(12).fill(100))
    expect(m.insufficientData).toBe(false)
  })

  it("0 readings → insufficientData = true", () => {
    const m = computeGlucoseMetrics([])
    expect(m.insufficientData).toBe(true)
    expect(m.count).toBe(0)
  })
})

describe("TU-02 hypo detection", () => {
  it("values including 50 mg/dL → hasHypo = true", () => {
    const values = [...Array(11).fill(100), 50]
    const m = computeGlucoseMetrics(values)
    expect(m.hasHypo).toBe(true)
  })

  it("all values >= 70 → hasHypo = false", () => {
    const m = computeGlucoseMetrics(Array(12).fill(100))
    expect(m.hasHypo).toBe(false)
  })
})

describe("TU-02 distribution", () => {
  it("distribution sums to 100", () => {
    const m = computeGlucoseMetrics(FIXED_20)
    const total =
      m.distribution.veryLow +
      m.distribution.low +
      m.distribution.inRange +
      m.distribution.high +
      m.distribution.veryHigh
    // Rounding may cause 99 or 101; allow ±1
    expect(total).toBeGreaterThanOrEqual(99)
    expect(total).toBeLessThanOrEqual(101)
  })
})

describe("TU-02 MIN_READINGS_FOR_METRICS constant", () => {
  it("equals 12", () => {
    expect(MIN_READINGS_FOR_METRICS).toBe(12)
  })
})
