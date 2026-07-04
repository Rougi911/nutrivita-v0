"use client"

// BUG-3 / audit L2 — Lazy-mount des blocs lourds (graphes Recharts / SVG).
// Ne monte les enfants que lorsque le bloc entre dans le viewport (ou juste
// avant, via rootMargin). Évite de monter tous les charts d'un coup au premier
// rendu de l'écran → réduit le gel du renderer sur Bilan / Tendances / Score /
// Glycémie×Repas. Réserve la hauteur (minHeight) pour ne pas casser le scroll.

import { useEffect, useRef, useState, type ReactNode } from "react"

interface LazyMountProps {
  children: ReactNode
  /** Hauteur réservée tant que le contenu n'est pas monté (évite les sauts de layout). */
  minHeight?: number
  /** Marge de pré-chargement autour du viewport. */
  rootMargin?: string
  className?: string
}

export function LazyMount({ children, minHeight = 180, rootMargin = "250px", className }: LazyMountProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (visible) return
    const el = ref.current
    if (!el) return
    // SSR / navigateurs sans IntersectionObserver : on monte directement.
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [visible, rootMargin])

  return (
    <div ref={ref} className={className} style={visible ? undefined : { minHeight }}>
      {visible ? children : null}
    </div>
  )
}
