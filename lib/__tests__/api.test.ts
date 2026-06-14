/**
 * TU-api — Client HTTP lib/api.ts
 * Vérifie : appels corrects, mappers snake→camelCase, gestion erreur.
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest"
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
  it("mappe meal_type et created_at → camelCase", async () => {
    const { getJournal } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/journal/query`, () =>
        HttpResponse.json([
          {
            id: "m1",
            food_id: "42",
            food: { id: "42", name: "Chorba", calories: 95, protein: 5.2, carbs: 12, fat: 2.1, source: "nutrivita", cuisine: "Maghreb" },
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

describe("getGlucoseReadings", () => {
  it("retourne les valeurs en mg/dL (AL-04)", async () => {
    const { getGlucoseReadings } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/glucose/query`, () =>
        HttpResponse.json([
          { id: "g1", value: 92, timestamp: "2026-06-12T07:00:00Z", type: "fasting", source: "manual" },
        ])
      )
    )
    const readings = await getGlucoseReadings(14)
    expect(readings[0].value).toBe(92)
  })
})
