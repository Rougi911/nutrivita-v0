"use client"

import { useEffect } from "react"
import { captureException, initSentry } from "@/lib/observability/sentry"

/**
 * S20 — Initialise l'observabilité Sentry côté client et capture les erreurs
 * non gérées (hors arbre React : promesses rejetées, `window.onerror`).
 * Les erreurs de rendu React sont, elles, captées par les Error Boundaries
 * `app/error.tsx` et `app/global-error.tsx`.
 *
 * Aucune UI. No-op total si `NEXT_PUBLIC_SENTRY_DSN` est absent.
 */
export function SentryListener() {
  useEffect(() => {
    if (!initSentry()) return

    const onError = (event: ErrorEvent) => {
      captureException(event.error ?? event.message, { kind: "window.onerror" })
    }
    const onRejection = (event: PromiseRejectionEvent) => {
      captureException(event.reason, { kind: "unhandledrejection" })
    }

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onRejection)
    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [])

  return null
}
