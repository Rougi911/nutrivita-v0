/**
 * S16 — Client API Strava (statut, connexion OAuth, sync, déconnexion)
 * Tracé : EB-05 → AL-02 → SL-API-05 → TI-04 → VAL-05
 *
 * Vérifie les mappers défensifs du client front. Les tokens Strava restent
 * backend-only (REG-05) : le front ne manipule jamais que { connected, athleteName }.
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://nutridz-2.onrender.com"
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe("S16 client API Strava", () => {
  it("getStravaStatus → mappe { connected, athleteName }", async () => {
    const { getStravaStatus } = await import("../api")
    server.use(
      http.get(`${API_BASE}/api/strava/status`, () =>
        HttpResponse.json({ connected: true, athleteName: "Sofiane K." })
      )
    )
    const s = await getStravaStatus()
    expect(s.connected).toBe(true)
    expect(s.athleteName).toBe("Sofiane K.")
  })

  it("getStravaStatus → défensif : connected non booléen → false, nom absent → null", async () => {
    const { getStravaStatus } = await import("../api")
    server.use(
      http.get(`${API_BASE}/api/strava/status`, () =>
        HttpResponse.json({ connected: "yes" })
      )
    )
    const s = await getStravaStatus()
    expect(s.connected).toBe(false)
    expect(s.athleteName).toBeNull()
  })

  it("getStravaConnectUrl → renvoie l'URL OAuth", async () => {
    const { getStravaConnectUrl } = await import("../api")
    server.use(
      http.get(`${API_BASE}/api/strava/connect`, () =>
        HttpResponse.json({ url: "https://www.strava.com/oauth/authorize?state=abc" })
      )
    )
    const url = await getStravaConnectUrl()
    expect(url).toBe("https://www.strava.com/oauth/authorize?state=abc")
  })

  it("getStravaConnectUrl → 503 non configuré → lève ApiError", async () => {
    const { getStravaConnectUrl, ApiError } = await import("../api")
    server.use(
      http.get(`${API_BASE}/api/strava/connect`, () =>
        HttpResponse.json({ error: "Strava non configuré" }, { status: 503 })
      )
    )
    await expect(getStravaConnectUrl()).rejects.toBeInstanceOf(ApiError)
  })

  it("syncStrava → mappe { connected, imported } ; imported absent → 0", async () => {
    const { syncStrava } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/strava/sync`, () =>
        HttpResponse.json({ connected: true, imported: 2, activities: [] })
      )
    )
    const r = await syncStrava()
    expect(r.connected).toBe(true)
    expect(r.imported).toBe(2)
  })

  it("syncStrava → non lié : { connected:false, imported:0 }", async () => {
    const { syncStrava } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/strava/sync`, () =>
        HttpResponse.json({ connected: false, imported: 0, activities: [] })
      )
    )
    const r = await syncStrava()
    expect(r.connected).toBe(false)
    expect(r.imported).toBe(0)
  })

  it("disconnectStrava → DELETE résout sans lever", async () => {
    const { disconnectStrava } = await import("../api")
    server.use(
      http.delete(`${API_BASE}/api/strava/disconnect`, () =>
        HttpResponse.json({ connected: false })
      )
    )
    await expect(disconnectStrava()).resolves.toBeUndefined()
  })
})
