/** Isolated opt-in UI adapter. No fetch, tokens, or persistent personal data. */
import { createUiDemoDataset } from "./mock-data"
import { SAMPLE_FOODS } from "./types"
import { getLocalDateStr } from "./date-utils"
const today = getLocalDateStr()
const data = createUiDemoDataset(today)
let nextId = 0
const meals = data.meals.map((m) => ({
  id: m.id,
  food_id: m.foodId,
  food: { ...m.food, name_ar: m.food.nameAr, name_en: m.food.nameEn },
  amount: m.amount,
  meal_type: m.mealType,
  date: m.date,
  created_at: m.createdAt,
}))
let prefs = {
  journal_enabled: false,
  journal_time: "20:00",
  glucose_enabled: false,
  glucose_time: "08:00",
  hydration_enabled: false,
  deficiency_enabled: false,
  geo_consent: false,
}
export async function demoRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const u = new URL(path, "http://ui-demo.invalid")
  const method = init?.method ?? "GET"
  const body = typeof init?.body === "string" ? JSON.parse(init.body) : {}
  let result: unknown
  if (u.pathname === "/api/profile")
    result = {
      user: { id: "demo", name: "Ahmed", email: "demo@example.invalid" },
      age: 34,
      weight: 72.4,
      height: 178,
      target_kcal: 2000,
      sexe: "h",
    }
  else if (u.pathname === "/api/journal/query")
    result = meals.filter((m) => m.date === body.date)
  else if (u.pathname === "/api/journal/range") result = meals
  else if (u.pathname === "/api/journal" && method === "POST") {
    const food = SAMPLE_FOODS.find((f) => f.id === body.food_id) ?? {
      id: body.food_id,
      name: body.name ?? "Demo",
      nameAr: undefined,
      nameEn: undefined,
      cuisine: "Demo",
      source: "estimated" as const,
      calories: body.kcal_per100 ?? 0,
      protein: body.proteines ?? 0,
      carbs: body.glucides ?? 0,
      fat: body.lipides ?? 0,
    }
    const row = {
      id: `demo-new-${++nextId}`,
      food_id: body.food_id,
      food: { ...food, name_ar: food.nameAr, name_en: food.nameEn },
      amount: body.amount,
      meal_type: body.meal_type,
      date: body.date,
      created_at: new Date().toISOString(),
    }
    meals.push(row)
    result = row
  } else if (
    u.pathname.startsWith("/api/journal/") &&
    ["PATCH", "DELETE"].includes(method)
  ) {
    const index = meals.findIndex(
      (m) => m.id === decodeURIComponent(u.pathname.split("/").pop()!)
    )
    if (index < 0) throw new Error("UI demo: entry not found")
    if (method === "DELETE") {
      meals.splice(index, 1)
      result = { deleted: true }
    } else {
      Object.assign(meals[index], body)
      result = { success: true, ...meals[index] }
    }
  } else if (u.pathname === "/api/weight/query") result = data.weight
  else if (u.pathname === "/api/glucose/query") result = data.glucose
  else if (u.pathname === "/api/activities/query")
    result = data.activities.filter((a) => a.date === body.date)
  else if (u.pathname === "/api/activities/range")
    result = data.activities.map((a) => ({
      date: a.date,
      burned: a.calories_burned,
    }))
  else if (u.pathname === "/api/weight" && method === "POST") {
    data.weight.push(body)
    result = body
  } else if (u.pathname === "/api/glucose" && method === "POST") {
    const row = { ...body, id: `demo-g-new-${++nextId}`, source: "manual" }
    data.glucose.push(row)
    result = row
  } else if (u.pathname === "/api/activities" && method === "POST") {
    const row = {
      ...body,
      id: `demo-a-new-${++nextId}`,
      duration_min: body.duration,
      created_at: new Date().toISOString(),
    }
    data.activities.push(row)
    result = row
  } else if (u.pathname === "/api/foods/search")
    result = SAMPLE_FOODS.filter((f) =>
      f.name
        .toLowerCase()
        .includes((u.searchParams.get("q") ?? "").toLowerCase())
    )
  else if (u.pathname === "/api/health-score")
    result = {
      total: 72,
      prevTotal: 69,
      daysLogged: 7,
      daysInPeriod: 7,
      components: { adherence: 75, quality: 70, micro: 65, macro: 78 },
      history: [],
      actions: [],
      targetKcal: 2000,
    }
  else if (u.pathname === "/api/glucose-meals")
    result = {
      date: today,
      timeline: {
        points: [
          { minutes: 450, valueMgDl: 94 },
          { minutes: 600, valueMgDl: 126 },
          { minutes: 720, valueMgDl: 108 },
          { minutes: 900, valueMgDl: 139 },
        ],
        markers: [],
        tir: null,
        maxPeakDeltaMgDl: null,
      },
      pattern: null,
      disclaimer: { fr: "Données fictives", en: "Fictional data", ar: "" },
    }
  else if (
    ["/api/stats/deficiencies", "/api/suggestions/deficiencies"].includes(
      u.pathname
    )
  )
    result = null
  else if (u.pathname === "/api/groceries/summary")
    result = {
      period: today.slice(0, 7),
      year: Number(today.slice(0, 4)),
      month: Number(today.slice(5, 7)),
      products_scanned: 0,
      sugars: { total_g: 0, reference_g: 1500, pct: 0, color: "green" },
      salt: { total_g: 0, reference_g: 150, pct: 0, color: "green" },
      sat_fat: { total_g: 0, reference_g: 600, pct: 0, color: "green" },
      products: [],
      total_sucres_g: 0,
      total_sel_g: 0,
      total_ags_g: 0,
    }
  else if (u.pathname === "/api/scanned")
    result = { products: [], total: 0, limit: 50, offset: 0 }
  else if (u.pathname === "/api/stats/additives")
    result = {
      days: 30,
      entries_with_additives: 0,
      total_entries: 0,
      counts: { high: 0, moderate: 0, low: 0, unknown: 0 },
      items: [],
    }
  else if (u.pathname === "/api/strava/status") result = { connected: false }
  else if (u.pathname === "/api/notifications/prefs") {
    if (method === "PUT") prefs = { ...prefs, ...body }
    result = method === "PUT" ? { success: true, prefs } : prefs
  } else if (u.pathname === "/api/user/export")
    result = {
      demo: true,
      meals,
      weight: data.weight,
      glucose: data.glucose,
      activities: data.activities,
    }
  else if (u.pathname === "/api/interpret")
    result = {
      intents: [
        {
          type: "food",
          name: "Couscous aux légumes",
          quantity_g: 300,
          confidence: 0.7,
          needs_confirmation: true,
          nutrition: {
            kcal: 420,
            glucides: 65,
            proteines: 15,
            lipides: 11,
            fibres: 8,
            source: "ciqual",
            quantity_g: 300,
            estimated_portion: true,
          },
        },
      ],
    }
  else throw new Error(`UI demo: unsupported action ${method} ${u.pathname}`)
  return result as T
}
