import type {
  ApiInterpretResponse,
  ApiScanResponse,
  ApiGroceriesSummary,
  ApiDeficienciesResponse,
  ApiMealEntry,
  ApiWeightEntry,
  ApiGlucoseReading,
  ApiActivityEntry,
} from "@/lib/api-types"
import type {
  MealEntry,
  WeightEntry,
  GlucoseReading,
  ActivityEntry,
  ScannedProduct,
  FoodItem,
} from "@/lib/types"

export const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
  "https://nutridz.onrender.com"

const REQUEST_TIMEOUT_MS = 60_000
const SLOW_START_THRESHOLD_MS = 3_000

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(`ApiError [${status}]: ${message}`)
    this.name = "ApiError"
  }
}

type SlowStartCallback = () => void
let _onSlowStart: SlowStartCallback | null = null
export function setSlowStartCallback(cb: SlowStartCallback | null) {
  _onSlowStart = cb
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const start = Date.now()
  let slowTimer: ReturnType<typeof setTimeout> | null = null

  if (_onSlowStart) {
    slowTimer = setTimeout(() => _onSlowStart?.(), SLOW_START_THRESHOLD_MS)
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    })

    if (slowTimer) clearTimeout(slowTimer)

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new ApiError(res.status, text)
    }

    return res.json() as Promise<T>
  } catch (err) {
    if (slowTimer) clearTimeout(slowTimer)
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(0, "timeout after " + (Date.now() - start) + "ms")
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

// ─── Mappers snake_case → camelCase ─────────────────────────────────────────

function mapFood(raw: ApiMealEntry["food"]): FoodItem {
  return {
    id: raw.id,
    name: raw.name,
    nameAr: raw.name_ar,
    nameEn: raw.name_en,
    cuisine: raw.cuisine ?? "International",
    calories: raw.calories,
    protein: raw.protein,
    carbs: raw.carbs,
    fat: raw.fat,
    fiber: raw.fiber,
    sugar: raw.sugar,
    sodium: raw.sodium,
    source: raw.source,
  }
}

function mapMealEntry(raw: ApiMealEntry): MealEntry {
  return {
    id: raw.id,
    foodId: raw.food_id,
    food: mapFood(raw.food),
    amount: raw.amount,
    mealType: raw.meal_type,
    date: raw.date,
    createdAt: raw.created_at,
  }
}

function mapWeightEntry(raw: ApiWeightEntry): WeightEntry {
  return {
    date: raw.date,
    weight: raw.weight_kg,
    bodyFat: raw.body_fat,
    muscleMass: raw.muscle_mass,
  }
}

function mapGlucoseReading(raw: ApiGlucoseReading): GlucoseReading {
  return {
    id: raw.id,
    value: raw.value,
    timestamp: raw.timestamp,
    type: raw.type,
    source: raw.source,
  }
}

function mapActivityEntry(raw: ApiActivityEntry): ActivityEntry {
  return {
    id: raw.id,
    type: raw.type,
    duration: raw.duration,
    caloriesBurned: raw.calories_burned,
    date: raw.date,
    source: raw.source,
    createdAt: raw.created_at,
  }
}

function mapScannedProduct(
  raw: ApiScanResponse & { times_this_month?: number }
): ScannedProduct {
  return {
    barcode: raw.barcode,
    name: raw.name,
    nutriScore: raw.nutri_score,
    score: raw.score,
    verdict: raw.verdict,
    additives: raw.additives,
    timesThisMonth: raw.times_this_month ?? 1,
    sucres: raw.sucres,
    sel: raw.sel,
    ags: raw.ags,
  }
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

export async function interpretMedia(
  mode: "photo" | "voice",
  content: string
): Promise<ApiInterpretResponse> {
  return apiFetch<ApiInterpretResponse>("/api/interpret", {
    method: "POST",
    body: JSON.stringify({ mode, content }),
  })
}

export async function scanBarcode(barcode: string): Promise<ScannedProduct> {
  const raw = await apiFetch<ApiScanResponse>("/api/scan", {
    method: "POST",
    body: JSON.stringify({ barcode }),
  })
  return mapScannedProduct(raw)
}

export async function getGroceriesSummary(): Promise<{
  products: ScannedProduct[]
  totalSucresG: number
  totalSelG: number
  totalAgsG: number
}> {
  const raw = await apiFetch<ApiGroceriesSummary>("/api/groceries/summary")
  return {
    products: raw.products.map(mapScannedProduct),
    totalSucresG: raw.total_sucres_g,
    totalSelG: raw.total_sel_g,
    totalAgsG: raw.total_ags_g,
  }
}

export async function getDeficiencies(): Promise<ApiDeficienciesResponse> {
  return apiFetch<ApiDeficienciesResponse>("/api/stats/deficiencies")
}

export async function getJournal(date: string): Promise<MealEntry[]> {
  const raw = await apiFetch<ApiMealEntry[]>(`/api/journal?date=${date}`)
  return raw.map(mapMealEntry)
}

export async function addJournalEntry(
  entry: Omit<MealEntry, "id" | "createdAt">
): Promise<MealEntry> {
  const raw = await apiFetch<ApiMealEntry>("/api/journal", {
    method: "POST",
    body: JSON.stringify({
      food_id: entry.foodId,
      amount: entry.amount,
      meal_type: entry.mealType,
      date: entry.date,
    }),
  })
  return mapMealEntry(raw)
}

export async function deleteJournalEntry(id: string): Promise<void> {
  await apiFetch<void>(`/api/journal/${id}`, { method: "DELETE" })
}

export async function getWeightHistory(days: number): Promise<WeightEntry[]> {
  const raw = await apiFetch<ApiWeightEntry[]>(`/api/weight?days=${days}`)
  return raw.map(mapWeightEntry)
}

export async function addWeightEntryApi(entry: WeightEntry): Promise<WeightEntry> {
  const raw = await apiFetch<ApiWeightEntry>("/api/weight", {
    method: "POST",
    body: JSON.stringify({ date: entry.date, weight_kg: entry.weight, body_fat: entry.bodyFat }),
  })
  return mapWeightEntry(raw)
}

export async function getGlucoseReadings(days: number): Promise<GlucoseReading[]> {
  const raw = await apiFetch<ApiGlucoseReading[]>(`/api/glucose?days=${days}`)
  return raw.map(mapGlucoseReading)
}

export async function addGlucoseReadingApi(
  reading: Omit<GlucoseReading, "id">
): Promise<GlucoseReading> {
  const raw = await apiFetch<ApiGlucoseReading>("/api/glucose", {
    method: "POST",
    body: JSON.stringify(reading),
  })
  return mapGlucoseReading(raw)
}

export async function getActivities(date: string): Promise<ActivityEntry[]> {
  const raw = await apiFetch<ApiActivityEntry[]>(`/api/activities?date=${date}`)
  return raw.map(mapActivityEntry)
}

export async function addActivityApi(
  entry: Omit<ActivityEntry, "id" | "createdAt">
): Promise<ActivityEntry> {
  const raw = await apiFetch<ApiActivityEntry>("/api/activities", {
    method: "POST",
    body: JSON.stringify({
      type: entry.type,
      duration: entry.duration,
      calories_burned: entry.caloriesBurned,
      date: entry.date,
      source: entry.source,
    }),
  })
  return mapActivityEntry(raw)
}

export async function deleteActivityApi(id: string): Promise<void> {
  await apiFetch<void>(`/api/activities/${id}`, { method: "DELETE" })
}
