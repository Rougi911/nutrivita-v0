"use client"

import { motion } from "framer-motion"
import { Mic, Plus, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { MealEntry } from "@/lib/types"

interface MealSectionCardProps {
  icon: string
  name: string
  entries: MealEntry[]
  onAddFood: () => void
  onVoiceInput: () => void
  className?: string
}

export function MealSectionCard({
  icon,
  name,
  entries,
  onAddFood,
  onVoiceInput,
  className,
}: MealSectionCardProps) {
  const totalCalories = entries.reduce(
    (sum, entry) => sum + (entry.food.calories * entry.amount) / 100,
    0
  )

  return (
    <motion.div
      className={cn(
        "rounded-2xl bg-card border border-border shadow-sm overflow-hidden",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-semibold text-foreground">{name}</span>
        </div>
        <span className="font-semibold text-foreground">
          {Math.round(totalCalories)} kcal
        </span>
      </div>

      {/* Food items */}
      <div className="p-4 space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            Aucun aliment ajouté
          </p>
        ) : (
          <>
            {entries.slice(0, 3).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span>{entry.food.emoji}</span>
                  <span className="text-foreground">
                    {entry.food.name} {entry.amount}g
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {Math.round((entry.food.calories * entry.amount) / 100)} kcal
                </span>
              </div>
            ))}
            {entries.length > 3 && (
              <button className="flex items-center gap-1 text-sm text-primary hover:underline">
                <ChevronDown className="h-4 w-4" />
                Voir {entries.length - 3} de plus
              </button>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 p-4 pt-0">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-2 rounded-xl touch-target"
          onClick={onVoiceInput}
        >
          <Mic className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          className="flex-1 gap-2 rounded-xl gradient-hero text-white touch-target"
          onClick={onAddFood}
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>
    </motion.div>
  )
}
