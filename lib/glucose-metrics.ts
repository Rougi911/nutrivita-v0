/** AL-05 — Glycaemic metrics for a set of readings (values in mg/dL). */

export const MIN_READINGS_FOR_METRICS = 12

export interface GlucoseMetrics {
  gmi: number
  tir: number
  cv: number
  average: number
  min: number
  max: number
  count: number
  hasHypo: boolean
  insufficientData: boolean
  distribution: {
    veryLow: number
    low: number
    inRange: number
    high: number
    veryHigh: number
  }
  counts: {
    veryLow: number
    low: number
    inRange: number
    high: number
    veryHigh: number
  }
}

export function computeGlucoseMetrics(
  valuesMgDl: number[],
  targetLow = 70,
  targetHigh = 180
): GlucoseMetrics {
  const count = valuesMgDl.length

  if (count === 0) {
    return {
      gmi: 0,
      tir: 0,
      cv: 0,
      average: 0,
      min: 0,
      max: 0,
      count: 0,
      hasHypo: false,
      insufficientData: true,
      distribution: { veryLow: 0, low: 0, inRange: 0, high: 0, veryHigh: 0 },
      counts: { veryLow: 0, low: 0, inRange: 0, high: 0, veryHigh: 0 },
    }
  }

  const insufficientData = count < MIN_READINGS_FOR_METRICS
  const avg = valuesMgDl.reduce((s, v) => s + v, 0) / count
  const variance = valuesMgDl.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / count
  const std = Math.sqrt(variance)

  // AL-05: GMI = 3.31 + 0.02392 * mean(mg/dL)
  const gmi = parseFloat((3.31 + 0.02392 * avg).toFixed(2))

  const inRangeCount = valuesMgDl.filter((v) => v >= targetLow && v <= targetHigh).length
  const tir = Math.round((inRangeCount / count) * 100)

  const cv = avg > 0 ? Math.round((std / avg) * 100) : 0

  const veryLowCount = valuesMgDl.filter((v) => v < 54).length
  const lowCount = valuesMgDl.filter((v) => v >= 54 && v < 70).length
  const highCount = valuesMgDl.filter((v) => v > 180 && v <= 250).length
  const veryHighCount = valuesMgDl.filter((v) => v > 250).length

  return {
    gmi,
    tir: insufficientData ? 0 : tir,
    cv: insufficientData ? 0 : cv,
    average: Math.round(avg),
    min: Math.round(Math.min(...valuesMgDl)),
    max: Math.round(Math.max(...valuesMgDl)),
    count,
    hasHypo: veryLowCount > 0,
    insufficientData,
    distribution: {
      veryLow: Math.round((veryLowCount / count) * 100),
      low: Math.round((lowCount / count) * 100),
      inRange: Math.round((inRangeCount / count) * 100),
      high: Math.round((highCount / count) * 100),
      veryHigh: Math.round((veryHighCount / count) * 100),
    },
    counts: {
      veryLow: veryLowCount,
      low: lowCount,
      inRange: inRangeCount,
      high: highCount,
      veryHigh: veryHighCount,
    },
  }
}

export function getGlucoseStatus(
  metric: "gmi" | "tir" | "cv",
  value: number
): "good" | "warning" | "danger" {
  if (metric === "gmi") {
    if (value < 7) return "good"
    if (value < 8) return "warning"
    return "danger"
  }
  if (metric === "tir") {
    if (value >= 70) return "good"
    if (value >= 50) return "warning"
    return "danger"
  }
  // cv
  return value < 36 ? "good" : "warning"
}
