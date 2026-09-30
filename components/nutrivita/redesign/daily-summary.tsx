"use client"
import { useApp } from "@/lib/app-context"
import { uiCopy } from "@/lib/redesign-copy"
import { formatEnergy } from "@/lib/units"
import { macroTargetsG } from "@/lib/p1-insights"
import { AlertCircle, Flame } from "lucide-react"
export function DailySummary({ compact = false }: { compact?: boolean }) {
  const {
    dailyLog,
    user,
    todayBurnedCalories,
    language,
    t,
    incompleteMacroCount,
  } = useApp()
  const c = uiCopy(language)
  const credit = Math.min(Math.max(todayBurnedCalories, 0), 1000)
  const target = user.targetCalories + credit
  const remaining = target - dailyLog.totalCalories
  const progress =
    target > 0
      ? Math.min(100, Math.max(0, (dailyLog.totalCalories / target) * 100))
      : 0
  const goals = macroTargetsG(user)
  return (
    <section className="nv-card nv-energy" aria-label={c.recorded}>
      <div className="flex items-center gap-2 nv-caption">
        <Flame size={17} className="text-primary" />
        {c.recorded}
      </div>
      <div className="nv-number mt-2">
        {formatEnergy(dailyLog.totalCalories, user.units.energy)}
      </div>
      <p className="nv-caption mt-1">
        {c.goal} : {formatEnergy(target, user.units.energy)}
      </p>
      <div
        className="nv-progress mt-4"
        role="progressbar"
        aria-label={c.recorded}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
      <p className="text-sm mt-2">
        {formatEnergy(Math.abs(remaining), user.units.energy)}{" "}
        {remaining >= 0 ? c.remaining : c.above}
      </p>
      {credit > 0 && (
        <p className="nv-caption mt-1">
          {c.credit} : {formatEnergy(credit, user.units.energy)}
        </p>
      )}
      {!compact && (
        <div className="nv-macros">
          {(
            [
              [
                t("protein"),
                dailyLog.totalProtein,
                goals.protein,
                "var(--glucose)",
              ],
              [t("carbs"), dailyLog.totalCarbs, goals.carbs, "var(--amber)"],
              [t("fat"), dailyLog.totalFat, goals.fat, "var(--lipids)"],
            ] as const
          ).map(([label, value, goal, color]) => (
            <div key={label}>
              <div className="nv-caption">{label}</div>
              <p className="font-semibold mt-1">
                {Math.round(value)}{" "}
                <span className="nv-caption">/ {goal} g</span>
              </p>
              <div className="nv-progress mt-2">
                <span
                  style={{
                    width: `${Math.min(100, goal > 0 ? (value / goal) * 100 : 0)}%`,
                    background: color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {incompleteMacroCount > 0 && (
        <p className="nv-caption mt-3 flex gap-2">
          <AlertCircle size={16} className="shrink-0" />
          {c.missingMacros}
        </p>
      )}
    </section>
  )
}
