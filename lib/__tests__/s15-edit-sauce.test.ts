/**
 * S15 — Frontend : édition quantité (PATCH) + ajout sauce (parent_entry_id) + portion par défaut.
 * Trace : EB-03/EB-05 · S15 édition repas + condiments.
 *
 * TU-S15-FE-1 : updateJournalEntry PATCH /api/journal/:id avec { amount }, renvoie totaux recalculés
 * TU-S15-FE-2 : addJournalEntry transmet parent_entry_id quand fourni (sauce liée)
 * TU-S15-FE-3 : addJournalEntry n'envoie pas parent_entry_id si absent (aliment normal)
 * TU-S15-FE-4 : defaultPortionG = portion connue du catalogue, 15 g sinon, insensible à la casse
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"
import { defaultPortionG, DEFAULT_CONDIMENT_PORTION_G } from "../condiments"
import type { FoodItem } from "../types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://nutridz.onrender.com"
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe("updateJournalEntry", () => {
  it("TU-S15-FE-1 : PATCH /api/journal/:id { amount } → totaux recalculés", async () => {
    const { updateJournalEntry } = await import("../api")
    let method = ""
    let body: Record<string, unknown> = {}
    let calledId = ""
    server.use(
      http.patch(`${API_BASE}/api/journal/:id`, async ({ request, params }) => {
        method = request.method
        calledId = String(params.id)
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({
          id: calledId, grams: 200, kcal: 330, glucides: 0, proteines: 62, lipides: 7.2, fibres: 0,
        })
      })
    )
    const res = await updateJournalEntry("abc-123", 200)
    expect(method).toBe("PATCH")
    expect(calledId).toBe("abc-123")
    expect(body.amount).toBe(200)
    expect(res.kcal).toBe(330)
    expect(res.grams).toBe(200)
  })
})

describe("addJournalEntry — parent_entry_id (sauce liée)", () => {
  const food: FoodItem = {
    id: "p-mayo", name: "Mayonnaise", cuisine: "International",
    calories: 680, protein: 1, carbs: 1, fat: 75, source: "ciqual",
  }
  const baseEntry = { foodId: "p-mayo", food, amount: 15, mealType: "lunch" as const, date: "2026-06-26" }

  it("TU-S15-FE-2 : transmet parent_entry_id quand fourni", async () => {
    const { addJournalEntry } = await import("../api")
    let body: Record<string, unknown> = {}
    server.use(
      http.post(`${API_BASE}/api/journal`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: "sauce-uuid" }, { status: 201 })
      })
    )
    const res = await addJournalEntry(baseEntry, "parent-uuid")
    expect(body.parent_entry_id).toBe("parent-uuid")
    expect(body.food_id).toBe("p-mayo")
    expect(res.id).toBe("sauce-uuid")
  })

  it("TU-S15-FE-3 : n'envoie pas parent_entry_id si absent", async () => {
    const { addJournalEntry } = await import("../api")
    let body: Record<string, unknown> = {}
    server.use(
      http.post(`${API_BASE}/api/journal`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: "x" }, { status: 201 })
      })
    )
    await addJournalEntry(baseEntry)
    expect("parent_entry_id" in body).toBe(false)
  })
})

describe("defaultPortionG", () => {
  it("TU-S15-FE-4 : portion du catalogue, fallback 15 g, insensible à la casse", () => {
    expect(defaultPortionG("Mayonnaise")).toBe(15)
    expect(defaultPortionG("sel")).toBe(1)
    expect(defaultPortionG("HUILE D'OLIVE")).toBe(10)
    expect(defaultPortionG("Sauce tomate")).toBe(50)
    expect(defaultPortionG("produit inconnu xyz")).toBe(DEFAULT_CONDIMENT_PORTION_G)
    expect(DEFAULT_CONDIMENT_PORTION_G).toBe(15)
  })
})
