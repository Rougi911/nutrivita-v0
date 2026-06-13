/**
 * TU-13 — Verrouillage objectifs POIDS/CONDITION (Section 3 HAS/SFD, P4.7)
 * Couvre : lib/goals.ts toggleGoal
 */
import { describe, it, expect } from "vitest"
import { toggleGoal } from "../goals"

describe("TU-13 toggleGoal — groupe POIDS (radio exclusif)", () => {
  it("sélectionner 'lose' sur liste vide l'ajoute", () => {
    expect(toggleGoal([], "lose")).toEqual(["lose"])
  })

  it("sélectionner 'maintain' après 'lose' remplace 'lose'", () => {
    expect(toggleGoal(["lose"], "maintain")).toEqual(["maintain"])
  })

  it("sélectionner 'gain' après 'maintain' remplace 'maintain'", () => {
    expect(toggleGoal(["maintain"], "gain")).toEqual(["gain"])
  })

  it("cliquer sur le même objectif POIDS ne le désélectionne pas (radio)", () => {
    expect(toggleGoal(["lose"], "lose")).toEqual(["lose"])
  })

  it("changer objectif POIDS ne touche pas aux CONDITION coexistants", () => {
    const result = toggleGoal(["lose", "diabetes"], "maintain")
    expect(result).toContain("maintain")
    expect(result).toContain("diabetes")
    expect(result).not.toContain("lose")
  })
})

describe("TU-13 toggleGoal — groupe CONDITION (cumulatif)", () => {
  it("'lose' + 'diabetes' peuvent coexister", () => {
    const result = toggleGoal(["lose"], "diabetes")
    expect(result).toContain("lose")
    expect(result).toContain("diabetes")
  })

  it("sélectionner 'diabetes' seul fonctionne", () => {
    expect(toggleGoal([], "diabetes")).toEqual(["diabetes"])
  })

  it("désélectionner 'diabetes' le retire", () => {
    expect(toggleGoal(["lose", "diabetes"], "diabetes")).toEqual(["lose"])
  })
})

describe("TU-13 toggleGoal — invariants", () => {
  it("résultat n'a jamais deux objectifs POIDS simultanément", () => {
    const result = toggleGoal(["lose", "diabetes"], "gain")
    const poidsSelected = result.filter((g) => ["lose", "maintain", "gain"].includes(g))
    expect(poidsSelected.length).toBeLessThanOrEqual(1)
  })
})
