// Backend response shapes (snake_case — SL-03).
// Mappers vers camelCase dans lib/api.ts.

export interface ApiNutrition {
  kcal: number
  glucides: number
  proteines: number
  lipides: number
  fibres: number
  sel?: number
  source: "ciqual" | "usda"
  quantity_g: number
  estimated_portion: boolean
}

export interface ApiIntent {
  type: "food" | "activity" | "glucose" | "weight"
  // food
  name?: string
  quantity_g?: number | null
  meal_type?: string | null
  nutrition?: ApiNutrition | null
  nutrition_found?: boolean
  // activity
  sport?: string
  duration_min?: number
  // glucose — always mg/dL from backend (AL-04)
  glucose_mg_dl?: number
  // weight
  weight_kg?: number
  // common
  confidence: number
  needs_confirmation: boolean
}

export interface ApiInterpretResponse {
  intents: ApiIntent[]
}

export interface ApiScanResponse {
  barcode: string
  name: string
  nutri_score: "A" | "B" | "C" | "D" | "E" | null
  score: number
  verdict: "Excellent" | "Médiocre" | "Mauvais"
  additives: (string | { code: string; name?: string; risk?: "high" | "moderate" | "low" | null })[]
  sucres: number
  sel: number
  ags: number
}

/** GET /api/scanned — liste paginée des produits scannés avec additifs {code,name,risk} */
export interface ApiScannedProduct {
  id: number
  barcode: string
  name: string
  score: number
  verdict: "Excellent" | "Médiocre" | "Mauvais"
  nutri_score: "A" | "B" | "C" | "D" | "E" | null
  nova: number | null
  sugars_g: number
  salt_g: number
  sat_fat_g: number
  times_this_month: number
  scanned_at: string
  additives: { code: string; name?: string; risk?: "high" | "moderate" | "low" | "unknown" | null }[]
}

export interface ApiScannedProductsResponse {
  total: number
  limit: number
  offset: number
  products: ApiScannedProduct[]
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
    source: "nutrivita" | "ciqual" | "usda" | "estimated"
    // Micronutriments imbriqués renvoyés par /api/journal (clés camelCase backend).
    // null = donnée inconnue (≠ 0). Absent si l'aliment n'a pas de données détaillées.
    micronutrients?: {
      vitaminC?: number | null
      vitaminD?: number | null
      vitaminB9?: number | null
      vitaminB12?: number | null
      iron?: number | null
      calcium?: number | null
      magnesium?: number | null
      zinc?: number | null
    } | null
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

export interface ApiFoodSearchResult {
  id: string
  name: string
  name_ar?: string
  name_en?: string
  cuisine?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  source: "ciqual" | "usda" | "nutrivita" | "estimated"
}

/** Résultat d'analyse d'une photo d'étiquette nutritionnelle (POST /api/scan/label). */
export interface ApiLabelScanResult {
  /** "label_declared_by_manufacturer" — REG : source obligatoire */
  source: string
  kcal: number | null
  glucides: number | null
  sucres: number | null
  proteines: number | null
  lipides: number | null
  satures: number | null
  sel: number | null
  fibres: number | null
}

/** GET /api/stats/additives — AL-S4 exposition additifs (REG-05) */
export interface ApiAdditivesStatsItem {
  code: string
  name: string
  risk: "high" | "moderate" | "low" | "unknown"
  count: number
}

export interface ApiAdditivesStats {
  days: number
  entries_with_additives: number
  total_entries: number
  counts: { high: number; moderate: number; low: number; unknown: number }
  items: ApiAdditivesStatsItem[]
  disclaimer: { fr: string; ar: string; en: string }
}
