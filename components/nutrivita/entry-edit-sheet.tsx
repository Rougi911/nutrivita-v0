"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X, Plus, Trash2 } from "lucide-react"
import { useApp } from "@/lib/app-context"
import type { FoodItem, MealEntry } from "@/lib/types"
import { addJournalEntry, deleteJournalEntry, updateJournalEntry } from "@/lib/api"
import { defaultPortionG } from "@/lib/condiments"
import { CondimentSheet } from "@/components/nutrivita/condiment-sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

/** Id local (optimiste, pas encore synchronisé) vs id backend réel. */
export const isBackendId = (id: string) => !/^(meal-|label-|act-)/.test(id)

type MacroKey = "kcal" | "protein" | "carbs" | "fat"
type MacroStrings = Record<MacroKey, string>

const r1 = (n: number) => Math.round(n * 10) / 10
const parseNum = (s: string) => Number(String(s).replace(",", ".").trim())

/** Macros de la PORTION (et non /100 g), pour une saisie intuitive (« ce plat = 650 kcal »). */
function portionMacros(food: FoodItem, grams: number): MacroStrings {
  const k = grams / 100
  return {
    kcal: String(Math.round((food.calories || 0) * k)),
    protein: String(r1((food.protein || 0) * k)),
    carbs: String(r1((food.carbs || 0) * k)),
    fat: String(r1((food.fat || 0) * k)),
  }
}

interface EntryEditSheetProps {
  entry: MealEntry
  onClose: () => void
}

/**
 * Feuille d'édition d'un aliment du journal (Journal + Accueil) :
 *  - quantité (g) ;
 *  - correction manuelle des macros de la portion (estimation IA fausse, plat maison…) ;
 *  - sauces / huiles / aliments ajoutés, rattachés à l'aliment (quantité modifiable, suppression).
 */
export function EntryEditSheet({ entry, onClose }: EntryEditSheetProps) {
  const {
    t, dailyLog, addMealEntry, updateMealEntryId, updateMealEntryAmount,
    updateMealEntryFood, removeMealEntry,
  } = useApp()

  // L'id peut passer de local à backend pendant que la feuille est ouverte → on relit l'entrée
  // vivante par createdAt (stable) plutôt que de garder l'instantané reçu en prop.
  const live = dailyLog.meals.find((m) => m.createdAt === entry.createdAt) ?? entry
  const children = dailyLog.meals.filter((m) => m.parentId === live.id)

  const [amount, setAmount] = useState(String(entry.amount))
  const [macros, setMacros] = useState<MacroStrings>(() => portionMacros(entry.food, entry.amount))
  const [macrosDirty, setMacrosDirty] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const amountNum = parseInt(amount, 10)

  // Tant que l'utilisateur n'a pas corrigé les macros, elles suivent la quantité saisie.
  useEffect(() => {
    if (!macrosDirty && Number.isFinite(amountNum) && amountNum > 0) {
      setMacros(portionMacros(entry.food, amountNum))
    }
  }, [amountNum, macrosDirty, entry.food])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !showPicker) onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, showPicker])

  const setMacro = (key: MacroKey, value: string) => {
    setMacrosDirty(true)
    setMacros((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    setError(null)
    if (!Number.isFinite(amountNum) || amountNum <= 0 || amountNum > 5000) {
      setError(t("quantityG"))
      return
    }

    if (macrosDirty) {
      const vals = {
        kcal: parseNum(macros.kcal), protein: parseNum(macros.protein),
        carbs: parseNum(macros.carbs), fat: parseNum(macros.fat),
      }
      if (Object.values(vals).some((v) => !Number.isFinite(v) || v < 0)) {
        setError(t("portionMacros"))
        return
      }
      // Portion → /100 g (le modèle de données et le backend raisonnent en /100 g).
      const f = 100 / amountNum
      const food: FoodItem = {
        ...live.food,
        calories: Math.round(vals.kcal * f),
        protein: r1(vals.protein * f),
        carbs: r1(vals.carbs * f),
        fat: r1(vals.fat * f),
      }
      updateMealEntryFood(live.id, food)
      updateMealEntryAmount(live.id, amountNum)
      if (isBackendId(live.id)) {
        updateJournalEntry(live.id, amountNum, {
          kcal_per100: food.calories, proteines: food.protein, glucides: food.carbs, lipides: food.fat,
        }).catch((err) => console.error("[EntryEditSheet] macros PATCH failed:", err))
      }
    } else if (amountNum !== live.amount) {
      updateMealEntryAmount(live.id, amountNum)
      if (isBackendId(live.id)) {
        updateJournalEntry(live.id, amountNum)
          .catch((err) => console.error("[EntryEditSheet] amount PATCH failed:", err))
      }
    }
    onClose()
  }

  const handlePickAddOn = (food: FoodItem) => {
    setShowPicker(false)
    const addOn = {
      foodId: food.id,
      food,
      amount: defaultPortionG(food.name),
      mealType: live.mealType,
      date: live.date,
      parentId: live.id,
    }
    const localId = addMealEntry(addOn)
    addJournalEntry(addOn, isBackendId(live.id) ? live.id : undefined)
      .then((backendEntry) => updateMealEntryId(localId, backendEntry.id))
      .catch((err) => console.error("[EntryEditSheet] add-on sync failed:", err))
  }

  const handleChildAmount = (child: MealEntry, value: string) => {
    const g = parseInt(value, 10)
    if (!Number.isFinite(g) || g <= 0 || g > 5000 || g === child.amount) return
    updateMealEntryAmount(child.id, g)
    if (isBackendId(child.id)) {
      updateJournalEntry(child.id, g).catch((err) => console.error("[EntryEditSheet] add-on PATCH failed:", err))
    }
  }

  const handleChildDelete = (child: MealEntry) => {
    removeMealEntry(child.id)
    if (isBackendId(child.id)) {
      deleteJournalEntry(child.id).catch((err) => console.error("[EntryEditSheet] add-on DELETE failed:", err))
    }
  }

  const mainKcal = parseNum(macros.kcal) || 0
  const addOnsKcal = children.reduce((s, c) => s + (c.food.calories * c.amount) / 100, 0)

  const MACRO_FIELDS: { key: MacroKey; label: string; unit: string }[] = [
    { key: "kcal", label: "Calories", unit: "kcal" },
    { key: "protein", label: t("protein"), unit: "g" },
    { key: "carbs", label: t("carbs"), unit: "g" },
    { key: "fat", label: t("fat"), unit: "g" },
  ]

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-[65] flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t("editFoodTitle")}
            className="relative w-full max-w-md mx-auto bg-background rounded-t-3xl border-t border-border overflow-hidden flex flex-col max-h-[88vh]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-muted-foreground/25" />
            </div>

            <div className="px-4 pt-2 pb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] text-muted-foreground">{t("editFoodTitle")}</p>
                <h2 className="text-[16px] font-semibold text-foreground truncate">{live.food.name}</h2>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0"
                aria-label={t("cancel")}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-5">
              {/* Quantité */}
              <div className="space-y-1.5">
                <label htmlFor="entry-amount" className="text-[12px] font-medium text-muted-foreground">
                  {t("quantityG")}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    id="entry-amount"
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
                    className="h-11 w-28 rounded-xl text-right text-[15px]"
                  />
                  <span className="text-[13px] text-muted-foreground">g</span>
                </div>
              </div>

              {/* Macros de la portion — corrigeables */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-muted-foreground">{t("portionMacros")}</p>
                  {macrosDirty && (
                    <span className="text-[11px] font-medium" style={{ color: "var(--amber)" }}>
                      {t("macrosCorrected")}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {MACRO_FIELDS.map((m) => (
                    <label key={m.key} className="rounded-xl border border-border bg-card px-3 py-2 flex flex-col gap-1">
                      <span className="text-[11px] text-muted-foreground">{m.label}</span>
                      <span className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={macros[m.key]}
                          onChange={(e) => setMacro(m.key, e.target.value.replace(/[^\d.,]/g, ""))}
                          className="w-full bg-transparent text-[15px] font-semibold text-foreground outline-none tabular-nums"
                          aria-label={`${m.label} (${m.unit})`}
                        />
                        <span className="text-[12px] text-muted-foreground">{m.unit}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">{t("macrosHint")}</p>
              </div>

              {/* Sauces / huiles / ajouts rattachés */}
              <div className="space-y-2">
                <p className="text-[12px] font-medium text-muted-foreground">{t("addOnsTitle")}</p>
                {children.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">{t("noAddOns")}</p>
                ) : (
                  children.map((child) => (
                    <div key={child.createdAt} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
                      <span className="flex-1 min-w-0 text-[13px] text-foreground truncate">{child.food.name}</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        defaultValue={String(child.amount)}
                        onBlur={(e) => handleChildAmount(child, e.target.value)}
                        className="h-8 w-16 rounded-lg text-right text-[13px]"
                        aria-label={`${child.food.name} — ${t("quantityG")}`}
                      />
                      <span className="text-[11px] text-muted-foreground">g</span>
                      <span className="text-[11px] text-muted-foreground w-14 text-right tabular-nums">
                        {Math.round((child.food.calories * child.amount) / 100)} kcal
                      </span>
                      <button
                        type="button"
                        onClick={() => handleChildDelete(child)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-[var(--risk)]"
                        aria-label={t("deleteProduct")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
                <button
                  type="button"
                  onClick={() => setShowPicker(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-[13px] font-medium"
                  style={{ color: "var(--primary)" }}
                >
                  <Plus className="h-4 w-4" />
                  {t("addSauce")}
                </button>
              </div>
            </div>

            <div
              className="shrink-0 px-4 pt-3 border-t border-border bg-background space-y-2"
              style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
            >
              <p className="text-[12px] text-muted-foreground text-center tabular-nums">
                {Math.round(mainKcal + addOnsKcal)} kcal
                {children.length > 0 && ` (${Math.round(mainKcal)} + ${Math.round(addOnsKcal)})`}
              </p>
              {error && (
                <p className="text-[12px] text-center" style={{ color: "var(--risk)" }}>{error}</p>
              )}
              <Button className="w-full h-12 rounded-2xl text-[15px] font-semibold" onClick={handleSave}>
                {t("save")}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {showPicker && (
        <CondimentSheet onPick={handlePickAddOn} onClose={() => setShowPicker(false)} />
      )}
    </>
  )
}
