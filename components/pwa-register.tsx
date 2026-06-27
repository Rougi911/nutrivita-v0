"use client"

import { useEffect } from "react"

/**
 * Enregistre le service worker `/sw.js` (S18, PWA installable).
 * Aucune UI. Échec silencieux si l'API n'est pas disponible.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return
    }
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Pas de SW = pas de mode hors-ligne, mais l'app reste fonctionnelle.
      })
    }
    if (document.readyState === "complete") {
      register()
    } else {
      window.addEventListener("load", register, { once: true })
      return () => window.removeEventListener("load", register)
    }
  }, [])

  return null
}
