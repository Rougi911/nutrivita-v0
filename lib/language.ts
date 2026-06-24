import type { Language } from "@/lib/types"

const LANGUAGE_KEY = "language"
const SUPPORTED: readonly Language[] = ["fr", "ar", "en"]

/** Langue par défaut (cf. EB-11 / défaut FR). */
export const DEFAULT_LANGUAGE: Language = "fr"

/**
 * P1-5 — Persistance de la langue choisie.
 * Lit la langue stockée ; renvoie null si absente ou invalide (SSR-safe).
 */
export function getStoredLanguage(): Language | null {
  if (typeof window === "undefined") return null
  const v = localStorage.getItem(LANGUAGE_KEY)
  return v !== null && (SUPPORTED as readonly string[]).includes(v) ? (v as Language) : null
}

/** Persiste la langue choisie (SSR-safe). */
export function setStoredLanguage(lang: Language): void {
  if (typeof window === "undefined") return
  localStorage.setItem(LANGUAGE_KEY, lang)
}

/** Sens d'écriture associé à une langue (arabe = RTL). */
export function dirForLanguage(lang: Language): "rtl" | "ltr" {
  return lang === "ar" ? "rtl" : "ltr"
}
