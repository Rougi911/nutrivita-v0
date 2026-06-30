import { describe, it, expect } from "vitest"
import {
  getBarFill,
  classifyGlucose,
  computeWeightBand,
  computeEcart,
  mergeSeries,
  metricUnit,
  axisLayout,
  GLUCOSE_BAND,
} from "@/lib/stats-charts"
import { bmr, tdee } from "@/lib/body-composition"

// ── BUG-1 : couleur des barres calories vs cible ──────────────────────────────
describe("getBarFill", () => {
  it("T1 vert si dans la cible", () => expect(getBarFill(2000, 2000)).toBe("var(--primary)"))
  it("T2 vert si écart ≤ 100", () => expect(getBarFill(2080, 2000)).toBe("var(--primary)"))
  it("T3 ambre si trop bas", () => expect(getBarFill(1850, 2000)).toBe("var(--amber)"))
  it("T4 rouge si > cible + 300", () => expect(getBarFill(2500, 2000)).toBe("var(--risk)"))
  it("T5 neutre si 0 kcal", () => expect(getBarFill(0, 2000)).toBe("var(--muted)"))
  it("T6 cible invalide → neutre, jamais une couleur fausse", () => {
    expect(getBarFill(2000, undefined as unknown as number)).toBe("var(--muted)")
    expect(getBarFill(2000, 0)).toBe("var(--muted)")
    expect(getBarFill(2000, NaN)).toBe("var(--muted)")
  })
})

// ── EVO-2 : classification glycémie ───────────────────────────────────────────
describe("classifyGlucose", () => {
  it("T19 haut/bas/normal", () => {
    expect(classifyGlucose(1.3)).toBe("high")
    expect(classifyGlucose(0.6)).toBe("low")
    expect(classifyGlucose(0.95)).toBe("in")
  })
  it("bornes incluses dans la zone", () => {
    expect(classifyGlucose(GLUCOSE_BAND.low)).toBe("in")
    expect(classifyGlucose(GLUCOSE_BAND.high)).toBe("in")
  })
})

// ── EVO-3 : bande dynamique poids + variations rapides ────────────────────────
describe("computeWeightBand", () => {
  it("T22 poids stable → aucune variation rapide", () => {
    const pts = [
      { date: "2026-06-01", value: 80.0 },
      { date: "2026-06-08", value: 80.1 },
      { date: "2026-06-15", value: 79.9 },
    ]
    expect(computeWeightBand(pts).every((p) => !p.rapid)).toBe(true)
  })
  it("T23 chute de 2,5 kg en 7 j → variation rapide", () => {
    const pts = [
      { date: "2026-06-01", value: 80 },
      { date: "2026-06-08", value: 77.5 },
    ]
    expect(computeWeightBand(pts)[1].rapid).toBe(true)
  })
  it("la bande encadre la moyenne mobile (±1 %)", () => {
    const pts = [{ date: "2026-06-01", value: 80 }]
    const b = computeWeightBand(pts)[0]
    expect(b.low).toBeCloseTo(79.2, 1)
    expect(b.high).toBeCloseTo(80.8, 1)
  })
  it("T26 série vide → pas de crash", () => expect(computeWeightBand([])).toEqual([]))
})

// ── BUG-3 : écart = dépense totale − ingéré ───────────────────────────────────
describe("computeEcart", () => {
  it("T9 dépense > 0", () => expect(computeEcart(2200, 1700, 500)).toBe(0))
  it("T10 exercice nul mais TDEE compte → écart ≠ ingéré", () => {
    expect(computeEcart(1800, 2400, 0)).toBe(600)
  })
})

// ── EVO-1 : fusion multi-séries + axes ────────────────────────────────────────
describe("mergeSeries / axisLayout", () => {
  it("fusionne sur l'union des dates", () => {
    const rows = mergeSeries({
      poids: [{ date: "2026-06-01", value: 80 }],
      glycemie: [{ date: "2026-06-02", value: 1.0 }],
    })
    expect(rows).toEqual([
      { date: "2026-06-01", poids: 80 },
      { date: "2026-06-02", glycemie: 1.0 },
    ])
  })
  it("unités distinctes → 1ʳᵉ à gauche, autres à droite", () => {
    expect(metricUnit("poids")).toBe("kg")
    expect(metricUnit("calories")).toBe("kcal")
    expect(metricUnit("glycemie")).toBe("g/L")
    expect(axisLayout(["poids", "glycemie"])).toEqual([
      { unit: "kg", orientation: "left" },
      { unit: "g/L", orientation: "right" },
    ])
    // calories + ecart partagent kcal → un seul axe
    expect(axisLayout(["calories", "ecart"])).toEqual([{ unit: "kcal", orientation: "left" }])
  })
})

// ── BUG-1/2 : TDEE de repli ───────────────────────────────────────────────────
describe("bmr / tdee", () => {
  it("BMR Mifflin homme", () => {
    // 10*78 + 6.25*178 - 5*34 + 5 = 780 + 1112.5 - 170 + 5 = 1727.5 → 1728
    expect(bmr(78, 178, 34, "male")).toBe(1728)
  })
  it("TDEE = BMR × facteur (modéré 1.55)", () => {
    expect(tdee(78, 178, 34, "male", 3)).toBe(Math.round(1728 * 1.55))
  })
  it("niveau hors plage → replié sur sédentaire", () => {
    expect(tdee(78, 178, 34, "male", 99)).toBe(Math.round(1728 * 1.9))
    expect(tdee(78, 178, 34, "male", 0)).toBe(Math.round(1728 * 1.2))
  })
})
