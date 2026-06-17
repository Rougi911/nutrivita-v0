"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, ArrowLeft, Mic, Plus, Upload } from "lucide-react"
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
import { toGlucoseUnit, fromGlucoseUnit, formatGlucose, convertThreshold } from "@/lib/glucose-units"
import { computeGlucoseMetrics, getGlucoseStatus } from "@/lib/glucose-metrics"
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
import type { GlucoseUnit } from "@/lib/types"

type GlucosePeriod = "7d" | "14d" | "30d"
type MeasurementType = "fasting" | "pre-meal" | "post-meal" | "pontuelle"

interface GlucoseScreenProps {
  onBack?: () => void
}

const ZONE_COLORS = {
  veryLow: "var(--risk)",
  low: "var(--amber)",
  inRange: "var(--primary)",
  high: "var(--amber)",
  veryHigh: "var(--risk)",
}

function getPointColor(value: number, targetLow: number, targetHigh: number): string {
  if (value < 54) return "var(--risk)"
  if (value < targetLow) return "var(--amber)"
  if (value <= targetHigh) return "var(--primary)"
  if (value <= 250) return "var(--amber)"
  return "var(--risk)"
}

export function GlucoseScreen({ onBack }: GlucoseScreenProps) {
  const {
    t,
    glucoseReadings,
    addGlucoseReading,
    isRTL,
    user,
    glucoseTarget,
  } = useApp()

  const [period, setPeriod] = useState<GlucosePeriod>("14d")
  const [showAddModal, setShowAddModal] = useState(false)

  const displayUnit = user.units.glucose

  // Filter readings by period
  const filteredReadings = useMemo(() => {
    const days = period === "7d" ? 7 : period === "14d" ? 14 : 30
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    return glucoseReadings.filter((r) => new Date(r.timestamp).getTime() > cutoff)
  }, [glucoseReadings, period])

  const values = filteredReadings.map((r) => r.value)

  // AL-05 guard: N<12 → insufficientData
  const metrics = useMemo(
    () => computeGlucoseMetrics(values, glucoseTarget.low, glucoseTarget.high),
    [values, glucoseTarget]
  )

  // Hypo alert: count episodes < 54 mg/dL
  const hypoCount = values.filter((v) => v < 54).length

  // Context stats per measurement type (b)
  const contextStats = useMemo(() => {
    const types: MeasurementType[] = ["fasting", "pre-meal", "post-meal", "pontuelle"]
    return types.map((type) => {
      const subset = filteredReadings.filter((r) => r.type === type)
      if (subset.length === 0) return null
      const avg = subset.reduce((s, r) => s + r.value, 0) / subset.length
      const exceedsTarget = avg > glucoseTarget.high
      return { type, avg: Math.round(avg), count: subset.length, exceedsTarget }
    }).filter(Boolean)
  }, [filteredReadings, glucoseTarget])

  const typeLabels: Record<string, string> = {
    fasting: t("fasting"),
    "pre-meal": t("preMeal"),
    "post-meal": t("postMeal"),
    pontuelle: t("pontuelle"),
  }

  // Chart data — values displayed in user's chosen unit
  const chartData = useMemo(() => {
    return filteredReadings.map((r) => {
      const date = new Date(r.timestamp)
      return {
        x: date.getTime(),
        y: toGlucoseUnit(r.value, displayUnit),
        rawMgDl: r.value,
        type: r.type,
      }
    })
  }, [filteredReadings, displayUnit])

  // Y axis domain converted to display unit [40, 350] mg/dL
  const yMin = parseFloat(toGlucoseUnit(40,  displayUnit).toFixed(2))
  const yMax = parseFloat(toGlucoseUnit(350, displayUnit).toFixed(2))
  const yTargetLow  = toGlucoseUnit(glucoseTarget.low,  displayUnit)
  const yTargetHigh = toGlucoseUnit(glucoseTarget.high, displayUnit)
  const y54  = toGlucoseUnit(54,  displayUnit)
  const y250 = toGlucoseUnit(250, displayUnit)

  const periodLabel =
    period === "7d" ? t("periodLabel7d") :
    period === "14d" ? t("periodLabel14d") : t("periodLabel30d")

  const statusColors: Record<"good" | "warning" | "danger", string> = {
    good:    "var(--primary)",
    warning: "var(--amber)",
    danger:  "var(--risk)",
  }

  return (
    <div className={cn("flex flex-col min-h-screen bg-background pb-8", isRTL && "rtl")}>
      {/* Flat header */}
      <div className="px-4 pt-5 pb-3 flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0"
            aria-label="Retour"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-[18px] font-semibold text-foreground">{t("glucoseTracking")}</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">{periodLabel}</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-xl text-[13px]"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            {t("addReading")}
          </Button>
        </div>
      </div>

      {/* REG-04 disclaimer — permanent, non-dismissable */}
      <div className="mx-4 mb-3 px-3 py-2 rounded-xl border border-border bg-muted/40">
        <p className="text-[11px] text-muted-foreground leading-snug">
          {t("glucoseDisclaimer")}
        </p>
      </div>

      <div className="px-4 space-y-4">
        {/* Hypo alert card (c) — neutral text, no therapeutic advice (REG-05) */}
        {hypoCount > 0 && (
          <div
            className="rounded-2xl border px-4 py-3 flex items-start gap-3"
            style={{ borderColor: "var(--risk)", backgroundColor: "var(--risk-bg)" }}
          >
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--risk)" }} />
            <p className="text-[13px] font-medium" style={{ color: "var(--risk)" }}>
              {hypoCount} {t("hypoAlert")}
            </p>
          </div>
        )}

        {/* Period selector */}
        <div className="flex gap-2">
          {(["7d", "14d", "30d"] as GlucosePeriod[]).map((p) => {
            const labels: Record<GlucosePeriod, string> = { "7d": "7j", "14d": "14j", "30d": "30j" }
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "flex-1 py-2 rounded-xl text-sm font-medium transition-colors",
                  period === p
                    ? "text-white"
                    : "bg-card border border-border text-muted-foreground"
                )}
                style={period === p ? { backgroundColor: "var(--glucose)" } : undefined}
              >
                {labels[p]}
              </button>
            )
          })}
        </div>

        {/* Empty state (d) */}
        {filteredReadings.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 flex flex-col items-center gap-3 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--glucose-bg)" }}
            >
              <Plus className="h-6 w-6" style={{ color: "var(--glucose)" }} />
            </div>
            <p className="text-[15px] font-semibold text-foreground">{t("noGlucoseData")}</p>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowAddModal(true)}
            >
              {t("addFirstReading")}
            </Button>
          </div>
        ) : (
          <>
            {/* Metrics (AL-05 guard) */}
            {metrics.insufficientData ? (
              <div className="rounded-2xl border border-border bg-card px-4 py-3">
                <p className="text-[13px] text-muted-foreground text-center">
                  {t("insufficientGlucoseData")} — {metrics.count} / 12 {t("measurements")} minimum
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {/* GMI */}
                <div className="rounded-2xl border border-border bg-card p-3">
                  <p className="text-[12px] text-muted-foreground mb-1">{t("gmi")}</p>
                  <p className="text-[24px] font-semibold leading-none" style={{ color: statusColors[getGlucoseStatus("gmi", metrics.gmi)] }}>
                    {metrics.gmi.toFixed(1)}%
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">{t("estimatedHba1c")}</p>
                </div>
                {/* TIR */}
                <div className="rounded-2xl border border-border bg-card p-3">
                  <p className="text-[12px] text-muted-foreground mb-1">{t("tir")}</p>
                  <p className="text-[24px] font-semibold leading-none" style={{ color: statusColors[getGlucoseStatus("tir", metrics.tir)] }}>
                    {metrics.tir}%
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">{t("inTarget")}</p>
                </div>
                {/* CV */}
                <div className="rounded-2xl border border-border bg-card p-3">
                  <p className="text-[12px] text-muted-foreground mb-1">{t("cv")}</p>
                  <p className="text-[24px] font-semibold leading-none" style={{ color: statusColors[getGlucoseStatus("cv", metrics.cv)] }}>
                    {metrics.cv}%
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">{t("stability")}</p>
                </div>
                {/* Mean */}
                <div className="rounded-2xl border border-border bg-card p-3">
                  <p className="text-[12px] text-muted-foreground mb-1">{t("mean")}</p>
                  <p className="text-[24px] font-semibold leading-none text-foreground">
                    {formatGlucose(metrics.average, displayUnit)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">{displayUnit}</p>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-semibold text-foreground">
                  {filteredReadings.length} {t("measurements")}
                </h3>
                <span className="text-[12px] text-muted-foreground">{displayUnit}</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  {/* Zone bands */}
                  <ReferenceArea y1={yMin}       y2={y54}         fill="var(--risk)"    fillOpacity={0.08} />
                  <ReferenceArea y1={y54}        y2={yTargetLow}  fill="var(--amber)"   fillOpacity={0.08} />
                  <ReferenceArea y1={yTargetLow} y2={yTargetHigh} fill="var(--primary)" fillOpacity={0.06} />
                  <ReferenceArea y1={yTargetHigh} y2={y250}       fill="var(--amber)"   fillOpacity={0.08} />
                  <ReferenceArea y1={y250}       y2={yMax}        fill="var(--risk)"    fillOpacity={0.08} />

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
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    domain={[yMin, yMax]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickFormatter={(v) =>
                      displayUnit === "g/L" ? v.toFixed(1) : Math.round(v).toString()
                    }
                  />

                  <ReferenceLine y={yTargetLow}  stroke="var(--primary)" strokeDasharray="3 3" strokeOpacity={0.6} />
                  <ReferenceLine y={yTargetHigh} stroke="var(--primary)" strokeDasharray="3 3" strokeOpacity={0.6} />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [
                      `${displayUnit === "g/L" ? value.toFixed(2) : Math.round(value)} ${displayUnit}`,
                      t("glucoseTracking"),
                    ]}
                    labelFormatter={(label) => new Date(label).toLocaleString("fr-FR")}
                  />

                  <Scatter data={chartData} fill="var(--glucose)">
                    {chartData.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={getPointColor(entry.rawMgDl, glucoseTarget.low, glucoseTarget.high)}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Distribution bar */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-[14px] font-semibold text-foreground mb-3">Répartition</h3>
              <div className="h-5 flex rounded-lg overflow-hidden mb-3">
                {[
                  { key: "veryLow",  color: "var(--risk)" },
                  { key: "low",      color: "var(--amber)" },
                  { key: "inRange",  color: "var(--primary)" },
                  { key: "high",     color: "var(--amber)" },
                  { key: "veryHigh", color: "var(--risk)" },
                ].map((zone) => {
                  const pct = metrics.distribution[zone.key as keyof typeof metrics.distribution]
                  return pct > 0 ? (
                    <div
                      key={zone.key}
                      style={{ width: `${pct}%`, backgroundColor: zone.color }}
                    />
                  ) : null
                })}
              </div>

              <div className="space-y-1.5">
                {[
                  { key: "veryLow",  label: t("veryLow"),  range: `<${convertThreshold(54, displayUnit)}` },
                  { key: "low",      label: t("low"),       range: `${convertThreshold(glucoseTarget.low, displayUnit)}` },
                  { key: "inRange",  label: t("target"),    range: `${convertThreshold(glucoseTarget.low, displayUnit)}–${convertThreshold(glucoseTarget.high, displayUnit)}` },
                  { key: "high",     label: t("high"),      range: `>${convertThreshold(glucoseTarget.high, displayUnit)}` },
                  { key: "veryHigh", label: t("veryHigh"),  range: `>${convertThreshold(250, displayUnit)}` },
                ].map((zone) => {
                  const pct = metrics.distribution[zone.key as keyof typeof metrics.distribution]
                  const count = metrics.counts[zone.key as keyof typeof metrics.counts]
                  return (
                    <div key={zone.key} className="flex items-center gap-2 text-[12px]">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: ZONE_COLORS[zone.key as keyof typeof ZONE_COLORS] }}
                      />
                      <span className="text-foreground flex-1">{zone.label}</span>
                      <span className="text-muted-foreground">{zone.range}</span>
                      <span className="font-semibold text-foreground w-8 text-right">{pct}%</span>
                      <span className="text-muted-foreground w-10 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Context stats (b) */}
            {contextStats.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="text-[14px] font-semibold text-foreground mb-3">{t("contextStats")}</h3>
                <div className="space-y-2">
                  {contextStats.map((stat) =>
                    stat ? (
                      <div key={stat.type} className="flex items-center justify-between">
                        <span className="text-[13px] text-muted-foreground">
                          {typeLabels[stat.type]} ({stat.count})
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-foreground">
                            {formatGlucose(stat.avg, displayUnit)}
                          </span>
                          {stat.exceedsTarget && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{
                                backgroundColor: "var(--amber-bg)",
                                color: "var(--amber)",
                              }}
                            >
                              ↑
                            </span>
                          )}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            )}

            {/* Import button */}
            <Button variant="outline" className="w-full gap-2 rounded-xl">
              <Upload className="h-4 w-4" />
              {t("importCsv")}
            </Button>
          </>
        )}
      </div>

      {/* Add reading modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddGlucoseModal
            displayUnit={displayUnit}
            targetLow={glucoseTarget.low}
            targetHigh={glucoseTarget.high}
            onClose={() => setShowAddModal(false)}
            onAdd={(valueMgDl, type) => {
              addGlucoseReading({
                value: valueMgDl,
                type,
                timestamp: new Date().toISOString(),
                source: "manual",
              })
              setShowAddModal(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function AddGlucoseModal({
  displayUnit,
  targetLow,
  targetHigh,
  onClose,
  onAdd,
}: {
  displayUnit: GlucoseUnit
  targetLow: number
  targetHigh: number
  onClose: () => void
  onAdd: (valueMgDl: number, type: MeasurementType) => void
}) {
  const { t } = useApp()
  const [raw, setRaw] = useState("")
  const [type, setType] = useState<MeasurementType>("pontuelle")

  const handleSubmit = () => {
    const num = parseFloat(raw)
    if (!isNaN(num) && num > 0) {
      // Convert from display unit → mg/dL for storage (AL-04)
      const mgDl = fromGlucoseUnit(num, displayUnit)
      onAdd(Math.round(mgDl), type)
    }
  }

  const placeholder =
    displayUnit === "g/L" ? "Ex: 1.20" :
    displayUnit === "mmol/L" ? "Ex: 6.7" : "Ex: 120"

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-md mx-auto bg-background rounded-t-3xl border-t border-border p-6"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
      >
        <div className="flex justify-center mb-4">
          <div className="w-9 h-1 rounded-full bg-muted-foreground/25" />
        </div>
        <h3 className="text-[17px] font-semibold mb-4">{t("addReading")}</h3>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Input
              type="number"
              placeholder={placeholder}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              className="flex-1 h-12 text-[16px]"
              autoFocus
            />
            <span className="text-muted-foreground text-[13px] shrink-0">{displayUnit}</span>
            {/* Mic disabled with tooltip (g) */}
            <div title="Vocal bientôt disponible">
              <Button variant="outline" size="icon" className="h-12 w-12 opacity-40" disabled>
                <Mic className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <Select value={type} onValueChange={(v) => setType(v as MeasurementType)}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fasting">{t("fasting")}</SelectItem>
              <SelectItem value="pre-meal">{t("preMeal")}</SelectItem>
              <SelectItem value="post-meal">{t("postMeal")}</SelectItem>
              <SelectItem value="pontuelle">{t("pontuelle")}</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button
              className="flex-1 rounded-xl"
              onClick={handleSubmit}
              disabled={!raw || isNaN(parseFloat(raw))}
            >
              {t("add")}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground leading-snug mt-2">
            {t("glucoseDisclaimer")}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
