import type { ApiIntent } from "./api-types"
/** AL-10 / EB-01: API nutrition is per estimated portion, not per 100 g. */
export function withPortion(intent: ApiIntent, grams: number): ApiIntent {
  if (!Number.isFinite(grams) || grams < 1 || grams > 5000)
    throw new RangeError("Invalid portion")
  const previous = intent.quantity_g ?? intent.nutrition?.quantity_g ?? 100
  const ratio = previous > 0 ? grams / previous : 1
  return {
    ...intent,
    quantity_g: grams,
    nutrition: intent.nutrition
      ? {
          ...intent.nutrition,
          quantity_g: grams,
          kcal: intent.nutrition.kcal * ratio,
          glucides: intent.nutrition.glucides * ratio,
          proteines: intent.nutrition.proteines * ratio,
          lipides: intent.nutrition.lipides * ratio,
          fibres: intent.nutrition.fibres * ratio,
          ...(intent.nutrition.sel == null
            ? {}
            : { sel: intent.nutrition.sel * ratio }),
        }
      : intent.nutrition,
  }
}
