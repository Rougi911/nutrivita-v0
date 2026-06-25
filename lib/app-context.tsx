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
import { getLocalDateStr } from "@/lib/date-utils"
import {
  getJournal,
  getGlucoseReadings as fetchGlucoseReadings,
  getWeightHistory,
  getActivities,
  getScannedProducts,
  addGlucoseReadingApi,
  addWeightEntryApi,
  addActivityApi,
  deleteActivityApi,
  setSlowStartCallback,
  ApiError,
} from "@/lib/api"
import { getToken, setToken, removeToken } from "@/lib/auth"
import { getStoredLanguage, setStoredLanguage, dirForLanguage } from "@/lib/language"

interface AppContextType {
  // Auth
  isAuthenticated: boolean
  isAuthLoading: boolean
  login: (token: string, serverUser: { id: string; email: string; name: string }) => void
  logout: () => void

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
  mealEntries: MealEntry[]
  addMealEntry: (entry: Omit<MealEntry, "id" | "createdAt">) => string
  updateMealEntryId: (localId: string, backendId: string) => void
  updateMealEntryAmount: (id: string, amount: number) => void
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
  removeScannedProductById: (id: number) => void
  loadScannedProducts: () => Promise<void>

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
  name: "Utilisateur",
  age: 28,
  height: 178,
  weight: 75,
  sex: "male",
  goals: ["maintain"],
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
  isDiabetic: false,
  language: "fr",
  darkMode: false,
  streak: 0,
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  const [user, setUser] = useState<User>(defaultUser)
  const [isOnboarded, setIsOnboarded] = useState(false)
  const [language, setLanguageState] = useState<Language>("fr")
  // "" initially — useEffect sets real date client-side (avoids SSR/client hydration #418)
  const [currentDate, setCurrentDate] = useState("")
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
  const [isLoading, setIsLoading] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [serverWaking, setServerWaking] = useState(false)
  const loadCountRef = useRef(0)

  // Check localStorage for existing token (client-side only)
  useEffect(() => {
    const token = getToken()
    setIsAuthenticated(!!token)
    setIsAuthLoading(false)
  }, [])

  // Set current date client-side only (date LOCALE, pas UTC) — fixes React #418 hydration
  // mismatch et évite le décalage de jour en soirée (UTC+1 Algeria).
  useEffect(() => {
    setCurrentDate(getLocalDateStr())
  }, [])

  // P1-5 — Restaure la langue persistée au montage (sinon reset FR au reload) et
  // applique le sens d'écriture (RTL pour l'arabe) sur <html>.
  useEffect(() => {
    const stored = getStoredLanguage()
    const lang = stored ?? "fr"
    if (stored) {
      setLanguageState(stored)
      setUser((prev) => ({ ...prev, language: stored }))
    }
    if (typeof document !== "undefined") {
      document.documentElement.dir = dirForLanguage(lang)
      document.documentElement.lang = lang
    }
  }, [])

  const login = useCallback((token: string, serverUser: { id: string; email: string; name: string }) => {
    setToken(token)
    setIsAuthenticated(true)
    setUser((prev) => ({ ...prev, id: serverUser.id, name: serverUser.name, email: serverUser.email }))
  }, [])

  const logout = useCallback(() => {
    removeToken()
    setIsAuthenticated(false)
    setMealEntries([])
    setGlucoseReadings([])
    setWeightHistory([])
    setActivities([])
    setScannedProducts([])
    setIsOnboarded(false)
  }, [])

  const loadData = useCallback(async (date: string) => {
    if (!getToken()) return
    const loadId = ++loadCountRef.current
    setIsLoading(true)
    setIsOffline(false)

    setSlowStartCallback(() => {
      if (loadCountRef.current === loadId) setServerWaking(true)
    })

    const MAX_ATTEMPTS = 3
    let success = false

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
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
        success = true
        break
      } catch (err) {
        if (loadCountRef.current !== loadId) return
        if (err instanceof ApiError && err.status === 401) {
          removeToken()
          setIsAuthenticated(false)
          setIsLoading(false)
          setServerWaking(false)
          setSlowStartCallback(null)
          return
        }
        // Retry only on 503 (cold start) or timeout (status 0)
        const isRetryable = err instanceof ApiError && (err.status === 503 || err.status === 0)
        if (!isRetryable || attempt === MAX_ATTEMPTS - 1) {
          console.error("[loadData] giving up after", attempt + 1, "attempt(s):", err)
          if (loadCountRef.current === loadId) {
            setMealEntries([])
            setGlucoseReadings([])
            setWeightHistory([])
            setActivities([])
            setIsOffline(true)
          }
          break
        }
        // Exponential backoff: 4s, 8s
        await new Promise((r) => setTimeout(r, (attempt + 1) * 4000))
      }
    }

    if (loadCountRef.current === loadId) {
      setIsLoading(false)
      setServerWaking(false)
      setSlowStartCallback(null)
    }
  }, [])

  // Reload when date changes or auth state changes
  useEffect(() => {
    if (currentDate && isAuthenticated) {
      loadData(currentDate)
    }
  }, [currentDate, loadData, isAuthenticated])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    setUser((prev) => ({ ...prev, language: lang }))
    setStoredLanguage(lang) // P1-5 — persiste le choix (survit au reload)
    if (typeof document !== "undefined") {
      document.documentElement.dir = dirForLanguage(lang)
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

  const addMealEntry = (entry: Omit<MealEntry, "id" | "createdAt">): string => {
    // Use crypto.randomUUID for collision safety (two simultaneous adds on same ms)
    const id = `meal-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`}`
    const newEntry: MealEntry = { ...entry, id, createdAt: new Date().toISOString() }
    setMealEntries((prev) => [...prev, newEntry])
    return id
  }

  const updateMealEntryId = (localId: string, backendId: string) => {
    setMealEntries((prev) => prev.map((m) => m.id === localId ? { ...m, id: backendId } : m))
  }

  // S15 — mise à jour optimiste de la quantité (recalcul kcal/macros = food/100g × amount, dérivé)
  const updateMealEntryAmount = (id: string, amount: number) => {
    setMealEntries((prev) => prev.map((m) => m.id === id ? { ...m, amount } : m))
  }

  const removeMealEntry = (id: string) => setMealEntries((prev) => prev.filter((m) => m.id !== id))

  const clearJournal = () => setMealEntries([])

  const addGlucoseReading = (reading: Omit<GlucoseReading, "id">) => {
    // Ajout optimiste local puis persistance serveur (sinon la mesure disparaît au reload).
    const tempId = `glucose-${Date.now()}`
    setGlucoseReadings((prev) => [...prev, { ...reading, id: tempId }])
    addGlucoseReadingApi(reading)
      .then((saved) => setGlucoseReadings((prev) => prev.map((r) => (r.id === tempId ? saved : r))))
      .catch((err) => console.error("[addGlucoseReading] sync serveur échouée:", err))
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
    addWeightEntryApi(entry).catch((err) => console.error("[addWeightEntry] sync serveur échouée:", err))
  }

  const clearWeight = () => setWeightHistory([])

  const addActivity = (entry: Omit<ActivityEntry, "id" | "createdAt">) => {
    const tempId = `act-${Date.now()}`
    setActivities((prev) => [...prev, { ...entry, id: tempId, createdAt: new Date().toISOString() }])
    addActivityApi(entry)
      .then((saved) => setActivities((prev) => prev.map((a) => (a.id === tempId ? saved : a))))
      .catch((err) => console.error("[addActivity] sync serveur échouée:", err))
  }

  const removeActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id))
    // Ne pas appeler l'API pour un id local non encore synchronisé
    if (!id.startsWith("act-")) {
      deleteActivityApi(id).catch((err) => console.error("[removeActivity] sync serveur échouée:", err))
    }
  }

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

  const removeScannedProductById = (id: number) =>
    setScannedProducts((prev) => prev.filter((p) => p.id !== id))

  const loadScannedProducts = useCallback(async () => {
    if (!getToken()) return
    try {
      const { products } = await getScannedProducts(50)
      setScannedProducts(products)
    } catch {
      // offline: keep existing state
    }
  }, [])

  const reloadData = useCallback(() => loadData(currentDate), [loadData, currentDate])

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        isAuthLoading,
        login,
        logout,
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
        mealEntries,
        addMealEntry,
        updateMealEntryId,
        updateMealEntryAmount,
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
        removeScannedProductById,
        loadScannedProducts,
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
        reloadData,
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
