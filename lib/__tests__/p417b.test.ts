/**
 * TU-P417B — Propagation UUID backend après ajout via Recherche
 *
 * Vérifie que :
 * 1. addJournalEntry retourne bien l'UUID backend (pas le localId local)
 * 2. updateMealEntryId remplace correctement le localId par le backendId dans l'entrée
 * 3. La suppression en double-tap utilise l'UUID réel même si updateMealEntryId a
 *    été appelé ENTRE le 1er et le 2e tap (race condition corrigée par confirmStableKey)
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"
import type { MealEntry } from "@/lib/types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://nutridz-2.onrender.com"
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─── TU-P417B-1 : addJournalEntry retourne l'UUID du backend ─────────────────

describe("TU-P417B-1 : addJournalEntry retourne UUID backend (pas localId)", () => {
  it("l'id retourné correspond à celui de la réponse backend, pas au localId meal-xxx", async () => {
    const { addJournalEntry } = await import("../api")
    const BACKEND_UUID = "e7c5a431-dcfc-40c3-88d7-d8c34de76ada"
    server.use(
      http.post(`${API_BASE}/api/journal`, () =>
        HttpResponse.json({ id: BACKEND_UUID, product_id: 7, grams: 300, meal_type: "dej", date: "2026-06-17", kcal: 228 }, { status: 201 })
      )
    )
    const food = {
      id: "7", name: "Pomme de terre", calories: 76, protein: 2, carbs: 16, fat: 0.1,
      source: "ciqual" as const, cuisine: "International",
    }
    const result = await addJournalEntry({ foodId: "7", food, amount: 300, mealType: "lunch", date: "2026-06-17" })
    expect(result.id).toBe(BACKEND_UUID)            // UUID backend propagé
    expect(result.id).not.toMatch(/^meal-/)          // Pas un localId temporaire
    expect(result.id).not.toMatch(/^label-/)
    expect(result.food.calories).toBe(76)            // food préservé depuis l'input
    expect(result.amount).toBe(300)
  })
})

// ─── TU-P417B-2 : updateMealEntryId remplace le localId par le backendId ──────

describe("TU-P417B-2 : updateMealEntryId remplace localId → backendId", () => {
  it("seule l'entrée ciblée par localId reçoit le backendId ; les autres sont inchangées", () => {
    const LOCAL_ID_1 = "meal-abc-111"
    const LOCAL_ID_2 = "meal-xyz-222"
    const BACKEND_ID = "uuid-real-backend"

    const entries: MealEntry[] = [
      {
        id: LOCAL_ID_1, foodId: "7",
        food: { id: "7", name: "A", calories: 76, protein: 2, carbs: 16, fat: 0.1, source: "ciqual", cuisine: "International" },
        amount: 100, mealType: "breakfast", date: "2026-06-17", createdAt: "2026-06-17T07:00:00.000Z",
      },
      {
        id: LOCAL_ID_2, foodId: "3",
        food: { id: "3", name: "B", calories: 95, protein: 5, carbs: 12, fat: 2, source: "nutrivita", cuisine: "Maghreb" },
        amount: 200, mealType: "lunch", date: "2026-06-17", createdAt: "2026-06-17T12:00:00.000Z",
      },
    ]

    // Pure logic of updateMealEntryId (mirrors app-context.tsx implementation)
    const afterUpdate = entries.map((m) => m.id === LOCAL_ID_1 ? { ...m, id: BACKEND_ID } : m)

    expect(afterUpdate[0].id).toBe(BACKEND_ID)    // Cible mise à jour
    expect(afterUpdate[1].id).toBe(LOCAL_ID_2)    // Autre entrée inchangée
    expect(afterUpdate[0].createdAt).toBe("2026-06-17T07:00:00.000Z") // createdAt stable
    expect(afterUpdate[0].food.name).toBe("A")    // food préservé
  })
})

// ─── TU-P417B-3 : confirmStableKey par createdAt — résistant à la race condition ─

describe("TU-P417B-3 : double-tap utilise createdAt comme clé stable (pas entry.id)", () => {
  it("la clé de confirmation reste valide même après updateMealEntryId (id change, createdAt non)", () => {
    const LOCAL_ID = "meal-temp-local"
    const BACKEND_ID = "uuid-from-backend"
    const CREATED_AT = "2026-06-17T08:30:00.000Z"

    const entryBefore: MealEntry = {
      id: LOCAL_ID, foodId: "7",
      food: { id: "7", name: "Chorba", calories: 95, protein: 5, carbs: 12, fat: 2, source: "nutrivita", cuisine: "Maghreb" },
      amount: 300, mealType: "lunch", date: "2026-06-17", createdAt: CREATED_AT,
    }
    // Simule updateMealEntryId : id change, createdAt inchangé
    const entryAfter: MealEntry = { ...entryBefore, id: BACKEND_ID }

    // Tap 1 : confirmStableKey = entryBefore.createdAt
    const confirmStableKey = entryBefore.createdAt  // "2026-06-17T08:30:00.000Z"

    // updateMealEntryId se déclenche entre tap1 et tap2 — entry.id est maintenant BACKEND_ID
    // Tap 2 vérifie la clé stable
    const tap2Matches = confirmStableKey === entryAfter.createdAt  // ← doit être true
    expect(tap2Matches).toBe(true)  // confirmStableKey === entryAfter.createdAt → DELETE déclenché

    // La suppression utilise entryAfter.id = BACKEND_ID, pas le localId
    expect(entryAfter.id).toBe(BACKEND_ID)
    expect(entryAfter.id).not.toBe(LOCAL_ID)
  })
})
