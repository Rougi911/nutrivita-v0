/**
 * TU-meal-utils — AL-inferMealType / AL-normalizeMealType
 * Vérifie : déduction horaire + normalisation des meal_type backend.
 */
import { describe, it, expect, vi, afterEach } from "vitest"
import { inferMealTypeFromTime, normalizeMealType } from "../meal-utils"

afterEach(() => { vi.restoreAllMocks() })

describe("inferMealTypeFromTime (TU-P414-01)", () => {
  // Règle : 5–10h→breakfast, 11–13h→lunch, 14–19h→dinner, 20–4h→snack
  const cases: [number, string][] = [
    [5,  "breakfast"],
    [6,  "breakfast"],
    [10, "breakfast"],
    [11, "lunch"],
    [13, "lunch"],
    [14, "dinner"],
    [19, "dinner"],
    [20, "snack"],
    [23, "snack"],
    [0,  "snack"],
    [4,  "snack"],
  ]
  it.each(cases)("h=%i → %s", (hour, expected) => {
    // Mock Date.prototype.getHours to return a fixed hour
    const spy = vi.spyOn(Date.prototype, "getHours").mockReturnValue(hour)
    expect(inferMealTypeFromTime()).toBe(expected)
    spy.mockRestore()
  })
})

describe("normalizeMealType (TU-P414-02)", () => {
  it("retourne null pour null/undefined/empty", () => {
    expect(normalizeMealType(null)).toBeNull()
    expect(normalizeMealType(undefined)).toBeNull()
    expect(normalizeMealType("")).toBeNull()
    expect(normalizeMealType("null")).toBeNull()
  })

  it("mappe les valeurs backend standard", () => {
    expect(normalizeMealType("breakfast")).toBe("breakfast")
    expect(normalizeMealType("lunch")).toBe("lunch")
    expect(normalizeMealType("dinner")).toBe("dinner")
    expect(normalizeMealType("snack")).toBe("snack")
  })

  it("mappe les alias français (dejeuner legacy)", () => {
    expect(normalizeMealType("dejeuner")).toBe("lunch")
    expect(normalizeMealType("petit-dejeuner")).toBe("breakfast")
    expect(normalizeMealType("diner")).toBe("dinner")
    expect(normalizeMealType("collation")).toBe("snack")
  })

  it("est insensible à la casse", () => {
    expect(normalizeMealType("LUNCH")).toBe("lunch")
    expect(normalizeMealType("Breakfast")).toBe("breakfast")
  })

  it("retourne null pour valeur inconnue", () => {
    expect(normalizeMealType("unknownvalue")).toBeNull()
  })
})
