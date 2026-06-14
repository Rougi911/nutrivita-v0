/**
 * TI-02 — Phrase vocale composite → 3 intents routés + glycémie en mg/dL
 * Tracé : EB-02 → AL-10, AL-04 → SL-02 → TI-02 → VAL-02
 * Contrat SL-API-01 (P4.11) : type:"food" flat + nutrition per portion + glucose_mg_dl
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

describe("TI-02 phrase vocale composite (contrat SL-API-01)", () => {
  it("retourne 3 intents : food + activity + glucose (type:food flat)", async () => {
    const { interpretMedia } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/interpret`, () =>
        HttpResponse.json({
          intents: [
            {
              type: "food",
              name: "Chorba",
              quantity_g: 250,
              meal_type: "dejeuner",
              confidence: 0.88,
              needs_confirmation: false,
              nutrition: {
                kcal: 239, glucides: 22.5, proteines: 18, lipides: 8, fibres: 5,
                source: "ciqual", quantity_g: 250, estimated_portion: false,
              },
              nutrition_found: true,
            },
            {
              type: "activity", sport: "course", duration_min: 30,
              confidence: 0.91, needs_confirmation: false,
            },
            {
              type: "glucose", glucose_mg_dl: 115,
              confidence: 0.95, needs_confirmation: false,
            },
          ],
        })
      )
    )

    const result = await interpretMedia(
      "voice",
      "j'ai mangé une chorba, couru 30 minutes, glycémie 1,15"
    )

    expect(result.intents).toHaveLength(3)

    const foodIntent = result.intents.find((i) => i.type === "food")
    expect(foodIntent?.name).toBe("Chorba")
    expect(foodIntent?.quantity_g).toBe(250)
    expect(foodIntent?.nutrition?.kcal).toBe(239)
    expect(foodIntent?.nutrition?.estimated_portion).toBe(false)
    expect(foodIntent?.nutrition_found).toBe(true)

    const actIntent = result.intents.find((i) => i.type === "activity")
    expect(actIntent?.sport).toBe("course")
    expect(actIntent?.duration_min).toBe(30)

    // glucose_mg_dl déjà en mg/dL — pas de conversion côté frontend (AL-04)
    const glucIntent = result.intents.find((i) => i.type === "glucose")
    expect(glucIntent?.glucose_mg_dl).toBe(115)
  })

  it("estimated_portion=true quand quantity_g absent du texte", async () => {
    const { interpretMedia } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/interpret`, () =>
        HttpResponse.json({
          intents: [
            {
              type: "food", name: "Pomme", quantity_g: null,
              confidence: 0.80, needs_confirmation: false,
              nutrition: {
                kcal: 52, glucides: 14, proteines: 0.3, lipides: 0.2, fibres: 2.4,
                source: "ciqual", quantity_g: 100, estimated_portion: true,
              },
              nutrition_found: true,
            },
          ],
        })
      )
    )

    const result = await interpretMedia("voice", "j'ai mangé une pomme")
    const intent = result.intents[0]
    expect(intent.nutrition?.estimated_portion).toBe(true)
    expect(intent.nutrition?.quantity_g).toBe(100)
  })

  it("glycémie 1.15 g/L → 115 mg/dL (AL-04 fromGlucoseUnit — conversion utilitaire)", () => {
    const mgDl = fromGlucoseUnit(1.15, "g/L")
    expect(mgDl).toBeCloseTo(115, 0)
  })

  it("glycémie 6.4 mmol/L → ~115 mg/dL (AL-04)", () => {
    const mgDl = fromGlucoseUnit(6.4, "mmol/L")
    expect(mgDl).toBeCloseTo(115.3, 0)
  })

  it("confidence < 0.6 sur un intent → needs_confirmation = true sur l'intent", async () => {
    const { interpretMedia } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/interpret`, () =>
        HttpResponse.json({
          intents: [
            {
              type: "food", name: "Chorba", quantity_g: 250,
              confidence: 0.88, needs_confirmation: false,
              nutrition: null, nutrition_found: false,
            },
            {
              type: "activity", sport: "course", duration_min: 30,
              confidence: 0.55, needs_confirmation: true,
            },
          ],
        })
      )
    )

    const result = await interpretMedia("voice", "chorba et un peu de sport")
    const low = result.intents.find((i) => i.needs_confirmation)
    expect(low).toBeDefined()
    expect(low?.confidence).toBeLessThan(0.6)
  })
})
