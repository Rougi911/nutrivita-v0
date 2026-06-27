"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { captureException } from "@/lib/observability/sentry"
import { getStoredLanguage, dirForLanguage, DEFAULT_LANGUAGE } from "@/lib/language"
import type { Language } from "@/lib/types"

/**
 * S20 — Error Boundary de route (App Router). Capte les erreurs de rendu React
 * de l'arbre de pages, les envoie à Sentry (scrubbées, sans donnée de santé/PII)
 * et affiche un repli neutre avec réessai. Respecte SL-UI (pas de dégradé, pas
 * d'émoji, icônes lucide, carte rounded-2xl) et l'i18n FR/AR/EN + RTL.
 *
 * Le `t()` de l'AppProvider n'est pas disponible ici (le boundary remplace
 * l'arbre qui le monte) → on lit la langue persistée (localStorage, SSR-safe).
 */
const MESSAGES: Record<Language, { title: string; body: string; retry: string }> = {
  fr: {
    title: "Une erreur est survenue",
    body: "Réessaie. Si le problème persiste, reviens un peu plus tard.",
    retry: "Réessayer",
  },
  ar: {
    // SL-03 : arabe en échappements Unicode (jamais de caractères arabes directs).
    title: "\u062d\u062f\u062b \u062e\u0637\u0623",
    body: "\u062d\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649. \u0625\u0630\u0627 \u0627\u0633\u062a\u0645\u0631\u062a \u0627\u0644\u0645\u0634\u0643\u0644\u0629\u060c \u0639\u064f\u062f \u0644\u0627\u062d\u0642\u064b\u0627.",
    retry: "\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629",
  },
  en: {
    title: "Something went wrong",
    body: "Please try again. If the problem persists, come back later.",
    retry: "Try again",
  },
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [lang, setLang] = useState<Language>(DEFAULT_LANGUAGE)

  useEffect(() => {
    setLang(getStoredLanguage() ?? DEFAULT_LANGUAGE)
  }, [])

  useEffect(() => {
    captureException(error, { digest: error.digest })
  }, [error])

  const m = MESSAGES[lang]

  return (
    <div
      dir={dirForLanguage(lang)}
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-card text-[#BA7517]">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">{m.title}</p>
        <p className="text-sm text-muted-foreground">{m.body}</p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        {m.retry}
      </button>
    </div>
  )
}
