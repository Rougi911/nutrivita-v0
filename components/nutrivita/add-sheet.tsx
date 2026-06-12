"use client"

import { useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Camera, Mic, ScanLine, Search, X } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { SAMPLE_FOODS } from "@/lib/types"
import { cn } from "@/lib/utils"

const recentFoodIds = ["1", "3", "9", "5", "7"]

const quickActions = [
  {
    id: "photo",
    labelKey: "photo" as const,
    icon: Camera,
    color: "var(--primary)",
    bg: "var(--badge-positive-bg)",
    comingSoon: false,
  },
  {
    id: "voice",
    labelKey: "voice" as const,
    icon: Mic,
    color: "var(--glucose)",
    bg: "var(--glucose-bg)",
    comingSoon: false,
  },
  {
    id: "scanner",
    labelKey: "scanner" as const,
    icon: ScanLine,
    color: "var(--amber)",
    bg: "var(--amber-bg)",
    comingSoon: false,
  },
  {
    id: "search",
    labelKey: "search" as const,
    icon: Search,
    color: "var(--muted-foreground)",
    bg: "var(--muted)",
    comingSoon: false,
  },
] as const

export function AddSheet() {
  const { setShowAddSheet, t, setShowFoodSearch } = useApp()

  const recentFoods = recentFoodIds
    .map((id) => SAMPLE_FOODS.find((f) => f.id === id))
    .filter(Boolean)

  // Dismiss on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowAddSheet(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [setShowAddSheet])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Overlay */}
        <motion.div
          className="absolute inset-0 bg-black/40"
          onClick={() => setShowAddSheet(false)}
        />

        {/* Sheet */}
        <motion.div
          className="relative w-full max-w-md mx-auto bg-background rounded-t-3xl border-t border-border overflow-hidden"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-9 h-1 rounded-full bg-muted-foreground/25" />
          </div>

          <div className="px-4 pb-8 pt-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-semibold text-foreground">{t("addMeal")}</h2>
              <button
                onClick={() => setShowAddSheet(false)}
                className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"
                aria-label={t("cancel")}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* 2×2 quick action grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={() => {
                      if (action.id === "search") {
                        setShowFoodSearch(true)
                        setShowAddSheet(false)
                      }
                      // photo / voice / scanner: coming soon stubs
                    }}
                    className="flex items-center gap-3 rounded-2xl border border-border p-3.5 active:scale-[0.97] transition-transform text-left"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: action.bg }}
                    >
                      <Icon className="h-5 w-5" style={{ color: action.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-foreground leading-tight">
                        {t(action.labelKey)}
                      </p>
                      {action.id === "photo" && (
                        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                          {t("detectByPhoto")}
                        </p>
                      )}
                      {action.id === "voice" && (
                        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                          {t("sayMeal")}
                        </p>
                      )}
                      {action.id === "scanner" && (
                        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                          {t("barcode")}
                        </p>
                      )}
                      {action.id === "search" && (
                        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                          {t("searchCiqual")}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Recent foods pills */}
            {recentFoods.length > 0 && (
              <div>
                <p className="text-[12px] text-muted-foreground font-medium mb-2">
                  {t("recentFoods")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {recentFoods.map((food) =>
                    food ? (
                      <button
                        key={food.id}
                        className="px-3 py-1.5 rounded-full border border-border bg-card text-[13px] text-foreground font-medium active:scale-95 transition-transform"
                      >
                        {food.name}
                        <span className="ml-1.5 text-muted-foreground text-[11px]">
                          {food.calories} kcal/100g
                        </span>
                      </button>
                    ) : null
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
