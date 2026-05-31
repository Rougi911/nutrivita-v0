"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { FileText, AlertTriangle, Droplets } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
  Tooltip,
} from "recharts"
import { useApp } from "@/lib/app-context"
import { GradientHeader } from "./gradient-header"
import { MetricCard } from "./metric-card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Period = "today" | "7days" | "30days" | "evolution"

export function StatsScreen() {
  const { t, dailyLog, user, weightHistory, isRTL } = useApp()
  const [period, setPeriod] = useState<Period>("7days")

  // Generate sample data for charts
  const weekData = useMemo(() => {
    const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
    return days.map((day, i) => ({
      day,
      calories: 1800 + Math.random() * 800,
      target: user.targetCalories,
    }))
  }, [user.targetCalories])

  const monthData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      calories: 1700 + Math.random() * 900,
      weight: 77.5 - i * 0.08 + Math.random() * 0.3,
    }))
  }, [])

  const macroData = [
    { name: "Glucides", value: dailyLog.totalCarbs, color: "#6366F1" },
    { name: "Protéines", value: dailyLog.totalProtein, color: "#10B981" },
    { name: "Lipides", value: dailyLog.totalFat, color: "#F59E0B" },
  ]

  const getBarColor = (calories: number) => {
    const ratio = calories / user.targetCalories
    if (ratio <= 1) return "#10B981"
    if (ratio <= 1.1) return "#F59E0B"
    return "#EF4444"
  }

  // Calculate week stats
  const avgCalories = Math.round(
    weekData.reduce((sum, d) => sum + d.calories, 0) / weekData.length
  )
  const bestDay = weekData.reduce((best, d) =>
    Math.abs(d.calories - user.targetCalories) <
    Math.abs(best.calories - user.targetCalories)
      ? d
      : best
  )
  const hardestDay = weekData.reduce((worst, d) =>
    d.calories > worst.calories ? d : worst
  )

  // Calculate body composition changes
  const latestWeight = weightHistory[weightHistory.length - 1]
  const firstWeight = weightHistory[0]
  const weightLost = firstWeight
    ? (firstWeight.weight - (latestWeight?.weight || firstWeight.weight)).toFixed(1)
    : "0"
  const fatLost = firstWeight
    ? (
        (firstWeight.bodyFat || 0) * firstWeight.weight / 100 -
        (latestWeight?.bodyFat || 0) * (latestWeight?.weight || 0) / 100
      ).toFixed(1)
    : "0"
  const muscleGained = firstWeight
    ? (
        (latestWeight?.muscleMass || 0) - (firstWeight.muscleMass || 0)
      ).toFixed(1)
    : "0"

  const periods: { id: Period; label: string }[] = [
    { id: "today", label: t("today") },
    { id: "7days", label: t("days7") },
    { id: "30days", label: t("days30") },
    { id: "evolution", label: t("evolution") },
  ]

  return (
    <div className={cn("flex flex-col pb-32 min-h-screen", isRTL && "rtl")}>
      <GradientHeader
        title={t("stats")}
        subtitle="Analysez vos progrès"
        variant="emerald"
      >
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
        >
          <FileText className="h-5 w-5" />
        </Button>
      </GradientHeader>

      {/* Period selector */}
      <div className="flex gap-2 p-4 -mt-4">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors",
              period === p.id
                ? "bg-secondary text-secondary-foreground"
                : "bg-card text-muted-foreground border border-border"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-6">
        {/* Today View */}
        {period === "today" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Macros Donut */}
            <div className="p-4 rounded-2xl bg-card border border-border">
              <h3 className="font-semibold mb-4">Répartition des macros</h3>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={macroData}
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {macroData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {macroData.map((m) => (
                  <div key={m.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: m.color }}
                    />
                    <span className="text-sm">
                      {m.name}: {m.value}g
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Water Intake */}
            <div className="p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-blue-500" />
                  Hydratation
                </h3>
                <span className="text-sm text-muted-foreground">
                  {dailyLog.waterIntake}/8 verres
                </span>
              </div>
              <div className="flex gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 h-10 rounded-lg transition-colors",
                      i < dailyLog.waterIntake
                        ? "bg-blue-500"
                        : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* 7 Days View */}
        {period === "7days" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Bar Chart */}
            <div className="p-4 rounded-2xl bg-card border border-border">
              <h3 className="font-semibold mb-4">Calories par jour</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weekData}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis hide />
                  <ReferenceLine
                    y={user.targetCalories}
                    stroke="#6366F1"
                    strokeDasharray="3 3"
                    label={{
                      value: "Objectif",
                      position: "right",
                      fontSize: 10,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.75rem",
                    }}
                  />
                  <Bar
                    dataKey="calories"
                    radius={[8, 8, 0, 0]}
                    fill="#10B981"
                  >
                    {weekData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getBarColor(entry.calories)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Week Summary */}
            <div className="p-4 rounded-2xl bg-card border border-border">
              <h3 className="font-semibold mb-4">{t("weekSummary")}</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <p className="text-2xl font-bold text-foreground">
                    {avgCalories}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("average")}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-emerald/10">
                  <p className="text-2xl font-bold text-emerald">
                    {bestDay.day}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("bestDay")}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-destructive/10">
                  <p className="text-2xl font-bold text-destructive">
                    {hardestDay.day}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("hardestDay")}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 30 Days View */}
        {period === "30days" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Area Chart */}
            <div className="p-4 rounded-2xl bg-card border border-border">
              <h3 className="font-semibold mb-4">Tendance sur 30 jours</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthData}>
                  <defs>
                    <linearGradient
                      id="colorCalories"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => (v % 5 === 0 ? v : "")}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.75rem",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="calories"
                    stroke="#6366F1"
                    fillOpacity={1}
                    fill="url(#colorCalories)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Month Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-card border border-border text-center">
                <p className="text-xl font-bold">
                  {Math.round(
                    monthData.reduce((s, d) => s + d.calories, 0) / 30
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Moy. kcal</p>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border text-center">
                <p className="text-xl font-bold">
                  {Math.round(Math.min(...monthData.map((d) => d.calories)))}
                </p>
                <p className="text-xs text-muted-foreground">Min kcal</p>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border text-center">
                <p className="text-xl font-bold">
                  {Math.round(Math.max(...monthData.map((d) => d.calories)))}
                </p>
                <p className="text-xs text-muted-foreground">Max kcal</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Evolution View */}
        {period === "evolution" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Weight Chart */}
            <div className="p-4 rounded-2xl bg-card border border-border">
              <h3 className="font-semibold mb-4">Évolution du poids</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weightHistory}>
                  <defs>
                    <linearGradient
                      id="colorWeight"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => new Date(v).getDate().toString()}
                  />
                  <YAxis
                    domain={["dataMin - 1", "dataMax + 1"]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.75rem",
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)} kg`, "Poids"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Body Composition Summary */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                label={t("weightLost")}
                value={weightLost}
                unit="kg"
                status={Number(weightLost) > 0 ? "good" : "neutral"}
                statusText={Number(weightLost) > 0 ? "En progrès" : ""}
              />
              <MetricCard
                label={t("muscleGained")}
                value={muscleGained}
                unit="kg"
                status={Number(muscleGained) > 0 ? "good" : "neutral"}
                statusText={Number(muscleGained) > 0 ? "En hausse" : ""}
              />
              <MetricCard
                label={t("fatLost")}
                value={fatLost}
                unit="kg"
                status={Number(fatLost) > 0 ? "good" : "neutral"}
              />
              <MetricCard
                label={t("bodyFat")}
                value={(latestWeight?.bodyFat || 18.2).toFixed(1)}
                unit="%"
                status="neutral"
              />
            </div>

            {/* Forbes Disclaimer */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber/10 text-amber">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{t("forbesEstimate")}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
