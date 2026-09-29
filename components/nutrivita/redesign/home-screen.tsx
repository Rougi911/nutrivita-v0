"use client"
import {
  Activity,
  Flame,
  ArrowUpRight,
  Camera,
  ChevronRight,
  Droplet,
  Leaf,
  Scale,
  Utensils,
  Plus,
  Loader2,
} from "lucide-react"
import { useApp } from "@/lib/app-context"
import { uiCopy } from "@/lib/redesign-copy"
import { formatEnergy, formatWeight } from "@/lib/units"
import { formatGlucose } from "@/lib/glucose-units"
import { MEALS } from "@/lib/types"
import { ViewModeSwitch, useViewMode } from "./view-preferences"
import { DailySummary } from "./daily-summary"
import { HomeScreenV2 } from "../home-screen-v2"
import { OfflineBanner } from "../offline-banner"
export function HomeScreen({
  onOpenSettings,
  onOpenGlucose,
}: {
  onOpenSettings: () => void
  onOpenGlucose: () => void
}) {
  const a = useApp()
  const c = uiCopy(a.language)
  const { mode } = useViewMode()
  const latest = [...a.glucoseReadings].sort((x, y) =>
    y.timestamp.localeCompare(x.timestamp)
  )[0]
  const weight = [...a.weightHistory].sort((x, y) =>
    y.date.localeCompare(x.date)
  )[0]
  const add = () => {
    a.setSelectedMealType(null)
    a.setAddSheetMode("menu")
    a.setShowAddSheet(true)
  }
  const date = a.currentDate
    ? new Date(`${a.currentDate}T12:00:00`).toLocaleDateString(
        a.language === "ar" ? "ar" : a.language === "en" ? "en-GB" : "fr-FR",
        { weekday: "long", day: "numeric", month: "long" }
      )
    : ""
  return (
    <div className="nv-page">
      <OfflineBanner />
      <header className="nv-page-header">
        <div>
          <p className="nv-eyebrow">
            <Leaf size={18} />
            NutraLance
          </p>
          <h1>
            {c.greeting}, {a.user.name}
          </h1>
          <p className="nv-caption capitalize">{date}</p>
          <p className="nv-caption mt-2 flex items-center gap-1.5"><Flame size={15} aria-hidden="true" />{a.user.streak} {a.t("streak")}</p>
        </div>
        <button
          className="nv-avatar"
          onClick={onOpenSettings}
          aria-label={c.profile}
        >
          {a.user.name.slice(0, 2).toUpperCase()}
        </button>
      </header>
      <ViewModeSwitch />
      {mode === "details" ? (
        <div className="nv-legacy-home">
          <HomeScreenV2
            onOpenSettings={onOpenSettings}
            onOpenGlucose={onOpenGlucose}
          />
        </div>
      ) : (
        <>
          <h2 className="nv-section-title mt-7">{c.day}</h2>
          {a.isLoading ? (
            <div className="nv-card flex gap-3 items-center" role="status">
              <Loader2 className="animate-spin" />
              {c.loading}
            </div>
          ) : (
            <DailySummary />
          )}
          <button className="nv-primary" onClick={add}>
            <Camera size={21} />
            {c.add}
          </button>
          <p className="nv-caption text-center -mt-1">{c.addHint}</p>
          <section>
            <div className="nv-section-heading">
              <h2>{c.meals}</h2>
              <button
                className="nv-text-button"
                onClick={() => a.setActiveTab("journal")}
                aria-label={c.all}
              >
                <ArrowUpRight size={21} />
              </button>
            </div>
            <div className="nv-card nv-meal-list">
              {MEALS.map((meal) => {
                const entries = a.dailyLog.meals.filter(
                  (e) => e.mealType === meal.type
                )
                const total = entries.reduce(
                  (v, e) => v + (e.food.calories * e.amount) / 100,
                  0
                )
                return (
                  <button
                    key={meal.type}
                    className="nv-meal-row"
                    onClick={() => {
                      if (entries.length) a.setActiveTab("journal")
                      else {
                        a.setSelectedMealType(meal.type)
                        a.setAddSheetMode("menu")
                        a.setShowAddSheet(true)
                      }
                    }}
                  >
                    <span className="nv-icon-tile">
                      <Utensils size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-semibold block">
                        {a.t(meal.type)}
                      </span>
                      <span className="nv-caption block truncate">
                        {entries.length
                          ? entries.map((e) => a.language === "ar" ? e.food.nameAr || e.food.name : a.language === "en" ? e.food.nameEn || e.food.name : e.food.name).join(", ")
                          : a.t("noFoodAdded")}
                      </span>
                    </span>
                    <span className="text-sm shrink-0">
                      {entries.length ? (
                        formatEnergy(total, a.user.units.energy)
                      ) : (
                        <Plus size={20} />
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
          <section>
            <h2 className="nv-section-title mb-3">{c.follow}</h2>
            <div className="nv-two-cols">
              <button className="nv-card text-start" onClick={onOpenGlucose}>
                <Droplet size={21} style={{ color: "var(--glucose)" }} />
                <p className="nv-caption mt-2">{a.t("glucose")}</p>
                <p className="font-semibold mt-1">
                  {latest
                    ? `${formatGlucose(latest.value, a.user.units.glucose)} ${a.user.units.glucose}`
                    : c.noReading}
                </p>
                {latest && (
                  <p className="nv-caption mt-1">
                    {c.lastReading} ·{" "}
                    {new Date(latest.timestamp).toLocaleDateString(a.language)}
                  </p>
                )}
                <ChevronRight size={16} className="mt-2" />
              </button>
              <button
                className="nv-card text-start"
                onClick={() => a.setActiveTab("stats")}
              >
                <Scale size={21} className="text-primary" />
                <p className="nv-caption mt-2">{a.t("weight")}</p>
                <p className="font-semibold mt-1">
                  {weight
                    ? formatWeight(weight.weight, a.user.units.weight)
                    : c.noReading}
                </p>
                {weight && <p className="nv-caption mt-1">{weight.date}</p>}
                <ChevronRight size={16} className="mt-2" />
              </button>
            </div>
            <button
              className="nv-inline-card mt-3"
              onClick={() => a.setActiveTab("journal")}
            >
              <Activity size={20} />
              <span className="flex-1 text-start">{a.t("activity")}</span>
              <span>
                {formatEnergy(a.todayBurnedCalories, a.user.units.energy)}
              </span>
              <ChevronRight size={16} />
            </button>
          </section>
        </>
      )}
    </div>
  )
}
