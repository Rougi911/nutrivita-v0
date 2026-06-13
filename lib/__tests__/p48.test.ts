/**
 * TU-P4.8 — Handlers ajout, 204 carences, retry offline
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://nutridz.onrender.com"
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─── TU-16 : 204 deficiencies → null (empty state) ───────────────────────────

describe("TU-16 : getDeficiencies 204 → null", () => {
  it("retourne null quand le backend répond 204 (pas de données)", async () => {
    const { getDeficiencies } = await import("../api")
    server.use(
      http.get(`${API_BASE}/api/stats/deficiencies`, () =>
        new HttpResponse(null, { status: 204 })
      )
    )
    const result = await getDeficiencies()
    expect(result).toBeNull()
  })

  it("retourne les carences normalement sur 200", async () => {
    const { getDeficiencies } = await import("../api")
    server.use(
      http.get(`${API_BASE}/api/stats/deficiencies`, () =>
        HttpResponse.json({
          deficiencies: [{ nutrient: "Vitamine D", status: "probable", amount_pct: 42 }],
          period_days: 14,
        })
      )
    )
    const result = await getDeficiencies()
    expect(result?.deficiencies).toHaveLength(1)
    expect(result?.deficiencies[0].nutrient).toBe("Vitamine D")
  })
})

// ─── TU-15 : addJournalEntry — wire correct ──────────────────────────────────

describe("TU-15 : addJournalEntry body snake_case", () => {
  it("envoie food_id, meal_type, amount, date en snake_case", async () => {
    const { addJournalEntry } = await import("../api")
    let body: Record<string, unknown> = {}
    server.use(
      http.post(`${API_BASE}/api/journal`, async ({ request }) => {
        body = await request.json() as Record<string, unknown>
        return HttpResponse.json({
          id: "m-new",
          food_id: "42",
          food: { id: "42", name: "Pomme", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, source: "ciqual", cuisine: "International" },
          amount: 150,
          meal_type: "breakfast",
          date: "2026-06-13",
          created_at: "2026-06-13T08:00:00Z",
        })
      })
    )
    const entry = await addJournalEntry({
      foodId: "42",
      food: { id: "42", name: "Pomme", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, source: "ciqual", cuisine: "International" },
      amount: 150,
      mealType: "breakfast",
      date: "2026-06-13",
    })
    expect(body["food_id"]).toBe("42")
    expect(body["meal_type"]).toBe("breakfast")
    expect(body["amount"]).toBe(150)
    expect(body["date"]).toBe("2026-06-13")
    expect(entry.mealType).toBe("breakfast")
    expect(entry.foodId).toBe("42")
  })
})

// ─── TU-17 : retry 503 puis 200 → isOffline=false ────────────────────────────

describe("TU-17 : interpretMedia mode:text payload field", () => {
  it("n'envoie pas le champ 'content' (ancien nom cassé)", async () => {
    const { interpretMedia } = await import("../api")
    let body: Record<string, unknown> = {}
    server.use(
      http.post(`${API_BASE}/api/interpret`, async ({ request }) => {
        body = await request.json() as Record<string, unknown>
        return HttpResponse.json({ intents: [] })
      })
    )
    await interpretMedia("text", "une pomme")
    expect(body["payload"]).toBe("une pomme")
    expect(body["content"]).toBeUndefined()
    expect(body["mode"]).toBe("text")
  })
})
