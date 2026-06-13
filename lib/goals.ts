export const POIDS_GOALS = ["lose", "maintain", "gain"] as const
export type PoidsGoal = (typeof POIDS_GOALS)[number]

export function toggleGoal(currentGoals: string[], value: string): string[] {
  const isPoids = POIDS_GOALS.includes(value as PoidsGoal)
  if (isPoids) {
    if (currentGoals.includes(value)) return currentGoals  // radio — no deselect
    return [...currentGoals.filter((g) => !POIDS_GOALS.includes(g as PoidsGoal)), value]
  }
  // CONDITION goals: cumulative toggle
  return currentGoals.includes(value)
    ? currentGoals.filter((g) => g !== value)
    : [...currentGoals, value]
}
