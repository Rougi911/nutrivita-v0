// Backend response shapes (snake_case — SL-03).
// Mappers vers camelCase dans lib/api.ts.

export interface ApiIntent {
  type: "meal" | "activity" | "glucose"
  items?: Array<{ name: string; quantity_g: number }>
  sport?: string
  duration_min?: number
  valeur?: number
  unite?: string
  contexte?: string
  confidence: number
}

export interface ApiInterpretResponse {
  intents: ApiIntent[]
  needs_confirmation?: boolean
}

export interface ApiScanResponse {
  barcode: string
  name: string
  nutri_score: "A" | "B" | "C" | "D" | "E" | null
  score: number
  verdict: "Excellent" | "Médiocre" | "Mauvais"
  additives: string[]
  sucres: number
  sel: number
  ags: number
}

export interface ApiGroceriesSummary {
  products: Array<ApiScanResponse & { times_this_month: number }>
  total_sucres_g: number
  total_sel_g: number
  total_ags_g: number
}

export interface ApiDeficiency {
  nutrient: string
  status: "probable" | "a_surveiller"
  amount_pct: number
}

export interface ApiDeficienciesResponse {
  deficiencies: ApiDeficiency[]
  period_days: number
}

export interface ApiMealEntry {
  id: string
  food_id: string
  food: {
    id: string
    name: string
    name_ar?: string
    name_en?: string
    cuisine: string
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
    sugar?: number
    sodium?: number
    source: "nutrivita" | "ciqual" | "estimated"
  }
  amount: number
  meal_type: "breakfast" | "lunch" | "snack" | "dinner"
  date: string
  created_at: string
}

export interface ApiWeightEntry {
  date: string
  weight_kg: number
  body_fat?: number
  muscle_mass?: number
}

export interface ApiGlucoseReading {
  id: string
  value: number  // mg/dL — AL-04
  timestamp: string
  type: "fasting" | "pre-meal" | "post-meal" | "pontuelle" | "cgm"
  source: "manual" | "libreview"
}

export interface ApiActivityEntry {
  id: string
  type: string
  duration: number
  calories_burned: number
  date: string
  source: "manual" | "strava" | "voice"
  created_at: string
}
