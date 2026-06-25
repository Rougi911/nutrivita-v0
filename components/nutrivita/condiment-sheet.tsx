"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X, Search, Loader2, Plus } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { searchFoods } from "@/lib/api"
import type { FoodItem } from "@/lib/types"
import { CONDIMENTS } from "@/lib/condiments"
import { Input } from "@/components/ui/input"

interface CondimentSheetProps {
  /** Appelé avec le produit choisi (id backend réel issu de la recherche). */
  onPick: (food: FoodItem) => void
  onClose: () => void
}

/** S15 — Sélecteur de sauces/condiments. Recherche le catalogue backend
 *  (products) via /api/foods/search ; raccourcis « condiments courants ». */
export function CondimentSheet({ onPick, onClose }: CondimentSheetProps) {
  const { t } = useApp()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<FoodItem[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setError(null)
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      setError(null)
      try {
        setResults(await searchFoods(query.trim()))
      } catch (err) {
        console.error("[CondimentSheet] searchFoods failed:", err)
        setError(t("errorLoading"))
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, t])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] flex items-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-md mx-auto bg-background rounded-t-3xl border-t border-border overflow-hidden flex flex-col max-h-[80vh]"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-9 h-1 rounded-full bg-muted-foreground/25" />
          </div>

          <div className="px-4 pt-2 pb-3 flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-foreground">{t("addSauce")}</h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"
              aria-label={t("cancel")}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("condimentSearch")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-11 rounded-xl"
                autoFocus
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-8">
            {/* Raccourcis condiments courants (quand pas de recherche) */}
            {!query.trim() && (
              <>
                <p className="text-[12px] text-muted-foreground font-medium mb-2">{t("commonCondiments")}</p>
                <div className="flex flex-wrap gap-2">
                  {CONDIMENTS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setQuery(c.name)}
                      className="px-3 py-1.5 rounded-full border border-border bg-card text-[13px] text-foreground active:scale-95 transition-transform"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Résultats de recherche (produits backend) */}
            {query.trim() && (
              <div className="space-y-2">
                {searching && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {error && (
                  <p className="text-[12px] text-center py-2" style={{ color: "var(--risk)" }}>{error}</p>
                )}
                {!searching && !error && results.length === 0 && (
                  <p className="text-[13px] text-muted-foreground text-center py-4">{t("searchNoResults")}</p>
                )}
                {results.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => onPick(food)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border text-left active:scale-[0.99] transition-transform"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-foreground truncate">{food.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {Number.isFinite(food.calories) ? `${food.calories} kcal/100g` : "—"}
                      </p>
                    </div>
                    <Plus className="h-5 w-5 text-primary shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
