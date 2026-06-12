"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Search, ScanBarcode, Camera, Plus, Star } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SAMPLE_FOODS, type FoodItem } from "@/lib/types"
import { cn } from "@/lib/utils"

export function MealsScreen() {
  const { t, isRTL, setShowFoodSearch, setSelectedMealType } = useApp()
  const [searchQuery, setSearchQuery] = useState("")
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

  const handleQuickAdd = (food: FoodItem) => {
    setSelectedMealType("lunch")
    setShowFoodSearch(true)
  }

  return (
    <div className={cn("flex flex-col pb-32 min-h-screen", isRTL && "rtl")}>
      {/* Header */}
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">
          Base de données
        </h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={t("searchFood")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-xl"
          />
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-2 rounded-xl h-11">
            <Camera className="h-4 w-4" />
            Photo
          </Button>
          <Button variant="outline" className="flex-1 gap-2 rounded-xl h-11">
            <ScanBarcode className="h-4 w-4" />
            Scanner CB
          </Button>
          <Button className="flex-1 gap-2 rounded-xl h-11 gradient-hero text-white">
            <Plus className="h-4 w-4" />
            Créer plat
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
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

      {/* Foods Grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {filteredFoods.map((food, index) => (
          <motion.button
            key={food.id}
            className="relative flex flex-col items-center p-4 rounded-2xl bg-card border border-border text-center"
            onClick={() => handleQuickAdd(food)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {food.isFavorite && (
              <Star className="absolute top-2 right-2 h-4 w-4 text-amber fill-amber" />
            )}
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-2 text-[16px] font-semibold text-muted-foreground">
              {food.name.charAt(0)}
            </div>
            <p className="font-medium text-sm truncate w-full">{food.name}</p>
            <p className="text-xs text-muted-foreground">{food.cuisine}</p>
            <p className="text-sm font-semibold text-primary mt-1">
              {food.calories} kcal
            </p>
            <p className="text-[10px] text-muted-foreground">
              P{food.protein} G{food.carbs} L{food.fat}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
