/**
 * S4 — Frontend : mapper getAdditivesStats + calcul largeur relative
 *
 * TU-S4-FE-1 : mapper mappe entries_with_additives → entriesWithAdditives (camelCase)
 * TU-S4-FE-2 : mapper mappe total_entries → totalEntries (camelCase)
 * TU-S4-FE-3 : mapper passe days=7 dans l'URL
 * TU-S4-FE-4 : mapper passe days=1 quand demandé
 * TU-S4-FE-5 : barWidthPercent(5,5) = 100
 * TU-S4-FE-6 : barWidthPercent(3,6) = 50
 * TU-S4-FE-7 : barWidthPercent(0,0) = 0 (pas de division par zéro)
 * TU-S4-FE-8 : barWidthPercent(0,5) = 0
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://nutridz.onrender.com"
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─── TU-S4-FE-1/2/3 — mapper snake_case → camelCase ─────────────────────────
describe("getAdditivesStats — mapper snake→camelCase", () => {
  it("TU-S4-FE-1/2/3 : mappe correctement et passe days=7", async () => {
    const { getAdditivesStats } = await import("../api")
    let capturedUrl = ""
    server.use(
      http.get(`${API_BASE}/api/stats/additives`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({
          days: 7,
          entries_with_additives: 1,
          total_entries: 2,
          counts: { high: 1, moderate: 1, low: 0 },
          items: [
            { code: "E150D", name: "Caramel sulfite-ammoniacal", risk: "high",     count: 1 },
            { code: "E338",  name: "Acide phosphorique",          risk: "moderate", count: 1 },
          ],
          disclaimer: { fr: "fr-text", ar: "ar-text", en: "en-text" },
        })
      })
    )
    const result = await getAdditivesStats(7)
    expect(capturedUrl).toContain("days=7")              // TU-S4-FE-3
    expect(result.days).toBe(7)
    expect(result.entriesWithAdditives).toBe(1)          // TU-S4-FE-1 : snake→camel
    expect(result.totalEntries).toBe(2)                  // TU-S4-FE-2 : snake→camel
    expect(result.counts.high).toBe(1)
    expect(result.counts.moderate).toBe(1)
    expect(result.counts.low).toBe(0)
    expect(result.items).toHaveLength(2)
    expect(result.items[0].code).toBe("E150D")
    expect(result.items[0].risk).toBe("high")
    expect(result.items[1].code).toBe("E338")
    expect(result.items[1].risk).toBe("moderate")
  })

  it("TU-S4-FE-4 : passe days=1 quand demandé", async () => {
    const { getAdditivesStats } = await import("../api")
    let capturedUrl = ""
    server.use(
      http.get(`${API_BASE}/api/stats/additives`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({
          days: 1, entries_with_additives: 0, total_entries: 0,
          counts: { high: 0, moderate: 0, low: 0 }, items: [],
          disclaimer: { fr: "", ar: "", en: "" },
        })
      })
    )
    await getAdditivesStats(1)
    expect(capturedUrl).toContain("days=1")              // TU-S4-FE-4
  })
})

// ─── TU-S4-FE-5/6/7/8 — calcul largeur relative (pure) ──────────────────────
describe("barWidthPercent — calcul largeur relative", () => {
  function barWidthPercent(count: number, maxCount: number): number {
    if (maxCount === 0) return 0
    return Math.round((count / maxCount) * 100)
  }

  it("TU-S4-FE-5 : 100% quand count === maxCount", () => {
    expect(barWidthPercent(5, 5)).toBe(100)
  })

  it("TU-S4-FE-6 : 50% quand count est la moitié du max", () => {
    expect(barWidthPercent(3, 6)).toBe(50)
  })

  it("TU-S4-FE-7 : 0% quand maxCount === 0 (pas de division par zéro)", () => {
    expect(barWidthPercent(0, 0)).toBe(0)
  })

  it("TU-S4-FE-8 : 0% quand count === 0", () => {
    expect(barWidthPercent(0, 5)).toBe(0)
  })
})
