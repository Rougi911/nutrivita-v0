/**
 * TI-03 — Scan code-barres → ScannedProduct mappé + intégration bilan mensuel
 * Tracé : EB-04, EB-10 → AL-08, AL-09 → SL-02 → TI-03 → VAL-04/10
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://nutridz-2.onrender.com"
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const mockScanResponse = {
  barcode: "5449000000996",
  name: "Coca-Cola 500ml",
  nutri_score: "E",
  score: 12,
  verdict: "Mauvais",
  additives: ["E150d", "E338"],
  sucres: 10.6,
  sel: 0.0,
  ags: 0.0,
}

describe("TI-03 scan produit", () => {
  it("POST /api/scan → ScannedProduct avec nutriScore (camelCase)", async () => {
    const { scanBarcode } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/scan`, () => HttpResponse.json(mockScanResponse))
    )

    const product = await scanBarcode("5449000000996")

    expect(product.nutriScore).toBe("E")
    expect(product.score).toBe(12)
    expect(product.verdict).toBe("Mauvais")
    expect(product.additives).toContain("E150d")
    expect(product.additives).toContain("E338")
    expect(product.sucres).toBe(10.6)
  })

  it("GET /api/groceries/summary → produits + totaux mensuels (camelCase)", async () => {
    const { getGroceriesSummary } = await import("../api")
    server.use(
      http.get(`${API_BASE}/api/groceries/summary`, () =>
        HttpResponse.json({
          products: [
            { ...mockScanResponse, times_this_month: 5 },
            {
              barcode: "3175681851389",
              name: "Yaourt nature",
              nutri_score: "A",
              score: 88,
              verdict: "Excellent",
              additives: [],
              sucres: 5.2,
              sel: 0.08,
              ags: 1.1,
              times_this_month: 8,
            },
          ],
          total_sucres_g: 145.2,
          total_sel_g: 23.8,
          total_ags_g: 38.1,
        })
      )
    )

    const summary = await getGroceriesSummary()

    expect(summary.products).toHaveLength(2)
    expect(summary.products[0].timesThisMonth).toBe(5)
    expect(summary.products[1].nutriScore).toBe("A")
    expect(summary.totalSucresG).toBe(145.2)
    expect(summary.totalSelG).toBe(23.8)
  })

  it("score Nutri-Score bas + additif à risque → verdict Mauvais (AL-08 côté backend)", async () => {
    const { scanBarcode } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/scan`, () =>
        HttpResponse.json({
          barcode: "3228021180121",
          name: "Jambon + nitrite",
          nutri_score: "D",
          score: 5,
          verdict: "Mauvais",
          additives: ["E150d"],
          sucres: 0.5,
          sel: 1.9,
          ags: 1.2,
        })
      )
    )

    const product = await scanBarcode("3228021180121")
    expect(product.score).toBe(5)
    expect(product.verdict).toBe("Mauvais")
  })
})
