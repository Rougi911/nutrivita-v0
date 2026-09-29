"use client"
import { useApp } from "@/lib/app-context"
import { uiCopy } from "@/lib/redesign-copy"
import { StatsScreen } from "./stats-screen"
import { TrendsScreen } from "./trends-screen"
import { HealthScoreScreen } from "./health-score-screen"
import { GrocerySummaryCard } from "./grocery-summary-card"
import {
  IndicatorSection,
  ViewModeSwitch,
  useViewMode,
} from "./redesign/view-preferences"
import { formatEnergy, formatWeight } from "@/lib/units"
import { ChevronRight, UserRound } from "lucide-react"
export function StatsTab({
  onOpenSettings,
  onOpenGroceries,
}: {
  onOpenSettings: () => void
  onOpenGroceries: () => void
}) {
  const { language, t, dailyLog, user, weightHistory, currentDate } = useApp()
  const c = uiCopy(language)
  const { mode } = useViewMode()
  const latestWeight = [...weightHistory].sort((a, b) =>
    b.date.localeCompare(a.date)
  )[0]
  return (
    <div className="nv-page">
      <header className="nv-page-header">
        <div>
          <p className="nv-eyebrow">NutraLance</p>
          <h1>{c.balance}</h1>
        </div>
        <button
          className="nv-avatar"
          onClick={onOpenSettings}
          aria-label={c.profile}
        >
          <UserRound size={22} />
        </button>
      </header>
      <ViewModeSwitch hint />
      {mode === "summary" && (
        <section className="nv-card">
          <p className="nv-caption mb-3">
            {c.day} · {currentDate}
          </p>
          <div className="nv-two-cols">
            <div>
              <p className="nv-caption">{c.recorded}</p>
              <p className="text-xl font-semibold mt-1">
                {formatEnergy(dailyLog.totalCalories, user.units.energy)}
              </p>
              <p className="nv-caption mt-1">
                {dailyLog.meals.length} {c.mealCount}
              </p>
            </div>
            <div>
              <p className="nv-caption">{t("weight")}</p>
              <p className="text-xl font-semibold mt-1">
                {latestWeight
                  ? formatWeight(latestWeight.weight, user.units.weight)
                  : "—"}
              </p>
              <p className="nv-caption mt-1">
                {latestWeight?.date ?? c.noReading}
              </p>
            </div>
          </div>
        </section>
      )}
      <h2 className="nv-section-title mt-7">{c.explore}</h2>
      <IndicatorSection title={c.nutrition} description={c.nutritionHint}>
        <StatsScreen onOpenSettings={onOpenSettings} />
      </IndicatorSection>
      <IndicatorSection title={c.patterns} description={c.patternsHint}>
        <TrendsScreen />
      </IndicatorSection>
      <IndicatorSection title={c.score} description={c.scoreHint}>
        <HealthScoreScreen />
      </IndicatorSection>
      <IndicatorSection title={c.groceries} description={c.groceriesHint}>
        <GrocerySummaryCard />
        <button className="nv-inline-card mt-3" onClick={onOpenGroceries}>
          <span className="flex-1 text-start">{t("openGroceries")}</span>
          <ChevronRight size={18} />
        </button>
      </IndicatorSection>
    </div>
  )
}
