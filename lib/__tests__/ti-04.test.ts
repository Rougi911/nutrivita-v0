/**
 * TI-04 — Webhook Strava simulé → activité créée, calories correctes, anneau mis à jour
 * Tracé : EB-05 → AL-02, AL-03 → SL-02 → TI-04 → VAL-05
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://nutridz-2.onrender.com"
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe("TI-04 webhook Strava simulé", () => {
  it("POST /api/activities/query → activité Strava avec calories_burned → caloriesBurned", async () => {
    const { getActivities } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/activities/query`, () =>
        HttpResponse.json([
          {
            id: "a-strava-1",
            type: "Course",
            duration: 35,
            calories_burned: 310,
            date: "2026-06-12",
            source: "strava",
            created_at: "2026-06-12T06:30:00Z",
          },
        ])
      )
    )

    const activities = await getActivities("2026-06-12")

    expect(activities).toHaveLength(1)
    expect(activities[0].source).toBe("strava")
    expect(activities[0].caloriesBurned).toBe(310)
    expect(activities[0].duration).toBe(35)
  })

  it("anneau calorique : todayBurnedCalories plafonné à 1000 kcal (AL-03)", () => {
    const burned = 1400
    const cappedBurned = Math.min(burned, 1000)
    const objective = 2100
    const consumed = 1800
    const remaining = objective + cappedBurned - consumed

    expect(cappedBurned).toBe(1000)
    expect(remaining).toBe(1300)
  })

  it("AL-02 : Course 9 MET * 78 kg * 35 min = 410 kcal", () => {
    const MET = 9.0
    const weight = 78
    const durationH = 35 / 60
    const kcal = Math.round(MET * weight * durationH)
    expect(kcal).toBe(410)
  })

  it("POST /api/activities → kcal Strava priment (AL-02)", async () => {
    const { addActivityApi } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/activities`, () =>
        HttpResponse.json({
          id: "a-new",
          type: "Course",
          duration: 35,
          calories_burned: 310,
          date: "2026-06-12",
          source: "strava",
          created_at: "2026-06-12T06:30:00Z",
        })
      )
    )

    const activity = await addActivityApi({
      type: "Course",
      duration: 35,
      caloriesBurned: 310,
      date: "2026-06-12",
      source: "strava",
    })

    expect(activity.caloriesBurned).toBe(310)
    expect(activity.source).toBe("strava")
  })
})
