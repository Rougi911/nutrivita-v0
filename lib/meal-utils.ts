import type { MealEntry } from "@/lib/types"

export type MealType = MealEntry["mealType"]

export function inferMealTypeFromTime(): MealType {
  const h = new Date().getHours()
  if (h < 11) return "breakfast"
  if (h < 15) return "lunch"
  if (h < 19) return "snack"
  return "dinner"
}

export function normalizeMealType(mt: string | null | undefined): MealType | null {
  if (!mt || mt === "null") return null
  const map: Record<string, MealType> = {
    breakfast: "breakfast",
    lunch: "lunch",
    dinner: "dinner",
    snack: "snack",
    "petit-dejeuner": "breakfast",
    dejeuner: "lunch",
    diner: "dinner",
    collation: "snack",
  }
  return map[mt.toLowerCase()] ?? null
}
