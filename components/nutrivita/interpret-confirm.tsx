"use client"

import { useState } from "react"
import { ArrowLeft, Check, X } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { SAMPLE_FOODS, MEALS } from "@/lib/types"
import type { ApiInterpretResponse, ApiIntent } from "@/lib/api-types"
import type { GlucoseReading, FoodItem, MealEntry } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface InterpretConfirmProps {
  result: ApiInterpretResponse
  onBack: () => void
  onDone: () => void
}

type MealType = MealEntry["mealType"]

function inferMealTypeFromTime(): MealType {
  const h = new Date().getHours()
  if (h < 11) return "breakfast"
  if (h < 15) return "lunch"
  if (h < 19) return "snack"
  return "dinner"
}

function normalizeMealType(mt: string | null | undefined): MealType | null {
  if (!mt || mt === "null") return null
  const map: Record<string, MealType> = {
    breakfast: "breakfast",
    lunch: "lunch",
    dinner: "dinner",
    snack: "snack",
    "petit-dejeuner": "breakfast",
    dejeuner: "lunch",
    diner: "dinner",
    collation: "snack",
  }
  return map[mt.toLowerCase()] ?? null
}

function intentLabel(intent: ApiIntent): string {
  if (intent.type === "food") {
    const qty = intent.quantity_g ? ` · ${intent.quantity_g}g` : ""
    const kcal = intent.nutrition?.kcal ? ` · ${intent.nutrition.kcal} kcal` : ""
    return `${intent.name ?? "Aliment"}${qty}${kcal}`
  }
  if (intent.type === "activity") {
    return `${intent.sport ?? "Activité"} · ${intent.duration_min} min`
  }
  if (intent.type === "glucose") {
    return `Glycémie ${intent.glucose_mg_dl} mg/dL`
  }
  return "Élément détecté"
}

function intentColor(type: ApiIntent["type"]): string {
  if (type === "food") return "var(--primary)"
  if (type === "activity") return "var(--amber)"
  return "var(--glucose)"
}

export function InterpretConfirm({ result, onBack, onDone }: InterpretConfirmProps) {
  const { t, addMealEntry, addActivity, addGlucoseReading, currentDate, user } = useApp()

  const [selected, setSelected] = useState<boolean[]>(result.intents.map(() => true))
  const [mealTypes, setMealTypes] = useState<MealType[]>(
    result.intents.map((intent) => {
      if (intent.type === "food") {
        return normalizeMealType(intent.meal_type) ?? inferMealTypeFromTime()
      }
      return "lunch"
    })
  )

  const toggle = (i: number) =>
    setSelected((prev) => prev.map((v, idx) => (idx === i ? !v : v)))

  const updateMealType = (i: number, mt: MealType) =>
    setMealTypes((prev) => prev.map((v, idx) => (idx === i ? mt : v)))

  const handleConfirm = () => {
    result.intents.forEach((intent, i) => {
      if (!selected[i]) return

      if (intent.type === "food" && intent.name) {
        const n = intent.nutrition
        const food: FoodItem =
          SAMPLE_FOODS.find((f) =>
            f.name.toLowerCase().includes(intent.name!.toLowerCase())
          ) ?? {
            id: `ai-${Date.now()}-${intent.name}`,
            name: intent.name,
            nameEn: intent.name,
            cuisine: "International",
            calories: n?.kcal ?? 150,
            protein: n?.proteines ?? 5,
            carbs: n?.glucides ?? 20,
            fat: n?.lipides ?? 5,
            source: "estimated" as const,
          }
        addMealEntry({
          foodId: food.id,
          food,
          amount: intent.quantity_g ?? 100,
          mealType: mealTypes[i],
          date: currentDate,
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

      if (intent.type === "glucose" && intent.glucose_mg_dl != null) {
        // glucose_mg_dl est déjà en mg/dL depuis le backend (AL-04) — pas de conversion
        const reading: Omit<GlucoseReading, "id"> = {
          value: intent.glucose_mg_dl,
          timestamp: new Date().toISOString(),
          type: "pontuelle",
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
          <div key={i} className="space-y-2">
            <button
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

            {/* Sélecteur de repas — uniquement pour les intents food sélectionnés */}
            {intent.type === "food" && selected[i] && (
              <div className="flex gap-1.5">
                {MEALS.map((m) => (
                  <button
                    key={m.type}
                    onClick={() => updateMealType(i, m.type)}
                    className={cn(
                      "flex-1 text-[11px] font-medium rounded-xl py-1.5 border transition-colors",
                      mealTypes[i] === m.type
                        ? "border-[var(--primary)] text-white"
                        : "bg-card text-muted-foreground border-border"
                    )}
                    style={mealTypes[i] === m.type ? { backgroundColor: "var(--primary)" } : {}}
                  >
                    {t(m.type)}
                  </button>
                ))}
              </div>
            )}
          </div>
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
