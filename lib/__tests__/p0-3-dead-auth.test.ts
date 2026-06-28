/**
 * TU-P0-3 — Gestion du 403 « Token invalide » comme session morte (DEF-1)
 *
 * Bug : seul le 401 purgeait la session ; un 403 « Token invalide » (rotation
 * JWT_SECRET) tombait en mode hors-ligne → l'utilisateur restait bloqué.
 *
 * Règle (classification, lib/api.ts) :
 *  - session morte (purge token + retour login) = 401, OU 403 dont le corps cite le token,
 *  - hors-ligne (données locales + retry) = vraie panne réseau (status 0, 502/503/504),
 *  - 403 CSRF / 403 métier = NI purge NI offline forcé (pas une session morte).
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"
import { ApiError, isDeadAuthError, isNetworkFailure } from "../api"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://nutridz-2.onrender.com"
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─── isDeadAuthError — classification pure ───────────────────────────────────

describe("TU-P0-3-1 : isDeadAuthError (session morte)", () => {
  it("401 → session morte (true)", () => {
    expect(isDeadAuthError(new ApiError(401, "Token manquant"))).toBe(true)
  })

  it("403 « Token invalide » → session morte (true)", () => {
    expect(isDeadAuthError(new ApiError(403, '{"error":"Token invalide"}'))).toBe(true)
  })

  it("403 « jwt expired » → session morte (true)", () => {
    expect(isDeadAuthError(new ApiError(403, '{"error":"jwt expired"}'))).toBe(true)
  })

  it("403 « invalid signature » (jsonwebtoken brut, rotation JWT_SECRET) → session morte (true)", () => {
    expect(isDeadAuthError(new ApiError(403, '{"error":"invalid signature"}'))).toBe(true)
  })

  it("403 CSRF (« CSRF token invalide ») → PAS une session morte (false)", () => {
    expect(isDeadAuthError(new ApiError(403, '{"error":"CSRF token invalide"}'))).toBe(false)
  })

  it("403 « invalid xsrf token » → PAS une session morte (false)", () => {
    expect(isDeadAuthError(new ApiError(403, '{"error":"invalid xsrf token"}'))).toBe(false)
  })

  it("403 à corps vide → PAS une session morte (false, défaut prudent → offline)", () => {
    expect(isDeadAuthError(new ApiError(403, ""))).toBe(false)
  })

  it("403 métier (« Accès refusé », sans token) → PAS une session morte (false)", () => {
    expect(isDeadAuthError(new ApiError(403, '{"error":"Accès refusé"}'))).toBe(false)
  })

  it("503 (cold start) → PAS une session morte (false)", () => {
    expect(isDeadAuthError(new ApiError(503, "Service Unavailable"))).toBe(false)
  })

  it("0 (timeout/abort) → PAS une session morte (false)", () => {
    expect(isDeadAuthError(new ApiError(0, "timeout after 60000ms"))).toBe(false)
  })

  it("erreur non-ApiError → false", () => {
    expect(isDeadAuthError(new Error("boom"))).toBe(false)
    expect(isDeadAuthError(null)).toBe(false)
  })
})

// ─── isNetworkFailure — vraie panne réseau (mode hors-ligne) ─────────────────

describe("TU-P0-3-2 : isNetworkFailure (mode hors-ligne)", () => {
  it.each([0, 502, 503, 504])("status %i → panne réseau (true)", (status) => {
    expect(isNetworkFailure(new ApiError(status, "x"))).toBe(true)
  })

  it.each([401, 403, 404, 422])("status %i → PAS une panne réseau (false)", (status) => {
    expect(isNetworkFailure(new ApiError(status, "x"))).toBe(false)
  })

  it("erreur non-ApiError → false", () => {
    expect(isNetworkFailure(new Error("boom"))).toBe(false)
  })
})

// ─── Chemin HTTP réel (msw) : /journal/query ─────────────────────────────────

describe("TU-P0-3-3 : /journal/query — classification du chemin réel", () => {
  it("403 « Token invalide » → erreur classée session morte (déconnexion, pas offline)", async () => {
    const { getJournal } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/journal/query`, () =>
        HttpResponse.json({ error: "Token invalide" }, { status: 403 })
      )
    )
    const err = await getJournal("2026-06-28").catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).status).toBe(403)
    expect(isDeadAuthError(err)).toBe(true)     // → purge + login
    expect(isNetworkFailure(err)).toBe(false)   // → surtout PAS offline
  })

  it("503 (cold start) → panne réseau (mode hors-ligne, non-régression)", async () => {
    const { getJournal } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/journal/query`, () =>
        HttpResponse.json({ error: "Service Unavailable" }, { status: 503 })
      )
    )
    const err = await getJournal("2026-06-28").catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(isDeadAuthError(err)).toBe(false)    // → pas de déconnexion
    expect(isNetworkFailure(err)).toBe(true)    // → mode hors-ligne + retry
  })

  it("403 CSRF → ni purge ni offline forcé (pas de déconnexion)", async () => {
    const { getJournal } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/journal/query`, () =>
        HttpResponse.json({ error: "CSRF token invalide" }, { status: 403 })
      )
    )
    const err = await getJournal("2026-06-28").catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(isDeadAuthError(err)).toBe(false)    // → token NON purgé
    expect(isNetworkFailure(err)).toBe(false)
  })
})
