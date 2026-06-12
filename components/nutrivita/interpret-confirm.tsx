"use client"

import { useState } from "react"
import { ArrowLeft, Check, X } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { fromGlucoseUnit } from "@/lib/glucose-units"
import { SAMPLE_FOODS } from "@/lib/types"
import type { ApiInterpretResponse, ApiIntent } from "@/lib/api-types"
import type { GlucoseReading, FoodItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface InterpretConfirmProps {
  result: ApiInterpretResponse
  onBack: () => void
  onDone: () => void
}

function intentLabel(intent: ApiIntent): string {
  if (intent.type === "meal") {
    return intent.items?.map((i) => `${i.name} ${i.quantity_g}g`).join(", ") ?? "Repas"
  }
  if (intent.type === "activity") {
    return `${intent.sport ?? "Activité"} · ${intent.duration_min} min`
  }
  if (intent.type === "glucose") {
    return `Glycémie ${intent.valeur} ${intent.unite ?? "g/L"}`
  }
  return "Élément détecté"
}

function intentColor(type: ApiIntent["type"]): string {
  if (type === "meal") return "var(--primary)"
  if (type === "activity") return "var(--amber)"
  return "var(--glucose)"
}

export function InterpretConfirm({ result, onBack, onDone }: InterpretConfirmProps) {
  const { t, addMealEntry, addActivity, addGlucoseReading, currentDate, selectedMealType, user } =
    useApp()
  const [selected, setSelected] = useState<boolean[]>(result.intents.map(() => true))

  const toggle = (i: number) =>
    setSelected((prev) => prev.map((v, idx) => (idx === i ? !v : v)))

  const handleConfirm = () => {
    result.intents.forEach((intent, i) => {
      if (!selected[i]) return

      if (intent.type === "meal" && intent.items) {
        intent.items.forEach((item) => {
          const food: FoodItem =
            SAMPLE_FOODS.find((f) =>
              f.name.toLowerCase().includes(item.name.toLowerCase())
            ) ?? {
              id: `ai-${Date.now()}-${item.name}`,
              name: item.name,
              nameEn: item.name,
              cuisine: "International",
              calories: 150,
              protein: 5,
              carbs: 20,
              fat: 5,
              source: "estimated" as const,
            }
          addMealEntry({
            foodId: food.id,
            food,
            amount: item.quantity_g,
            mealType: selectedMealType ?? "lunch",
            date: currentDate,
          })
        })
      }

      if (intent.type === "activity" && intent.sport && intent.duration_min != null) {
        addActivity({
          type: intent.sport,
          duration: intent.duration_min,
          caloriesBurned: Math.round(9.0 * (user.weight ?? 80) * (intent.duration_min / 60)),
          date: currentDate,
          source: "voice",
        })
      }

      if (intent.type === "glucose" && intent.valeur != null) {
        const valueMgDl = fromGlucoseUnit(
          intent.valeur,
          (intent.unite ?? "g/L") as Parameters<typeof fromGlucoseUnit>[1]
        )
        const reading: Omit<GlucoseReading, "id"> = {
          value: valueMgDl,
          timestamp: new Date().toISOString(),
          type: (intent.contexte as GlucoseReading["type"]) ?? "pontuelle",
          source: "manual",
        }
        addGlucoseReading(reading)
      }
    })
    onDone()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-5 pb-3">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
          aria-label={t("cancel")}
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="text-[18px] font-semibold text-foreground">{t("detectedFoods")}</h1>
      </div>

      <div className="flex-1 px-4 pb-6 space-y-3 overflow-y-auto">
        {result.intents.map((intent, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={cn(
              "w-full flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors",
              selected[i]
                ? "border-[var(--primary)] bg-[var(--badge-positive-bg)]"
                : "border-border bg-card"
            )}
          >
            <div
              className="w-2 h-2 rounded-full mt-1.5 shrink-0"
              style={{ backgroundColor: intentColor(intent.type) }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-foreground leading-tight">
                {intentLabel(intent)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("detectedAt")} {Math.round(intent.confidence * 100)}%
              </p>
            </div>
            {selected[i] ? (
              <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--primary)" }} />
            ) : (
              <X className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            )}
          </button>
        ))}
      </div>

      <div className="px-4 pb-8 pt-3 border-t border-border bg-background">
        <Button
          className="w-full gap-2 rounded-2xl h-12 text-[15px] font-semibold"
          onClick={handleConfirm}
          disabled={selected.every((v) => !v)}
        >
          <Check className="h-4 w-4" />
          {t("add")} ({selected.filter(Boolean).length})
        </Button>
      </div>
    </div>
  )
}
