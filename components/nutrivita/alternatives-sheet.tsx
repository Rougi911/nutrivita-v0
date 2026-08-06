"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X, ShoppingBag } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { getAlternatives } from "@/lib/api"
import type { Alternative } from "@/lib/types"
import { NutriScoreBadge } from "@/components/nutrivita/nutri-score-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface AlternativesSheetProps {
  barcode: string
  productName: string
  onClose: () => void
}

function AlternativeRow({ alt }: { alt: Alternative }) {
  const [imgFailed, setImgFailed] = useState(false)
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {alt.imageUrl && !imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={alt.imageUrl}
          alt={alt.name}
          className="w-10 h-10 rounded-lg object-cover shrink-0"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <p className="flex-1 min-w-0 text-[14px] font-medium text-foreground truncate">{alt.name}</p>
      <NutriScoreBadge score={alt.nutriScore} />
    </div>
  )
}

export function AlternativesSheet({ barcode, productName, onClose }: AlternativesSheetProps) {
  const { t } = useApp()
  const [loading, setLoading] = useState(true)
  const [alternatives, setAlternatives] = useState<Alternative[]>([])

  useEffect(() => {
    let active = true
    setLoading(true)
    getAlternatives(barcode)
      .then((res) => { if (active) setAlternatives(res.alternatives) })
      .catch((err) => {
        console.error("[AlternativesSheet] getAlternatives failed:", err)
        if (active) toast(t("errorLoading"), { duration: 3000 })
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [barcode, t])

  // Fermeture sur Échap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div className="absolute inset-0 bg-black/40" onClick={onClose} />

        <motion.div
          className="relative w-full max-w-md mx-auto bg-background rounded-t-3xl border-t border-border overflow-hidden flex flex-col max-h-[85vh]"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
        >
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-9 h-1 rounded-full bg-muted-foreground/25" />
          </div>

          <div className="px-4 pb-8 pt-2 flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 pr-2">
                <h2 className="text-[17px] font-semibold text-foreground">{t("alternativesTitle")}</h2>
                <p className="text-[12px] text-muted-foreground truncate mt-0.5">{productName}</p>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0"
                aria-label={t("cancel")}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-border bg-card divide-y divide-border">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <Skeleton className="h-4 flex-1 rounded" />
                    <Skeleton className="w-7 h-7 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : alternatives.length > 0 ? (
              <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
                {alternatives.map((alt) => (
                  <AlternativeRow key={alt.barcode} alt={alt} />
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground text-center py-8">
                {t("alternativesEmpty")}
              </p>
            )}

            {/* Disclaimer REG-05 (langue active) — vocabulaire non clinique */}
            <p className="text-[11px] text-muted-foreground leading-snug mt-3">
              {t("scanDisclaimer")}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
