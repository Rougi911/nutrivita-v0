/**
 * S6 — Frontend : mapper composition + appel /api/scan/composition.
 * Trace : EB-04 / AL-08 (additifs) · S5/S6 extraction composition.
 *
 * TU-S6-FE-1 : mapCompositionResult mappe dont_sucres→sucres, dont_satures→satures
 * TU-S6-FE-2 : null préservé (REG — jamais 0 inventé)
 * TU-S6-FE-3 : needsConfirmation = true par défaut si non explicitement false
 * TU-S6-FE-4 : additifs {code,name,risk} passés tels quels
 * TU-S6-FE-5 : scanCompositionImage POST /api/scan/composition + image en body
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"
import { mapCompositionResult } from "../api"
import type { ApiCompositionResult } from "../api-types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://nutridz.onrender.com"
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function rawComposition(over: Partial<ApiCompositionResult> = {}): ApiCompositionResult {
  return {
    source: "gemini_label",
    product_name: "Biscuits",
    per_100g: {
      kcal: 480, glucides: 64, dont_sucres: 22, proteines: 7,
      lipides: 21, dont_satures: 10, fibres: 3, sel: 0.6,
    },
    additives: [{ code: "E471", name: "Mono- et diglycérides", risk: "moderate" }],
    serving_g: 30,
    confidence: 0.8,
    needs_confirmation: false,
    warnings: [],
    disclaimer: { fr: "x", ar: "x", en: "x" },
    ...over,
  }
}

describe("mapCompositionResult", () => {
  it("TU-S6-FE-1 : dont_sucres→sucres, dont_satures→satures", () => {
    const r = mapCompositionResult(rawComposition())
    expect(r.per100g.sucres).toBe(22)
    expect(r.per100g.satures).toBe(10)
    expect(r.per100g.kcal).toBe(480)
    expect(r.productName).toBe("Biscuits")
  })

  it("TU-S6-FE-2 : null préservé (pas de 0 inventé)", () => {
    const r = mapCompositionResult(
      rawComposition({
        per_100g: {
          kcal: 100, glucides: null, dont_sucres: null, proteines: null,
          lipides: null, dont_satures: null, fibres: null, sel: null,
        },
      })
    )
    expect(r.per100g.kcal).toBe(100)
    expect(r.per100g.glucides).toBeNull()
    expect(r.per100g.sel).toBeNull()
  })

  it("TU-S6-FE-3 : needsConfirmation=true par défaut (non explicitement false)", () => {
    // needs_confirmation absent → prudence : confirmer
    const raw = rawComposition()
    delete (raw as Partial<ApiCompositionResult>).needs_confirmation
    expect(mapCompositionResult(raw).needsConfirmation).toBe(true)
    // explicitement false → pas de bandeau
    expect(mapCompositionResult(rawComposition({ needs_confirmation: false })).needsConfirmation).toBe(false)
    expect(mapCompositionResult(rawComposition({ needs_confirmation: true })).needsConfirmation).toBe(true)
  })

  it("TU-S6-FE-4 : additifs {code,name,risk} passés tels quels", () => {
    const r = mapCompositionResult(rawComposition())
    const a = r.additives[0] as { code: string; name?: string; risk?: string | null }
    expect(a.code).toBe("E471")
    expect(a.risk).toBe("moderate")
  })
})

describe("scanCompositionImage", () => {
  it("TU-S6-FE-5 : POST /api/scan/composition avec image en body", async () => {
    const { scanCompositionImage } = await import("../api")
    let captured: Record<string, unknown> = {}
    server.use(
      http.post(`${API_BASE}/api/scan/composition`, async ({ request }) => {
        captured = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(rawComposition())
      })
    )
    const result = await scanCompositionImage("base64data")
    expect(captured["image"]).toBe("base64data")
    expect(result.per100g.sucres).toBe(22)
    expect(result.additives).toHaveLength(1)
  })
})
