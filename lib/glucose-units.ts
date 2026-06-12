export type GlucoseUnit = "mg/dL" | "mmol/L" | "g/L"

const MMOL_FACTOR = 18.016
const GL_FACTOR = 100

/** Convert mg/dL to the target display unit. */
export function toGlucoseUnit(valueMgDl: number, unit: GlucoseUnit): number {
  if (unit === "g/L") return valueMgDl / GL_FACTOR
  if (unit === "mmol/L") return valueMgDl / MMOL_FACTOR
  return valueMgDl
}

/** Convert a user-entered value in the given unit back to mg/dL for storage. */
export function fromGlucoseUnit(value: number, unit: GlucoseUnit): number {
  if (unit === "g/L") return value * GL_FACTOR
  if (unit === "mmol/L") return value * MMOL_FACTOR
  return value
}

/** Format a mg/dL value for display with the right decimal places. */
export function formatGlucose(valueMgDl: number, unit: GlucoseUnit): string {
  const converted = toGlucoseUnit(valueMgDl, unit)
  if (unit === "mg/dL") return Math.round(converted).toString()
  return converted.toFixed(2)
}

/** Unit label string for display. */
export function glucoseUnitLabel(unit: GlucoseUnit): string {
  return unit
}

/** Convert a threshold value (mg/dL) to the target unit for display. */
export function convertThreshold(thresholdMgDl: number, unit: GlucoseUnit): string {
  return formatGlucose(thresholdMgDl, unit)
}

/** Zone labels in the given unit. */
export function zoneLabels(unit: GlucoseUnit) {
  return {
    veryLow: `<${convertThreshold(54, unit)} ${unit}`,
    low: `${convertThreshold(54, unit)}–${convertThreshold(70, unit)} ${unit}`,
    target: `${convertThreshold(70, unit)}–${convertThreshold(180, unit)} ${unit}`,
    high: `${convertThreshold(180, unit)}–${convertThreshold(250, unit)} ${unit}`,
    veryHigh: `>${convertThreshold(250, unit)} ${unit}`,
  }
}
