/**
 * S12 — Frontend : alternatives plus saines.
 * Trace : EB-10 / S12 (live OpenFoodFacts).
 *
 * TU-S12-FE-1 : mapAlternative normalise le grade OFF "a"→"A"
 * TU-S12-FE-2 : grade absent/invalide → nutriScore null (pas de crash)
 * TU-S12-FE-3 : getAlternatives GET /api/alternatives/:barcode + mapping liste
 * TU-S12-FE-4 : OFF sans alternative → liste vide (jamais d'exception)
 * TU-S12-FE-5 : pickWorstProduct = plus petit score, ignore les « non notés »
 * TU-S12-FE-6 : pickWorstProduct null si aucun produit noté
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"
import { mapAlternative } from "../api"
import { pickWorstProduct } from "../alternatives"
import type { ScannedProduct } from "../types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://nutridz-2.onrender.com"
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe("mapAlternative", () => {
  it("TU-S12-FE-1 : grade OFF minuscule 'a' → 'A'", () => {
    const a = mapAlternative({ barcode: "123", name: "Yaourt nature", nutriScore: "a", imageUrl: "http://img/y.jpg" })
    expect(a.nutriScore).toBe("A")
    expect(a.imageUrl).toBe("http://img/y.jpg")
  })

  it("TU-S12-FE-2 : grade absent/invalide → null", () => {
    expect(mapAlternative({ barcode: "1", name: "x", nutriScore: null, imageUrl: null }).nutriScore).toBeNull()
    expect(mapAlternative({ barcode: "1", name: "x", nutriScore: "z", imageUrl: null }).nutriScore).toBeNull()
    expect(mapAlternative({ barcode: "1", name: "x", nutriScore: null, imageUrl: null }).imageUrl).toBeNull()
  })
})

describe("getAlternatives", () => {
  it("TU-S12-FE-3 : GET /api/alternatives/:barcode + mapping liste", async () => {
    const { getAlternatives } = await import("../api")
    server.use(
      http.get(`${API_BASE}/api/alternatives/:barcode`, ({ params }) =>
        HttpResponse.json({
          source_barcode: String(params.barcode),
          category: "en:sodas",
          alternatives: [
            { barcode: "111", name: "Eau pétillante", nutriScore: "a", imageUrl: "http://img/a.jpg" },
            { barcode: "222", name: "Thé glacé léger", nutriScore: "b", imageUrl: "http://img/b.jpg" },
          ],
        })
      )
    )
    const res = await getAlternatives("3017620422003")
    expect(res.sourceBarcode).toBe("3017620422003")
    expect(res.category).toBe("en:sodas")
    expect(res.alternatives).toHaveLength(2)
    expect(res.alternatives[0].nutriScore).toBe("A")
    expect(res.alternatives[0].name).toBe("Eau pétillante")
  })

  it("TU-S12-FE-4 : OFF sans alternative → liste vide", async () => {
    const { getAlternatives } = await import("../api")
    server.use(
      http.get(`${API_BASE}/api/alternatives/:barcode`, () =>
        HttpResponse.json({ source_barcode: "123", category: null, alternatives: [] })
      )
    )
    const res = await getAlternatives("123")
    expect(res.alternatives).toEqual([])
    expect(res.category).toBeNull()
  })
})

describe("pickWorstProduct", () => {
  const make = (barcode: string, score: number | null): ScannedProduct => ({
    barcode,
    name: `P-${barcode}`,
    nutriScore: null,
    score,
    verdict: score == null ? null : "Mauvais",
    additives: [],
    timesThisMonth: 1,
  })

  it("TU-S12-FE-5 : plus petit score, ignore les non notés (score null)", () => {
    const products = [make("a", 70), make("b", 12), make("c", null), make("d", 45)]
    expect(pickWorstProduct(products)?.barcode).toBe("b")
  })

  it("TU-S12-FE-6 : null si aucun produit noté", () => {
    expect(pickWorstProduct([])).toBeNull()
    expect(pickWorstProduct([make("a", null), make("b", null)])).toBeNull()
  })
})
