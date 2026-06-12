/** AL-11 — Auto-adjust macros so the total stays exactly 100, min 10% each. */

export interface Macros {
  carbs: number
  protein: number
  fat: number
}

const MACRO_MIN = 10
const MACRO_KEYS: (keyof Macros)[] = ["carbs", "protein", "fat"]

/**
 * Move `changed` to `newValue`, redistribute the delta proportionally
 * across the other two, respecting the 10% minimum.
 * Returns a new Macros object that always sums to exactly 100.
 */
export function adjustMacros(
  current: Macros,
  changed: keyof Macros,
  newValue: number
): Macros {
  const clamped = Math.max(MACRO_MIN, Math.min(newValue, 100 - 2 * MACRO_MIN))
  const others = MACRO_KEYS.filter((k) => k !== changed) as [keyof Macros, keyof Macros]

  const currentOtherSum = current[others[0]] + current[others[1]]
  const delta = current[changed] - clamped // how much to redistribute

  if (currentOtherSum === 0) {
    // Degenerate case: split equally
    const half = Math.max(MACRO_MIN, Math.round((100 - clamped) / 2))
    return {
      ...current,
      [changed]: clamped,
      [others[0]]: half,
      [others[1]]: 100 - clamped - half,
    }
  }

  // Distribute delta proportionally
  const weight0 = current[others[0]] / currentOtherSum
  const raw0 = current[others[0]] + delta * weight0
  const raw1 = current[others[1]] + delta * (1 - weight0)

  const val0 = Math.max(MACRO_MIN, Math.round(raw0))
  const val1 = 100 - clamped - val0

  if (val1 < MACRO_MIN) {
    const adjusted1 = MACRO_MIN
    const adjusted0 = 100 - clamped - adjusted1
    return {
      ...current,
      [changed]: clamped,
      [others[0]]: Math.max(MACRO_MIN, adjusted0),
      [others[1]]: adjusted1,
    }
  }

  return {
    ...current,
    [changed]: clamped,
    [others[0]]: val0,
    [others[1]]: val1,
  }
}
