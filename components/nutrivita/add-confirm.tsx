"use client"

import { useState } from "react"
import { ArrowLeft, Check } from "lucide-react"
import { useApp } from "@/lib/app-context"
import type { FoodItem, MealEntry } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AddConfirmProps {
  food: FoodItem
  confidence?: number // 0–1
  onBack: () => void
  onConfirm: (entry: Omit<MealEntry, "id" | "createdAt">) => void
}

const INGREDIENTS: Record<string, string[]> = {
  "1": ["Lait", "Ferments lactiques"],
  "3": ["Semoule", "Agneau", "Légumes", "Épices", "Merguez"],
  "5": ["Poulet", "Olives", "Citron confit", "Oignons", "Coriandre"],
}

const miniCardStyle = "rounded-xl border border-border bg-card p-3 text-center"

export function AddConfirm({ food, confidence = 0.94, onBack, onConfirm }: AddConfirmProps) {
  const { selectedMealType, currentDate, t } = useApp()
  const [portion, setPortion] = useState(100)

  const mealType = selectedMealType ?? "lunch"
  const factor = portion / 100

  const kcal  = Math.round(food.calories * factor)
  const prot  = Math.round(food.protein  * factor * 10) / 10
  const carbs = Math.round(food.carbs    * factor * 10) / 10
  const fat   = Math.round(food.fat      * factor * 10) / 10

  const ingredients = INGREDIENTS[food.id] ?? []

  const confidencePct = Math.round(confidence * 100)

  const handleConfirm = () => {
    onConfirm({
      foodId: food.id,
      food,
      amount: portion,
      mealType,
      date: currentDate,
    })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
          aria-label="Retour"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="text-[18px] font-semibold text-foreground">{t("addMeal")}</h1>
      </div>

      <div className="flex-1 px-4 pb-6 space-y-4 overflow-y-auto">
        {/* Food image placeholder + confidence badge */}
        <div className="relative rounded-2xl bg-muted overflow-hidden h-44 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-2xl bg-muted-foreground/20 flex items-center justify-center">
              <span className="text-3xl text-muted-foreground/40">?</span>
            </div>
            <span className="text-[13px] text-muted-foreground">{food.name}</span>
          </div>
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[12px] font-semibold"
            style={{ backgroundColor: "var(--badge-positive-bg)", color: "var(--badge-positive)" }}>
            {t("detectedAt")} {confidencePct}%
          </span>
        </div>

        {/* Name + portion slider */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[16px] font-semibold text-foreground mb-3">{food.name}</p>
          <div className="flex items-center gap-3">
            <label className="text-[13px] text-muted-foreground shrink-0">
              {t("portion")}
            </label>
            <input
              type="range"
              min={10}
              max={500}
              step={5}
              value={portion}
              onChange={(e) => setPortion(Number(e.target.value))}
              className="flex-1 accent-[--primary]"
            />
            <div className="flex items-center gap-1 shrink-0">
              <input
                type="number"
                min={10}
                max={999}
                value={portion}
                onChange={(e) => setPortion(Math.max(10, Number(e.target.value)))}
                className="w-14 text-center text-[14px] font-semibold text-foreground bg-muted rounded-lg py-1 border-none outline-none"
              />
              <span className="text-[13px] text-muted-foreground">g</span>
            </div>
          </div>
        </div>

        {/* 4 mini-cards */}
        <div className="grid grid-cols-4 gap-2">
          <div className={miniCardStyle}>
            <p className="text-[18px] font-semibold text-foreground">{kcal}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">kcal</p>
          </div>
          <div className={miniCardStyle}>
            <p className="text-[18px] font-semibold leading-none" style={{ color: "var(--glucose)" }}>
              {prot}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">prot</p>
          </div>
          <div className={miniCardStyle}>
            <p className="text-[18px] font-semibold leading-none" style={{ color: "var(--amber)" }}>
              {carbs}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">gluc</p>
          </div>
          <div className={miniCardStyle}>
            <p className="text-[18px] font-semibold leading-none" style={{ color: "var(--lipids)" }}>
              {fat}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">lip</p>
          </div>
        </div>

        {/* Ingredient pills */}
        {ingredients.length > 0 && (
          <div>
            <p className="text-[12px] text-muted-foreground font-medium mb-2">
              {t("ingredients")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ingredients.map((ing) => (
                <span
                  key={ing}
                  className="px-2.5 py-1 rounded-full border border-border bg-card text-[12px] text-foreground"
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-4 pb-8 pt-3 border-t border-border bg-background">
        <Button
          className="w-full gap-2 rounded-2xl h-12 text-[15px] font-semibold"
          onClick={handleConfirm}
        >
          <Check className="h-4 w-4" />
          {t("addToLunch")}
        </Button>
      </div>
    </div>
  )
}
