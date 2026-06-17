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
  // Use createdAt as stable confirmation key — entry.id changes when updateMealEntryId
  // propagates the backend UUID, which would break a two-tap confirmation tracked by id.
  const [confirmStableKey, setConfirmStableKey] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])
  const handleDelete = (entry: MealEntry) => {
    const stableKey = entry.createdAt
    if (confirmStableKey !== stableKey) {
      setConfirmStableKey(stableKey)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setConfirmStableKey(null), 3000)
      return
    }
    // Use entry.id at tap-2 time — it is the backend UUID if updateMealEntryId already fired
    removeMealEntry(entry.id)
    setConfirmStableKey(null)
    deleteJournalEntry(entry.id).catch((err) => {
      console.error("[MealSectionCard] deleteJournalEntry failed:", err)
    })
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
            {visible.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-foreground truncate">
                  {entry.food.name}{" "}
                  <span className="text-muted-foreground">{entry.amount}g</span>
                </span>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="text-muted-foreground">
                    {Math.round((entry.food.calories * entry.amount) / 100)} kcal
                  </span>
                  <button
                    onClick={() => handleDelete(entry)}
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                    style={{
                      color: confirmStableKey === entry.createdAt ? "var(--risk)" : "var(--muted-foreground)",
                    }}
                    aria-label={confirmStableKey === entry.createdAt ? "Confirmer la suppression" : "Supprimer"}
                    title={confirmStableKey === entry.createdAt ? "Appuyer à nouveau pour confirmer" : "Supprimer"}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
            {!expanded && hidden > 0 && (
              <button
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
