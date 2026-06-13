/**
 * TU-14 — Token helpers + chaîne auth API (P4.7)
 * Couvre : lib/auth.ts getToken/setToken/removeToken, lib/api.ts register/loginApi
 */
import { describe, it, expect, beforeEach, beforeAll, afterEach, afterAll, vi } from "vitest"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"

// ─── localStorage mock (Node.js n'en a pas) ─────────────────────────────────

const localStorageStore: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => localStorageStore[key] ?? null,
  setItem: (key: string, value: string) => { localStorageStore[key] = value },
  removeItem: (key: string) => { delete localStorageStore[key] },
  clear: () => { Object.keys(localStorageStore).forEach((k) => delete localStorageStore[k]) },
  length: 0,
  key: (_: number) => null,
}
vi.stubGlobal("window", { localStorage: localStorageMock })
vi.stubGlobal("localStorage", localStorageMock)

// ─── MSW server pour les routes auth ────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://nutridz.onrender.com"
const MOCK_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test"
const MOCK_USER  = { id: "42", email: "test@example.com", name: "Test User" }

const server = setupServer(
  http.post(`${API_BASE}/api/auth/register`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    if (!body.email || !body.password) {
      return HttpResponse.json({ error: "missing fields" }, { status: 400 })
    }
    return HttpResponse.json({ token: MOCK_TOKEN, user: MOCK_USER })
  }),
  http.post(`${API_BASE}/api/auth/login`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    if (body.email === "wrong@example.com") {
      return HttpResponse.json({ error: "invalid credentials" }, { status: 401 })
    }
    return HttpResponse.json({ token: MOCK_TOKEN, user: MOCK_USER })
  })
)
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => {
  server.resetHandlers()
  localStorageMock.clear()
})
afterAll(() => server.close())

// ─── Tests lib/auth.ts ───────────────────────────────────────────────────────

describe("TU-14a getToken / setToken / removeToken", () => {
  it("getToken retourne null si rien stocké", async () => {
    const { getToken } = await import("../auth")
    expect(getToken()).toBeNull()
  })

  it("setToken puis getToken retourne le token", async () => {
    const { getToken, setToken } = await import("../auth")
    setToken("abc123")
    expect(getToken()).toBe("abc123")
  })

  it("removeToken vide le token", async () => {
    const { getToken, setToken, removeToken } = await import("../auth")
    setToken("abc123")
    removeToken()
    expect(getToken()).toBeNull()
  })
})

// ─── Tests lib/api.ts auth endpoints ─────────────────────────────────────────

describe("TU-14b register()", () => {
  beforeEach(() => localStorageMock.clear())

  it("renvoie token + user sur succès", async () => {
    const { register } = await import("../api")
    const result = await register("test@example.com", "password123", "Test", true)
    expect(result.token).toBe(MOCK_TOKEN)
    expect(result.user.email).toBe("test@example.com")
    expect(result.user.id).toBe("42")
  })

  it("lève ApiError 400 sur champs manquants", async () => {
    const { register, ApiError } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/auth/register`, () =>
        HttpResponse.json({ error: "missing password" }, { status: 400 })
      )
    )
    await expect(register("test@example.com", "", "Test", true)).rejects.toBeInstanceOf(ApiError)
  })

  it("lève ApiError 409 si email déjà utilisé", async () => {
    const { register, ApiError } = await import("../api")
    server.use(
      http.post(`${API_BASE}/api/auth/register`, () =>
        HttpResponse.json({ error: "email already used" }, { status: 409 })
      )
    )
    await expect(register("dupe@example.com", "pass123", "Test", true)).rejects.toBeInstanceOf(ApiError)
  })
})

describe("TU-14c loginApi()", () => {
  it("renvoie token + user sur identifiants corrects", async () => {
    const { loginApi } = await import("../api")
    const result = await loginApi("test@example.com", "password123")
    expect(result.token).toBe(MOCK_TOKEN)
    expect(result.user.name).toBe("Test User")
  })

  it("lève ApiError 401 sur identifiants incorrects", async () => {
    const { loginApi, ApiError } = await import("../api")
    await expect(loginApi("wrong@example.com", "badpass")).rejects.toBeInstanceOf(ApiError)
  })
})

// ─── TU-14d — AL-01 formule calorique Mifflin-St Jeor ───────────────────────

describe("TU-14d AL-01 calcul calorique (Mifflin-St Jeor)", () => {
  function calcCalories(params: {
    weight: number; height: number; age: number
    sex: "male" | "female"
    activityLevel: 1 | 2 | 3 | 4 | 5
    goal: "lose" | "maintain" | "gain"
  }): number {
    const { weight, height, age, sex, activityLevel, goal } = params
    const bmr = sex === "female"
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5
    const multipliers = [1.2, 1.375, 1.55, 1.725, 1.9]
    let tdee = bmr * multipliers[activityLevel - 1]
    if (goal === "lose") tdee -= 400
    if (goal === "gain") tdee += 300
    return Math.round(tdee)
  }

  it("homme 28 ans, 81 kg, 178 cm, activité 3, maintien — TDEE correct", () => {
    // BMR = 10*81 + 6.25*178 - 5*28 + 5 = 810 + 1112.5 - 140 + 5 = 1787.5
    // TDEE = 1787.5 * 1.55 ≈ 2771
    const kcal = calcCalories({ weight: 81, height: 178, age: 28, sex: "male", activityLevel: 3, goal: "maintain" })
    expect(kcal).toBeGreaterThan(2700)
    expect(kcal).toBeLessThan(2850)
  })

  it("objectif perte → TDEE - 400", () => {
    const maintain = calcCalories({ weight: 75, height: 175, age: 30, sex: "male", activityLevel: 3, goal: "maintain" })
    const lose     = calcCalories({ weight: 75, height: 175, age: 30, sex: "male", activityLevel: 3, goal: "lose" })
    expect(maintain - lose).toBe(400)
  })

  it("objectif prise → TDEE + 300", () => {
    const maintain = calcCalories({ weight: 75, height: 175, age: 30, sex: "male", activityLevel: 3, goal: "maintain" })
    const gain     = calcCalories({ weight: 75, height: 175, age: 30, sex: "male", activityLevel: 3, goal: "gain" })
    expect(gain - maintain).toBe(300)
  })

  it("femme 35 ans, 65 kg, 165 cm, sédentaire — BMR inférieur à l'homme équivalent", () => {
    const female = calcCalories({ weight: 65, height: 165, age: 35, sex: "female", activityLevel: 1, goal: "maintain" })
    const male   = calcCalories({ weight: 65, height: 165, age: 35, sex: "male",   activityLevel: 1, goal: "maintain" })
    expect(female).toBeLessThan(male)
  })
})
