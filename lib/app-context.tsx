"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from "react"
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
  getJournalRange,
  getProfile,
  getGlucoseReadings as fetchGlucoseReadings,
  getWeightHistory,
  getActivities,
  getScannedProducts,
  addGlucoseReadingApi,
  addWeightEntryApi,
  addActivityApi,
  deleteActivityApi,
  updateActivityApi,
  setSlowStartCallback,
  isDeadAuthError,
  isNetworkFailure,
} from "@/lib/api"
import { getToken, setToken, removeToken } from "@/lib/auth"
import { getStoredLanguage, setStoredLanguage, dirForLanguage } from "@/lib/language"
import { getStoredChartMode, setStoredChartMode, DEFAULT_ADVANCED_CHARTS } from "@/lib/chart-mode"

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

  // P2 — mode graphiques (Glycémie / Bilan) : simple (barres) ou avancé (courbes/radar)
  advancedCharts: boolean
  setAdvancedCharts: (value: boolean) => void

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
  updateActivity: (id: string, patch: { type?: string; duration_min?: number; distance_km?: number; intensite?: string }) => void
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
  /** P0-5 — nb d'entrées du jour avec kcal > 0 mais aucune macro (photo IA incomplète) */
  incompleteMacroCount: number
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
  const [advancedCharts, setAdvancedChartsState] = useState<boolean>(DEFAULT_ADVANCED_CHARTS)
  // "" initially — useEffect sets real date client-side (avoids SSR/client hydration #418)
  const [currentDate, setCurrentDate] = useState("")
  const [mealEntries, setMealEntries] = useState<MealEntry[]>([])
  const [glucoseReadings, setGlucoseReadings] = useState<GlucoseReading[]>([])
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([])
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [scannedProducts, setScannedProducts] = useState<ScannedProduct[]>([])
  const [glucoseTarget, setGlucoseTargetState] = useState<{ low: number; high: number }>(defaultUser.glucoseTarget)
  const [isDiabetic, setIsDiabetic] = useState(defaultUser.isDiabetic)
  const [activeTab, setActiveTab] = useState("home")
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [showFoodSearch, setShowFoodSearch] = useState(false)
  const [selectedMealType, setSelectedMealType] = useState<MealEntry["mealType"] | null>(null)
  const [waterIntake, setWaterIntake] = useState(defaultWaterIntake)
  // P0-4 — dates (YYYY-MM-DD) des 60 derniers jours ayant au moins une entrée journal
  const [journalDates, setJournalDates] = useState<string[]>([])
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

  // P2 — Restaure le mode graphiques persisté au montage (sinon reste "simple" par défaut).
  useEffect(() => {
    const stored = getStoredChartMode()
    if (stored !== null) setAdvancedChartsState(stored)
  }, [])

  const login = useCallback((token: string, serverUser: { id: string; email: string; name: string }) => {
    setToken(token)
    setIsAuthenticated(true)
    setUser((prev) => ({ ...prev, id: serverUser.id, name: serverUser.name, email: serverUser.email }))
    // Cold-start (BUG-1) : cache le prénom pour l'afficher instantanément au
    // prochain reload, sans attendre getProfile (qui peut mettre 60 s au réveil).
    if (typeof window !== "undefined" && serverUser.name?.trim()) {
      try { localStorage.setItem("nutrivita-profile-name", serverUser.name) } catch { /* quota */ }
    }
  }, [])

  const logout = useCallback(() => {
    removeToken()
    setIsAuthenticated(false)
    setMealEntries([])
    setGlucoseReadings([])
    setWeightHistory([])
    setActivities([])
    setScannedProducts([])
    setJournalDates([])
    setIsOnboarded(false)
    // RGPD : purge aussi le prénom mis en cache pour le cold-start.
    if (typeof window !== "undefined") {
      try { localStorage.removeItem("nutrivita-profile-name") } catch { /* ignore */ }
    }
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
        // P0-3 / DEF-1 — session morte (401, ou 403 « Token invalide ») → purge + retour
        // login. On NE bascule PAS en hors-ligne : un token définitivement invalide (rotation
        // JWT_SECRET) ne se répare jamais offline, l'utilisateur resterait bloqué.
        // logout() efface AUSSI tout l'état santé/PII résident (repas, glycémie, poids,
        // activités, produits scannés) — pas seulement le token — pour éviter qu'il subsiste
        // en mémoire après la mort de session (minimisation RGPD).
        if (isDeadAuthError(err)) {
          logout()
          setIsLoading(false)
          setServerWaking(false)
          setSlowStartCallback(null)
          return
        }
        // Retry/hors-ligne réservés aux vraies pannes réseau (timeout/abort = status 0,
        // indisponibilité infra = 502/503/504). Un 403 non-auth (CSRF, 403 métier) n'est
        // pas retryable mais ne purge pas la session : il tombera en hors-ligne sans déconnexion.
        const isRetryable = isNetworkFailure(err)
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
  }, [logout])

  // Reload when date changes or auth state changes
  useEffect(() => {
    if (currentDate && isAuthenticated) {
      loadData(currentDate)
    }
  }, [currentDate, loadData, isAuthenticated])

  // P0-3 / P0-4 — au login OU au reload avec token existant : hydrate le profil
  // (prénom réel, objectif kcal serveur) et l'historique 60 j pour le streak.
  // Best-effort : en cas d'échec réseau on garde les valeurs par défaut, sans bloquer.
  useEffect(() => {
    if (!isAuthenticated) return
    // Cold-start (BUG-1) : hydrate le prénom depuis le cache AVANT que getProfile
    // ne réponde (jusqu'à 60 s au réveil Render) → supprime le flash « Utilisateur ».
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("nutrivita-profile-name")
      if (cached?.trim()) setUser((prev) => (prev.name === cached ? prev : { ...prev, name: cached }))
    }
    getProfile()
      .then((p) => {
        if (typeof window !== "undefined" && p.user?.name?.trim()) {
          try { localStorage.setItem("nutrivita-profile-name", p.user.name) } catch { /* quota */ }
        }
        setUser((prev) => ({
          ...prev,
          name: p.user?.name?.trim() ? p.user.name : prev.name,
          targetCalories:
            typeof p.target_kcal === "number" && p.target_kcal > 0 ? p.target_kcal : prev.targetCalories,
          age: p.age ?? prev.age,
          weight: p.weight ?? prev.weight,
          height: p.height ?? prev.height,
        }))
      })
      .catch((err) => console.error("[getProfile] hydratation profil échouée:", err))
    getJournalRange(60)
      .then((entries) => setJournalDates(Array.from(new Set(entries.map((e) => e.date)))))
      .catch((err) => console.error("[getJournalRange] historique streak échoué:", err))
  }, [isAuthenticated])

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

  // P2 — bascule mode graphiques (persistée, survit au reload).
  const setAdvancedCharts = (value: boolean) => {
    setAdvancedChartsState(value)
    setStoredChartMode(value)
  }

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

  // P0-5 — entrées suspectes : des kcal mais aucune macro (typiquement une estimation
  // photo IA incomplète). Exposé à l'UI pour signaler des totaux macros sous-estimés.
  const incompleteMacroCount = dailyMeals.filter(
    (m) => m.food.calories > 0 && !m.food.protein && !m.food.carbs && !m.food.fat
  ).length

  // P0-4 — streak : nb de jours consécutifs avec au moins une entrée journal.
  // Un jour courant encore vide ne casse pas la série (elle repart d'hier).
  const streak = (() => {
    const dates = new Set(journalDates)
    mealEntries.forEach((m) => dates.add(m.date))
    if (dates.size === 0) return 0
    const cursor = new Date()
    if (!dates.has(getLocalDateStr(cursor))) cursor.setDate(cursor.getDate() - 1)
    let count = 0
    while (dates.has(getLocalDateStr(cursor))) {
      count++
      cursor.setDate(cursor.getDate() - 1)
    }
    return count
  })()

  // U3 (ultrareview) : objet `user` augmenté du streak MÉMOÏSÉ → référence stable tant que
  // user/streak ne changent pas. Sans ça, `{...user, streak}` était recréé à chaque rendu et
  // cassait les useMemo des écrans (Bilan/Tendances/Score) qui dépendent de `user`.
  const userWithStreak = useMemo(() => ({ ...user, streak }), [user, streak])

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

  // S25 — modifier une activité : maj optimiste des champs connus, le serveur recalcule les kcal.
  const updateActivity = (id: string, patch: { type?: string; duration_min?: number; distance_km?: number; intensite?: string }) => {
    setActivities((prev) => prev.map((a) => a.id === id
      ? { ...a, type: patch.type ?? a.type, duration: patch.duration_min ?? a.duration }
      : a))
    if (!id.startsWith("act-")) {
      updateActivityApi(id, patch)
        .then((saved) => setActivities((prev) => prev.map((a) => (a.id === id ? saved : a))))
        .catch((err) => console.error("[updateActivity] sync serveur échouée:", err))
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

  // Cible glycémique — SOURCE UNIQUE (ultrareview). Certains écrans lisent le state dédié
  // `glucoseTarget`, d'autres `user.glucoseTarget` ; sans synchronisation, personnaliser la
  // cible (Réglages) laissait des TIR/répartitions/marqueurs divergents entre écrans (cœur diabète).
  const setGlucoseTarget = useCallback((target: { low: number; high: number }) => {
    setGlucoseTargetState(target)
    setUser((prev) => ({ ...prev, glucoseTarget: target }))
  }, [])

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        isAuthLoading,
        login,
        logout,
        user: userWithStreak, // P0-4 — streak dérivé (mémoïsé, U3)
        setUser,
        isOnboarded,
        setIsOnboarded,
        language,
        setLanguage,
        t,
        isRTL,
        advancedCharts,
        setAdvancedCharts,
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
        updateActivity,
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
        incompleteMacroCount,
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
