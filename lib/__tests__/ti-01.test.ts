/**
 * TI-01 — Pipeline photo : réponse /api/interpret simulée → intents mappés → ajout
 * Tracé : EB-01 → AL-10 → SL-02 → TI-01 → VAL-01
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://nutridz.onrender.com"
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe("TI-01 pipeline photo", () => {
  it("POST /api/interpret(photo) retourne les intents et les items sont mappés", async () => {
    const { interpretMedia } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/interpret`, () =>
        HttpResponse.json({
          intents: [
            {
              type: "meal",
              items: [
                { name: "Couscous royal", quantity_g: 300 },
                { name: "Salade niçoise", quantity_g: 150 },
              ],
              confidence: 0.91,
            },
          ],
          needs_confirmation: false,
        })
      )
    )

    const result = await interpretMedia("photo", "base64_image_data")

    expect(result.intents).toHaveLength(1)
    expect(result.intents[0].type).toBe("meal")
    expect(result.intents[0].items).toHaveLength(2)
    expect(result.intents[0].confidence).toBeGreaterThanOrEqual(0.6)
    expect(result.needs_confirmation).toBe(false)
  })

  it("confidence < 0.6 → needs_confirmation = true", async () => {
    const { interpretMedia } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/interpret`, () =>
        HttpResponse.json({
          intents: [
            { type: "meal", items: [{ name: "Plat inconnu", quantity_g: 200 }], confidence: 0.45 },
          ],
          needs_confirmation: true,
        })
      )
    )

    const result = await interpretMedia("photo", "base64_flou")
    expect(result.needs_confirmation).toBe(true)
  })

  it("addJournalEntry après confirmation → retourne l'entrée créée avec bons champs camelCase", async () => {
    const { addJournalEntry } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/journal`, () =>
        HttpResponse.json({
          id: "m-new",
          food_id: "3",
          food: {
            id: "3",
            name: "Couscous royal",
            calories: 178,
            protein: 12,
            carbs: 22,
            fat: 5,
            source: "nutrivita",
            cuisine: "Maghreb",
          },
          amount: 300,
          meal_type: "lunch",
          date: "2026-06-12",
          created_at: "2026-06-12T12:30:00Z",
        })
      )
    )

    const entry = await addJournalEntry({
      foodId: "3",
      food: {
        id: "3",
        name: "Couscous royal",
        calories: 178,
        protein: 12,
        carbs: 22,
        fat: 5,
        source: "nutrivita",
        cuisine: "Maghreb",
      },
      amount: 300,
      mealType: "lunch",
      date: "2026-06-12",
    })

    expect(entry.id).toBe("m-new")
    expect(entry.mealType).toBe("lunch")
    expect(entry.createdAt).toBe("2026-06-12T12:30:00Z")
    // Anneau calorique : 178 kcal/100g * 300g / 100 = 534 kcal
    const kcal = (entry.food.calories * entry.amount) / 100
    expect(kcal).toBe(534)
  })
})
