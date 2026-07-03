"use client"

// P1-1 — Accueil « Aujourd'hui » repensé (maquette 1).
// Transforme le tableau de bord passif en assistant : anneau « restantes »
// (cadrage positif), insight IA du jour, prochaine action contextuelle,
// duo glycémie/activité, repas du jour. Coexiste avec l'ancien HomeScreen.

import { useEffect, useMemo, useState } from "react"
import { Settings, ChevronRight } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { getJournalRange } from "@/lib/api"
import { formatGlucose } from "@/lib/glucose-units"
import { P1 } from "@/lib/p1-i18n"
import {
  macroTargetsG,
  totalsFor,
  buildDailyInsight,
  buildNextAction,
  type MealType,
} from "@/lib/p1-insights"
import type { MealEntry } from "@/lib/types"

interface Props {
  onOpenSettings: () => void
  onOpenGlucose: () => void
}

const MEAL_LABELS: Record<MealType, { fr: string; ar: string; en: string; emoji: string }> = {
  breakfast: { fr: "Petit-déjeuner", ar: "الفطور", en: "Breakfast", emoji: "☕" },
  lunch: { fr: "Déjeuner", ar: "الغداء", en: "Lunch", emoji: "🍽️" },
  snack: { fr: "Collation", ar: "وجبة خفيفة", en: "Snack", emoji: "🍎" },
  dinner: { fr: "Dîner", ar: "العشاء", en: "Dinner", emoji: "🌙" },
}

function RemainingRing({ consumed, target, size = 132 }: { consumed: number; target: number; size?: number }) {
  const remaining = Math.max(0, Math.round(target - consumed))
  const over = consumed > target
  const pct = target > 0 ? Math.min(1, consumed / target) : 0
  const r = size / 2 - 9
  const c = 2 * Math.PI * r
  const dash = pct * c
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={11} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={over ? "var(--risk)" : "var(--primary)"}
          strokeWidth={11}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <b className="text-[24px] font-extrabold leading-none text-foreground">
          {remaining.toLocaleString()}
        </b>
        <span className="text-[10.5px] text-muted-foreground mt-0.5">
          / {target.toLocaleString()}
        </span>
      </div>
    </div>
  )
}

function MacroBar({ label, consumed, target, color }: { label: string; consumed: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(100, (consumed / target) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11.5px] text-muted-foreground">{label}</span>
        <span className="text-[11.5px] font-semibold text-foreground">
          {Math.round(consumed)} / {target} g
        </span>
      </div>
      <div className="h-[7px] rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export function HomeScreenV2({ onOpenSettings, onOpenGlucose }: Props) {
  const {
    user,
    dailyLog,
    mealEntries,
    glucoseReadings,
    currentDate,
    todayBurnedCalories,
    incompleteMacroCount,
    language,
    isRTL,
    setActiveTab,
  } = useApp()
  const P = P1[language]

  const [history, setHistory] = useState<MealEntry[]>([])
  useEffect(() => {
    let alive = true
    getJournalRange(14)
      .then((rows) => { if (alive) setHistory(rows) })
      .catch(() => { /* premier jet : silencieux, l'écran reste utilisable sans historique */ })
    return () => { alive = false }
  }, [currentDate])

  const targets = macroTargetsG(user)
  const insight = useMemo(
    () => buildDailyInsight(history, glucoseReadings, user, language),
    [history, glucoseReadings, user, language],
  )
  const todayMeals = useMemo(() => mealEntries.filter((m) => m.date === currentDate), [mealEntries, currentDate])
  const nextAction = useMemo(() => buildNextAction(todayMeals, history), [todayMeals, history])

  const latestGlucose = [...glucoseReadings].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )[0]
  const glucoseInTarget =
    latestGlucose &&
    latestGlucose.value >= user.glucoseTarget.low &&
    latestGlucose.value <= user.glucoseTarget.high

  const mealTotals = useMemo(() => {
    const map = {} as Record<MealType, number>
    ;(["breakfast", "lunch", "snack", "dinner"] as MealType[]).forEach((slot) => {
      map[slot] = Math.round(totalsFor(todayMeals.filter((m) => m.mealType === slot)).kcal)
    })
    return map
  }, [todayMeals])

  const dateObj = currentDate ? new Date(currentDate + "T00:00:00") : new Date()
  const localeMap = { fr: "fr-FR", ar: "ar", en: "en-US" } as const
  const dateLabel = dateObj.toLocaleDateString(localeMap[language], { weekday: "long", day: "numeric", month: "long" })

  const insightText = insight?.text ?? P.noInsightYet

  return (
    <div className={`bg-background min-h-screen px-4 pt-4 pb-6 ${isRTL ? "rtl" : ""}`}>
      {/* Salutation + streak */}
      <div className="flex items-start justify-between py-2">
        <div>
          <div className="text-[12px] text-muted-foreground capitalize">{dateLabel}</div>
          <div className="text-[21px] font-extrabold text-foreground">
            {P.today === "Aujourd'hui" ? "Bonjour" : language === "ar" ? "مرحبًا" : "Hello"}, {user.name} 👋
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 text-[12px] font-bold rounded-full px-3 py-1.5"
            style={{ backgroundColor: "color-mix(in oklab, var(--amber) 16%, transparent)", color: "var(--amber)" }}
          >
            🔥 {user.streak}
          </span>
          <button onClick={onOpenSettings} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center" aria-label="settings">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Hero : anneau restantes + macros */}
      <div className="rounded-2xl bg-card border border-border p-4 mt-1">
        <div className="flex items-center gap-4">
          <RemainingRing consumed={dailyLog.totalCalories} target={user.targetCalories} />
          <div className="flex-1 space-y-2.5 min-w-0">
            <MacroBar label={language === "ar" ? "بروتين" : language === "en" ? "Protein" : "Protéines"} consumed={dailyLog.totalProtein} target={targets.protein} color="var(--glucose)" />
            <MacroBar label={language === "ar" ? "كربوهيدرات" : language === "en" ? "Carbs" : "Glucides"} consumed={dailyLog.totalCarbs} target={targets.carbs} color="var(--amber)" />
            <MacroBar label={language === "ar" ? "دهون" : language === "en" ? "Fat" : "Lipides"} consumed={dailyLog.totalFat} target={targets.fat} color="var(--lipids)" />
          </div>
        </div>
        {incompleteMacroCount > 0 && (
          <p className="mt-3 text-[11.5px] text-center px-3 py-1.5 rounded-full" style={{ color: "var(--amber)", backgroundColor: "color-mix(in oklab, var(--amber) 12%, transparent)" }}>
            ⚠ {incompleteMacroCount} {language === "ar" ? "عناصر بدون تفاصيل" : language === "en" ? "item(s) missing macro details" : "aliment(s) sans macros détaillées"}
          </p>
        )}
      </div>

      {/* Insight IA du jour */}
      <button
        onClick={() => insight?.cta === "glucose" && setActiveTab("glucose")}
        disabled={insight?.cta !== "glucose"}
        className="w-full text-left rounded-2xl p-4 mt-3 text-white"
        style={{ background: "linear-gradient(135deg, var(--glucose), #7A6FE0)" }}
      >
        <div className="text-[12px] font-bold" style={{ color: "rgba(255,255,255,.78)" }}>💡 {P.insightOfDay}</div>
        <p className="text-[13.5px] leading-snug mt-1.5">{insightText}</p>
        {insight?.cta === "glucose" && (
          <span className="inline-block mt-2.5 text-[12px] font-bold rounded-full px-3.5 py-1.5" style={{ backgroundColor: "rgba(255,255,255,.18)" }}>
            {P.seeCorrelation} →
          </span>
        )}
      </button>

      {/* Prochaine action */}
      <button
        onClick={() => setActiveTab("journal")}
        className="w-full flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-3 mt-3 text-left"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[17px]" style={{ backgroundColor: "color-mix(in oklab, var(--primary) 14%, transparent)" }}>
          {MEAL_LABELS[nextAction.mealType].emoji}
        </div>
        <div className="min-w-0">
          <b className="text-[13.5px] text-foreground block">
            {P.nextAction} : {MEAL_LABELS[nextAction.mealType][language]}
          </b>
          <span className="text-[11.5px] text-muted-foreground block truncate">
            {nextAction.yesterdayLabel
              ? `${P.sameTimeYesterday} : ${nextAction.yesterdayLabel} (${nextAction.yesterdayKcal} kcal)`
              : "—"}
          </span>
        </div>
        <span className="ml-auto text-primary font-extrabold text-lg">＋</span>
      </button>

      {/* Duo glycémie / activité */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <button onClick={onOpenGlucose} className="rounded-2xl bg-card border border-border p-3 text-left active:scale-[0.98] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted-foreground font-medium">{language === "ar" ? "سكر الدم" : language === "en" ? "Glucose" : "Glycémie"}</span>
            {latestGlucose && (
              <span
                className="text-[10.5px] font-bold rounded-full px-2 py-0.5"
                style={{
                  backgroundColor: `color-mix(in oklab, var(--${glucoseInTarget ? "primary" : "risk"}) 14%, transparent)`,
                  color: `var(--${glucoseInTarget ? "primary" : "risk"})`,
                }}
              >
                {glucoseInTarget ? P.inTarget : "!"}
              </span>
            )}
          </div>
          <div className="mt-2">
            {latestGlucose ? (
              <>
                <span className="text-[20px] font-extrabold" style={{ color: "var(--glucose)" }}>
                  {formatGlucose(latestGlucose.value, user.units.glucose)}
                </span>{" "}
                <span className="text-[11px] text-muted-foreground">{user.units.glucose}</span>
              </>
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

        <div className="rounded-2xl bg-card border border-border p-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted-foreground font-medium">{language === "ar" ? "النشاط" : language === "en" ? "Activity" : "Activité"}</span>
          </div>
          <div className="mt-2">
            <span className="text-[20px] font-extrabold text-foreground">{Math.min(todayBurnedCalories, 1000).toLocaleString()}</span>{" "}
            <span className="text-[11px] text-muted-foreground">{P.kcalBurned}</span>
          </div>
        </div>
      </div>

      {/* Repas du jour */}
      <div className="rounded-2xl bg-card border border-border p-4 mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">{P.mealsOfDay}</span>
          <span className="text-[11px] font-bold rounded-full px-2.5 py-1" style={{ backgroundColor: "color-mix(in oklab, var(--glucose) 14%, transparent)", color: "var(--glucose)" }}>
            {Math.round(dailyLog.totalCalories)} kcal
          </span>
        </div>
        {(["breakfast", "lunch", "snack", "dinner"] as MealType[]).map((slot) => (
          <div key={slot} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-[13px]">
            <span>{MEAL_LABELS[slot].emoji} {MEAL_LABELS[slot][language]}</span>
            {mealTotals[slot] > 0 ? (
              <span className="font-bold text-[12.5px] text-foreground">{mealTotals[slot]} kcal</span>
            ) : (
              <span className="text-[12.5px] text-muted-foreground">— {P.addMeal}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
