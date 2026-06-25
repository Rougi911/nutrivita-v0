/**
 * S13 — Frontend : dissipation des calories (cadrage bien-être REG-05).
 * Trace : AL-02 (MET) · maquette dissipation.
 *
 * TU-S13-1 : durée correcte pour un MET/poids donnés (course 8.3, 75 kg, 400 kcal → 37 min)
 * TU-S13-2 : recalcul au changement de sport (MET différent → durée différente)
 * TU-S13-3 : dailyExcessKcal = consommé − (objectif + activité plafonnée 1000), 0 si pas d'excédent
 * TU-S13-4 : isWeightStale vrai si > 3 mois ou absent, faux si récent
 * TU-S13-5 : entrées invalides (excédent/MET/poids ≤ 0) → 0 (pas de NaN/division par zéro)
 * TU-S13-6 : SPORTS = 17 activités, groupées doux/modéré/intense
 */
import { describe, it, expect } from "vitest"
import {
  dissipationMinutes, dailyExcessKcal, isWeightStale, SPORTS, sportsByIntensity,
} from "../calorie-dissipation"

describe("dissipationMinutes", () => {
  it("TU-S13-1 : course 8.3 MET, 75 kg, 400 kcal → 37 min", () => {
    expect(dissipationMinutes(400, 8.3, 75)).toBe(37)
  })

  it("TU-S13-2 : recalcul selon le sport (marche 3.0, 70 kg, 300 kcal → 82 min)", () => {
    expect(dissipationMinutes(300, 3.0, 70)).toBe(82)
    // même excédent/poids, MET plus élevé → durée plus courte
    expect(dissipationMinutes(300, 8.0, 70)).toBeLessThan(dissipationMinutes(300, 3.0, 70))
  })

  it("TU-S13-5 : entrées invalides → 0", () => {
    expect(dissipationMinutes(0, 8.0, 75)).toBe(0)
    expect(dissipationMinutes(400, 0, 75)).toBe(0)
    expect(dissipationMinutes(400, 8.0, 0)).toBe(0)
    expect(dissipationMinutes(-100, 8.0, 75)).toBe(0)
  })
})

describe("dailyExcessKcal", () => {
  it("TU-S13-3 : consommé − objectif, 0 si pas d'excédent", () => {
    expect(dailyExcessKcal(2500, 2100)).toBe(400)
    expect(dailyExcessKcal(1800, 2100)).toBe(0) // sous l'objectif
  })

  it("crédite l'activité (plafond 1000 kcal, AL-03)", () => {
    // 2500 consommé, 2100 objectif, 200 brûlé → excédent 200
    expect(dailyExcessKcal(2500, 2100, 200)).toBe(200)
    // brûlé énorme plafonné à 1000 → 2500 - (2100+1000) = -600 → 0
    expect(dailyExcessKcal(2500, 2100, 5000)).toBe(0)
  })
})

describe("isWeightStale", () => {
  const now = new Date("2026-06-25T12:00:00Z")
  it("TU-S13-4 : > 3 mois → périmé", () => {
    expect(isWeightStale("2026-01-01", now)).toBe(true)
  })
  it("récent → non périmé", () => {
    expect(isWeightStale("2026-06-10", now)).toBe(false)
  })
  it("absent/invalide → périmé", () => {
    expect(isWeightStale(undefined, now)).toBe(true)
    expect(isWeightStale(null, now)).toBe(true)
    expect(isWeightStale("pas-une-date", now)).toBe(true)
  })
})

describe("table MET", () => {
  it("TU-S13-6 : 17 sports groupés par intensité", () => {
    expect(SPORTS).toHaveLength(17)
    const g = sportsByIntensity()
    expect(g.gentle.length + g.moderate.length + g.intense.length).toBe(17)
    expect(g.gentle.length).toBeGreaterThan(0)
    expect(g.intense.length).toBeGreaterThan(0)
    // MET croissants par intensité (max doux ≤ min intense)
    const maxGentle = Math.max(...g.gentle.map((s) => s.met))
    const minIntense = Math.min(...g.intense.map((s) => s.met))
    expect(maxGentle).toBeLessThanOrEqual(minIntense)
  })
})
