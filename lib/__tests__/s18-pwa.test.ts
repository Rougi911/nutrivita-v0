/**
 * S18 — PWA installable (manifeste, service worker, coquille hors-ligne, i18n)
 * Tracé : EB-12 (PWA accessible mobile et web) → SL-01.
 *
 * Vérifie les invariants « Installable » de Lighthouse côté artefacts statiques :
 * manifeste complet, icônes 192/512 présentes, service worker avec repli hors-ligne,
 * et clés i18n d'installation dans les 3 langues (SL-03 : arabe en \uXXXX).
 */
import { describe, it, expect } from "vitest"
import { existsSync, readFileSync, statSync } from "fs"
import path from "path"
import { translations } from "../types"

const root = path.resolve(__dirname, "../..")
const pub = (p: string) => path.join(root, "public", p)

describe("S18 manifeste PWA", () => {
  const manifest = JSON.parse(readFileSync(pub("manifest.json"), "utf8"))

  it("contient les champs requis pour l'installation", () => {
    expect(manifest.name).toBeTruthy()
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.start_url).toBe("/")
    expect(["standalone", "fullscreen", "minimal-ui"]).toContain(manifest.display)
    expect(manifest.theme_color).toBe("#1D9E75")
    expect(manifest.background_color).toBeTruthy()
  })

  it("déclare des icônes PNG 192 et 512 + une icône maskable", () => {
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes)
    expect(sizes).toContain("192x192")
    expect(sizes).toContain("512x512")
    const purposes = manifest.icons.flatMap((i: { purpose?: string }) =>
      (i.purpose ?? "any").split(" ")
    )
    expect(purposes).toContain("maskable")
  })

  it("les fichiers d'icônes déclarés existent réellement", () => {
    for (const icon of manifest.icons as { src: string }[]) {
      expect(existsSync(path.join(root, "public", icon.src))).toBe(true)
    }
  })
})

describe("S18 service worker + coquille hors-ligne", () => {
  it("expose un service worker avec un gestionnaire fetch et un repli hors-ligne", () => {
    const sw = readFileSync(pub("sw.js"), "utf8")
    expect(sw).toContain('addEventListener("fetch"')
    expect(sw).toContain("offline.html")
    // Ne met en cache que le same-origin (pas l'API/données de santé) — REG-05.
    expect(sw).toContain("self.location.origin")
  })

  it("fournit une page de repli hors-ligne non vide", () => {
    const offline = readFileSync(pub("offline.html"), "utf8")
    expect(statSync(pub("offline.html")).size).toBeGreaterThan(0)
    expect(offline.toLowerCase()).toContain("<!doctype html")
  })
})

describe("S18 i18n invite d'installation", () => {
  const keys = [
    "installTitle",
    "installBody",
    "installAction",
    "installDismiss",
    "installIosHint",
  ] as const

  it("définit chaque clé dans fr/ar/en", () => {
    for (const lang of ["fr", "ar", "en"] as const) {
      for (const key of keys) {
        expect(translations[lang][key]).toBeTruthy()
      }
    }
  })

  it("les chaînes arabes n'utilisent pas de caractères arabes bruts (SL-03)", () => {
    const arabic = /[؀-ۿ]/
    for (const key of keys) {
      // La valeur runtime est déjà décodée ; on vérifie la source TS.
      const src = readFileSync(path.join(root, "lib", "types.ts"), "utf8")
      const line = src
        .split("\n")
        .filter((l) => l.includes(`${key}:`))
      // Au moins une occurrence par langue ; l'arabe doit être en \uXXXX dans la source.
      expect(line.length).toBeGreaterThanOrEqual(3)
    }
    // La source TS ne contient pas d'arabe brut sur les clés install (escapes \uXXXX).
    const src = readFileSync(path.join(root, "lib", "types.ts"), "utf8")
    const installArLines = src
      .split("\n")
      .filter((l) => /install\w+:/.test(l) && arabic.test(l))
    expect(installArLines).toHaveLength(0)
  })
})
