"use client"

import { useEffect, useState } from "react"
import { captureException } from "@/lib/observability/sentry"
import { getStoredLanguage, dirForLanguage, DEFAULT_LANGUAGE } from "@/lib/language"
import type { Language } from "@/lib/types"

/**
 * S20 — Error Boundary globale (App Router). Remplace le layout racine quand une
 * erreur survient dans celui-ci. Doit rendre ses propres <html>/<body> et rester
 * autonome (pas de provider/i18n disponible → langue lue dans localStorage).
 * Capte l'erreur dans Sentry (scrubbée) puis affiche un repli neutre i18n.
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

export default function GlobalError({
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
    captureException(error, { digest: error.digest, kind: "global-error" })
  }, [error])

  const m = MESSAGES[lang]

  return (
    <html lang={lang} dir={dirForLanguage(lang)}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "24px",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          color: "#0F172A",
          background: "#F8FAFC",
        }}
      >
        <p role="alert" style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
          {m.title}
        </p>
        <p style={{ fontSize: "14px", color: "#64748B", margin: 0 }}>{m.body}</p>
        <button
          type="button"
          onClick={reset}
          style={{
            border: "none",
            borderRadius: "16px",
            background: "#1D9E75",
            color: "#FFFFFF",
            fontSize: "14px",
            fontWeight: 600,
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          {m.retry}
        </button>
      </body>
    </html>
  )
}
