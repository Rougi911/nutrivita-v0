"use client"

import { useState } from "react"
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
} from "lucide-react"
import { useApp } from "@/lib/app-context"
import { CalorieRing } from "./calorie-ring"
import { MacroPillCard } from "./macro-pill-card"
import { MealSectionCard } from "./meal-section-card"
import { Button } from "@/components/ui/button"
import { MEALS, type ActivityEntry } from "@/lib/types"
import { cn } from "@/lib/utils"

export function JournalScreen() {
  const {
    user,
    dailyLog,
    currentDate,
    setCurrentDate,
    t,
    isRTL,
    setShowFoodSearch,
    setSelectedMealType,
    activities,
    addActivity,
    removeActivity,
    todayBurnedCalories,
  } = useApp()

  const [showVoiceInput, setShowVoiceInput] = useState(false)
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
            {t("greeting")} {user.name} 👋
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
            icon="🍚"
            value={dailyLog.totalCarbs}
            target={carbsTarget}
            label={t("carbs")}
          />
          <MacroPillCard
            icon="🥩"
            value={dailyLog.totalProtein}
            target={proteinTarget}
            label={t("protein")}
          />
          <MacroPillCard
            icon="🥑"
            value={dailyLog.totalFat}
            target={fatTarget}
            label={t("fat")}
          />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {quickActions.map((action) => (
            <motion.button
              key={action.label}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm whitespace-nowrap touch-target"
              onClick={action.onClick}
              whileTap={{ scale: 0.95 }}
            >
              <action.icon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
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
                    <span className="text-base">{activityIcon(act.type)}</span>
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
                  icon={meal.icon}
                  name={meal.nameFr}
                  entries={mealEntries}
                  onAddFood={() => handleAddFood(meal.type)}
                  onVoiceInput={() => setShowVoiceInput(true)}
                />
              </motion.div>
            )
          })}
        </div>
      </div>

      {showVoiceInput && (
        <VoiceInputModal onClose={() => setShowVoiceInput(false)} />
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACTIVITY_META: Record<string, { icon: string; label: string }> = {
  course:   { icon: "🏃", label: "Course" },
  velo:     { icon: "🚴", label: "Vélo" },
  marche:   { icon: "🚶", label: "Marche" },
  natation: { icon: "🏊", label: "Natation" },
  muscu:    { icon: "🏋️", label: "Muscu" },
  autre:    { icon: "⚡", label: "Autre" },
}

const MET: Record<string, number> = {
  course: 9.0,
  velo: 7.0,
  marche: 3.5,
  natation: 6.0,
  muscu: 5.0,
  autre: 3.5,
}

function activityIcon(type: string) {
  return ACTIVITY_META[type]?.icon ?? "⚡"
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
              Simuler
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
                <span className="text-2xl">{activityIcon(detected.type)}</span>
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
          Fermer
        </Button>
      </motion.div>
    </motion.div>
  )
}

// ─── Activity Manual Modal ────────────────────────────────────────────────────

const ACTIVITY_TYPES = [
  { key: "course", label: "Course", icon: "🏃" },
  { key: "velo", label: "Vélo", icon: "🚴" },
  { key: "marche", label: "Marche", icon: "🚶" },
  { key: "muscu", label: "Muscu", icon: "🏋️" },
  { key: "natation", label: "Natation", icon: "🏊" },
  { key: "autre", label: "Autre", icon: "⚡" },
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
              <span>{a.icon}</span>
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
          Fermer
        </Button>
      </motion.div>
    </motion.div>
  )
}

// ─── Food Voice Modal ─────────────────────────────────────────────────────────

function VoiceInputModal({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<"listening" | "processing" | "confirm">(
    "listening"
  )
  const { t } = useApp()

  // Simulate voice processing
  const simulateProcessing = () => {
    setState("processing")
    setTimeout(() => setState("confirm"), 2000)
  }

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
            {/* Waveform visualization */}
            <div className="flex items-center gap-1 h-16">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-destructive rounded-full"
                  animate={{
                    height: [8, 32 + Math.random() * 32, 8],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.05,
                  }}
                />
              ))}
            </div>
            <motion.div
              className="p-6 rounded-full bg-destructive/10"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Mic className="h-8 w-8 text-destructive" />
            </motion.div>
            <p className="text-lg text-muted-foreground">{t("speakNow")}</p>
            <p className="text-sm text-foreground">
              "Riz blanc 150g et huile d'olive 15ml"
            </p>
            <Button
              variant="outline"
              onClick={simulateProcessing}
              className="mt-4"
            >
              Simuler
            </Button>
          </div>
        )}

        {state === "processing" && (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-lg text-muted-foreground">{t("analyzing")}</p>
          </div>
        )}

        {state === "confirm" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{t("detectedFoods")}</h3>
            </div>
            <div className="space-y-3">
              {[
                { name: "Riz blanc", amount: 150, calories: 207, source: "📚" },
                { name: "Huile d'olive", amount: 15, calories: 124, source: "🇫🇷" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.amount}g
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {item.calories} kcal
                    </span>
                    <span>{item.source}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="font-semibold">{t("total")}</span>
              <span className="font-semibold">331 kcal</span>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                {t("cancel")}
              </Button>
              <Button
                className="flex-1 gradient-hero text-white"
                onClick={onClose}
              >
                {t("add")}
              </Button>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          className="absolute top-4 right-4"
          onClick={onClose}
        >
          Fermer
        </Button>
      </motion.div>
    </motion.div>
  )
}
