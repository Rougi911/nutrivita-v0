/**
 * Stable mock data for NutriVita — NO Math.random() allowed here.
 * All glucose values stored in mg/dL (AL-04).
 */

import type { MealEntry, WeightEntry, GlucoseReading, ActivityEntry, ScannedProduct } from "@/lib/types"
import { SAMPLE_FOODS } from "@/lib/types"

// ─── Meal entries ──────────────────────────────────────────────────────────────

export const sampleMealEntries: MealEntry[] = [
  { id: "m1",  foodId: "1",  food: SAMPLE_FOODS[0], amount: 200, mealType: "breakfast", date: "2026-06-12", createdAt: "2026-06-12T07:30:00Z" },
  { id: "m2",  foodId: "2",  food: SAMPLE_FOODS[1], amount: 80,  mealType: "breakfast", date: "2026-06-12", createdAt: "2026-06-12T07:31:00Z" },
  { id: "m3",  foodId: "5",  food: SAMPLE_FOODS[4], amount: 300, mealType: "lunch",     date: "2026-06-12", createdAt: "2026-06-12T12:15:00Z" },
  { id: "m4",  foodId: "7",  food: SAMPLE_FOODS[6], amount: 150, mealType: "lunch",     date: "2026-06-12", createdAt: "2026-06-12T12:16:00Z" },
  { id: "m5",  foodId: "6",  food: SAMPLE_FOODS[5], amount: 60,  mealType: "snack",     date: "2026-06-12", createdAt: "2026-06-12T16:00:00Z" },
  { id: "m6",  foodId: "9",  food: SAMPLE_FOODS[8], amount: 180, mealType: "dinner",    date: "2026-06-12", createdAt: "2026-06-12T19:30:00Z" },
  { id: "m7",  foodId: "10", food: SAMPLE_FOODS[9], amount: 150, mealType: "dinner",    date: "2026-06-12", createdAt: "2026-06-12T19:31:00Z" },
  { id: "m8",  foodId: "1",  food: SAMPLE_FOODS[0], amount: 200, mealType: "breakfast", date: "2026-06-11", createdAt: "2026-06-11T07:30:00Z" },
  { id: "m9",  foodId: "3",  food: SAMPLE_FOODS[2], amount: 250, mealType: "lunch",     date: "2026-06-11", createdAt: "2026-06-11T12:30:00Z" },
  { id: "m10", foodId: "9",  food: SAMPLE_FOODS[8], amount: 200, mealType: "dinner",    date: "2026-06-11", createdAt: "2026-06-11T19:00:00Z" },
  { id: "m11", foodId: "4",  food: SAMPLE_FOODS[3], amount: 300, mealType: "lunch",     date: "2026-06-10", createdAt: "2026-06-10T12:00:00Z" },
  { id: "m12", foodId: "2",  food: SAMPLE_FOODS[1], amount: 100, mealType: "breakfast", date: "2026-06-10", createdAt: "2026-06-10T08:00:00Z" },
]

// ─── Glucose readings ──────────────────────────────────────────────────────────
// All values in mg/dL (AL-04). 144 readings across 14 days (~10-11 per day)
// Deliberately includes some low values to trigger hypo alert, some high values
// but NO diagnostic text or therapeutic recommendations (REG-05).

export const sampleGlucoseReadings: GlucoseReading[] = [
  // Day -13
  { id: "g1",   value: 92,  timestamp: "2026-05-30T07:00:00Z", type: "fasting",   source: "manual" },
  { id: "g2",   value: 145, timestamp: "2026-05-30T09:30:00Z", type: "post-meal", source: "manual" },
  { id: "g3",   value: 110, timestamp: "2026-05-30T12:00:00Z", type: "pre-meal",  source: "manual" },
  { id: "g4",   value: 168, timestamp: "2026-05-30T14:00:00Z", type: "post-meal", source: "manual" },
  { id: "g5",   value: 105, timestamp: "2026-05-30T18:00:00Z", type: "pre-meal",  source: "manual" },
  { id: "g6",   value: 152, timestamp: "2026-05-30T20:00:00Z", type: "post-meal", source: "manual" },
  { id: "g7",   value: 98,  timestamp: "2026-05-30T22:00:00Z", type: "pontuelle", source: "manual" },
  // Day -12
  { id: "g8",   value: 88,  timestamp: "2026-05-31T07:00:00Z", type: "fasting",   source: "manual" },
  { id: "g9",   value: 138, timestamp: "2026-05-31T09:30:00Z", type: "post-meal", source: "manual" },
  { id: "g10",  value: 115, timestamp: "2026-05-31T12:00:00Z", type: "pre-meal",  source: "manual" },
  { id: "g11",  value: 172, timestamp: "2026-05-31T14:00:00Z", type: "post-meal", source: "manual" },
  { id: "g12",  value: 99,  timestamp: "2026-05-31T18:30:00Z", type: "pre-meal",  source: "manual" },
  { id: "g13",  value: 155, timestamp: "2026-05-31T20:30:00Z", type: "post-meal", source: "manual" },
  // Day -11
  { id: "g14",  value: 95,  timestamp: "2026-06-01T07:00:00Z", type: "fasting",   source: "manual" },
  { id: "g15",  value: 142, timestamp: "2026-06-01T09:30:00Z", type: "post-meal", source: "manual" },
  { id: "g16",  value: 108, timestamp: "2026-06-01T12:00:00Z", type: "pre-meal",  source: "manual" },
  { id: "g17",  value: 51,  timestamp: "2026-06-01T15:00:00Z", type: "pontuelle", source: "manual" }, // hypo
  { id: "g18",  value: 165, timestamp: "2026-06-01T19:30:00Z", type: "post-meal", source: "manual" },
  { id: "g19",  value: 102, timestamp: "2026-06-01T22:00:00Z", type: "pontuelle", source: "manual" },
  // Day -10
  { id: "g20",  value: 90,  timestamp: "2026-06-02T07:00:00Z", type: "fasting",   source: "manual" },
  { id: "g21",  value: 148, timestamp: "2026-06-02T09:30:00Z", type: "post-meal", source: "manual" },
  { id: "g22",  value: 112, timestamp: "2026-06-02T12:00:00Z", type: "pre-meal",  source: "manual" },
  { id: "g23",  value: 162, timestamp: "2026-06-02T14:00:00Z", type: "post-meal", source: "manual" },
  { id: "g24",  value: 103, timestamp: "2026-06-02T18:00:00Z", type: "pre-meal",  source: "manual" },
  { id: "g25",  value: 158, timestamp: "2026-06-02T20:30:00Z", type: "post-meal", source: "manual" },
  { id: "g26",  value: 96,  timestamp: "2026-06-02T23:00:00Z", type: "pontuelle", source: "manual" },
  // Day -9
  { id: "g27",  value: 86,  timestamp: "2026-06-03T07:00:00Z", type: "fasting",   source: "manual" },
  { id: "g28",  value: 135, timestamp: "2026-06-03T09:30:00Z", type: "post-meal", source: "manual" },
  { id: "g29",  value: 118, timestamp: "2026-06-03T12:00:00Z", type: "pre-meal",  source: "manual" },
  { id: "g30",  value: 175, timestamp: "2026-06-03T14:00:00Z", type: "post-meal", source: "manual" },
  { id: "g31",  value: 107, timestamp: "2026-06-03T18:00:00Z", type: "pre-meal",  source: "manual" },
  { id: "g32",  value: 160, timestamp: "2026-06-03T20:00:00Z", type: "post-meal", source: "manual" },
  { id: "g33",  value: 101, timestamp: "2026-06-03T22:00:00Z", type: "pontuelle", source: "manual" },
  // Day -8
  { id: "g34",  value: 94,  timestamp: "2026-06-04T07:00:00Z", type: "fasting",   source: "manual" },
  { id: "g35",  value: 140, timestamp: "2026-06-04T09:30:00Z", type: "post-meal", source: "manual" },
  { id: "g36",  value: 113, timestamp: "2026-06-04T12:00:00Z", type: "pre-meal",  source: "manual" },
  { id: "g37",  value: 185, timestamp: "2026-06-04T14:00:00Z", type: "post-meal", source: "manual" }, // slightly high
  { id: "g38",  value: 48,  timestamp: "2026-06-04T16:00:00Z", type: "pontuelle", source: "manual" }, // hypo
  { id: "g39",  value: 150, timestamp: "2026-06-04T19:30:00Z", type: "post-meal", source: "manual" },
  { id: "g40",  value: 99,  timestamp: "2026-06-04T22:00:00Z", type: "pontuelle", source: "manual" },
  // Day -7
  { id: "g41",  value: 91,  timestamp: "2026-06-05T07:00:00Z", type: "fasting",   source: "manual" },
  { id: "g42",  value: 143, timestamp: "2026-06-05T09:30:00Z", type: "post-meal", source: "manual" },
  { id: "g43",  value: 116, timestamp: "2026-06-05T12:00:00Z", type: "pre-meal",  source: "manual" },
  { id: "g44",  value: 170, timestamp: "2026-06-05T14:00:00Z", type: "post-meal", source: "manual" },
  { id: "g45",  value: 104, timestamp: "2026-06-05T18:00:00Z", type: "pre-meal",  source: "manual" },
  { id: "g46",  value: 157, timestamp: "2026-06-05T20:30:00Z", type: "post-meal", source: "manual" },
  { id: "g47",  value: 97,  timestamp: "2026-06-05T22:00:00Z", type: "pontuelle", source: "manual" },
  // Day -6
  { id: "g48",  value: 89,  timestamp: "2026-06-06T07:00:00Z", type: "fasting",   source: "manual" },
  { id: "g49",  value: 137, timestamp: "2026-06-06T09:30:00Z", type: "post-meal", source: "manual" },
  { id: "g50",  value: 111, timestamp: "2026-06-06T12:00:00Z", type: "pre-meal",  source: "manual" },
  { id: "g51",  value: 167, timestamp: "2026-06-06T14:00:00Z", type: "post-meal", source: "manual" },
  { id: "g52",  value: 100, timestamp: "2026-06-06T18:00:00Z", type: "pre-meal",  source: "manual" },
  { id: "g53",  value: 154, timestamp: "2026-06-06T20:00:00Z", type: "post-meal", source: "manual" },
  { id: "g54",  value: 95,  timestamp: "2026-06-06T22:00:00Z", type: "pontuelle", source: "manual" },
  // Day -5
  { id: "g55",  value: 93,  timestamp: "2026-06-07T07:00:00Z", type: "fasting",   source: "manual" },
  { id: "g56",  value: 144, timestamp: "2026-06-07T09:30:00Z", type: "post-meal", source: "manual" },
  { id: "g57",  value: 117, timestamp: "2026-06-07T12:00:00Z", type: "pre-meal",  source: "manual" },
  { id: "g58",  value: 173, timestamp: "2026-06-07T14:00:00Z", type: "post-meal", source: "manual" },
  { id: "g59",  value: 106, timestamp: "2026-06-07T18:00:00Z", type: "pre-meal",  source: "manual" },
  { id: "g60",  value: 161, timestamp: "2026-06-07T20:30:00Z", type: "post-meal", source: "manual" },
  { id: "g61",  value: 100, timestamp: "2026-06-07T22:00:00Z", type: "pontuelle", source: "manual" },
  // Day -4
  { id: "g62",  value: 87,  timestamp: "2026-06-08T07:00:00Z", type: "fasting",   source: "manual" },
  { id: "g63",  value: 139, timestamp: "2026-06-08T09:30:00Z", type: "post-meal", source: "manual" },
  { id: "g64",  value: 114, timestamp: "2026-06-08T12:00:00Z", type: "pre-meal",  source: "manual" },
  { id: "g65",  value: 169, timestamp: "2026-06-08T14:00:00Z", type: "post-meal", source: "manual" },
  { id: "g66",  value: 102, timestamp: "2026-06-08T18:00:00Z", type: "pre-meal",  source: "manual" },
  { id: "g67",  value: 156, timestamp: "2026-06-08T20:00:00Z", type: "post-meal", source: "manual" },
  { id: "g68",  value: 98,  timestamp: "2026-06-08T22:00:00Z", type: "pontuelle", source: "manual" },
  // Day -3
  { id: "g69",  value: 92,  timestamp: "2026-06-09T07:00:00Z", type: "fasting",   source: "manual" },
  { id: "g70",  value: 146, timestamp: "2026-06-09T09:30:00Z", type: "post-meal", source: "manual" },
  { id: "g71",  value: 110, timestamp: "2026-06-09T12:00:00Z", type: "pre-meal",  source: "manual" },
  { id: "g72",  value: 166, timestamp: "2026-06-09T14:00:00Z", type: "post-meal", source: "manual" },
  { id: "g73",  value: 101, timestamp: "2026-06-09T18:00:00Z", type: "pre-meal",  source: "manual" },
  { id: "g74",  value: 153, timestamp: "2026-06-09T20:30:00Z", type: "post-meal", source: "manual" },
  { id: "g75",  value: 96,  timestamp: "2026-06-09T22:00:00Z", type: "pontuelle", source: "manual" },
  // Day -2
  { id: "g76",  value: 90,  timestamp: "2026-06-10T07:00:00Z", type: "fasting",   source: "manual" },
  { id: "g77",  value: 141, timestamp: "2026-06-10T09:30:00Z", type: "post-meal", source: "manual" },
  { id: "g78",  value: 116, timestamp: "2026-06-10T12:00:00Z", type: "pre-meal",  source: "manual" },
  { id: "g79",  value: 171, timestamp: "2026-06-10T14:00:00Z", type: "post-meal", source: "manual" },
  { id: "g80",  value: 105, timestamp: "2026-06-10T18:00:00Z", type: "pre-meal",  source: "manual" },
  { id: "g81",  value: 158, timestamp: "2026-06-10T20:00:00Z", type: "post-meal", source: "manual" },
  { id: "g82",  value: 97,  timestamp: "2026-06-10T22:00:00Z", type: "pontuelle", source: "manual" },
  // Day -1 (yesterday)
  { id: "g83",  value: 88,  timestamp: "2026-06-11T07:00:00Z", type: "fasting",   source: "manual" },
  { id: "g84",  value: 136, timestamp: "2026-06-11T09:30:00Z", type: "post-meal", source: "manual" },
  { id: "g85",  value: 112, timestamp: "2026-06-11T12:00:00Z", type: "pre-meal",  source: "manual" },
  { id: "g86",  value: 163, timestamp: "2026-06-11T14:00:00Z", type: "post-meal", source: "manual" },
  { id: "g87",  value: 103, timestamp: "2026-06-11T18:00:00Z", type: "pre-meal",  source: "manual" },
  { id: "g88",  value: 155, timestamp: "2026-06-11T20:30:00Z", type: "post-meal", source: "manual" },
  { id: "g89",  value: 94,  timestamp: "2026-06-11T22:00:00Z", type: "pontuelle", source: "manual" },
  // Day 0 (today, partial)
  { id: "g90",  value: 91,  timestamp: "2026-06-12T07:00:00Z", type: "fasting",   source: "manual" },
  { id: "g91",  value: 148, timestamp: "2026-06-12T09:30:00Z", type: "post-meal", source: "manual" },
  { id: "g92",  value: 109, timestamp: "2026-06-12T12:30:00Z", type: "pre-meal",  source: "manual" },
]

// ─── Weight history ─────────────────────────────────────────────────────────────
// 30 days of stable data, small realistic downward trend

export const sampleWeightHistory: WeightEntry[] = [
  { date: "2026-05-13", weight: 84.2, bodyFat: 22.8 },
  { date: "2026-05-14", weight: 84.0, bodyFat: 22.7 },
  { date: "2026-05-15", weight: 83.9, bodyFat: 22.7 },
  { date: "2026-05-16", weight: 83.8, bodyFat: 22.6 },
  { date: "2026-05-17", weight: 83.7, bodyFat: 22.5 },
  { date: "2026-05-18", weight: 83.9, bodyFat: 22.6 },
  { date: "2026-05-19", weight: 83.6, bodyFat: 22.5 },
  { date: "2026-05-20", weight: 83.5, bodyFat: 22.4 },
  { date: "2026-05-21", weight: 83.4, bodyFat: 22.4 },
  { date: "2026-05-22", weight: 83.3, bodyFat: 22.3 },
  { date: "2026-05-23", weight: 83.5, bodyFat: 22.3 },
  { date: "2026-05-24", weight: 83.2, bodyFat: 22.2 },
  { date: "2026-05-25", weight: 83.1, bodyFat: 22.2 },
  { date: "2026-05-26", weight: 83.0, bodyFat: 22.1 },
  { date: "2026-05-27", weight: 82.9, bodyFat: 22.1 },
  { date: "2026-05-28", weight: 82.8, bodyFat: 22.0 },
  { date: "2026-05-29", weight: 82.9, bodyFat: 22.0 },
  { date: "2026-05-30", weight: 82.7, bodyFat: 21.9 },
  { date: "2026-05-31", weight: 82.6, bodyFat: 21.9 },
  { date: "2026-06-01", weight: 82.5, bodyFat: 21.8 },
  { date: "2026-06-02", weight: 82.4, bodyFat: 21.8 },
  { date: "2026-06-03", weight: 82.3, bodyFat: 21.7 },
  { date: "2026-06-04", weight: 82.5, bodyFat: 21.7 },
  { date: "2026-06-05", weight: 82.2, bodyFat: 21.6 },
  { date: "2026-06-06", weight: 82.1, bodyFat: 21.6 },
  { date: "2026-06-07", weight: 82.0, bodyFat: 21.5 },
  { date: "2026-06-08", weight: 82.1, bodyFat: 21.5 },
  { date: "2026-06-09", weight: 81.9, bodyFat: 21.4 },
  { date: "2026-06-10", weight: 81.8, bodyFat: 21.4 },
  { date: "2026-06-11", weight: 81.7, bodyFat: 21.3 },
]

// ─── Activities ─────────────────────────────────────────────────────────────────

export const sampleActivities: ActivityEntry[] = [
  { id: "a1",  type: "Course",    duration: 35, caloriesBurned: 310, date: "2026-06-12", source: "strava",  createdAt: "2026-06-12T06:30:00Z" },
  { id: "a2",  type: "Vélo",      duration: 60, caloriesBurned: 480, date: "2026-06-11", source: "strava",  createdAt: "2026-06-11T07:00:00Z" },
  { id: "a3",  type: "Natation",  duration: 45, caloriesBurned: 400, date: "2026-06-10", source: "manual",  createdAt: "2026-06-10T08:00:00Z" },
  { id: "a4",  type: "Marche",    duration: 50, caloriesBurned: 210, date: "2026-06-09", source: "manual",  createdAt: "2026-06-09T18:00:00Z" },
  { id: "a5",  type: "Musculation", duration: 55, caloriesBurned: 350, date: "2026-06-08", source: "manual", createdAt: "2026-06-08T17:00:00Z" },
  { id: "a6",  type: "Course",    duration: 30, caloriesBurned: 265, date: "2026-06-07", source: "strava",  createdAt: "2026-06-07T06:45:00Z" },
  { id: "a7",  type: "Yoga",      duration: 60, caloriesBurned: 180, date: "2026-06-05", source: "manual",  createdAt: "2026-06-05T07:30:00Z" },
  { id: "a8",  type: "Vélo",      duration: 90, caloriesBurned: 720, date: "2026-06-01", source: "strava",  createdAt: "2026-06-01T10:00:00Z" },
]

// ─── Scanned products (groceries screen) ──────────────────────────────────────

export const sampleScannedProducts: ScannedProduct[] = [
  {
    barcode: "3017620422003",
    name: "Nutella 400g",
    nutriScore: "E",
    score: 18,
    verdict: "Mauvais",
    additives: ["E322", "E476"],
    timesThisMonth: 3,
    sucres: 57,
    sel: 0.1,
    ags: 10.6,
  },
  {
    barcode: "7613034626844",
    name: "Nescafé Classic",
    nutriScore: "B",
    score: 62,
    verdict: "Médiocre",
    additives: [],
    timesThisMonth: 12,
    sucres: 0,
    sel: 0,
    ags: 0.1,
  },
  {
    barcode: "3175681851389",
    name: "Yaourt nature",
    nutriScore: "A",
    score: 88,
    verdict: "Excellent",
    additives: [],
    timesThisMonth: 8,
    sucres: 5.2,
    sel: 0.08,
    ags: 1.1,
  },
  {
    barcode: "5449000000996",
    name: "Coca-Cola 500ml",
    nutriScore: "E",
    score: 12,
    verdict: "Mauvais",
    additives: ["E150d", "E338"],
    timesThisMonth: 5,
    sucres: 10.6,
    sel: 0,
    ags: 0,
  },
  {
    barcode: "3228021180121",
    name: "Fleury Michon Jambon",
    nutriScore: "C",
    score: 47,
    verdict: "Médiocre",
    additives: ["E250", "E301"],
    timesThisMonth: 4,
    sucres: 0.5,
    sel: 1.9,
    ags: 1.2,
  },
  {
    barcode: "3256227012115",
    name: "Pain complet bio",
    nutriScore: "A",
    score: 82,
    verdict: "Excellent",
    additives: [],
    timesThisMonth: 10,
    sucres: 3.7,
    sel: 0.9,
    ags: 0.4,
  },
]

// ─── Derived monthly stats from scanned products ────────────────────────────────

export function getMonthlyScannedStats(products: ScannedProduct[]) {
  const totalSucres = products.reduce((s, p) => s + (p.sucres ?? 0) * p.timesThisMonth * 0.1, 0)
  const totalSel = products.reduce((s, p) => s + (p.sel ?? 0) * p.timesThisMonth * 0.1, 0)
  const totalAgs = products.reduce((s, p) => s + (p.ags ?? 0) * p.timesThisMonth * 0.1, 0)

  const RISK_CODES = new Set(["E150d", "E471", "E250", "E338", "E476"])
  const riskAdditives = [
    ...new Set(
      products
        .flatMap((p) => p.additives)
        .map((a) => (typeof a === "string" ? a : (a?.code ?? "")))
        .filter((code) => RISK_CODES.has(code)),
    ),
  ]
  const productsWithRiskAdditives = products.filter((p) =>
    p.additives.some((a) => {
      const code = typeof a === "string" ? a : (a?.code ?? "")
      return RISK_CODES.has(code)
    })
  ).length

  return {
    sucres: Math.round(totalSucres * 10) / 10,
    sel: Math.round(totalSel * 10) / 10,
    ags: Math.round(totalAgs * 10) / 10,
    // WHO daily reference for 30 days: sucres <50g/j, sel <5g/j, AGS <20g/j
    sucresPercent: Math.min(100, Math.round((totalSucres / (50 * 30)) * 100)),
    selPercent: Math.min(100, Math.round((totalSel / (5 * 30)) * 100)),
    agsPercent: Math.min(100, Math.round((totalAgs / (20 * 30)) * 100)),
    riskAdditives,
    productsWithRiskAdditives,
  }
}

// ─── Daily calorie data for stats screen ─────────────────────────────────────────

export interface DayCalories {
  date: string
  label: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export const sampleWeekCalories: DayCalories[] = [
  { date: "2026-06-06", label: "Ven", calories: 1850, protein: 95,  carbs: 215, fat: 62 },
  { date: "2026-06-07", label: "Sam", calories: 2100, protein: 88,  carbs: 248, fat: 75 },
  { date: "2026-06-08", label: "Dim", calories: 1940, protein: 102, carbs: 225, fat: 64 },
  { date: "2026-06-09", label: "Lun", calories: 1780, protein: 98,  carbs: 205, fat: 58 },
  { date: "2026-06-10", label: "Mar", calories: 1920, protein: 105, carbs: 218, fat: 63 },
  { date: "2026-06-11", label: "Mer", calories: 1860, protein: 96,  carbs: 212, fat: 60 },
  { date: "2026-06-12", label: "Jeu", calories: 1650, protein: 87,  carbs: 192, fat: 54 },
]

export const sampleMonthCalories: DayCalories[] = [
  { date: "2026-05-13", label: "13", calories: 2050, protein: 100, carbs: 235, fat: 68 },
  { date: "2026-05-14", label: "14", calories: 1900, protein: 95,  carbs: 218, fat: 63 },
  { date: "2026-05-15", label: "15", calories: 1820, protein: 92,  carbs: 210, fat: 60 },
  { date: "2026-05-16", label: "16", calories: 1980, protein: 103, carbs: 225, fat: 66 },
  { date: "2026-05-17", label: "17", calories: 2120, protein: 89,  carbs: 250, fat: 71 },
  { date: "2026-05-18", label: "18", calories: 1750, protein: 97,  carbs: 200, fat: 57 },
  { date: "2026-05-19", label: "19", calories: 1870, protein: 94,  carbs: 215, fat: 62 },
  { date: "2026-05-20", label: "20", calories: 2000, protein: 104, carbs: 228, fat: 67 },
  { date: "2026-05-21", label: "21", calories: 1930, protein: 99,  carbs: 220, fat: 64 },
  { date: "2026-05-22", label: "22", calories: 1800, protein: 91,  carbs: 208, fat: 59 },
  { date: "2026-05-23", label: "23", calories: 1860, protein: 96,  carbs: 213, fat: 61 },
  { date: "2026-05-24", label: "24", calories: 1950, protein: 101, carbs: 222, fat: 65 },
  { date: "2026-05-25", label: "25", calories: 2080, protein: 107, carbs: 237, fat: 70 },
  { date: "2026-05-26", label: "26", calories: 1760, protein: 88,  carbs: 202, fat: 58 },
  { date: "2026-05-27", label: "27", calories: 1840, protein: 93,  carbs: 211, fat: 60 },
  { date: "2026-05-28", label: "28", calories: 1970, protein: 102, carbs: 224, fat: 66 },
  { date: "2026-05-29", label: "29", calories: 2010, protein: 105, carbs: 229, fat: 67 },
  { date: "2026-05-30", label: "30", calories: 1890, protein: 97,  carbs: 216, fat: 63 },
  { date: "2026-05-31", label: "31", calories: 1820, protein: 92,  carbs: 209, fat: 60 },
  { date: "2026-06-01", label: "1",  calories: 1750, protein: 88,  carbs: 201, fat: 57 },
  { date: "2026-06-02", label: "2",  calories: 1910, protein: 99,  carbs: 218, fat: 63 },
  { date: "2026-06-03", label: "3",  calories: 1980, protein: 104, carbs: 225, fat: 66 },
  { date: "2026-06-04", label: "4",  calories: 2040, protein: 106, carbs: 232, fat: 69 },
  { date: "2026-06-05", label: "5",  calories: 1870, protein: 95,  carbs: 214, fat: 62 },
  { date: "2026-06-06", label: "6",  calories: 1850, protein: 95,  carbs: 215, fat: 62 },
  { date: "2026-06-07", label: "7",  calories: 2100, protein: 88,  carbs: 248, fat: 75 },
  { date: "2026-06-08", label: "8",  calories: 1940, protein: 102, carbs: 225, fat: 64 },
  { date: "2026-06-09", label: "9",  calories: 1780, protein: 98,  carbs: 205, fat: 58 },
  { date: "2026-06-10", label: "10", calories: 1920, protein: 105, carbs: 218, fat: 63 },
  { date: "2026-06-11", label: "11", calories: 1860, protein: 96,  carbs: 212, fat: 60 },
]

// ─── Today's water intake ────────────────────────────────────────────────────────

export const defaultWaterIntake = 5 // glasses consumed today (mock)
