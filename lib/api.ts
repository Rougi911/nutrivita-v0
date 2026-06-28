import type {
  ApiInterpretResponse,
  ApiScanResponse,
  ApiGroceriesSummary,
  ApiDeficienciesResponse,
  ApiMealEntry,
  ApiWeightEntry,
  ApiGlucoseReading,
  ApiActivityEntry,
  ApiFoodSearchResult,
  ApiLabelScanResult,
  ApiAdditivesStats,
  ApiScannedProductsResponse,
  ApiScannedProduct,
  ApiCompositionResult,
  ApiAlternative,
  ApiAlternativesResponse,
} from "@/lib/api-types"
import type {
  MealEntry,
  WeightEntry,
  GlucoseReading,
  ActivityEntry,
  ScannedProduct,
  FoodItem,
  AdditiveRef,
  Alternative,
} from "@/lib/types"
import { getToken } from "@/lib/auth"

// Strip trailing /api if present — every endpoint path already starts with /api/
// Garde-fou : si la valeur résolue n'est pas absolue (env mal réglée / vide), on retombe
// sur le backend par défaut — JAMAIS d'URL relative (sinon les appels partent vers le front Next → 404).
const DEFAULT_API_BASE = "https://nutridz-2.onrender.com"
export const API_BASE = (() => {
  const raw =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
    DEFAULT_API_BASE
  const stripped = raw.replace(/\/api\/?$/, "")
  return /^https?:\/\//.test(stripped) ? stripped : DEFAULT_API_BASE
})()

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

export class ProductUnknownError extends Error {
  constructor(public readonly barcode: string) {
    super(`product_unknown:${barcode}`)
    this.name = "ProductUnknownError"
  }
}

/**
 * P0-3 / DEF-1 — Session « morte » (auth invalide) → purge du token + retour au login.
 * Sont des sessions mortes :
 *  - status 401 (toujours),
 *  - status 403 dont le corps désigne explicitement le token (ex. {"error":"Token invalide"},
 *    « jwt expired »…) — typiquement après une rotation de JWT_SECRET.
 *
 * NE sont PAS des sessions mortes (donc ni purge, ni déconnexion) :
 *  - 403 CSRF (« CSRF token invalide ») → erreur de requête, pas de session morte,
 *  - 403 métier (« Accès refusé »…) → l'utilisateur reste connecté,
 *  - status 0 / 5xx → vraie panne réseau → mode hors-ligne (voir isNetworkFailure).
 */
export function isDeadAuthError(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false
  if (err.status === 401) return true
  if (err.status !== 403) return false
  // err.message embarque le corps brut de la réponse 403.
  // « csrf »/« xsrf » exclus en priorité (« CSRF token invalide » contient « token »).
  if (/csrf|xsrf/i.test(err.message)) return false
  // « token » / « jwt » couvrent « Token invalide » (libellé backend actuel) ;
  // « signature » couvre l'erreur brute de jsonwebtoken (« invalid signature »)
  // typique d'une rotation de JWT_SECRET. « jwt expired » est couvert par « jwt ».
  return /token|jwt|signature/i.test(err.message)
}

/**
 * P0-3 — Vraie panne réseau → mode hors-ligne (données locales) + retry.
 * Couvre le timeout/abort (status 0) et l'indisponibilité infra (502/503/504,
 * ex. cold start Render). Tout 4xx applicatif en est exclu.
 */
export function isNetworkFailure(err: unknown): boolean {
  return err instanceof ApiError && [0, 502, 503, 504].includes(err.status)
}

/** Vérifie que la réponse est bien un tableau. Si le corps contient {error:string},
 *  lève ApiError(401) pour les erreurs d'auth, ApiError(0) sinon.
 *  Empêche tout .map() sur un objet d'erreur (cause racine du faux offline). */
function guardArray<T>(raw: unknown, route: string): T[] {
  if (Array.isArray(raw)) return raw as T[]
  const errMsg = (raw != null && typeof raw === "object" && "error" in raw)
    ? String((raw as { error: unknown }).error)
    : "unexpected non-array response"
  console.error(`[API] ${route} returned non-array body:`, raw)
  const isAuth = /token|manquant|unauthorized|auth/i.test(errMsg)
  throw new ApiError(isAuth ? 401 : 0, errMsg)
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
    const token = getToken()
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    })

    if (slowTimer) clearTimeout(slowTimer)

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.error(`[API] ${init?.method ?? "GET"} ${path} → ${res.status}`, text)
      throw new ApiError(res.status, text)
    }

    // 204 No Content — legitimate empty response (e.g. /api/stats/deficiencies)
    if (res.status === 204) return null as unknown as T

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
    // Mappe les micronutriments imbriqués (camelCase backend) vers les champs
    // plats attendus par le radar (calcRadarData). ?? null préserve la sémantique
    // "donnée inconnue" ; un 0 réel (ex. vit D/B12 d'un légume) est conservé.
    vit_c_mg:     raw.micronutrients?.vitaminC   ?? null,
    vit_d_ug:     raw.micronutrients?.vitaminD   ?? null,
    b9_ug:        raw.micronutrients?.vitaminB9  ?? null,
    b12_ug:       raw.micronutrients?.vitaminB12 ?? null,
    iron_mg:      raw.micronutrients?.iron       ?? null,
    calcium_mg:   raw.micronutrients?.calcium    ?? null,
    magnesium_mg: raw.micronutrients?.magnesium  ?? null,
    zinc_mg:      raw.micronutrients?.zinc        ?? null,
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

// Le backend stocke reading_type (snake) ; le frontend utilise des libellés à tirets.
const GLUCOSE_TYPE_FROM_API: Record<string, GlucoseReading["type"]> = {
  fasting: "fasting", pre_meal: "pre-meal", post_meal: "post-meal",
  random: "pontuelle", bedtime: "pontuelle", cgm: "cgm",
}
const GLUCOSE_TYPE_TO_API: Record<string, string> = {
  fasting: "fasting", "pre-meal": "pre_meal", "post-meal": "post_meal",
  pontuelle: "random", cgm: "cgm",
}

function mapGlucoseReading(raw: ApiGlucoseReading): GlucoseReading {
  return {
    id: String(raw.id),
    value: raw.glucose_mg_dl,
    timestamp: raw.timestamp,
    type: GLUCOSE_TYPE_FROM_API[raw.reading_type] ?? "pontuelle",
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
    nutriScore: raw.nutri_score ? (raw.nutri_score.toUpperCase() as "A" | "B" | "C" | "D" | "E") : null,
    score: raw.score,
    verdict: raw.verdict,
    nutriScoreSource: raw.nutriscore_source, // P1-7 — non noté = "non_note"
    additives: raw.additives,
    timesThisMonth: raw.times_this_month ?? 1,
    sucres: raw.sucres,
    sel: raw.sel,
    ags: raw.ags,
    imageUrl: raw.image_url ?? null,
  }
}

function mapApiScannedProduct(raw: ApiScannedProduct): ScannedProduct {
  return {
    id:             raw.id,
    barcode:        raw.barcode,
    name:           raw.name,
    nutriScore:     raw.nutri_score ? (raw.nutri_score.toUpperCase() as "A" | "B" | "C" | "D" | "E") : null,
    score:          raw.score,
    verdict:        raw.verdict,
    additives:      raw.additives,
    timesThisMonth: raw.times_this_month,
    sucres:         raw.sugars_g,
    sel:            raw.salt_g,
    ags:            raw.sat_fat_g,
    scannedAt:      raw.scanned_at,
    imageUrl:       raw.image_url ?? null,
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string
  user: { id: string; email: string; name: string }
}

export async function register(
  email: string,
  password: string,
  name: string,
  consentGlucose: boolean
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name, consent_glucose: consentGlucose }),
  })
}

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

export async function interpretMedia(
  mode: "photo" | "voice" | "text",
  payload: string,
  lang?: string
): Promise<ApiInterpretResponse> {
  return apiFetch<ApiInterpretResponse>("/api/interpret", {
    method: "POST",
    body: JSON.stringify({ mode, payload, ...(lang ? { lang } : {}) }),
  })
}

export async function scanBarcode(barcode: string): Promise<ScannedProduct> {
  try {
    const raw = await apiFetch<ApiScanResponse & { status?: string }>("/api/scan", {
      method: "POST",
      body: JSON.stringify({ barcode }),
    })
    if (raw.status === "product_unknown") {
      throw new ProductUnknownError(barcode)
    }
    return mapScannedProduct(raw)
  } catch (err) {
    if (err instanceof ProductUnknownError) throw err
    if (err instanceof ApiError && (err.status === 404 || err.message.includes("product_unknown"))) {
      throw new ProductUnknownError(barcode)
    }
    throw err
  }
}

export async function scanLabelImage(base64: string): Promise<ApiLabelScanResult> {
  type RawLabel = Record<string, number | string | null | undefined>
  const raw = await apiFetch<RawLabel>("/api/scan/label", {
    method: "POST",
    body: JSON.stringify({ image: base64 }),
  })
  // Defensive mapper: backend may return FR or EN field names
  const n = (...keys: string[]): number | null => {
    for (const k of keys) {
      const v = raw[k]
      if (v !== null && v !== undefined && typeof v === "number") return v
    }
    return null
  }
  return {
    source: (raw["source"] as string) ?? "label_declared_by_manufacturer",
    kcal:      n("kcal", "energy_kcal", "calories", "energie"),
    glucides:  n("glucides", "carbohydrates", "carbs", "glucides_total"),
    sucres:    n("sucres", "sugars", "sugar", "sucres_total"),
    proteines: n("proteines", "proteins", "protein", "proteines_total"),
    lipides:   n("lipides", "fat", "lipids", "matieres_grasses"),
    satures:   n("satures", "saturated_fat", "saturates", "acides_gras_satures"),
    sel:       n("sel", "salt", "sodium"),
    fibres:    n("fibres", "fiber", "fibre", "dietary_fiber"),
  }
}

/** Résultat S6 mappé camelCase pour l'écran de confirmation composition. */
export interface CompositionResult {
  source: string
  productName: string | null
  /** null = valeur non lue (REG : ne jamais afficher 0 à la place d'une donnée inconnue). */
  per100g: {
    kcal: number | null
    glucides: number | null
    sucres: number | null
    proteines: number | null
    lipides: number | null
    satures: number | null
    fibres: number | null
    sel: number | null
  }
  additives: AdditiveRef[]
  servingG: number | null
  confidence: number
  needsConfirmation: boolean
  warnings: string[]
}

/** Mapper pur ApiCompositionResult → CompositionResult (exporté pour les tests S6). */
export function mapCompositionResult(raw: ApiCompositionResult): CompositionResult {
  const p = raw.per_100g ?? ({} as ApiCompositionResult["per_100g"])
  const n = (v: number | null | undefined): number | null =>
    typeof v === "number" && Number.isFinite(v) ? v : null
  return {
    source: raw.source ?? "gemini_label",
    productName: raw.product_name ?? null,
    per100g: {
      kcal:      n(p.kcal),
      glucides:  n(p.glucides),
      sucres:    n(p.dont_sucres),
      proteines: n(p.proteines),
      lipides:   n(p.lipides),
      satures:   n(p.dont_satures),
      fibres:    n(p.fibres),
      sel:       n(p.sel),
    },
    additives: Array.isArray(raw.additives) ? raw.additives : [],
    servingG: n(raw.serving_g),
    confidence: typeof raw.confidence === "number" ? raw.confidence : 0,
    needsConfirmation: raw.needs_confirmation !== false, // défaut prudent : confirmer
    warnings: Array.isArray(raw.warnings) ? raw.warnings : [],
  }
}

/** POST /api/scan/composition (S5/S6) — extraction tableau nutritionnel + additifs. */
export async function scanCompositionImage(base64: string): Promise<CompositionResult> {
  const raw = await apiFetch<ApiCompositionResult>("/api/scan/composition", {
    method: "POST",
    body: JSON.stringify({ image: base64 }),
  })
  return mapCompositionResult(raw)
}

// ─── Alternatives plus saines (S12) ────────────────────────────────────────

export interface AlternativesResult {
  sourceBarcode: string
  category: string | null
  alternatives: Alternative[]
}

/** Mapper pur ApiAlternative → Alternative (exporté pour les tests S12).
 *  Normalise le grade OFF minuscule ("a") en majuscule ("A"), null si hors A–E. */
export function mapAlternative(raw: ApiAlternative): Alternative {
  const g = raw.nutriScore ? raw.nutriScore.toUpperCase() : null
  const nutriScore = g && "ABCDE".includes(g) ? (g as Alternative["nutriScore"]) : null
  return {
    barcode: String(raw.barcode),
    name: raw.name,
    nutriScore,
    imageUrl: raw.imageUrl ?? null,
  }
}

/** GET /api/alternatives/:barcode — top 5 produits mieux notés de la même catégorie. */
export async function getAlternatives(barcode: string): Promise<AlternativesResult> {
  const raw = await apiFetch<ApiAlternativesResponse>(
    `/api/alternatives/${encodeURIComponent(barcode)}`
  )
  return {
    sourceBarcode: raw.source_barcode,
    category: raw.category ?? null,
    alternatives: Array.isArray(raw.alternatives) ? raw.alternatives.map(mapAlternative) : [],
  }
}

export async function searchFoods(q: string): Promise<FoodItem[]> {
  const raw = await apiFetch<unknown>(
    `/api/foods/search?q=${encodeURIComponent(q)}`
  )
  return guardArray<ApiFoodSearchResult>(raw, "/api/foods/search").map((r) => ({
    id: r.id,
    name: r.name,
    nameAr: r.name_ar,
    nameEn: r.name_en,
    cuisine: r.cuisine ?? "International",
    calories: r.calories,
    protein: r.protein,
    carbs: r.carbs,
    fat: r.fat,
    fiber: r.fiber,
    source: r.source,
  }))
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

export async function getDeficiencies(): Promise<ApiDeficienciesResponse | null> {
  return apiFetch<ApiDeficienciesResponse | null>("/api/stats/deficiencies")
}

export async function getJournal(date: string): Promise<MealEntry[]> {
  const raw = await apiFetch<unknown>("/api/journal/query", {
    method: "POST",
    body: JSON.stringify({ date }),
  })
  // Backend P4.16 renvoie { date, entries: [...], meals, totals }
  // P4.15 guardArray protège contre les corps d'erreur {error:"..."}.
  // !Array.isArray évite le false-positive sur Array.prototype.entries.
  const arr = (raw != null && typeof raw === "object" && !Array.isArray(raw) && "entries" in (raw as object))
    ? (raw as { entries: unknown }).entries
    : raw
  return guardArray<ApiMealEntry>(arr, "/api/journal/query").map(mapMealEntry)
}

export async function addJournalEntry(
  entry: Omit<MealEntry, "id" | "createdAt">,
  parentEntryId?: string
): Promise<MealEntry> {
  // POST /api/journal returns a raw DB row (no nested food object) — don't call mapMealEntry.
  // Build MealEntry from the input data + backend UUID so callers can propagate the real id.
  // parent_entry_id (S15) lie une sauce/condiment à l'aliment parent.
  const raw = await apiFetch<{ id: string }>("/api/journal", {
    method: "POST",
    body: JSON.stringify({
      food_id: entry.foodId,
      amount: entry.amount,
      meal_type: entry.mealType,
      date: entry.date,
      ...(parentEntryId ? { parent_entry_id: parentEntryId } : {}),
    }),
  })
  if (!raw.id || typeof raw.id !== "string") {
    throw new ApiError(0, "POST /api/journal: id manquant dans la réponse")
  }
  return {
    id: raw.id,
    foodId: entry.foodId,
    food: entry.food,
    amount: entry.amount,
    mealType: entry.mealType,
    date: entry.date,
    createdAt: new Date().toISOString(),
  }
}

export async function deleteJournalEntry(id: string): Promise<void> {
  await apiFetch<void>(`/api/journal/${id}`, { method: "DELETE" })
}

/** Totaux recalculés renvoyés par PATCH /api/journal/:id (déjà mis à l'échelle de la quantité). */
export interface JournalPatchResult {
  id: string
  grams: number
  kcal: number
  glucides: number
  proteines: number
  lipides: number
  fibres: number
}

/** PATCH /api/journal/:id (S15) — modifie la quantité ; le backend recalcule kcal/macros proportionnellement. */
export async function updateJournalEntry(id: string, amount: number): Promise<JournalPatchResult> {
  return apiFetch<JournalPatchResult>(`/api/journal/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ amount }),
  })
}

export async function getWeightHistory(days: number): Promise<WeightEntry[]> {
  const raw = await apiFetch<unknown>("/api/weight/query", {
    method: "POST",
    body: JSON.stringify({ days }),
  })
  return guardArray<ApiWeightEntry>(raw, "/api/weight/query").map(mapWeightEntry)
}

export async function addWeightEntryApi(entry: WeightEntry): Promise<WeightEntry> {
  const raw = await apiFetch<ApiWeightEntry>("/api/weight", {
    method: "POST",
    body: JSON.stringify({ date: entry.date, weight_kg: entry.weight, body_fat: entry.bodyFat }),
  })
  return mapWeightEntry(raw)
}

export async function getGlucoseReadings(days: number): Promise<GlucoseReading[]> {
  const raw = await apiFetch<unknown>("/api/glucose/query", {
    method: "POST",
    body: JSON.stringify({ days }),
  })
  return guardArray<ApiGlucoseReading>(raw, "/api/glucose/query").map(mapGlucoseReading)
}

export async function addGlucoseReadingApi(
  reading: Omit<GlucoseReading, "id">
): Promise<GlucoseReading> {
  const raw = await apiFetch<ApiGlucoseReading>("/api/glucose", {
    method: "POST",
    body: JSON.stringify({
      glucose_mg_dl: reading.value,
      reading_type: GLUCOSE_TYPE_TO_API[reading.type] ?? "random",
      timestamp: reading.timestamp,
    }),
  })
  return mapGlucoseReading(raw)
}

export async function getActivities(date: string): Promise<ActivityEntry[]> {
  const raw = await apiFetch<unknown>("/api/activities/query", {
    method: "POST",
    body: JSON.stringify({ date }),
  })
  return guardArray<ApiActivityEntry>(raw, "/api/activities/query").map(mapActivityEntry)
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

// ─── Additifs EFSA (AL-S4) ───────────────────────────────────────────────────

export interface AdditivesStats {
  days: number
  entriesWithAdditives: number
  totalEntries: number
  counts: { high: number; moderate: number; low: number; unknown: number }
  items: { code: string; name: string; risk: "high" | "moderate" | "low" | "unknown"; count: number }[]
}

export async function getAdditivesStats(days: number): Promise<AdditivesStats> {
  const raw = await apiFetch<ApiAdditivesStats>(`/api/stats/additives?days=${days}`)
  return {
    days: raw.days,
    entriesWithAdditives: raw.entries_with_additives,
    totalEntries: raw.total_entries,
    counts: raw.counts,
    items: raw.items,
  }
}

// ─── Produits scannés (S9) ───────────────────────────────────────────────────

export async function getScannedProducts(limit = 50, offset = 0): Promise<{ total: number; products: ScannedProduct[] }> {
  const raw = await apiFetch<ApiScannedProductsResponse>(`/api/scanned?limit=${limit}&offset=${offset}`)
  return {
    total:    raw.total,
    products: raw.products.map(mapApiScannedProduct),
  }
}

export async function deleteScannedProduct(id: number): Promise<void> {
  await apiFetch<{ deleted: number }>(`/api/scanned/${id}`, { method: "DELETE" })
}

export async function clearScannedProducts(): Promise<number> {
  const raw = await apiFetch<{ deleted_count: number }>("/api/scanned", { method: "DELETE" })
  return raw.deleted_count
}

// ─── Export RGPD (S11) ────────────────────────────────────────────────────────

/** GET /api/user/export — récupère l'intégralité des données utilisateur (RGPD). */
export async function exportUserData(): Promise<unknown> {
  return apiFetch<unknown>("/api/user/export")
}

// ─── Strava (S16) ──────────────────────────────────────────────────────────────
// REG-05 : les tokens Strava restent backend-only ; le front ne manipule que l'état
// de connexion. Le flux OAuth (state anti-CSRF) est entièrement géré côté backend.

export interface StravaStatus {
  connected: boolean
  athleteName: string | null
}

/** GET /api/strava/status — état de connexion Strava (jamais les tokens). */
export async function getStravaStatus(): Promise<StravaStatus> {
  const raw = await apiFetch<{ connected?: boolean; athleteName?: string | null }>(
    "/api/strava/status"
  )
  return {
    connected: raw?.connected === true,
    athleteName: raw?.athleteName ?? null,
  }
}

/** GET /api/strava/connect — URL OAuth (state signé anti-CSRF). 503 si non configuré. */
export async function getStravaConnectUrl(): Promise<string> {
  const raw = await apiFetch<{ url?: string }>("/api/strava/connect")
  if (!raw?.url || typeof raw.url !== "string") {
    throw new ApiError(0, "GET /api/strava/connect: url manquante")
  }
  return raw.url
}

export interface StravaSyncResult {
  connected: boolean
  imported: number
}

/** POST /api/strava/sync — importe les activités du jour (dédup backend par strava_id). */
export async function syncStrava(): Promise<StravaSyncResult> {
  const raw = await apiFetch<{ connected?: boolean; imported?: number }>(
    "/api/strava/sync",
    { method: "POST" }
  )
  return {
    connected: raw?.connected === true,
    imported: typeof raw?.imported === "number" ? raw.imported : 0,
  }
}

/** DELETE /api/strava/disconnect — efface les tokens Strava côté backend. */
export async function disconnectStrava(): Promise<void> {
  await apiFetch<{ connected: boolean }>("/api/strava/disconnect", { method: "DELETE" })
}
