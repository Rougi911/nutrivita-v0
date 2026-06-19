/**
 * S9 — Frontend : couleur par risque + getScannedProducts mapper + pastille sans crash
 *
 * TU-S9-FE-1 : additiveRiskColor("high")     → "#DC2626"
 * TU-S9-FE-2 : additiveRiskColor("moderate") → "#D97706"
 * TU-S9-FE-3 : additiveRiskColor("low")      → "#1D9E75"
 * TU-S9-FE-4 : additiveRiskColor(null)       → "var(--muted-foreground)"
 * TU-S9-FE-5 : additiveRiskColor(undefined)  → "var(--muted-foreground)"
 * TU-S9-FE-6 : normalizeAdditive passe risk depuis objet {code,name,risk}
 * TU-S9-FE-7 : getScannedProducts mappe snake_case → camelCase + additives avec risk
 * TU-S9-FE-8 : deleteScannedProduct appelle DELETE /api/scanned/:id
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://nutridz.onrender.com"
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─── TU-S9-FE-1..5 : additiveRiskColor ─────────────────────────────────────

describe("additiveRiskColor", () => {
  it("TU-S9-FE-1 : high → #DC2626", async () => {
    const { additiveRiskColor } = await import("../additives-format")
    expect(additiveRiskColor("high")).toBe("#DC2626")
  })

  it("TU-S9-FE-2 : moderate → #D97706", async () => {
    const { additiveRiskColor } = await import("../additives-format")
    expect(additiveRiskColor("moderate")).toBe("#D97706")
  })

  it("TU-S9-FE-3 : low → #1D9E75", async () => {
    const { additiveRiskColor } = await import("../additives-format")
    expect(additiveRiskColor("low")).toBe("#1D9E75")
  })

  it("TU-S9-FE-4 : null → var(--muted-foreground)", async () => {
    const { additiveRiskColor } = await import("../additives-format")
    expect(additiveRiskColor(null)).toBe("var(--muted-foreground)")
  })

  it("TU-S9-FE-5 : undefined → var(--muted-foreground)", async () => {
    const { additiveRiskColor } = await import("../additives-format")
    expect(additiveRiskColor(undefined)).toBe("var(--muted-foreground)")
  })
})

// ─── TU-S9-FE-6 : normalizeAdditive passe risk ──────────────────────────────

describe("normalizeAdditive — risk passthrough", () => {
  it("TU-S9-FE-6 : objet {code,name,risk} → risk préservé", async () => {
    const { normalizeAdditive } = await import("../additives-format")
    const result = normalizeAdditive({ code: "E150D", name: "Caramel", risk: "high" })
    expect(result.code).toBe("E150D")
    expect(result.name).toBe("Caramel")
    expect(result.risk).toBe("high")
  })

  it("string legacy → risk absent (undefined)", async () => {
    const { normalizeAdditive } = await import("../additives-format")
    const result = normalizeAdditive("E150D")
    expect(result.code).toBe("E150D")
    expect(result.risk).toBeUndefined()
  })
})

// ─── TU-S9-FE-7 : getScannedProducts mapper ─────────────────────────────────

describe("getScannedProducts — mapper snake→camelCase", () => {
  it("TU-S9-FE-7 : mappe correctement + additives avec risk", async () => {
    const { getScannedProducts } = await import("../api")
    server.use(
      http.get(`${API_BASE}/api/scanned`, () =>
        HttpResponse.json({
          total: 1,
          limit: 50,
          offset: 0,
          products: [{
            id: 42,
            barcode: "3017620422003",
            name: "Coca-Cola",
            score: 30,
            verdict: "Mauvais",
            nutri_score: "E",
            nova: 4,
            sugars_g: 10.6,
            salt_g: 0,
            sat_fat_g: 0,
            times_this_month: 3,
            scanned_at: "2026-06-20T08:00:00Z",
            additives: [{ code: "E150D", name: "Caramel sulfite-ammoniacal", risk: "high" }],
          }],
        })
      )
    )

    const { total, products } = await getScannedProducts()
    expect(total).toBe(1)
    expect(products).toHaveLength(1)

    const p = products[0]
    expect(p.id).toBe(42)
    expect(p.barcode).toBe("3017620422003")
    expect(p.name).toBe("Coca-Cola")
    expect(p.nutriScore).toBe("E")   // nutri_score → nutriScore
    expect(p.timesThisMonth).toBe(3) // times_this_month → timesThisMonth
    expect(p.sucres).toBe(10.6)      // sugars_g → sucres
    expect(p.scannedAt).toBe("2026-06-20T08:00:00Z") // scanned_at → scannedAt

    const add = p.additives[0] as { code: string; name?: string; risk?: string | null }
    expect(add.code).toBe("E150D")
    expect(add.risk).toBe("high")
  })
})

// ─── TU-S9-FE-8 : deleteScannedProduct ──────────────────────────────────────

describe("deleteScannedProduct", () => {
  it("TU-S9-FE-8 : appelle DELETE /api/scanned/:id", async () => {
    const { deleteScannedProduct } = await import("../api")
    let deletedId = 0
    server.use(
      http.delete(`${API_BASE}/api/scanned/:id`, ({ params }) => {
        deletedId = Number(params.id)
        return HttpResponse.json({ deleted: deletedId })
      })
    )
    await deleteScannedProduct(7)
    expect(deletedId).toBe(7)
  })
})
