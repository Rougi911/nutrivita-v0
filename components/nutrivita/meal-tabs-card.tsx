"use client"

import { useState, useRef, useEffect } from "react"
import { Coffee, Utensils, Cookie, Moon, Plus, Trash2, Pencil, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/lib/app-context"
import { MEALS, type MealEntry, type FoodItem } from "@/lib/types"
import type { MealType } from "@/lib/meal-utils"
import { inferMealTypeFromTime } from "@/lib/meal-utils"
import { computeMealTotals } from "@/lib/meal-macros"
import { deleteJournalEntry, updateJournalEntry, addJournalEntry } from "@/lib/api"
import { defaultPortionG } from "@/lib/condiments"
import { MacroRing, MACRO_COLORS } from "@/components/nutrivita/macro-ring"
import { CondimentSheet } from "@/components/nutrivita/condiment-sheet"
import { Input } from "@/components/ui/input"

const MEAL_ICONS: Record<MealType, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Utensils,
  snack: Cookie,
  dinner: Moon,
}

/** S14 — Répartition des repas du jour en onglets (remplace les 4 cartes empilées). */
export function MealTabsCard() {
  const {
    t, dailyLog, removeMealEntry, setSelectedMealType, setShowAddSheet,
    addMealEntry, updateMealEntryId, updateMealEntryAmount, currentDate,
  } = useApp()
  const [activeMeal, setActiveMeal] = useState<MealType>(() => inferMealTypeFromTime())
  // confirmKey = createdAt de l'entrée en attente de suppression (stable malgré le swap d'id)
  const [confirmKey, setConfirmKey] = useState<string | null>(null)
  // S15 — édition inline : createdAt de l'entrée éditée + valeur quantité saisie
  const [editKey, setEditKey] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState("")
  // S15 — entrée parente pour laquelle on ajoute une sauce (ouvre le sélecteur)
  const [sauceParent, setSauceParent] = useState<MealEntry | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const isBackendId = (id: string) => !/^(meal-|label-|act-)/.test(id)

  const startEdit = (entry: MealEntry) => {
    setConfirmKey(null)
    setEditKey(entry.createdAt)
    setEditAmount(String(entry.amount))
  }

  const handleSaveEdit = (entry: MealEntry) => {
    const amount = parseInt(editAmount, 10)
    if (!Number.isFinite(amount) || amount <= 0) return
    updateMealEntryAmount(entry.id, amount) // optimiste
    if (isBackendId(entry.id)) {
      updateJournalEntry(entry.id, amount).catch((err) => {
        console.error("[MealTabsCard] updateJournalEntry failed:", err)
      })
    }
    setEditKey(null)
  }

  const handlePickSauce = (food: FoodItem) => {
    const parent = sauceParent
    setSauceParent(null)
    if (!parent) return
    const portion = defaultPortionG(food.name)
    const entry = {
      foodId: food.id,
      food,
      amount: portion,
      mealType: parent.mealType,
      date: currentDate,
      parentId: parent.id,
    }
    const localId = addMealEntry(entry) // optimiste → anneau/totaux recalculés
    addJournalEntry(entry, isBackendId(parent.id) ? parent.id : undefined)
      .then((backendEntry) => { updateMealEntryId(localId, backendEntry.id) })
      .catch((err) => { console.error("[MealTabsCard] addJournalEntry (sauce) failed:", err) })
  }

  const entries = dailyLog.meals.filter((m) => m.mealType === activeMeal)
  const totals = computeMealTotals(entries)

  const handleRequestDelete = (entry: MealEntry) => {
    setConfirmKey(entry.createdAt)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setConfirmKey(null), 4000)
  }

  const handleConfirmDelete = (entry: MealEntry) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    removeMealEntry(entry.id)
    setConfirmKey(null)
    deleteJournalEntry(entry.id).catch((err) => {
      console.error("[MealTabsCard] deleteJournalEntry failed:", err)
    })
  }

  const handleCancelDelete = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setConfirmKey(null)
  }

  const handleAdd = () => {
    setSelectedMealType(activeMeal)
    setShowAddSheet(true)
  }

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      {/* Barre d'onglets — picto lucide + libellé, actif en teal */}
      <div className="flex border-b border-border">
        {MEALS.map((meal) => {
          const Icon = MEAL_ICONS[meal.type]
          const isActive = activeMeal === meal.type
          return (
            <button
              key={meal.type}
              type="button"
              onClick={() => { setActiveMeal(meal.type); setConfirmKey(null) }}
              aria-pressed={isActive}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors border-b-2",
                isActive
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[11px] font-medium leading-tight">{t(meal.type)}</span>
            </button>
          )
        })}
      </div>

      {/* 2 colonnes centrées verticalement : liste à gauche, anneau macros à droite */}
      <div className="flex items-center gap-6 px-4 py-4">
        {/* Gauche — liste des aliments du repas sélectionné */}
        <div className="flex-1 min-w-0 space-y-2">
          {entries.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-4">{t("noFoodForMeal")}</p>
          ) : (
            entries.map((entry) => {
              const isPending = confirmKey === entry.createdAt
              const isEditing = editKey === entry.createdAt
              const kcal = Math.round((entry.food.calories * entry.amount) / 100)

              // S15 — éditeur inline : quantité + ajouter une sauce
              if (isEditing) {
                return (
                  <div key={entry.id} className={cn("space-y-2", entry.parentId && "pl-3 border-l border-border")}>
                    <p className="text-[13px] font-medium text-foreground truncate">{entry.food.name}</p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        aria-label={t("quantityG")}
                        className="h-9 w-20 rounded-lg text-right text-[13px]"
                        autoFocus
                      />
                      <span className="text-[12px] text-muted-foreground">g</span>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(entry)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: "var(--primary)" }}
                        aria-label={t("save")}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditKey(null)}
                        className="w-7 h-7 rounded-full flex items-center justify-center bg-muted text-muted-foreground shrink-0"
                        aria-label={t("cancel")}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSauceParent(entry); setEditKey(null) }}
                      className="flex items-center gap-1.5 text-[12px] font-medium"
                      style={{ color: "var(--primary)" }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {t("addSauce")}
                    </button>
                  </div>
                )
              }

              return (
                <div
                  key={entry.id}
                  className={cn(
                    "flex items-center justify-between gap-2 text-sm min-h-[28px]",
                    entry.parentId && "pl-3 border-l border-border"
                  )}
                >
                  <span className="text-foreground truncate min-w-0">
                    {entry.food.name}{" "}
                    <span className="text-muted-foreground">{entry.amount}g</span>
                  </span>
                  {isPending ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[12px] text-muted-foreground">{t("confirmDelete")}</span>
                      <button
                        type="button"
                        onClick={() => handleConfirmDelete(entry)}
                        className="px-2 py-0.5 text-[11px] font-semibold rounded-full text-white"
                        style={{ background: "var(--risk)" }}
                        aria-label={t("deleteProduct")}
                      >
                        {t("yes")}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelDelete}
                        className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-muted text-muted-foreground"
                        aria-label={t("cancel")}
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-muted-foreground whitespace-nowrap">{kcal} kcal</span>
                      <button
                        type="button"
                        onClick={() => startEdit(entry)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-[var(--primary)] transition-colors"
                        aria-label={t("edit")}
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRequestDelete(entry)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-[var(--risk)] transition-colors"
                        aria-label={t("deleteProduct")}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Droite — anneau calorique + légende P/G/L (grammes) */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <MacroRing totals={totals} size={120} />
          <div className="flex flex-col gap-1">
            {([
              { key: "protein" as const, label: t("protein"), grams: totals.protein },
              { key: "carbs" as const,   label: t("carbs"),   grams: totals.carbs },
              { key: "fat" as const,     label: t("fat"),     grams: totals.fat },
            ]).map((m) => (
              <div key={m.key} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: MACRO_COLORS[m.key] }} />
                <span className="text-[11px] text-muted-foreground">{m.label}</span>
                <span className="text-[11px] font-semibold text-foreground tabular-nums">{Math.round(m.grams)}g</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ajouter un aliment au repas sélectionné */}
      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={handleAdd}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-border text-[13px] font-medium text-foreground active:scale-[0.98] transition-transform"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("addFoodItem")}
        </button>
      </div>

      {/* S15 — sélecteur de sauces/condiments */}
      {sauceParent && (
        <CondimentSheet onPick={handlePickSauce} onClose={() => setSauceParent(null)} />
      )}
    </div>
  )
}
