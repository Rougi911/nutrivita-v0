/**
 * TI-01 — Pipeline photo : réponse /api/interpret simulée → intents mappés → ajout
 * Tracé : EB-01 → AL-10 → SL-02 → TI-01 → VAL-01
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://nutridz-2.onrender.com"
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe("TI-01 pipeline photo", () => {
  it("POST /api/interpret(photo) retourne les intents type:food (SL-API-01 P4.11)", async () => {
    const { interpretMedia } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/interpret`, () =>
        HttpResponse.json({
          intents: [
            {
              type: "food", name: "Couscous royal", quantity_g: 300,
              confidence: 0.91, needs_confirmation: false,
              nutrition: { kcal: 534, glucides: 66, proteines: 36, lipides: 15, fibres: 9,
                source: "ciqual", quantity_g: 300, estimated_portion: false },
              nutrition_found: true,
            },
            {
              type: "food", name: "Salade niçoise", quantity_g: 150,
              confidence: 0.85, needs_confirmation: false,
              nutrition: null, nutrition_found: false,
            },
          ],
        })
      )
    )

    const result = await interpretMedia("photo", "base64_image_data")

    expect(result.intents).toHaveLength(2)
    expect(result.intents[0].type).toBe("food")
    expect(result.intents[0].name).toBe("Couscous royal")
    expect(result.intents[0].quantity_g).toBe(300)
    expect(result.intents[0].nutrition?.kcal).toBe(534)
    expect(result.intents[0].confidence).toBeGreaterThanOrEqual(0.6)
    expect(result.intents[1].nutrition_found).toBe(false)
  })

  it("confidence < 0.6 → needs_confirmation = true sur l'intent (P4.11 : par intent)", async () => {
    const { interpretMedia } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/interpret`, () =>
        HttpResponse.json({
          intents: [
            {
              type: "food", name: "Plat inconnu", quantity_g: 200,
              confidence: 0.45, needs_confirmation: true,
              nutrition: null, nutrition_found: false,
            },
          ],
        })
      )
    )

    const result = await interpretMedia("photo", "base64_flou")
    expect(result.intents[0].needs_confirmation).toBe(true)
    expect(result.intents[0].confidence).toBeLessThan(0.6)
  })

  it("addJournalEntry après confirmation → retourne l'entrée créée avec bons champs camelCase", async () => {
    const { addJournalEntry } = await import("../api")
    // POST /api/journal retourne un raw DB row (pas ApiMealEntry) — seul id est lu depuis le serveur
    server.use(
      http.post(`${API_BASE}/api/journal`, () =>
        HttpResponse.json({
          id: "m-new",
          user_id: "u1",
          product_id: 3,
          grams: 300,
          meal_type: "dej",
          date: "2026-06-12",
          kcal: 534,
          glucides: 66,
          proteines: 36,
          lipides: 15,
          fibres: 0,
          modifiers_json: "[]",
        }, { status: 201 })
      )
    )

    const food = {
      id: "3", name: "Couscous royal",
      calories: 178, protein: 12, carbs: 22, fat: 5,
      source: "nutrivita" as const, cuisine: "Maghreb",
    }
    const entry = await addJournalEntry({
      foodId: "3",
      food,
      amount: 300,
      mealType: "lunch",
      date: "2026-06-12",
    })

    expect(entry.id).toBe("m-new")           // UUID propagé depuis backend
    expect(entry.mealType).toBe("lunch")
    expect(typeof entry.createdAt).toBe("string") // construit localement
    // Anneau calorique : 178 kcal/100g * 300g / 100 = 534 kcal
    const kcal = (entry.food.calories * entry.amount) / 100
    expect(kcal).toBe(534)
  })
})
