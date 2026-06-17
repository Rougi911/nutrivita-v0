import type { MealEntry } from "@/lib/types"

export type MealType = MealEntry["mealType"]

export function inferMealTypeFromTime(): MealType {
  const h = new Date().getHours()
  // 5h–10h59 → breakfast
  if (h >= 5 && h < 11) return "breakfast"
  // 11h–13h59 → lunch
  if (h >= 11 && h < 14) return "lunch"
  // 14h–19h59 → dinner
  if (h >= 14 && h < 20) return "dinner"
  // 20h–4h59 → snack
  return "snack"
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
