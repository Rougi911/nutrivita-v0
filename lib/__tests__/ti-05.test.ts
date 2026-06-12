/**
 * TI-05 — Changement unité glycémie → toutes vues converties, seuils inclus
 * Tracé : EB-09 → AL-04, AL-05 → TU-01, TI-05 → VAL-09 (+REG-04/05)
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"
import { toGlucoseUnit, fromGlucoseUnit, convertThreshold } from "../glucose-units"
import { computeGlucoseMetrics } from "../glucose-metrics"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://nutridz.onrender.com"
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const MOCK_READINGS_MG_DL = [
  92, 145, 110, 168, 105, 152, 98,
  88, 138, 115, 172, 99, 155,
  95, 142, 108, 51, 165, 102,
  90, 148, 112, 162, 103, 158, 96,
  86, 135, 118, 175, 107, 160, 101,
  94, 140, 113, 185, 48, 150, 99,
  91, 143, 116, 170, 104, 157, 97,
  89, 137, 111, 167, 100, 154, 95,
  93, 144, 117, 173, 106, 161, 100,
  87, 139, 114, 169, 102, 156, 98,
  92, 146, 110, 166, 101, 153, 96,
  90, 141, 116, 171, 105, 158, 97,
]

describe("TI-05 changement unité glycémie", () => {
  it("POST /api/glucose/query retourne toujours en mg/dL (AL-04)", async () => {
    const { getGlucoseReadings } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/glucose/query`, () =>
        HttpResponse.json(
          MOCK_READINGS_MG_DL.slice(0, 5).map((v, i) => ({
            id: `g${i}`,
            value: v,
            timestamp: `2026-06-12T0${i}:00:00Z`,
            type: "fasting",
            source: "manual",
          }))
        )
      )
    )

    const readings = await getGlucoseReadings(14)
    readings.forEach((r) => {
      expect(r.value).toBeGreaterThan(10)
    })
  })

  it("toutes vues converties quand unité = g/L (AL-04)", () => {
    const valueMgDl = 120
    const inGL = toGlucoseUnit(valueMgDl, "g/L")
    const inMmol = toGlucoseUnit(valueMgDl, "mmol/L")

    expect(inGL).toBeCloseTo(1.20, 2)
    expect(inMmol).toBeCloseTo(6.66, 1)
  })

  it("seuils de zones convertis avec la même fonction (AL-04)", () => {
    // convertThreshold returns a string — parse to number for numeric assertions
    const lowGL = parseFloat(convertThreshold(70, "g/L"))
    const highGL = parseFloat(convertThreshold(180, "g/L"))
    expect(lowGL).toBeCloseTo(0.70, 2)
    expect(highGL).toBeCloseTo(1.80, 2)

    const hypoMmol = parseFloat(convertThreshold(54, "mmol/L"))
    expect(hypoMmol).toBeCloseTo(3.0, 1)
  })

  it("aller-retour mg/dL → g/L → mg/dL sans dérive (AL-04)", () => {
    const original = 154
    const gl = toGlucoseUnit(original, "g/L")
    const backMgDl = fromGlucoseUnit(gl, "g/L")
    expect(backMgDl).toBeCloseTo(original, 0)
  })

  it("computeGlucoseMetrics sur 84 mesures : métriques calculées (AL-05)", () => {
    // computeGlucoseMetrics takes a plain number[] in mg/dL, not an array of objects
    const metrics = computeGlucoseMetrics(MOCK_READINGS_MG_DL, 70, 180)

    expect(metrics).not.toBeNull()
    expect(metrics.average).toBeGreaterThan(80)
    expect(metrics.tir).toBeGreaterThan(0)
    expect(metrics.tir).toBeLessThanOrEqual(100)
    expect(metrics.gmi).toBeGreaterThan(5)
  })

  it("< 12 mesures → insufficientData true — garde statistique AL-05", () => {
    const fewValues = MOCK_READINGS_MG_DL.slice(0, 8)

    // computeGlucoseMetrics never returns null: it sets insufficientData = true
    // and zeros out tir/cv when count < MIN_READINGS_FOR_METRICS (12)
    const metrics = computeGlucoseMetrics(fewValues, 70, 180)
    expect(metrics.insufficientData).toBe(true)
    expect(metrics.tir).toBe(0)
  })
})
