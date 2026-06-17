"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronUp, Plus, Utensils, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/app-context"
import type { MealEntry } from "@/lib/types"
import { deleteJournalEntry } from "@/lib/api"

interface MealSectionCardProps {
  icon?: React.ReactNode
  name: string
  entries: MealEntry[]
  onAddFood: () => void
  compact?: boolean
  className?: string
}

export function MealSectionCard({
  icon,
  name,
  entries,
  onAddFood,
  compact = false,
  className,
}: MealSectionCardProps) {
  const { t, removeMealEntry } = useApp()
  const [expanded, setExpanded] = useState(false)
  // confirmKey = entry.createdAt of the entry pending deletion (stable across id updates)
  const [confirmKey, setConfirmKey] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const handleRequestDelete = (entry: MealEntry) => {
    console.log("[MealSectionCard] handleRequestDelete — entry.id:", entry.id, "food:", entry.food.name)
    setConfirmKey(entry.createdAt)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setConfirmKey(null), 4000)
  }

  const handleConfirmDelete = (entry: MealEntry) => {
    console.log("[MealSectionCard] handleConfirmDelete — entry.id:", entry.id)
    if (timerRef.current) clearTimeout(timerRef.current)
    removeMealEntry(entry.id)
    setConfirmKey(null)
    deleteJournalEntry(entry.id).catch((err) => {
      console.error("[MealSectionCard] deleteJournalEntry failed:", err)
    })
  }

  const handleCancelDelete = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setConfirmKey(null)
  }

  const limit = compact ? 2 : 3
  const visible = expanded ? entries : entries.slice(0, limit)
  const hidden = entries.length - limit

  const totalCalories = entries.reduce(
    (sum, entry) => sum + (entry.food.calories * entry.amount) / 100,
    0
  )

  return (
    <div
      className={cn(
        "rounded-2xl bg-card border border-border overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {icon ?? <Utensils className="h-4 w-4 text-muted-foreground" />}
          <span className="font-semibold text-sm text-foreground">{name}</span>
        </div>
        <span className="text-sm font-semibold text-foreground">
          {Math.round(totalCalories)} kcal
        </span>
      </div>

      <div className="px-4 py-3 space-y-2">
        {entries.length === 0 ? (
          <p className="text-[13px] text-muted-foreground text-center py-1">
            {t("noFoodAdded")}
          </p>
        ) : (
          <>
            {visible.map((entry) => {
              const isPending = confirmKey === entry.createdAt
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between text-sm min-h-[28px]"
                >
                  <span className="text-foreground truncate">
                    {entry.food.name}{" "}
                    <span className="text-muted-foreground">{entry.amount}g</span>
                  </span>

                  {isPending ? (
                    // Single-click confirmation row — shown after first Trash2 click
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[12px] text-muted-foreground">{t("confirmDelete")}</span>
                      <button
                        type="button"
                        onClick={() => handleConfirmDelete(entry)}
                        className="px-2 py-0.5 text-[11px] font-semibold rounded-full"
                        style={{ background: "var(--risk)", color: "#fff" }}
                        aria-label="Oui, supprimer"
                      >
                        Oui
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelDelete}
                        className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-muted text-muted-foreground"
                        aria-label="Annuler la suppression"
                      >
                        Non
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-muted-foreground">
                        {Math.round((entry.food.calories * entry.amount) / 100)} kcal
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRequestDelete(entry)}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-colors text-muted-foreground hover:text-[var(--risk)]"
                        aria-label="Supprimer"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            {!expanded && hidden > 0 && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                aria-label={`${t("showLess")} — ${hidden} ${t("moreItems")}`}
                className="flex items-center gap-1 text-[13px] text-primary"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                {hidden} {t("moreItems")}
              </button>
            )}
            {expanded && entries.length > limit && (
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label={t("showLess")}
                className="flex items-center gap-1 text-[13px] text-muted-foreground"
              >
                <ChevronUp className="h-3.5 w-3.5" />
                {t("showLess")}
              </button>
            )}
          </>
        )}
      </div>

      {!compact && (
        <div className="px-4 pb-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full gap-2 rounded-xl"
            onClick={onAddFood}
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </Button>
        </div>
      )}
    </div>
  )
}
