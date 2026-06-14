"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Mic,
  Camera,
  ScanBarcode,
  Star,
  Copy,
  Scale,
  Activity,
  Plus,
  X,
  Wheat,
  Dumbbell,
  Droplets,
  PersonStanding,
  Bike,
  Waves,
  Zap,
  Loader2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { interpretMedia } from "@/lib/api"
import type { ApiInterpretResponse } from "@/lib/api-types"
import { InterpretConfirm } from "./interpret-confirm"
import { CalorieRing } from "./calorie-ring"
import { MacroPillCard } from "./macro-pill-card"
import { MealSectionCard } from "./meal-section-card"
import { Button } from "@/components/ui/button"
import { MEALS, type ActivityEntry } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { OfflineBanner } from "@/components/nutrivita/offline-banner"

export function JournalScreen() {
  const {
    user,
    dailyLog,
    currentDate,
    setCurrentDate,
    t,
    isRTL,
    language,
    setShowFoodSearch,
    setSelectedMealType,
    activities,
    addActivity,
    removeActivity,
    todayBurnedCalories,
    isLoading,
  } = useApp()

  const [showVoiceInput, setShowVoiceInput] = useState(false)
  const [voiceInterpResult, setVoiceInterpResult] = useState<ApiInterpretResponse | null>(null)
  const [showActivityVoice, setShowActivityVoice] = useState(false)
  const [showActivityManual, setShowActivityManual] = useState(false)

  const todayActivities = activities.filter((a) => a.date === currentDate)

  // Date navigation
  const date = new Date(currentDate)
  const today = new Date()
  const isToday =
    date.toDateString() === today.toDateString()

  const formatDate = (d: Date) => {
    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
    const months = [
      "Jan",
      "Fév",
      "Mar",
      "Avr",
      "Mai",
      "Jun",
      "Jul",
      "Aoû",
      "Sep",
      "Oct",
      "Nov",
      "Déc",
    ]
    return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
  }

  const navigateDate = (direction: number) => {
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() + direction)
    setCurrentDate(newDate.toISOString().split("T")[0])
  }

  // Calculate macro targets
  const carbsTarget = Math.round(
    (user.targetCalories * (user.macros.carbs / 100)) / 4
  )
  const proteinTarget = Math.round(
    (user.targetCalories * (user.macros.protein / 100)) / 4
  )
  const fatTarget = Math.round(
    (user.targetCalories * (user.macros.fat / 100)) / 9
  )

  // Get yesterday's weight for comparison
  const yesterdayWeight = 75.5 // Sample
  const weightChange = dailyLog.weight
    ? dailyLog.weight - yesterdayWeight
    : null

  const handleAddFood = (mealType: typeof MEALS[number]["type"]) => {
    setSelectedMealType(mealType)
    setShowFoodSearch(true)
  }

  const quickActions = [
    { icon: Mic, label: t("voice"), onClick: () => setShowVoiceInput(true) },
    { icon: Camera, label: t("photo"), onClick: () => {} },
    { icon: ScanBarcode, label: t("scanner"), onClick: () => {} },
    { icon: Star, label: t("favorites"), onClick: () => {} },
    { icon: Copy, label: t("copyYesterday"), onClick: () => {} },
  ]

  return (
    <div className={cn("flex flex-col pb-32", isRTL && "rtl")}>
      <OfflineBanner />
      {isLoading && (
        <div className="px-4 space-y-3 py-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      )}
      {/* Header */}
      <div className="px-4 pt-6 pb-4 bg-background">
        {/* Date Navigator */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => navigateDate(-1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-foreground">
              {formatDate(date)}
            </span>
            {isToday && (
              <span className="h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => navigateDate(1)}
            disabled={isToday}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Greeting */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-foreground">
            {t("greeting")} {user.name}
          </h1>
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber/10 text-amber">
            <Flame className="h-4 w-4" />
            <span className="text-sm font-medium">
              {user.streak} {t("streak")}
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 space-y-6">
        {/* Calorie Ring */}
        <div className="flex flex-col items-center">
          <CalorieRing
            consumed={dailyLog.totalCalories}
            target={user.targetCalories}
            burned={todayBurnedCalories}
            size={200}
          />
        </div>

        {/* Macro Row */}
        <div className="grid grid-cols-3 gap-3">
          <MacroPillCard
            icon={Wheat}
            value={dailyLog.totalCarbs}
            target={carbsTarget}
            label={t("carbs")}
            color="var(--amber)"
          />
          <MacroPillCard
            icon={Dumbbell}
            value={dailyLog.totalProtein}
            target={proteinTarget}
            label={t("protein")}
            color="var(--glucose)"
          />
          <MacroPillCard
            icon={Droplets}
            value={dailyLog.totalFat}
            target={fatTarget}
            label={t("fat")}
            color="var(--lipids)"
          />
        </div>

        {/* Quick Actions — round icon buttons */}
        <div className="flex justify-between gap-2">
          {quickActions.map((action) => (
            <motion.button
              key={action.label}
              className="flex flex-col items-center gap-1.5 flex-1"
              onClick={action.onClick}
              whileTap={{ scale: 0.9 }}
            >
              <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center">
                <action.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground text-center leading-tight">
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Weight Card */}
        {dailyLog.weight && (
          <motion.div
            className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3">
              <Scale className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-foreground">{t("weight")}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-foreground">
                {dailyLog.weight.toFixed(1)} kg
              </span>
              {weightChange !== null && (
                <span
                  className={cn(
                    "text-sm font-medium",
                    weightChange < 0 ? "text-emerald" : "text-destructive"
                  )}
                >
                  {weightChange > 0 ? "+" : ""}
                  {weightChange.toFixed(1)} {t("vsYesterday")}
                </span>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Activity Card */}
        <motion.div
          className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Card header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-foreground">{t("activity")}</span>
            </div>
            <div className="flex items-center gap-2">
              {todayBurnedCalories > 0 && (
                <span className="text-sm font-semibold text-emerald">
                  {todayBurnedCalories} {t("caloriesBurned")}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowActivityVoice(true)}
              >
                <Mic className="h-4 w-4 text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowActivityManual(true)}
              >
                <Plus className="h-4 w-4 text-primary" />
              </Button>
            </div>
          </div>

          {/* Activity list */}
          {todayActivities.length > 0 ? (
            <div className="border-t border-border divide-y divide-border">
              {todayActivities.map((act) => (
                <div key={act.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {(() => { const Icon = activityIcon(act.type); return <Icon className="h-4 w-4 text-primary" /> })()}
                    <span className="text-sm font-medium text-foreground">
                      {activityLabel(act.type)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {act.duration} min
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-emerald">
                      {act.caloriesBurned} kcal
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {act.source}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => removeActivity(act.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 pb-4 text-sm text-muted-foreground">
              {t("noActivity")}
            </div>
          )}
        </motion.div>

        {/* Meals Section */}
        <div className="space-y-4">
          {MEALS.map((meal, index) => {
            const mealEntries = dailyLog.meals.filter(
              (m) => m.mealType === meal.type
            )
            return (
              <motion.div
                key={meal.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <MealSectionCard
                  name={t(meal.type)}
                  entries={mealEntries}
                  onAddFood={() => handleAddFood(meal.type)}
                />
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* InterpretConfirm affiché quand le vocal a produit un résultat (food + activity + glucose) */}
      {voiceInterpResult && (
        <div className="fixed inset-0 z-50 bg-background">
          <InterpretConfirm
            result={voiceInterpResult}
            onBack={() => setVoiceInterpResult(null)}
            onDone={() => { setVoiceInterpResult(null); setShowVoiceInput(false) }}
          />
        </div>
      )}

      {showVoiceInput && !voiceInterpResult && (
        <VoiceInputModal
          onClose={() => setShowVoiceInput(false)}
          onInterpretResult={(r) => setVoiceInterpResult(r)}
          language={language}
        />
      )}
      {showActivityVoice && (
        <ActivityVoiceModal
          onClose={() => setShowActivityVoice(false)}
          onAdd={(entry) => {
            addActivity({ ...entry, date: currentDate })
            setShowActivityVoice(false)
          }}
          userWeight={user.weight}
        />
      )}
      {showActivityManual && (
        <ActivityManualModal
          onClose={() => setShowActivityManual(false)}
          onAdd={(entry) => {
            addActivity({ ...entry, date: currentDate })
            setShowActivityManual(false)
          }}
          userWeight={user.weight}
        />
      )}
    </div>
  )
}

// Pre-computed waveform heights — no Math.random() in render
const FOOD_WAVE_HEIGHTS = [36, 48, 28, 56, 32, 48, 24, 52, 40, 32, 44, 56, 28, 48, 36, 56, 32, 48, 24, 52]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACTIVITY_META: Record<string, { icon: LucideIcon; label: string }> = {
  course:   { icon: Activity,        label: "Course" },
  velo:     { icon: Bike,            label: "Vélo" },
  marche:   { icon: PersonStanding,  label: "Marche" },
  natation: { icon: Waves,           label: "Natation" },
  muscu:    { icon: Dumbbell,        label: "Muscu" },
  autre:    { icon: Zap,             label: "Autre" },
}

const MET: Record<string, number> = {
  course: 9.0,
  velo: 7.0,
  marche: 3.5,
  natation: 6.0,
  muscu: 5.0,
  autre: 3.5,
}

function activityIcon(type: string): LucideIcon {
  return ACTIVITY_META[type]?.icon ?? Zap
}

function activityLabel(type: string) {
  return ACTIVITY_META[type]?.label ?? type
}

function calcCalories(type: string, durationMin: number, weightKg: number) {
  return Math.round((MET[type] ?? 3.5) * weightKg * (durationMin / 60))
}

function parseActivityVoice(text: string): { type: string; duration: number } {
  const lower = text.toLowerCase()
  let type = "marche"
  if (/course|courir|couru|running|jogging|run/.test(lower)) type = "course"
  else if (/vélo|velo|cycl|bike|cycling/.test(lower)) type = "velo"
  else if (/natation|nager|nagé|swim/.test(lower)) type = "natation"
  else if (/muscu|musculation|gym|fitness|haltère|weight/.test(lower)) type = "muscu"
  else if (/marche|marcher|walk|promenade/.test(lower)) type = "marche"

  let duration = 30
  const heureMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*h(?:eure)?s?/)
  if (heureMatch) duration = Math.round(parseFloat(heureMatch[1].replace(",", ".")) * 60)
  const minMatch = lower.match(/(\d+)\s*(?:minutes?|min)/)
  if (minMatch) duration = parseInt(minMatch[1])
  if (/une heure|an hour/.test(lower)) duration = 60
  if (/demi.heure|half.hour/.test(lower)) duration = 30

  return { type, duration }
}

// ─── Activity Voice Modal ─────────────────────────────────────────────────────

function ActivityVoiceModal({
  onClose,
  onAdd,
  userWeight,
}: {
  onClose: () => void
  onAdd: (entry: Omit<ActivityEntry, "id" | "createdAt" | "date">) => void
  userWeight: number
}) {
  const [state, setState] = useState<"listening" | "processing" | "confirm">("listening")
  const [detected, setDetected] = useState<{ type: string; duration: number; caloriesBurned: number } | null>(null)
  const { t } = useApp()

  const simulateProcessing = () => {
    setState("processing")
    setTimeout(() => {
      const parsed = parseActivityVoice("30 minutes de course")
      setDetected({
        ...parsed,
        caloriesBurned: calcCalories(parsed.type, parsed.duration, userWeight),
      })
      setState("confirm")
    }, 2000)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-6 safe-bottom"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25 }}
      >
        {state === "listening" && (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="flex items-center gap-1 h-16">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-emerald rounded-full"
                  animate={{ height: [8, 32 + (i % 5) * 8, 8] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                />
              ))}
            </div>
            <motion.div
              className="p-6 rounded-full bg-emerald/10"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Mic className="h-8 w-8 text-emerald" />
            </motion.div>
            <p className="text-lg text-muted-foreground">{t("speakNow")}</p>
            <p className="text-sm text-foreground">{t("speakActivity")}</p>
            <Button variant="outline" onClick={simulateProcessing} className="mt-4">
              {t("simulate")}
            </Button>
          </div>
        )}

        {state === "processing" && (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="h-16 w-16 rounded-full border-4 border-emerald border-t-transparent animate-spin" />
            <p className="text-lg text-muted-foreground">{t("analyzing")}</p>
          </div>
        )}

        {state === "confirm" && detected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald" />
              <h3 className="text-lg font-semibold">{t("todayActivity")}</h3>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => { const Icon = activityIcon(detected.type); return <Icon className="h-6 w-6 text-primary" /> })()}
                <div>
                  <p className="font-semibold">{activityLabel(detected.type)}</p>
                  <p className="text-sm text-muted-foreground">{detected.duration} min</p>
                </div>
              </div>
              <span className="text-lg font-bold text-emerald">
                {detected.caloriesBurned} kcal
              </span>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                {t("cancel")}
              </Button>
              <Button
                className="flex-1 bg-emerald text-white hover:bg-emerald/90"
                onClick={() =>
                  onAdd({ type: detected.type, duration: detected.duration, caloriesBurned: detected.caloriesBurned, source: "voice" })
                }
              >
                {t("add")}
              </Button>
            </div>
          </div>
        )}

        <Button variant="ghost" className="absolute top-4 right-4" onClick={onClose}>
          {t("cancel")}
        </Button>
      </motion.div>
    </motion.div>
  )
}

// ─── Activity Manual Modal ────────────────────────────────────────────────────

const ACTIVITY_TYPES: Array<{ key: string; label: string; icon: LucideIcon }> = [
  { key: "course",   label: "Course",   icon: Activity },
  { key: "velo",     label: "Vélo",     icon: Bike },
  { key: "marche",   label: "Marche",   icon: PersonStanding },
  { key: "muscu",    label: "Muscu",    icon: Dumbbell },
  { key: "natation", label: "Natation", icon: Waves },
  { key: "autre",    label: "Autre",    icon: Zap },
]

function ActivityManualModal({
  onClose,
  onAdd,
  userWeight,
}: {
  onClose: () => void
  onAdd: (entry: Omit<ActivityEntry, "id" | "createdAt" | "date">) => void
  userWeight: number
}) {
  const [selectedType, setSelectedType] = useState("course")
  const [durationStr, setDurationStr] = useState("30")
  const [caloriesStr, setCaloriesStr] = useState(
    String(calcCalories("course", 30, userWeight))
  )
  const { t } = useApp()

  const handleTypeChange = (type: string) => {
    setSelectedType(type)
    const dur = parseInt(durationStr) || 30
    setCaloriesStr(String(calcCalories(type, dur, userWeight)))
  }

  const handleDurationChange = (val: string) => {
    setDurationStr(val)
    const dur = parseInt(val) || 0
    if (dur > 0) setCaloriesStr(String(calcCalories(selectedType, dur, userWeight)))
  }

  const handleSubmit = () => {
    const dur = parseInt(durationStr) || 30
    const cal = parseInt(caloriesStr) || calcCalories(selectedType, dur, userWeight)
    onAdd({ type: selectedType, duration: dur, caloriesBurned: cal, source: "manual" })
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-6 safe-bottom"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25 }}
      >
        <h3 className="text-lg font-semibold mb-4">{t("addActivity")}</h3>

        {/* Activity type chips */}
        <p className="text-sm text-muted-foreground mb-2">{t("activityType")}</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {ACTIVITY_TYPES.map((a) => (
            <button
              key={a.key}
              onClick={() => handleTypeChange(a.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                selectedType === a.key
                  ? "bg-emerald text-white border-emerald"
                  : "bg-muted text-foreground border-border"
              )}
            >
              <a.icon className="h-3.5 w-3.5" />
              {a.label}
            </button>
          ))}
        </div>

        {/* Duration */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{t("duration")} (min)</p>
            <input
              type="number"
              inputMode="numeric"
              value={durationStr}
              onChange={(e) => handleDurationChange(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-foreground text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-emerald"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{t("caloriesBurned")}</p>
            <input
              type="number"
              inputMode="numeric"
              value={caloriesStr}
              onChange={(e) => setCaloriesStr(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-emerald text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-emerald"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            className="flex-1 bg-emerald text-white hover:bg-emerald/90"
            onClick={handleSubmit}
          >
            {t("add")}
          </Button>
        </div>

        <Button variant="ghost" className="absolute top-4 right-4" onClick={onClose}>
          {t("cancel")}
        </Button>
      </motion.div>
    </motion.div>
  )
}

// ─── Food Voice Modal — appel réel au backend (remplace la simulation) ────────

function VoiceInputModal({
  onClose,
  onInterpretResult,
  language,
}: {
  onClose: () => void
  onInterpretResult: (r: ApiInterpretResponse) => void
  language: string
}) {
  const [state, setState] = useState<"listening" | "processing" | "error">("listening")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const { t } = useApp()

  useEffect(() => {
    type AnySpeechRecognition = {
      lang: string
      interimResults: boolean
      maxAlternatives: number
      onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null
      onerror: (() => void) | null
      start: () => void
      stop: () => void
    }
    type SpeechRecognitionCtor = new () => AnySpeechRecognition

    const SRC =
      typeof window !== "undefined"
        ? ((window as unknown as Record<string, unknown>)["SpeechRecognition"] ??
            (window as unknown as Record<string, unknown>)["webkitSpeechRecognition"]) as
          | SpeechRecognitionCtor
          | undefined
        : undefined

    if (!SRC) {
      setErrorMsg(t("voiceSpeechNotSupported"))
      setState("error")
      return
    }

    const recognition = new SRC()
    recognition.lang = language === "ar" ? "ar-DZ" : language === "en" ? "en-US" : "fr-FR"
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript
      setState("processing")
      try {
        const result = await interpretMedia("text", transcript, language)
        onInterpretResult(result)
      } catch (err) {
        console.error("[VoiceInputModal] /api/interpret failed:", err)
        setErrorMsg(t("errorLoading"))
        setState("error")
      }
    }

    recognition.onerror = () => {
      setErrorMsg(t("errorLoading"))
      setState("error")
    }

    recognition.start()
    return () => { try { recognition.stop() } catch { /* ignore */ } }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
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
        transition={{ type: "spring", damping: 25 }}
      >
        {state === "listening" && (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="flex items-center gap-1 h-16">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-primary rounded-full"
                  animate={{ height: [8, FOOD_WAVE_HEIGHTS[i % FOOD_WAVE_HEIGHTS.length], 8] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                />
              ))}
            </div>
            <motion.div
              className="p-6 rounded-full bg-[var(--badge-positive-bg)]"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Mic className="h-8 w-8" style={{ color: "var(--primary)" }} />
            </motion.div>
            <p className="text-lg text-muted-foreground">{t("speakNow")}</p>
            <p className="text-sm text-foreground text-center">{t("speakActivity")}</p>
          </div>
        )}

        {state === "processing" && (
          <div className="flex flex-col items-center gap-6 py-8">
            <Loader2 className="h-10 w-10 animate-spin" style={{ color: "var(--primary)" }} />
            <p className="text-lg text-muted-foreground">{t("analyzing")}</p>
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col items-center gap-6 py-8">
            <p className="text-[14px] text-center" style={{ color: "var(--risk)" }}>
              {errorMsg ?? t("errorLoading")}
            </p>
            <Button variant="outline" onClick={onClose}>{t("cancel")}</Button>
          </div>
        )}

        <Button variant="ghost" className="absolute top-4 right-4" onClick={onClose}>
          {t("cancel")}
        </Button>
      </motion.div>
    </motion.div>
  )
}
