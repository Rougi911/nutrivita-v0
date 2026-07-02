"use client"

import { useRef } from "react"
import { Settings, Droplets, Zap, ChevronRight, Activity, Calendar } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { CalorieRing } from "./calorie-ring"
import { MealTabsCard } from "./meal-tabs-card"
import { formatGlucose } from "@/lib/glucose-units"
import { Skeleton } from "@/components/ui/skeleton"
import { OfflineBanner } from "@/components/nutrivita/offline-banner"

interface HomeScreenProps {
  onOpenSettings: () => void
  onOpenGlucose: () => void
}

function MacroBar({
  label,
  consumed,
  target,
  color,
}: {
  label: string
  consumed: number
  target: number
  color: string
}) {
  const pct = Math.min(100, target > 0 ? (consumed / target) * 100 : 0)
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-muted-foreground font-medium truncate">{label}</span>
        <span className="text-[10px] text-foreground font-semibold ml-1 shrink-0 whitespace-nowrap">
          {consumed}g / {target}g
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function WaterTracker({
  glasses,
  target = 8,
  onToggle,
}: {
  glasses: number
  target?: number
  onToggle: (idx: number) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: target }).map((_, i) => (
        <button
          key={i}
          onClick={() => onToggle(i)}
          className="transition-transform active:scale-90"
          aria-label={`Verre ${i + 1}`}
        >
          <Droplets
            className="h-5 w-5"
            style={{ color: i < glasses ? "var(--primary)" : "var(--muted-foreground)", opacity: i < glasses ? 1 : 0.35 }}
          />
        </button>
      ))}
    </div>
  )
}

export function HomeScreen({ onOpenSettings, onOpenGlucose }: HomeScreenProps) {
  const {
    user,
    dailyLog,
    glucoseReadings,
    activities,
    currentDate,
    setCurrentDate,
    todayBurnedCalories,
    t,
    waterIntake,
    setWaterIntake,
    incompleteMacroCount,
    isLoading,
  } = useApp()

  // Latest glucose reading
  const latestGlucose = [...glucoseReadings]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

  // Today's activities
  const todayActivities = activities.filter((a) => a.date === currentDate)

  // Macro targets from user macros %
  const carbsTarget   = Math.round((user.targetCalories * (user.macros.carbs   / 100)) / 4)
  const proteinTarget = Math.round((user.targetCalories * (user.macros.protein / 100)) / 4)
  const fatTarget     = Math.round((user.targetCalories * (user.macros.fat     / 100)) / 9)

  const handleWaterToggle = (idx: number) => {
    if (idx < waterIntake) {
      setWaterIntake(idx)
    } else {
      setWaterIntake(idx + 1)
    }
  }

  // G6 — affiche la date SÉLECTIONNÉE (currentDate) ; modifiable via le sélecteur natif jj/mm/aaaa.
  const dateInputRef = useRef<HTMLInputElement>(null)
  const todayStr = new Date().toISOString().slice(0, 10)
  const dateObj = currentDate ? new Date(currentDate + "T00:00:00") : new Date()
  const showYear = dateObj.getFullYear() !== new Date().getFullYear()
  const dateLabel = dateObj.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", ...(showYear ? { year: "numeric" as const } : {}) })
  const dateCapitalized = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)

  return (
    <div className="bg-background min-h-screen">
      <OfflineBanner />
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-start justify-between">
        <div>
          <button
            type="button"
            onClick={() => dateInputRef.current?.showPicker?.()}
            className="flex items-center gap-1.5 text-[13px] text-muted-foreground"
            aria-label={dateCapitalized}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>{dateCapitalized}</span>
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={currentDate || todayStr}
            max={todayStr}
            onChange={(e) => { if (e.target.value) setCurrentDate(e.target.value) }}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
          <h1 className="text-[22px] font-semibold text-foreground leading-tight mt-0.5">
            {t("greeting")}, {user.name}
          </h1>
          <p className="text-[13px] text-primary mt-0.5 font-medium">
            {user.streak} {t("streak")}
          </p>
        </div>
        <button
          onClick={onOpenSettings}
          className="mt-1 w-9 h-9 rounded-full bg-muted flex items-center justify-center"
          aria-label={t("settings")}
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[13px] font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </button>
      </div>

      <div className="px-4 space-y-4 pb-6">
        {/* Calorie ring + macros */}
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center gap-5">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <Skeleton className="w-40 h-40 rounded-full" />
                <div className="flex gap-4">
                  <Skeleton className="w-20 h-4" />
                  <Skeleton className="w-20 h-4" />
                  <Skeleton className="w-20 h-4" />
                </div>
              </div>
            ) : (
              <CalorieRing
                consumed={dailyLog.totalCalories}
                target={user.targetCalories}
                burned={todayBurnedCalories}
                size={130}
              />
            )}
            <div className="flex-1 space-y-3 min-w-0">
              <MacroBar
                label={t("protein")}
                consumed={dailyLog.totalProtein}
                target={proteinTarget}
                color="var(--glucose)"
              />
              <MacroBar
                label={t("carbs")}
                consumed={dailyLog.totalCarbs}
                target={carbsTarget}
                color="var(--amber)"
              />
              <MacroBar
                label={t("fat")}
                consumed={dailyLog.totalFat}
                target={fatTarget}
                color="var(--lipids)"
              />
            </div>
          </div>
          {/* P0-5 — signale les entrées avec kcal mais sans macros (photo IA incomplète) */}
          {incompleteMacroCount > 0 && (
            <p
              className="mt-3 text-[11.5px] text-center px-3 py-1.5 rounded-full"
              style={{ color: "var(--amber)", backgroundColor: "color-mix(in oklab, var(--amber) 12%, transparent)" }}
            >
              ⚠ {incompleteMacroCount} {t("incompleteMacros")}
            </p>
          )}
        </div>

        {/* Glucose card + Activity card */}
        <div className="grid grid-cols-2 gap-3">
          {/* Glucose card */}
          <button
            onClick={onOpenGlucose}
            className="rounded-2xl bg-card border border-border p-3 text-left active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-muted-foreground font-medium">{t("glucose")}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            {latestGlucose ? (
              <>
                <p className="text-[22px] font-semibold text-foreground leading-none" style={{ color: "var(--glucose)" }}>
                  {formatGlucose(latestGlucose.value, user.units.glucose)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {user.units.glucose}
                </p>
              </>
            ) : (
              <p className="text-[13px] text-muted-foreground mt-1">{t("noGlucoseData")}</p>
            )}
          </button>

          {/* Activity card — static, pas d'écran dédié */}
          <div className="rounded-2xl bg-card border border-border p-3 cursor-default select-none">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-muted-foreground font-medium">{t("activity")}</span>
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-[22px] font-semibold text-foreground leading-none">
              {Math.min(todayBurnedCalories, 1000).toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">kcal brûlées</p>
            {todayActivities.length > 0 && (
              <p className="text-[11px] text-primary mt-1 font-medium">
                {todayActivities[0].type}
              </p>
            )}
          </div>
        </div>

        {/* Today's meals — répartition en onglets (S14) */}
        <div>
          <p className="text-[13px] font-semibold text-foreground mb-2">{t("todayMeals")}</p>
          <MealTabsCard />
        </div>

        {/* Hydration */}
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[14px] font-semibold text-foreground">{t("hydration")}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {waterIntake} / 8 {t("glasses")}
              </p>
            </div>
            <Droplets
              className="h-5 w-5"
              style={{ color: "var(--primary)" }}
            />
          </div>
          <WaterTracker glasses={waterIntake} onToggle={handleWaterToggle} />
        </div>
      </div>
    </div>
  )
}
