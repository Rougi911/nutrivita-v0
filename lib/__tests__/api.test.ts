/**
 * TU-api — Client HTTP lib/api.ts
 * Vérifie : appels corrects, mappers snake→camelCase, gestion erreur.
 */
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from "vitest"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://nutridz.onrender.com"
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe("interpretMedia", () => {
  it("envoie mode:text + champ payload pour transcription vocale", async () => {
    const { interpretMedia } = await import("../api")
    let capturedBody: Record<string, unknown> = {}
    server.use(
      http.post(`${API_BASE}/api/interpret`, async ({ request }) => {
        capturedBody = await request.json() as Record<string, unknown>
        return HttpResponse.json({
          intents: [
            {
              type: "food", name: "Chorba", quantity_g: 300,
              confidence: 0.92, needs_confirmation: false,
              nutrition: { kcal: 285, glucides: 27, proteines: 21, lipides: 9, fibres: 6,
                source: "ciqual", quantity_g: 300, estimated_portion: false },
              nutrition_found: true,
            },
          ],
        })
      })
    )
    const result = await interpretMedia("text", "j'ai mangé une chorba", "fr")
    expect(capturedBody["mode"]).toBe("text")     // TU-15 : mode correct
    expect(capturedBody["payload"]).toBe("j'ai mangé une chorba")  // champ payload
    expect(capturedBody["content"]).toBeUndefined()                 // ancien champ absent
    expect(result.intents).toHaveLength(1)
    expect(result.intents[0].type).toBe("food")
    expect(result.intents[0].name).toBe("Chorba")
  })

  it("envoie mode:photo + champ payload pour image", async () => {
    const { interpretMedia } = await import("../api")
    let capturedBody: Record<string, unknown> = {}
    server.use(
      http.post(`${API_BASE}/api/interpret`, async ({ request }) => {
        capturedBody = await request.json() as Record<string, unknown>
        return HttpResponse.json({ intents: [] })
      })
    )
    await interpretMedia("photo", "base64data")
    expect(capturedBody["mode"]).toBe("photo")
    expect(capturedBody["payload"]).toBe("base64data")
  })

  it("lève ApiError sur 422", async () => {
    const { interpretMedia } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/interpret`, () =>
        HttpResponse.json({ error: "invalid input" }, { status: 422 })
      )
    )
    await expect(interpretMedia("text", "test")).rejects.toThrow("ApiError")
  })
})

describe("scanBarcode", () => {
  it("mappe nutri_score → nutriScore", async () => {
    const { scanBarcode } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/scan`, () =>
        HttpResponse.json({
          barcode: "5449000000996",
          name: "Coca-Cola",
          nutri_score: "E",
          score: 12,
          verdict: "Mauvais",
          additives: ["E150d"],
          sucres: 10.6,
          sel: 0,
          ags: 0,
        })
      )
    )
    const product = await scanBarcode("5449000000996")
    expect(product.nutriScore).toBe("E")
    expect(product.name).toBe("Coca-Cola")
    expect(product.additives).toContain("E150d")
  })
})

describe("getJournal", () => {
  it("TU-P416-FE-1 : lit entries[] depuis { date, entries, meals, totals } (P4.16)", async () => {
    const { getJournal } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/journal/query`, () =>
        HttpResponse.json({
          date: "2026-06-15",
          entries: [
            {
              id: "m1",
              food_id: "7",
              food: { id: "7", name: "Pomme de terre, crue", calories: 76, protein: 2, carbs: 16, fat: 0.1, source: "nutrivita" },
              amount: 400,
              meal_type: "breakfast",
              date: "2026-06-15",
              created_at: "2026-06-15T07:00:00Z",
            },
          ],
          meals: { pdej: [], dej: [], coll: [], diner: [] },
          totals: { kcal: 304, glucides: 64, proteines: 8, lipides: 0.4, fibres: 5.6 },
        })
      )
    )
    const entries = await getJournal("2026-06-15")
    expect(entries).toHaveLength(1)
    expect(entries[0].mealType).toBe("breakfast")
    expect(entries[0].food.calories).toBe(76)   // par 100g, pas 304
    expect(entries[0].amount).toBe(400)
    expect(entries[0].createdAt).toBe("2026-06-15T07:00:00Z")
  })

  it("TU-P416-FE-2 : fonctionne encore si backend renvoie tableau direct (rétrocompat)", async () => {
    const { getJournal } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/journal/query`, () =>
        HttpResponse.json([
          {
            id: "m1",
            food_id: "42",
            food: { id: "42", name: "Chorba", calories: 95, protein: 5.2, carbs: 12, fat: 2.1, source: "nutrivita" },
            amount: 300,
            meal_type: "lunch",
            date: "2026-06-12",
            created_at: "2026-06-12T12:15:00Z",
          },
        ])
      )
    )
    const entries = await getJournal("2026-06-12")
    expect(entries).toHaveLength(1)
    expect(entries[0].mealType).toBe("lunch")
    expect(entries[0].createdAt).toBe("2026-06-12T12:15:00Z")
  })
})

describe("addJournalEntry (TU-P417)", () => {
  it("TU-P417-FE-1 : retourne MealEntry avec id du backend (UUID)", async () => {
    const { addJournalEntry } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/journal`, () =>
        HttpResponse.json({
          id: "e7c5a431-dcfc-40c3-88d7-d8c34de76ada",
          user_id: "u1",
          product_id: 7,
          grams: 400,
          meal_type: "pdej",
          date: "2026-06-15",
          kcal: 304,
        }, { status: 201 })
      )
    )
    const food = {
      id: "7", name: "Pomme de terre", nameAr: undefined, nameEn: undefined,
      cuisine: "International", calories: 76, protein: 2, carbs: 16, fat: 0.1, fiber: 1.4,
      source: "ciqual" as const,
    }
    const result = await addJournalEntry({ foodId: "7", food, amount: 400, mealType: "breakfast", date: "2026-06-15" })
    expect(result.id).toBe("e7c5a431-dcfc-40c3-88d7-d8c34de76ada") // backend UUID propagé
    expect(result.food.calories).toBe(76)   // food préservé depuis l'input
    expect(result.amount).toBe(400)
    expect(result.mealType).toBe("breakfast")
  })

  it("TU-P417-FE-2 : lève ApiError(404) si backend répond 404", async () => {
    const { addJournalEntry, ApiError } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/journal`, () =>
        HttpResponse.json({ error: "Produit non trouvé" }, { status: 404 })
      )
    )
    const food = {
      id: "999", name: "Inconnu", nameAr: undefined, nameEn: undefined,
      cuisine: "International", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
      source: "ciqual" as const,
    }
    const err = await addJournalEntry({ foodId: "999", food, amount: 100, mealType: "lunch", date: "2026-06-15" }).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as InstanceType<typeof ApiError>).status).toBe(404)
  })
})

describe("scanLabelImage (TU-P414-03)", () => {
  it("mappe les champs français standards (kcal, glucides, proteines...)", async () => {
    const { scanLabelImage } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/scan/label`, () =>
        HttpResponse.json({
          source: "label_declared_by_manufacturer",
          kcal: 250,
          glucides: 30,
          sucres: 18,
          proteines: 8,
          lipides: 10,
          satures: 4,
          sel: 0.5,
          fibres: 2,
        })
      )
    )
    const result = await scanLabelImage("base64data")
    expect(result.kcal).toBe(250)
    expect(result.glucides).toBe(30)
    expect(result.proteines).toBe(8)
    expect(result.source).toBe("label_declared_by_manufacturer")
  })

  it("mappe les noms de champs anglais (energy_kcal, carbohydrates...)", async () => {
    const { scanLabelImage } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/scan/label`, () =>
        HttpResponse.json({
          source: "gemini_vision",
          energy_kcal: 320,
          carbohydrates: 45,
          sugars: 22,
          proteins: 12,
          fat: 9,
          saturated_fat: 3,
          salt: 0.8,
          fiber: 3,
        })
      )
    )
    const result = await scanLabelImage("base64data")
    expect(result.kcal).toBe(320)      // energy_kcal → kcal
    expect(result.glucides).toBe(45)   // carbohydrates → glucides
    expect(result.sucres).toBe(22)     // sugars → sucres
    expect(result.proteines).toBe(12)  // proteins → proteines
    expect(result.lipides).toBe(9)     // fat → lipides
    expect(result.satures).toBe(3)     // saturated_fat → satures
    expect(result.sel).toBe(0.8)       // salt → sel
    expect(result.fibres).toBe(3)      // fiber → fibres
  })

  it("retourne null pour les champs absents (jamais 0 par défaut — REG)", async () => {
    const { scanLabelImage } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/scan/label`, () =>
        HttpResponse.json({ source: "test", kcal: 100 })
      )
    )
    const result = await scanLabelImage("base64data")
    expect(result.kcal).toBe(100)
    expect(result.glucides).toBeNull()
    expect(result.fibres).toBeNull()
  })
})

describe("getGlucoseReadings", () => {
  it("retourne les valeurs en mg/dL (AL-04)", async () => {
    const { getGlucoseReadings } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/glucose/query`, () =>
        HttpResponse.json([
          { id: "g1", glucose_mg_dl: 92, timestamp: "2026-06-12T07:00:00Z", reading_type: "fasting", source: "manual" },
        ])
      )
    )
    const readings = await getGlucoseReadings(14)
    expect(readings[0].value).toBe(92)
  })
})

// ─── TU-P415 — Guards réponse non-tableau ────────────────────────────────────

describe("TU-P415-1 guardArray — réponse erreur auth (200 + corps erreur)", () => {
  it("getJournal lève ApiError(401) quand backend répond {error:'Token manquant'} avec status 200", async () => {
    const { getJournal, ApiError } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/journal/query`, () =>
        HttpResponse.json({ error: "Token manquant" }, { status: 200 })
      )
    )
    const err = await getJournal("2026-06-15").catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as InstanceType<typeof ApiError>).status).toBe(401)
  })

  it("getGlucoseReadings lève ApiError(401) quand backend répond {error:'Token manquant'} avec status 200", async () => {
    const { getGlucoseReadings, ApiError } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/glucose/query`, () =>
        HttpResponse.json({ error: "Token manquant" }, { status: 200 })
      )
    )
    const err = await getGlucoseReadings(14).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as InstanceType<typeof ApiError>).status).toBe(401)
  })

  it("getWeightHistory lève ApiError(0) quand backend répond un objet non-tableau non-auth", async () => {
    const { getWeightHistory, ApiError } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/weight/query`, () =>
        HttpResponse.json({ unexpected: "shape" }, { status: 200 })
      )
    )
    const err = await getWeightHistory(30).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as InstanceType<typeof ApiError>).status).toBe(0)
  })

  it("getActivities lève ApiError(401) sur {error:'unauthorized'}", async () => {
    const { getActivities, ApiError } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/activities/query`, () =>
        HttpResponse.json({ error: "unauthorized" }, { status: 200 })
      )
    )
    const err = await getActivities("2026-06-15").catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as InstanceType<typeof ApiError>).status).toBe(401)
  })

  it("searchFoods lève ApiError(401) sur réponse non-tableau avec error Token", async () => {
    const { searchFoods, ApiError } = await import("../api")
    server.use(
      http.get(`${API_BASE}/api/foods/search`, () =>
        HttpResponse.json({ error: "Token manquant" }, { status: 200 })
      )
    )
    const err = await searchFoods("poulet").catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as InstanceType<typeof ApiError>).status).toBe(401)
  })
})
