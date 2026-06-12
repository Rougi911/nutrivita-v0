"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Search,
  ScanBarcode,
  Camera,
  Mic,
  Plus,
  Star,
  Heart,
  Minus,
} from "lucide-react"
import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { SAMPLE_FOODS, type FoodItem, MEALS } from "@/lib/types"
import { cn } from "@/lib/utils"

export function FoodSearchSheet() {
  const {
    showFoodSearch,
    setShowFoodSearch,
    selectedMealType,
    t,
    addMealEntry,
    currentDate,
    isRTL,
  } = useApp()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [portion, setPortion] = useState(100)
  const [activeFilter, setActiveFilter] = useState("all")

  const cuisineFilters = [
    { id: "all", label: "Tous" },
    { id: "favorites", label: "Favoris", icon: Star },
    { id: "Française", label: "Française", flag: "🇫🇷" },
    { id: "Maghreb", label: "Maghreb", flag: "🫙" },
    { id: "Italienne", label: "Italienne", flag: "🍝" },
    { id: "International", label: "International", flag: "🌍" },
  ]

  const filteredFoods = useMemo(() => {
    let foods = SAMPLE_FOODS

    if (activeFilter === "favorites") {
      foods = foods.filter((f) => f.isFavorite)
    } else if (activeFilter !== "all") {
      foods = foods.filter((f) => f.cuisine === activeFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      foods = foods.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          f.nameEn?.toLowerCase().includes(query) ||
          f.nameAr?.includes(query)
      )
    }

    return foods
  }, [searchQuery, activeFilter])

  const mealLabel =
    MEALS.find((m) => m.type === selectedMealType)?.nameFr || "Repas"

  const handleAddFood = () => {
    if (!selectedFood || !selectedMealType) return

    addMealEntry({
      foodId: selectedFood.id,
      food: selectedFood,
      amount: portion,
      mealType: selectedMealType,
      date: currentDate,
    })

    setSelectedFood(null)
    setPortion(100)
    setShowFoodSearch(false)
  }

  const calories = selectedFood
    ? Math.round((selectedFood.calories * portion) / 100)
    : 0
  const protein = selectedFood
    ? Math.round((selectedFood.protein * portion) / 100)
    : 0
  const carbs = selectedFood
    ? Math.round((selectedFood.carbs * portion) / 100)
    : 0
  const fat = selectedFood
    ? Math.round((selectedFood.fat * portion) / 100)
    : 0

  if (!showFoodSearch) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-background"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25 }}
      >
        <div className={cn("flex flex-col h-full", isRTL && "rtl")}>
          {/* Header */}
          <div className="flex items-center gap-4 p-4 border-b border-border">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFoodSearch(false)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">
              {t("addToMeal")} {mealLabel}
            </h1>
          </div>

          {/* Search */}
          <div className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={t("searchFood")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl"
                autoFocus
              />
            </div>

            {/* Mode buttons */}
            <div className="flex gap-2">
              {[
                { icon: Search, label: t("search") },
                { icon: ScanBarcode, label: t("scanner") },
                { icon: Camera, label: t("photo") },
                { icon: Mic, label: t("voice") },
              ].map((mode, i) => (
                <Button
                  key={i}
                  variant={i === 0 ? "default" : "outline"}
                  size="sm"
                  className="flex-1 gap-1.5 rounded-lg"
                >
                  <mode.icon className="h-4 w-4" />
                  <span className="text-xs">{mode.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
            {cuisineFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  activeFilter === filter.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {filter.flag && <span>{filter.flag}</span>}
                {filter.icon && <filter.icon className="h-3.5 w-3.5" />}
                {filter.label}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-4">
            {/* Favorites Section */}
            {!searchQuery && activeFilter === "all" && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  {t("yourFavorites")}
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {SAMPLE_FOODS.slice(0, 4).map((food) => (
                    <motion.button
                      key={food.id}
                      className="flex-shrink-0 w-24 p-3 rounded-2xl bg-card border border-border text-center"
                      onClick={() => setSelectedFood(food)}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-1 text-[15px] font-semibold text-muted-foreground">
                        {food.name.charAt(0)}
                      </div>
                      <p className="text-xs font-medium mt-1 truncate">
                        {food.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {food.calories} kcal
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            <div className="space-y-2 pb-32">
              {searchQuery && (
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  Résultats
                </h3>
              )}
              {filteredFoods.map((food) => (
                <motion.button
                  key={food.id}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border text-left"
                  onClick={() => setSelectedFood(food)}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 text-[15px] font-semibold text-muted-foreground">
                    {food.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{food.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {food.cuisine} • {food.calories} kcal/100g
                    </p>
                    <p className="text-xs text-muted-foreground">
                      P:{food.protein}g G:{food.carbs}g L:{food.fat}g
                    </p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Plus className="h-5 w-5 text-primary" />
                  </Button>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Quantity Sheet */}
        <AnimatePresence>
          {selectedFood && (
            <motion.div
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-6 safe-bottom"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25 }}
              >
                {/* Food header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-[22px] font-semibold text-muted-foreground shrink-0">
                    {selectedFood.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedFood.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedFood.cuisine}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto"
                    onClick={() => {}}
                  >
                    <Heart className="h-5 w-5" />
                  </Button>
                </div>

                {/* Nutrition ring preview */}
                <div className="flex items-center justify-center gap-8 mb-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{calories}</p>
                    <p className="text-xs text-muted-foreground">kcal</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-lg font-semibold">{protein}g</p>
                      <p className="text-[10px] text-muted-foreground">
                        Protéines
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold">{carbs}g</p>
                      <p className="text-[10px] text-muted-foreground">
                        Glucides
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold">{fat}g</p>
                      <p className="text-[10px] text-muted-foreground">
                        Lipides
                      </p>
                    </div>
                  </div>
                </div>

                {/* Portion slider */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{t("portion")}</span>
                    <span className="text-lg font-bold">{portion}g</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full"
                      onClick={() => setPortion(Math.max(10, portion - 10))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Slider
                      value={[portion]}
                      onValueChange={([v]) => setPortion(v)}
                      min={10}
                      max={500}
                      step={5}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full"
                      onClick={() => setPortion(Math.min(500, portion + 10))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Quick portions */}
                <div className="flex gap-2 mb-6">
                  {[
                    { label: "1/2", value: 50 },
                    { label: "Normal", value: 100 },
                    { label: "Double", value: 200 },
                  ].map((preset) => (
                    <Button
                      key={preset.label}
                      variant={portion === preset.value ? "default" : "outline"}
                      size="sm"
                      className="flex-1 rounded-lg"
                      onClick={() => setPortion(preset.value)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedFood(null)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    className="flex-1 gradient-hero text-white"
                    onClick={handleAddFood}
                  >
                    {t("addToMeal")} {mealLabel} • {calories} kcal
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
