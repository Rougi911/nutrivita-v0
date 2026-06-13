"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import {
  type Language,
  type User,
  type DailyLog,
  type MealEntry,
  type GlucoseReading,
  type WeightEntry,
  type ActivityEntry,
  type ScannedProduct,
  translations,
  type TranslationKey,
} from "@/lib/types"
import { defaultWaterIntake } from "@/lib/mock-data"
import {
  getJournal,
  getGlucoseReadings as fetchGlucoseReadings,
  getWeightHistory,
  getActivities,
  setSlowStartCallback,
} from "@/lib/api"

interface AppContextType {
  // User
  user: User
  setUser: (user: User) => void
  isOnboarded: boolean
  setIsOnboarded: (value: boolean) => void

  // Language & translations
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
  isRTL: boolean

  // Daily log
  currentDate: string
  setCurrentDate: (date: string) => void
  dailyLog: DailyLog
  addMealEntry: (entry: Omit<MealEntry, "id" | "createdAt">) => void
  removeMealEntry: (id: string) => void
  clearJournal: () => void

  // Glucose
  glucoseReadings: GlucoseReading[]
  addGlucoseReading: (reading: Omit<GlucoseReading, "id">) => void
  clearGlucose: () => void
  glucoseTarget: { low: number; high: number }
  setGlucoseTarget: (target: { low: number; high: number }) => void
  isDiabetic: boolean
  setIsDiabetic: (value: boolean) => void

  // Weight
  weightHistory: WeightEntry[]
  addWeightEntry: (entry: WeightEntry) => void
  clearWeight: () => void

  // Activities
  activities: ActivityEntry[]
  addActivity: (entry: Omit<ActivityEntry, "id" | "createdAt">) => void
  removeActivity: (id: string) => void
  todayBurnedCalories: number

  // Groceries
  scannedProducts: ScannedProduct[]
  addScannedProduct: (product: ScannedProduct) => void
  removeScannedProduct: (barcode: string) => void

  // UI state
  activeTab: string
  setActiveTab: (tab: string) => void
  showAddSheet: boolean
  setShowAddSheet: (show: boolean) => void
  showFoodSearch: boolean
  setShowFoodSearch: (show: boolean) => void
  selectedMealType: MealEntry["mealType"] | null
  setSelectedMealType: (type: MealEntry["mealType"] | null) => void
  waterIntake: number
  setWaterIntake: (n: number) => void
  isLoading: boolean
  isOffline: boolean
  serverWaking: boolean
  reloadData: () => void
}

const defaultUser: User = {
  id: "1",
  name: "Ahmed",
  age: 28,
  height: 178,
  weight: 81.7,
  sex: "male",
  goals: ["lose"],
  activityLevel: 3,
  targetCalories: 2100,
  macros: {
    carbs: 45,
    protein: 30,
    fat: 25,
  },
  units: {
    weight: "kg",
    height: "cm",
    glucose: "g/L",
    energy: "kcal",
  },
  glucoseTarget: { low: 70, high: 180 },
  isDiabetic: true,
  language: "fr",
  darkMode: false,
  streak: 12,
}

const today = new Date().toISOString().split("T")[0]

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(defaultUser)
  const [isOnboarded, setIsOnboarded] = useState(true)
  const [language, setLanguageState] = useState<Language>("fr")
  const [currentDate, setCurrentDate] = useState(today)
  const [mealEntries, setMealEntries] = useState<MealEntry[]>([])
  const [glucoseReadings, setGlucoseReadings] = useState<GlucoseReading[]>([])
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([])
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [scannedProducts, setScannedProducts] = useState<ScannedProduct[]>([])
  const [glucoseTarget, setGlucoseTarget] = useState<{ low: number; high: number }>(defaultUser.glucoseTarget)
  const [isDiabetic, setIsDiabetic] = useState(defaultUser.isDiabetic)
  const [activeTab, setActiveTab] = useState("home")
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [showFoodSearch, setShowFoodSearch] = useState(false)
  const [selectedMealType, setSelectedMealType] = useState<MealEntry["mealType"] | null>(null)
  const [waterIntake, setWaterIntake] = useState(defaultWaterIntake)
  const [isLoading, setIsLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)
  const [serverWaking, setServerWaking] = useState(false)
  const loadCountRef = useRef(0)

  const loadData = useCallback(async (date: string) => {
    const loadId = ++loadCountRef.current
    setIsLoading(true)
    setIsOffline(false)

    setSlowStartCallback(() => {
      if (loadCountRef.current === loadId) setServerWaking(true)
    })

    try {
      const [meals, glucose, weight, acts] = await Promise.all([
        getJournal(date),
        fetchGlucoseReadings(14),
        getWeightHistory(30),
        getActivities(date),
      ])
      if (loadCountRef.current !== loadId) return
      setMealEntries(meals)
      setGlucoseReadings(glucose)
      setWeightHistory(weight)
      setActivities(acts)
      setIsOffline(false)
    } catch {
      if (loadCountRef.current !== loadId) return
      // Offline — état vide navigable (pas de données mockées qui confondent un vrai compte)
      setMealEntries([])
      setGlucoseReadings([])
      setWeightHistory([])
      setActivities([])
      setIsOffline(true)
    } finally {
      if (loadCountRef.current === loadId) {
        setIsLoading(false)
        setServerWaking(false)
        setSlowStartCallback(null)
      }
    }
  }, [])

  useEffect(() => {
    loadData(currentDate)
  }, [currentDate, loadData])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    setUser((prev) => ({ ...prev, language: lang }))
    if (typeof document !== "undefined") {
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
      document.documentElement.lang = lang
    }
  }

  const t = (key: TranslationKey): string => {
    return (translations[language] as Record<string, string>)[key] ?? key
  }

  const isRTL = language === "ar"

  // Daily totals
  const dailyMeals = mealEntries.filter((m) => m.date === currentDate)
  const totalCalories = dailyMeals.reduce((sum, m) => sum + (m.food.calories * m.amount) / 100, 0)
  const totalProtein  = dailyMeals.reduce((sum, m) => sum + (m.food.protein  * m.amount) / 100, 0)
  const totalCarbs    = dailyMeals.reduce((sum, m) => sum + (m.food.carbs    * m.amount) / 100, 0)
  const totalFat      = dailyMeals.reduce((sum, m) => sum + (m.food.fat      * m.amount) / 100, 0)

  const dailyLog: DailyLog = {
    date: currentDate,
    meals: dailyMeals,
    weight: weightHistory.find((w) => w.date === currentDate)?.weight,
    waterIntake,
    totalCalories: Math.round(totalCalories),
    totalProtein:  Math.round(totalProtein),
    totalCarbs:    Math.round(totalCarbs),
    totalFat:      Math.round(totalFat),
  }

  const addMealEntry = (entry: Omit<MealEntry, "id" | "createdAt">) => {
    const newEntry: MealEntry = { ...entry, id: `meal-${Date.now()}`, createdAt: new Date().toISOString() }
    setMealEntries((prev) => [...prev, newEntry])
  }

  const removeMealEntry = (id: string) => setMealEntries((prev) => prev.filter((m) => m.id !== id))

  const clearJournal = () => setMealEntries([])

  const addGlucoseReading = (reading: Omit<GlucoseReading, "id">) => {
    const newReading: GlucoseReading = { ...reading, id: `glucose-${Date.now()}` }
    setGlucoseReadings((prev) => [...prev, newReading])
  }

  const clearGlucose = () => setGlucoseReadings([])

  const addWeightEntry = (entry: WeightEntry) => {
    setWeightHistory((prev) => {
      const idx = prev.findIndex((w) => w.date === entry.date)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = entry
        return updated
      }
      return [...prev, entry]
    })
  }

  const clearWeight = () => setWeightHistory([])

  const addActivity = (entry: Omit<ActivityEntry, "id" | "createdAt">) => {
    const newEntry: ActivityEntry = { ...entry, id: `act-${Date.now()}`, createdAt: new Date().toISOString() }
    setActivities((prev) => [...prev, newEntry])
  }

  const removeActivity = (id: string) => setActivities((prev) => prev.filter((a) => a.id !== id))

  const todayBurnedCalories = activities
    .filter((a) => a.date === currentDate)
    .reduce((sum, a) => sum + a.caloriesBurned, 0)

  const addScannedProduct = (product: ScannedProduct) => {
    setScannedProducts((prev) => {
      const idx = prev.findIndex((p) => p.barcode === product.barcode)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...product, timesThisMonth: prev[idx].timesThisMonth + 1 }
        return updated
      }
      return [...prev, product]
    })
  }

  const removeScannedProduct = (barcode: string) =>
    setScannedProducts((prev) => prev.filter((p) => p.barcode !== barcode))

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isOnboarded,
        setIsOnboarded,
        language,
        setLanguage,
        t,
        isRTL,
        currentDate,
        setCurrentDate,
        dailyLog,
        addMealEntry,
        removeMealEntry,
        clearJournal,
        glucoseReadings,
        addGlucoseReading,
        clearGlucose,
        glucoseTarget,
        setGlucoseTarget,
        isDiabetic,
        setIsDiabetic,
        weightHistory,
        addWeightEntry,
        clearWeight,
        activities,
        addActivity,
        removeActivity,
        todayBurnedCalories,
        scannedProducts,
        addScannedProduct,
        removeScannedProduct,
        activeTab,
        setActiveTab,
        showAddSheet,
        setShowAddSheet,
        showFoodSearch,
        setShowFoodSearch,
        selectedMealType,
        setSelectedMealType,
        waterIntake,
        setWaterIntake,
        isLoading,
        isOffline,
        serverWaking,
        reloadData: () => loadData(currentDate),
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
