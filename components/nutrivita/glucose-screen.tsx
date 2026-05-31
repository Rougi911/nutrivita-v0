"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Plus, Upload, Mic } from "lucide-react"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Tooltip,
  Cell,
} from "recharts"
import { useApp } from "@/lib/app-context"
import { GradientHeader } from "./gradient-header"
import { MetricCard } from "./metric-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type GlucosePeriod = "7d" | "14d" | "30d"

interface GlucoseZone {
  label: string
  min: number
  max: number
  color: string
  bgColor: string
}

const GLUCOSE_ZONES: GlucoseZone[] = [
  { label: "Très basse", min: 0, max: 54, color: "#EF4444", bgColor: "bg-red-500/20" },
  { label: "Basse", min: 54, max: 70, color: "#F97316", bgColor: "bg-orange-500/20" },
  { label: "Cible", min: 70, max: 180, color: "#10B981", bgColor: "bg-emerald/20" },
  { label: "Haute", min: 180, max: 250, color: "#F97316", bgColor: "bg-orange-500/20" },
  { label: "Très haute", min: 250, max: 400, color: "#EF4444", bgColor: "bg-red-500/20" },
]

export function GlucoseScreen() {
  const { t, glucoseReadings, addGlucoseReading, isRTL } = useApp()
  const [period, setPeriod] = useState<GlucosePeriod>("14d")
  const [showAddModal, setShowAddModal] = useState(false)

  // Filter readings by period
  const filteredReadings = useMemo(() => {
    const days = period === "7d" ? 7 : period === "14d" ? 14 : 30
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    return glucoseReadings.filter(
      (r) => new Date(r.timestamp).getTime() > cutoff
    )
  }, [glucoseReadings, period])

  // Calculate glucose stats
  const stats = useMemo(() => {
    if (filteredReadings.length === 0) {
      return {
        gmi: 0,
        tir: 0,
        cv: 0,
        average: 0,
        min: 0,
        max: 0,
        distribution: { veryLow: 0, low: 0, inRange: 0, high: 0, veryHigh: 0 },
        counts: { veryLow: 0, low: 0, inRange: 0, high: 0, veryHigh: 0 },
      }
    }

    const values = filteredReadings.map((r) => r.value)
    const avg = values.reduce((s, v) => s + v, 0) / values.length
    const std = Math.sqrt(
      values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length
    )

    // Count by zone
    const veryLow = values.filter((v) => v < 54).length
    const low = values.filter((v) => v >= 54 && v < 70).length
    const inRange = values.filter((v) => v >= 70 && v <= 180).length
    const high = values.filter((v) => v > 180 && v <= 250).length
    const veryHigh = values.filter((v) => v > 250).length
    const total = values.length

    return {
      gmi: (3.31 + 0.02392 * avg).toFixed(1), // GMI formula
      tir: Math.round((inRange / total) * 100),
      cv: Math.round((std / avg) * 100),
      average: Math.round(avg),
      min: Math.round(Math.min(...values)),
      max: Math.round(Math.max(...values)),
      distribution: {
        veryLow: Math.round((veryLow / total) * 100),
        low: Math.round((low / total) * 100),
        inRange: Math.round((inRange / total) * 100),
        high: Math.round((high / total) * 100),
        veryHigh: Math.round((veryHigh / total) * 100),
      },
      counts: { veryLow, low, inRange, high, veryHigh },
    }
  }, [filteredReadings])

  // Prepare chart data
  const chartData = useMemo(() => {
    return filteredReadings.map((r) => {
      const date = new Date(r.timestamp)
      return {
        x: date.getTime(),
        y: r.value,
        hour: date.getHours(),
      }
    })
  }, [filteredReadings])

  const getPointColor = (value: number) => {
    if (value < 54) return "#EF4444"
    if (value < 70) return "#F97316"
    if (value <= 180) return "#10B981"
    if (value <= 250) return "#F97316"
    return "#EF4444"
  }

  const getStatusForMetric = (
    metric: "gmi" | "tir" | "cv",
    value: number
  ): "good" | "warning" | "danger" => {
    if (metric === "gmi") {
      if (value < 7) return "good"
      if (value < 8) return "warning"
      return "danger"
    }
    if (metric === "tir") {
      if (value >= 70) return "good"
      if (value >= 50) return "warning"
      return "danger"
    }
    if (metric === "cv") {
      if (value < 36) return "good"
      return "warning"
    }
    return "neutral"
  }

  const periods: { id: GlucosePeriod; label: string }[] = [
    { id: "7d", label: "7j" },
    { id: "14d", label: "14j" },
    { id: "30d", label: "30j" },
  ]

  return (
    <div className={cn("flex flex-col pb-32 min-h-screen", isRTL && "rtl")}>
      <GradientHeader
        title={t("glucoseTracking")}
        subtitle={t("last14Days")}
        icon="🩸"
        variant="glucose"
      />

      <div className="px-4 -mt-4 space-y-4">
        {/* Metrics Dashboard */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label={t("gmi")}
            value={stats.gmi}
            unit="%"
            status={getStatusForMetric("gmi", Number(stats.gmi))}
            statusText={t("estimatedHba1c")}
            gradient="gradient-glucose"
          />
          <MetricCard
            label={t("tir")}
            value={stats.tir}
            unit="%"
            status={getStatusForMetric("tir", stats.tir)}
            statusText={`${t("targetRange")}`}
            gradient="gradient-glucose"
          />
          <MetricCard
            label={t("cv")}
            value={stats.cv}
            unit="%"
            status={getStatusForMetric("cv", stats.cv)}
            statusText={`${t("stable")} <36%`}
          />
          <MetricCard
            label={t("mean")}
            value={stats.average}
            unit="mg/dL"
            statusText={`Min ${stats.min}, Max ${stats.max}`}
          />
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={cn(
                "flex-1 py-2 rounded-xl text-sm font-medium transition-colors",
                period === p.id
                  ? "bg-glucose-pink text-white"
                  : "bg-card border border-border text-muted-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Glucose Chart */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <h3 className="font-semibold mb-4">Mesures de glycémie</h3>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -10 }}>
              {/* Zone backgrounds */}
              <ReferenceArea y1={0} y2={54} fill="#EF4444" fillOpacity={0.1} />
              <ReferenceArea y1={54} y2={70} fill="#F97316" fillOpacity={0.1} />
              <ReferenceArea y1={70} y2={180} fill="#10B981" fillOpacity={0.1} />
              <ReferenceArea y1={180} y2={250} fill="#F97316" fillOpacity={0.1} />
              <ReferenceArea y1={250} y2={350} fill="#EF4444" fillOpacity={0.1} />

              <XAxis
                type="number"
                dataKey="x"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(v) => {
                  const d = new Date(v)
                  return `${d.getDate()}/${d.getMonth() + 1}`
                }}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[40, 300]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
              />

              {/* Reference lines */}
              <ReferenceLine y={70} stroke="#10B981" strokeDasharray="3 3" />
              <ReferenceLine y={180} stroke="#10B981" strokeDasharray="3 3" />

              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.75rem",
                }}
                formatter={(value: number) => [`${value} mg/dL`, "Glycémie"]}
                labelFormatter={(label) => {
                  const d = new Date(label)
                  return d.toLocaleString("fr-FR")
                }}
              />

              <Scatter data={chartData} fill="#8884d8">
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getPointColor(entry.y)}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Distribution Bar */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <h3 className="font-semibold mb-3">Répartition</h3>
          <div className="h-6 flex rounded-lg overflow-hidden mb-4">
            {[
              { key: "veryLow", color: "bg-red-500" },
              { key: "low", color: "bg-orange-500" },
              { key: "inRange", color: "bg-emerald" },
              { key: "high", color: "bg-orange-500" },
              { key: "veryHigh", color: "bg-red-500" },
            ].map((zone) => {
              const pct =
                stats.distribution[zone.key as keyof typeof stats.distribution]
              return pct > 0 ? (
                <div
                  key={zone.key}
                  className={cn(zone.color)}
                  style={{ width: `${pct}%` }}
                />
              ) : null
            })}
          </div>

          {/* Distribution Detail */}
          <div className="space-y-2">
            {[
              {
                label: t("veryLow"),
                range: "<54",
                key: "veryLow",
                color: "border-red-500",
              },
              {
                label: t("low"),
                range: "54-70",
                key: "low",
                color: "border-orange-500",
              },
              {
                label: t("target"),
                range: "70-180",
                key: "inRange",
                color: "border-emerald",
              },
              {
                label: t("high"),
                range: "180-250",
                key: "high",
                color: "border-orange-500",
              },
              {
                label: t("veryHigh"),
                range: ">250",
                key: "veryHigh",
                color: "border-red-500",
              },
            ].map((zone) => {
              const pct =
                stats.distribution[zone.key as keyof typeof stats.distribution]
              const count =
                stats.counts[zone.key as keyof typeof stats.counts]
              return (
                <div
                  key={zone.key}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg border-l-4",
                    zone.color
                  )}
                >
                  <div className="flex-1">
                    <span className="text-sm font-medium">{zone.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({zone.range})
                    </span>
                  </div>
                  <span className="text-sm font-semibold">{pct}%</span>
                  <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        zone.color.replace("border-", "bg-")
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {count} {t("measurements")}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* FAB */}
      <motion.button
        className="fixed bottom-28 right-4 h-14 w-14 rounded-full gradient-glucose text-white shadow-lg flex items-center justify-center"
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowAddModal(true)}
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      {/* Add Modal */}
      {showAddModal && (
        <AddGlucoseModal
          onClose={() => setShowAddModal(false)}
          onAdd={(value, type) => {
            addGlucoseReading({
              value,
              type,
              timestamp: new Date().toISOString(),
              source: "manual",
            })
            setShowAddModal(false)
          }}
        />
      )}
    </div>
  )
}

function AddGlucoseModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (value: number, type: "fasting" | "pre-meal" | "post-meal" | "random") => void
}) {
  const { t } = useApp()
  const [value, setValue] = useState("")
  const [type, setType] = useState<"fasting" | "pre-meal" | "post-meal" | "random">(
    "random"
  )

  const handleSubmit = () => {
    const numValue = parseInt(value)
    if (numValue > 0) {
      onAdd(numValue, type)
    }
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
        <h3 className="text-lg font-semibold mb-6">Ajouter une mesure</h3>

        <div className="space-y-4">
          {/* Value input */}
          <div className="flex items-center gap-3">
            <Input
              type="number"
              placeholder="Ex: 120"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="flex-1 h-12 text-lg"
              autoFocus
            />
            <span className="text-muted-foreground">mg/dL</span>
            <Button variant="outline" size="icon" className="h-12 w-12">
              <Mic className="h-5 w-5" />
            </Button>
          </div>

          {/* Type selector */}
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fasting">À jeun</SelectItem>
              <SelectItem value="pre-meal">Avant repas</SelectItem>
              <SelectItem value="post-meal">Après repas</SelectItem>
              <SelectItem value="random">Aléatoire</SelectItem>
            </SelectContent>
          </Select>

          {/* Import option */}
          <Button variant="outline" className="w-full gap-2">
            <Upload className="h-4 w-4" />
            {t("importCsv")}
          </Button>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button
              className="flex-1 gradient-glucose text-white"
              onClick={handleSubmit}
              disabled={!value}
            >
              {t("add")}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
