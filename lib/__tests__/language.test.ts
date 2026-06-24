/**
 * TU-P15 — Persistance de la langue (P1-5)
 * Couvre : lib/language.ts getStoredLanguage / setStoredLanguage / dirForLanguage
 * Exigence tracée : EB-11 (multilingue FR/AR/EN) + persistance du choix utilisateur.
 */
import { describe, it, expect, beforeEach, vi } from "vitest"

// ─── localStorage mock (Node.js n'en a pas) ─────────────────────────────────
const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value },
  removeItem: (key: string) => { delete store[key] },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
  length: 0,
  key: (_: number) => null,
}
vi.stubGlobal("window", { localStorage: localStorageMock })
vi.stubGlobal("localStorage", localStorageMock)

beforeEach(() => localStorageMock.clear())

describe("TU-P15a getStoredLanguage / setStoredLanguage", () => {
  it("getStoredLanguage retourne null si rien stocké", async () => {
    const { getStoredLanguage } = await import("../language")
    expect(getStoredLanguage()).toBeNull()
  })

  it("setStoredLanguage('ar') puis getStoredLanguage retourne 'ar'", async () => {
    const { getStoredLanguage, setStoredLanguage } = await import("../language")
    setStoredLanguage("ar")
    expect(getStoredLanguage()).toBe("ar")
  })

  it("persiste indépendamment chaque langue supportée (fr/ar/en)", async () => {
    const { getStoredLanguage, setStoredLanguage } = await import("../language")
    for (const lang of ["fr", "ar", "en"] as const) {
      setStoredLanguage(lang)
      expect(getStoredLanguage()).toBe(lang)
    }
  })

  it("ignore une valeur stockée invalide (retourne null)", async () => {
    const { getStoredLanguage } = await import("../language")
    localStorageMock.setItem("language", "xx")
    expect(getStoredLanguage()).toBeNull()
  })
})

describe("TU-P15b dirForLanguage", () => {
  it("arabe → rtl", async () => {
    const { dirForLanguage } = await import("../language")
    expect(dirForLanguage("ar")).toBe("rtl")
  })

  it("français et anglais → ltr", async () => {
    const { dirForLanguage } = await import("../language")
    expect(dirForLanguage("fr")).toBe("ltr")
    expect(dirForLanguage("en")).toBe("ltr")
  })
})
