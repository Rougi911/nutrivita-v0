"use client"

import { ChevronDown, Plus, Utensils } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { MealEntry } from "@/lib/types"

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
            Aucun aliment ajouté
          </p>
        ) : (
          <>
            {entries.slice(0, compact ? 2 : 3).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-foreground truncate">
                  {entry.food.name}{" "}
                  <span className="text-muted-foreground">{entry.amount}g</span>
                </span>
                <span className="text-muted-foreground shrink-0 ml-2">
                  {Math.round((entry.food.calories * entry.amount) / 100)} kcal
                </span>
              </div>
            ))}
            {entries.length > (compact ? 2 : 3) && (
              <button className="flex items-center gap-1 text-[13px] text-primary">
                <ChevronDown className="h-3.5 w-3.5" />
                {entries.length - (compact ? 2 : 3)} de plus
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
