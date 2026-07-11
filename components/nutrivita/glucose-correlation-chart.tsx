"use client"

// P2 — Corrélation glycémie × habitudes alimentaires × activité sportive.
// Section "graphiques avancés" (réglage Profil) de l'écran Glycémie fusionné.
// Superpose 3 séries quotidiennes sur la période sélectionnée (3 axes Y distincts,
// un par unité, même principe que le graphe multi-métriques de stats-screen.tsx) :
// glycémie moyenne / jour, glucides ingérés / jour, calories dépensées (sport) / jour.
// Unités explicites sur chaque axe (retour utilisateur : "on ne voit pas les unités").

import { useEffect, useMemo, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from "recharts"
import { useApp } from "@/lib/app-context"
import { getJournalRange, getActivitiesRange } from "@/lib/api"
import { toGlucoseUnit } from "@/lib/glucose-units"
import { LazyMount } from "./lazy-mount"
import type { GlucosePeriod } from "./glucose-screen"

interface Props {
  period: GlucosePeriod
}

interface DayRow {
  date: string
  glycemie: number | null // display unit
  glucides: number | null // g
  sport: number | null // kcal
}

export function GlucoseCorrelationChart({ period }: Props) {
  const { t, glucoseReadings, user, glucoseTarget, language } = useApp()
  const days = period === "7d" ? 7 : period === "14d" ? 14 : 30
  const unit = user.units.glucose
  const dateLocale = ({ fr: "fr-FR", ar: "ar", en: "en-US" } as const)[language]

  const [carbsByDate, setCarbsByDate] = useState<Record<string, number>>({})
  const [burnedByDate, setBurnedByDate] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all([
      getJournalRange(days).catch(() => []),
      getActivitiesRange(days).catch(() => [] as { date: string; burned: number }[]),
    ]).then(([meals, burned]) => {
      if (!alive) return
      const carbs: Record<string, number> = {}
      for (const m of meals) {
        // FoodItem.carbs est en g/100g — ramener à la quantité réellement consommée (amount, en g).
        const g = ((m.food?.carbs || 0) / 100) * m.amount
        carbs[m.date] = (carbs[m.date] || 0) + g
      }
      const burnedMap: Record<string, number> = {}
      for (const b of burned) burnedMap[b.date] = b.burned
      setCarbsByDate(carbs)
      setBurnedByDate(burnedMap)
      setLoading(false)
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days])

  const rows: DayRow[] = useMemo(() => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    const glycemieByDate: Record<string, { sum: number; n: number }> = {}
    for (const r of glucoseReadings) {
      if (new Date(r.timestamp).getTime() <= cutoff) continue
      const d = new Date(r.timestamp).toISOString().slice(0, 10)
      const o = (glycemieByDate[d] ||= { sum: 0, n: 0 })
      o.sum += r.value
      o.n += 1
    }
    const allDates = new Set<string>([
      ...Object.keys(glycemieByDate),
      ...Object.keys(carbsByDate),
      ...Object.keys(burnedByDate),
    ])
    return Array.from(allDates).sort().map((date) => ({
      date,
      glycemie: glycemieByDate[date] ? toGlucoseUnit(glycemieByDate[date].sum / glycemieByDate[date].n, unit) : null,
      glucides: carbsByDate[date] ?? null,
      sport: burnedByDate[date] ?? null,
    }))
  }, [glucoseReadings, carbsByDate, burnedByDate, days, unit])

  const hasEnoughData = rows.filter((r) => r.glycemie !== null).length >= 3

  if (loading) {
    return <div className="h-[180px] rounded-2xl border border-border bg-card animate-pulse" />
  }

  if (!hasEnoughData) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-[13px] text-muted-foreground text-center py-4">{t("insufficientGlucoseData")}</p>
      </div>
    )
  }

  const targetHigh = toGlucoseUnit(glucoseTarget.high, unit)

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="text-[14px] font-semibold text-foreground mb-1">{t("correlationChartTitle")}</h3>
      <p className="text-[11px] text-muted-foreground mb-3 leading-snug">{t("correlationChartHint")}</p>
      <LazyMount minHeight={190}>
        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
              tickFormatter={(v) => new Date(v).toLocaleDateString(dateLocale, { day: "numeric", month: "short" })}
            />
            <YAxis
              yAxisId="glucose"
              orientation="left"
              axisLine={false}
              tickLine={false}
              width={32}
              tick={{ fontSize: 9, fill: "var(--glucose)" }}
              label={{ value: unit, angle: -90, position: "insideLeft", fontSize: 9, fill: "var(--glucose)" }}
            />
            <YAxis
              yAxisId="secondary"
              orientation="right"
              axisLine={false}
              tickLine={false}
              width={34}
              tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
              label={{ value: "g / kcal", angle: 90, position: "insideRight", fontSize: 9, fill: "var(--muted-foreground)" }}
            />
            <ReferenceLine
              yAxisId="glucose"
              y={targetHigh}
              stroke="var(--glucose)"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
              label={{ value: `${t("target")} ${targetHigh.toFixed(unit === "mg/dL" ? 0 : 2)}${unit}`, position: "insideTopLeft", fontSize: 9, fill: "var(--glucose)" }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", fontSize: "12px" }}
              labelFormatter={(v) => new Date(v).toLocaleDateString(dateLocale, { day: "numeric", month: "long" })}
              formatter={(value: number, name: string) => {
                if (name === "glycemie") return [`${Number(value).toFixed(unit === "mg/dL" ? 0 : 2)} ${unit}`, t("chartGlucose")]
                if (name === "glucides") return [`${Math.round(value)} g`, t("carbs")]
                return [`${Math.round(value)} kcal`, t("burned")]
              }}
            />
            <Line yAxisId="glucose" type="monotone" dataKey="glycemie" stroke="var(--glucose)" strokeWidth={2} dot={{ r: 2 }} connectNulls isAnimationActive={false} />
            <Line yAxisId="secondary" type="monotone" dataKey="glucides" stroke="var(--amber)" strokeWidth={2} dot={{ r: 2 }} connectNulls isAnimationActive={false} />
            <Line yAxisId="secondary" type="monotone" dataKey="sport" stroke="var(--primary)" strokeWidth={2} dot={{ r: 2 }} connectNulls isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </LazyMount>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--glucose)" }} />
          {t("chartGlucose")} ({unit})
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--amber)" }} />
          {t("carbs")} (g)
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--primary)" }} />
          {t("burned")} (kcal)
        </span>
      </div>
    </div>
  )
}
