"use client"

import { useState, useEffect, useMemo } from "react"
import { AlertTriangle, FileText, TrendingDown, TrendingUp } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
  Tooltip,
  ScatterChart,
  Scatter,
} from "recharts"
import { useApp } from "@/lib/app-context"
import { getDeficiencies } from "@/lib/api"
import type { ApiDeficiency } from "@/lib/api-types"
import { Skeleton } from "@/components/ui/skeleton"
import { computeGlucoseMetrics } from "@/lib/glucose-metrics"
import { deurenbergBodyFat, leanBodyMass, bmi } from "@/lib/body-composition"
import { formatGlucose } from "@/lib/glucose-units"
import {
  sampleWeekCalories,
  sampleMonthCalories,
  type DayCalories,
} from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Segment = "jour" | "semaine" | "mois" | "annee"

const SEGMENTS: { id: Segment; labelKey: string }[] = [
  { id: "jour",    labelKey: "today" },
  { id: "semaine", labelKey: "days7" },
  { id: "mois",    labelKey: "days30" },
  { id: "annee",   labelKey: "year" },
]


function getBarFill(calories: number, target: number): string {
  const ratio = calories / target
  if (ratio <= 1.0) return "var(--primary)"
  if (ratio <= 1.1) return "var(--amber)"
  return "var(--risk)"
}

export function StatsScreen() {
  const { t, dailyLog, mealEntries, user, weightHistory, glucoseReadings, isRTL } = useApp()
  const [segment, setSegment] = useState<Segment>("semaine")
  const [deficiencies, setDeficiencies] = useState<ApiDeficiency[]>([])
  const [loadingDef, setLoadingDef] = useState(false)

  useEffect(() => {
    setLoadingDef(true)
    getDeficiencies()
      .then((res) => setDeficiencies(res?.deficiencies ?? []))
      .catch((err) => {
        console.error("[StatsScreen] getDeficiencies failed:", err)
        setDeficiencies([])
      })
      .finally(() => setLoadingDef(false))
  }, [])

  // Body composition from latest weight entry
  const latest = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1] : null
  const first  = weightHistory.length > 0 ? weightHistory[0] : null
  const currentWeight = latest?.weight ?? user.weight
  const bmiVal  = bmi(currentWeight, user.height)
  const bfPct   = deurenbergBodyFat(currentWeight, user.height, user.age, user.sex)
  const lbm     = leanBodyMass(currentWeight, bfPct)
  const weightDelta = first && latest ? (latest.weight - first.weight) : 0
  const fatDeltaKg  = first && latest
    ? ((latest.bodyFat ?? bfPct) * latest.weight / 100) - ((first.bodyFat ?? bfPct) * first.weight / 100)
    : 0

  // Calorie data computed from real journal entries — J-N to J-0
  const calData: DayCalories[] = useMemo(() => {
    const days = segment === "semaine" ? 7 : segment === "mois" ? 30 : segment === "annee" ? 365 : 1
    const result: DayCalories[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      const dayEntries = mealEntries.filter((m) => m.date === dateStr)
      const calories = Math.round(dayEntries.reduce((s, m) => s + (m.food.calories * m.amount) / 100, 0))
      const protein  = Math.round(dayEntries.reduce((s, m) => s + (m.food.protein  * m.amount) / 100, 0))
      const carbs    = Math.round(dayEntries.reduce((s, m) => s + (m.food.carbs    * m.amount) / 100, 0))
      const fat      = Math.round(dayEntries.reduce((s, m) => s + (m.food.fat      * m.amount) / 100, 0))
      const label = days <= 7
        ? ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][d.getDay()]
        : String(d.getDate())
      result.push({ date: dateStr, label, calories, protein, carbs, fat })
    }
    // Fall back to mock data only if ALL real entries are zero (no backend data loaded yet)
    const hasRealData = result.some((r) => r.calories > 0)
    if (!hasRealData) {
      return segment === "semaine" ? sampleWeekCalories : sampleMonthCalories
    }
    return result
  }, [mealEntries, segment])

  const avgCalories = calData.length
    ? Math.round(calData.reduce((s, d) => s + d.calories, 0) / calData.length)
    : 0

  // Macro donut (today)
  const macroDonut = [
    { name: t("protein"), value: dailyLog.totalProtein, color: "var(--glucose)" },
    { name: t("carbs"),   value: dailyLog.totalCarbs,   color: "var(--amber)"   },
    { name: t("fat"),     value: dailyLog.totalFat,     color: "var(--lipids)"  },
  ]

  // Glucose summary for stats (7-day readings)
  const weekGlucose = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    return glucoseReadings
      .filter((r) => new Date(r.timestamp).getTime() > cutoff)
      .map((r) => r.value)
  }, [glucoseReadings])

  const glucoseMetrics = useMemo(
    () => computeGlucoseMetrics(weekGlucose, 70, 180),
    [weekGlucose]
  )

  // Mini glucose scatter (7 pts sampled evenly for the stats card)
  const glucoseMiniData = useMemo(() => {
    if (weekGlucose.length === 0) return []
    const step = Math.max(1, Math.floor(weekGlucose.length / 7))
    return weekGlucose.filter((_, i) => i % step === 0).slice(0, 7).map((v, i) => ({ x: i, y: v }))
  }, [weekGlucose])

  return (
    <div className={cn("flex flex-col min-h-screen bg-background pb-8", isRTL && "rtl")}>
      {/* Flat header */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-foreground">{t("stats")}</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Analysez vos progrès</p>
        </div>
        <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center" aria-label={t("export")}>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Segment selector — 4 tabs, NO evolution tab */}
      <div className="flex gap-1.5 px-4 mb-4">
        {SEGMENTS.map((seg) => (
          <button
            key={seg.id}
            onClick={() => setSegment(seg.id)}
            className={cn(
              "flex-1 py-2 rounded-xl text-[13px] font-medium transition-colors",
              segment === seg.id
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground"
            )}
          >
            {t(seg.labelKey as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-4">

        {/* ─── 1. Weight line chart ──────────────────────────────────────────── */}
        {weightHistory.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-semibold text-foreground">{t("weightEvolution")}</h3>
              <div className="flex items-center gap-1.5">
                {weightDelta < 0 ? (
                  <TrendingDown className="h-4 w-4" style={{ color: "var(--primary)" }} />
                ) : (
                  <TrendingUp className="h-4 w-4" style={{ color: "var(--amber)" }} />
                )}
                <span
                  className="text-[13px] font-semibold"
                  style={{ color: weightDelta < 0 ? "var(--primary)" : "var(--amber)" }}
                >
                  {weightDelta > 0 ? "+" : ""}{weightDelta.toFixed(1)} kg
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={weightHistory.slice(segment === "semaine" ? -7 : -30)}>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => new Date(v).getDate().toString()}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={["dataMin - 0.5", "dataMax + 0.5"]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  width={28}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", fontSize: "12px" }}
                  formatter={(v: number) => [`${v.toFixed(1)} kg`, "Poids"]}
                  labelFormatter={(v) => new Date(v).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ─── 2. Body composition ──────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="text-[14px] font-semibold text-foreground mb-3">{t("bodyFat")}</h3>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <p className="text-[22px] font-semibold text-foreground">{bfPct.toFixed(1)}</p>
              <p className="text-[11px] text-muted-foreground">% graisse</p>
            </div>
            <div className="text-center">
              <p className="text-[22px] font-semibold text-foreground">{lbm.toFixed(1)}</p>
              <p className="text-[11px] text-muted-foreground">kg maigre</p>
            </div>
            <div className="text-center">
              <p className="text-[22px] font-semibold text-foreground">{bmiVal.toFixed(1)}</p>
              <p className="text-[11px] text-muted-foreground">IMC</p>
            </div>
          </div>
          {/* Forbes disclaimer REG-04 */}
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-muted/40">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--amber)" }} />
            <p className="text-[11px] text-muted-foreground leading-snug">{t("forbesEstimate")}</p>
          </div>
        </div>

        {/* ─── 3. Calorie bar chart + macro donut ──────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold text-foreground">{t("caloriesPerDay")}</h3>
            <span className="text-[13px] text-muted-foreground">moy. {avgCalories} kcal</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={calData} barCategoryGap="30%">
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              />
              <YAxis hide />
              <ReferenceLine
                y={user.targetCalories}
                stroke="var(--primary)"
                strokeDasharray="3 3"
                strokeOpacity={0.7}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", fontSize: "12px" }}
                formatter={(v: number) => [`${Math.round(v)} kcal`, "Calories"]}
              />
              <Bar dataKey="calories" radius={[6, 6, 0, 0]}>
                {calData.map((entry, idx) => (
                  <Cell key={idx} fill={getBarFill(entry.calories, user.targetCalories)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Macro donut (shown in "jour" segment or always) */}
        {segment === "jour" && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="text-[14px] font-semibold text-foreground mb-3">{t("macroBreakdown")}</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie
                    data={macroDonut}
                    innerRadius={38}
                    outerRadius={55}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {macroDonut.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {macroDonut.map((m) => (
                  <div key={m.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                    <span className="text-[12px] text-foreground flex-1">{m.name}</span>
                    <span className="text-[12px] font-semibold text-foreground">{m.value}g</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── 4. Glycemia summary (with N<12 guard AL-05) ─────────────────── */}
        {user.isDiabetic && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-semibold text-foreground">{t("glucoseSummary")}</h3>
              {!glucoseMetrics.insufficientData && (
                <span
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{ backgroundColor: "var(--glucose-bg)", color: "var(--glucose)" }}
                >
                  TIR {glucoseMetrics.tir}% {t("inTarget")}
                </span>
              )}
            </div>

            {glucoseMetrics.insufficientData ? (
              <p className="text-[13px] text-muted-foreground py-2 text-center">
                {t("insufficientGlucoseData")} — {glucoseMetrics.count}/12 mesures min.
              </p>
            ) : (
              <>
                <div className="flex gap-3 mb-3">
                  <div className="flex-1 text-center">
                    <p className="text-[18px] font-semibold text-foreground">
                      {formatGlucose(glucoseMetrics.average, user.units.glucose)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{t("mean")}</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-[18px] font-semibold" style={{ color: "var(--glucose)" }}>
                      {glucoseMetrics.gmi.toFixed(1)}%
                    </p>
                    <p className="text-[11px] text-muted-foreground">{t("gmi")}</p>
                  </div>
                </div>

                {/* 7-point mini chart */}
                {glucoseMiniData.length > 0 && (
                  <ResponsiveContainer width="100%" height={60}>
                    <ScatterChart margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                      <XAxis type="number" dataKey="x" hide />
                      <YAxis type="number" dataKey="y" domain={[60, 220]} hide />
                      <ReferenceLine y={70}  stroke="var(--primary)" strokeDasharray="2 2" strokeOpacity={0.5} />
                      <ReferenceLine y={180} stroke="var(--primary)" strokeDasharray="2 2" strokeOpacity={0.5} />
                      <Scatter data={glucoseMiniData} fill="var(--glucose)" />
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── 5. Deficiencies (REG-04 disclaimer mandatory) ───────────────── */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="text-[14px] font-semibold text-foreground mb-3">{t("deficiencies")}</h3>
          {/* REG-04 — disclaimer obligatoire, non ignorable */}
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-muted/40 mb-3">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--amber)" }} />
            <p className="text-[11px] text-muted-foreground leading-snug">{t("deficiencyDisclaimer")}</p>
          </div>
          {loadingDef ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
            </div>
          ) : deficiencies.length > 0 ? (
            <div className="space-y-2">
              {deficiencies.map((d) => (
                <div key={d.nutrient} className="flex items-center justify-between py-1.5">
                  <span className="text-[13px] text-foreground">{d.nutrient}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={
                      d.status === "probable"
                        ? { backgroundColor: "var(--risk-bg)", color: "var(--risk)" }
                        : { backgroundColor: "var(--amber-bg)", color: "var(--amber)" }
                    }
                  >
                    {d.status === "probable" ? t("probable") : t("toMonitor")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground">{t("noDeficiencyData")}</p>
          )}
        </div>

        {/* Export button */}
        <Button variant="outline" className="w-full gap-2 rounded-xl">
          <FileText className="h-4 w-4" />
          {t("export")}
        </Button>
      </div>
    </div>
  )
}
