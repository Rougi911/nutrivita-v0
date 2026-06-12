/**
 * TI-02 — Phrase vocale composite → 3 intents routés + glycémie convertie
 * Tracé : EB-02 → AL-10, AL-04 → SL-02 → TI-02 → VAL-02
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"
import { fromGlucoseUnit } from "../glucose-units"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://nutridz.onrender.com"
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe("TI-02 phrase vocale composite", () => {
  it("retourne 3 intents : meal + activity + glucose", async () => {
    const { interpretMedia } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/interpret`, () =>
        HttpResponse.json({
          intents: [
            { type: "meal", items: [{ name: "Chorba", quantity_g: 250 }], confidence: 0.88 },
            { type: "activity", sport: "course", duration_min: 30, confidence: 0.91 },
            { type: "glucose", valeur: 1.15, unite: "g/L", contexte: "pontuelle", confidence: 0.95 },
          ],
          needs_confirmation: false,
        })
      )
    )

    const result = await interpretMedia(
      "voice",
      "j'ai mangé une chorba, couru 30 minutes, glycémie 1,15"
    )

    expect(result.intents).toHaveLength(3)

    const mealIntent = result.intents.find((i) => i.type === "meal")
    expect(mealIntent?.items?.[0].name).toBe("Chorba")

    const actIntent = result.intents.find((i) => i.type === "activity")
    expect(actIntent?.sport).toBe("course")
    expect(actIntent?.duration_min).toBe(30)

    const glucIntent = result.intents.find((i) => i.type === "glucose")
    expect(glucIntent?.valeur).toBe(1.15)
    expect(glucIntent?.unite).toBe("g/L")
  })

  it("glycémie 1.15 g/L → 115 mg/dL (AL-04 fromGlucoseUnit)", () => {
    const mgDl = fromGlucoseUnit(1.15, "g/L")
    expect(mgDl).toBeCloseTo(115, 0)
  })

  it("glycémie 6.4 mmol/L → ~115 mg/dL (AL-04)", () => {
    const mgDl = fromGlucoseUnit(6.4, "mmol/L")
    expect(mgDl).toBeCloseTo(115.3, 0)
  })

  it("confidence < 0.6 sur un intent → needs_confirmation = true", async () => {
    const { interpretMedia } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/interpret`, () =>
        HttpResponse.json({
          intents: [
            { type: "meal", items: [{ name: "Chorba", quantity_g: 250 }], confidence: 0.88 },
            { type: "activity", sport: "course", duration_min: 30, confidence: 0.55 },
          ],
          needs_confirmation: true,
        })
      )
    )

    const result = await interpretMedia("voice", "chorba et un peu de sport")
    expect(result.needs_confirmation).toBe(true)
    const low = result.intents.find((i) => i.confidence < 0.6)
    expect(low).toBeDefined()
  })
})
