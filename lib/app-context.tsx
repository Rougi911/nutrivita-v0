"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import {
  type Language,
  type User,
  type DailyLog,
  type MealEntry,
  type GlucoseReading,
  type WeightEntry,
  type ActivityEntry,
  translations,
  type TranslationKey,
  SAMPLE_FOODS,
} from "@/lib/types"

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

  // Glucose
  glucoseReadings: GlucoseReading[]
  addGlucoseReading: (reading: Omit<GlucoseReading, "id">) => void

  // Weight
  weightHistory: WeightEntry[]
  addWeightEntry: (entry: WeightEntry) => void

  // Activities
  activities: ActivityEntry[]
  addActivity: (entry: Omit<ActivityEntry, "id" | "createdAt">) => void
  removeActivity: (id: string) => void
  todayBurnedCalories: number

  // UI state
  activeTab: string
  setActiveTab: (tab: string) => void
  showFoodSearch: boolean
  setShowFoodSearch: (show: boolean) => void
  selectedMealType: MealEntry["mealType"] | null
  setSelectedMealType: (type: MealEntry["mealType"] | null) => void
}

const defaultUser: User = {
  id: "1",
  name: "Ahmed",
  age: 28,
  height: 178,
  weight: 75.3,
  sex: "male",
  goal: "lose",
  activityLevel: 3,
  targetCalories: 2310,
  macros: {
    carbs: 50,
    protein: 20,
    fat: 30,
  },
  units: {
    weight: "kg",
    height: "cm",
    glucose: "mg/dL",
    energy: "kcal",
  },
  language: "fr",
  darkMode: false,
  streak: 7,
}

// Sample data for demonstration
const today = new Date().toISOString().split("T")[0]

const sampleMealEntries: MealEntry[] = [
  {
    id: "1",
    foodId: "1",
    food: SAMPLE_FOODS[0],
    amount: 150,
    mealType: "breakfast",
    date: today,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    foodId: "2",
    food: SAMPLE_FOODS[1],
    amount: 60,
    mealType: "breakfast",
    date: today,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    foodId: "4",
    food: SAMPLE_FOODS[3],
    amount: 250,
    mealType: "lunch",
    date: today,
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    foodId: "7",
    food: SAMPLE_FOODS[6],
    amount: 150,
    mealType: "lunch",
    date: today,
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    foodId: "9",
    food: SAMPLE_FOODS[8],
    amount: 150,
    mealType: "dinner",
    date: today,
    createdAt: new Date().toISOString(),
  },
]

const sampleGlucoseReadings: GlucoseReading[] = Array.from(
  { length: 144 },
  (_, i) => ({
    id: `glucose-${i}`,
    value: 70 + Math.random() * 130 + (Math.random() > 0.9 ? 50 : 0),
    timestamp: new Date(
      Date.now() - (13 - Math.floor(i / 10)) * 24 * 60 * 60 * 1000
    ).toISOString(),
    type: "cgm" as const,
    source: "libreview" as const,
  })
)

const sampleActivities: ActivityEntry[] = [
  {
    id: "act-1",
    type: "course",
    duration: 30,
    caloriesBurned: 320,
    date: today,
    source: "manual",
    createdAt: new Date().toISOString(),
  },
]

const sampleWeightHistory: WeightEntry[] = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  weight: 77.5 - i * 0.08 + Math.random() * 0.3,
  bodyFat: 21 - i * 0.1 + Math.random() * 0.3,
  muscleMass: 58 + i * 0.03 + Math.random() * 0.2,
}))

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(defaultUser)
  const [isOnboarded, setIsOnboarded] = useState(true)
  const [language, setLanguageState] = useState<Language>("fr")
  const [currentDate, setCurrentDate] = useState(today)
  const [mealEntries, setMealEntries] = useState<MealEntry[]>(sampleMealEntries)
  const [glucoseReadings, setGlucoseReadings] = useState<GlucoseReading[]>(
    sampleGlucoseReadings
  )
  const [weightHistory, setWeightHistory] =
    useState<WeightEntry[]>(sampleWeightHistory)
  const [activities, setActivities] = useState<ActivityEntry[]>(sampleActivities)
  const [activeTab, setActiveTab] = useState("journal")
  const [showFoodSearch, setShowFoodSearch] = useState(false)
  const [selectedMealType, setSelectedMealType] = useState<
    MealEntry["mealType"] | null
  >(null)

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    setUser((prev) => ({ ...prev, language: lang }))
    // Update document direction for RTL
    if (typeof document !== "undefined") {
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
      document.documentElement.lang = lang
    }
  }

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key
  }

  const isRTL = language === "ar"

  // Calculate daily totals
  const dailyMeals = mealEntries.filter((m) => m.date === currentDate)
  const totalCalories = dailyMeals.reduce(
    (sum, m) => sum + (m.food.calories * m.amount) / 100,
    0
  )
  const totalProtein = dailyMeals.reduce(
    (sum, m) => sum + (m.food.protein * m.amount) / 100,
    0
  )
  const totalCarbs = dailyMeals.reduce(
    (sum, m) => sum + (m.food.carbs * m.amount) / 100,
    0
  )
  const totalFat = dailyMeals.reduce(
    (sum, m) => sum + (m.food.fat * m.amount) / 100,
    0
  )

  const dailyLog: DailyLog = {
    date: currentDate,
    meals: dailyMeals,
    weight: weightHistory.find((w) => w.date === currentDate)?.weight,
    waterIntake: 6,
    totalCalories: Math.round(totalCalories),
    totalProtein: Math.round(totalProtein),
    totalCarbs: Math.round(totalCarbs),
    totalFat: Math.round(totalFat),
  }

  const addMealEntry = (entry: Omit<MealEntry, "id" | "createdAt">) => {
    const newEntry: MealEntry = {
      ...entry,
      id: `meal-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setMealEntries((prev) => [...prev, newEntry])
  }

  const removeMealEntry = (id: string) => {
    setMealEntries((prev) => prev.filter((m) => m.id !== id))
  }

  const addGlucoseReading = (reading: Omit<GlucoseReading, "id">) => {
    const newReading: GlucoseReading = {
      ...reading,
      id: `glucose-${Date.now()}`,
    }
    setGlucoseReadings((prev) => [...prev, newReading])
  }

  const addActivity = (entry: Omit<ActivityEntry, "id" | "createdAt">) => {
    const newEntry: ActivityEntry = {
      ...entry,
      id: `act-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setActivities((prev) => [...prev, newEntry])
  }

  const removeActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id))
  }

  const todayBurnedCalories = activities
    .filter((a) => a.date === currentDate)
    .reduce((sum, a) => sum + a.caloriesBurned, 0)

  const addWeightEntry = (entry: WeightEntry) => {
    setWeightHistory((prev) => {
      const existing = prev.findIndex((w) => w.date === entry.date)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = entry
        return updated
      }
      return [...prev, entry]
    })
  }

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
        glucoseReadings,
        addGlucoseReading,
        weightHistory,
        addWeightEntry,
        activities,
        addActivity,
        removeActivity,
        todayBurnedCalories,
        activeTab,
        setActiveTab,
        showFoodSearch,
        setShowFoodSearch,
        selectedMealType,
        setSelectedMealType,
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
