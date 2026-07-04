"use client"

// P1-2 / P1-3 — Tendances (maquette 2). Sous-onglet du Bilan.
// Heatmap d'adhérence (style GitHub), barres macros empilées avec la part
// au-delà de l'objectif hachurée, et poids en moyenne mobile 7 j + pente kg/mois.
// Données réelles via getJournalRange / getWeightHistory.

import { useEffect, useMemo, useState } from "react"
import { useApp } from "@/lib/app-context"
import { getJournalRange, getWeightHistory } from "@/lib/api"
import { P1 } from "@/lib/p1-i18n"
import {
  buildAdherenceHeatmap,
  buildDailyMacros,
  buildSmoothedWeight,
  macroTargetsG,
  type AdherenceLevel,
} from "@/lib/p1-insights"
import type { MealEntry, WeightEntry } from "@/lib/types"
import { LazyMount } from "./lazy-mount"

const LEVEL_COLOR: Record<AdherenceLevel, string> = {
  empty: "var(--border)",
  partial: "color-mix(in oklab, var(--primary) 35%, var(--card))",
  in: "var(--primary)",
  over: "color-mix(in oklab, var(--lipids) 30%, var(--card))",
}

export function TrendsScreen() {
  const { user, language, isRTL } = useApp()
  const P = P1[language]

  const [meals, setMeals] = useState<MealEntry[]>([])
  const [weights, setWeights] = useState<WeightEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.allSettled([getJournalRange(30), getWeightHistory(60)]).then(([m, w]) => {
      if (!alive) return
      if (m.status === "fulfilled") setMeals(m.value)
      if (w.status === "fulfilled") setWeights(w.value)
      setLoading(false)
    })
    return () => { alive = false }
  }, [])

  const heat = useMemo(() => buildAdherenceHeatmap(meals, user, 30), [meals, user])
  const macros = useMemo(() => buildDailyMacros(meals, 7, language), [meals, language])
  const weight = useMemo(() => buildSmoothedWeight(weights), [weights])
  const tgt = macroTargetsG(user)

  return (
    <div className={`px-4 py-4 space-y-3 ${isRTL ? "rtl" : ""}`}>
      <h2 className="text-[19px] font-extrabold text-foreground">{P.trends}</h2>

      {/* Heatmap d'adhérence */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">{P.adherenceMonth}</span>
          <b className="text-[13px]" style={{ color: "var(--primary)" }}>
            {heat.inTarget} / 30 {P.daysInTargetLabel} ✓
          </b>
        </div>
        <div className="grid grid-cols-7 gap-[5px] mt-3">
          {heat.cells.map((cell) => (
            <div
              key={cell.date}
              title={`${cell.date} · ${cell.kcal} kcal`}
              className="rounded-md"
              style={{
                aspectRatio: "1 / 1",
                backgroundColor: LEVEL_COLOR[cell.level],
                outline: cell.isToday ? "2px solid var(--glucose)" : "none",
                outlineOffset: "1px",
              }}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-3 text-[10.5px] text-muted-foreground">
          <Legend color={LEVEL_COLOR.empty} label={P.legendEmpty} />
          <Legend color={LEVEL_COLOR.partial} label={P.legendPartial} />
          <Legend color={LEVEL_COLOR.in} label={P.legendInTarget} />
          <Legend color={LEVEL_COLOR.over} label={P.legendExceeded} />
        </div>
      </div>

      {/* Macros empilées par jour */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">{P.macrosPerDay}</span>
          <span className="text-[11px] font-bold rounded-full px-2.5 py-1" style={{ backgroundColor: "color-mix(in oklab, var(--glucose) 14%, transparent)", color: "var(--glucose)" }}>
            {P.last7days}
          </span>
        </div>
        <LazyMount minHeight={130}><StackedMacros days={macros} targets={tgt} /></LazyMount>
        <div className="flex justify-between text-[9.5px] text-muted-foreground mt-1 px-1">
          {macros.map((d) => <span key={d.date}>{d.weekdayShort}</span>)}
        </div>
        <div className="flex flex-wrap gap-3 mt-2 text-[10.5px] text-muted-foreground">
          <Legend color="var(--glucose)" label={language === "ar" ? "بروتين" : language === "en" ? "Protein" : "Protéines"} />
          <Legend color="var(--amber)" label={language === "ar" ? "كربوهيدرات" : language === "en" ? "Carbs" : "Glucides"} />
          <Legend color="var(--lipids)" label={language === "ar" ? "دهون" : language === "en" ? "Fat" : "Lipides"} />
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-[3px]" style={{ background: "repeating-linear-gradient(45deg, var(--muted-foreground) 0 2px, transparent 2px 4px)" }} />
            {P.aboveGoal}
          </span>
        </div>
      </div>

      {/* Poids lissé */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">{P.weightTrend}</span>
          {weight && (
            <span
              className="text-[11px] font-bold rounded-full px-2.5 py-1"
              style={{
                backgroundColor: `color-mix(in oklab, var(--${weight.slopePerMonth <= 0 ? "primary" : "amber"}) 14%, transparent)`,
                color: `var(--${weight.slopePerMonth <= 0 ? "primary" : "amber"})`,
              }}
            >
              {weight.slopePerMonth > 0 ? "▴ +" : "▾ "}{weight.slopePerMonth} kg {P.perMonth}
            </span>
          )}
        </div>
        {weight ? (
          <>
            <LazyMount minHeight={120}><SmoothedWeightChart data={weight} /></LazyMount>
            <div className="flex justify-between text-[9.5px] text-muted-foreground mt-1">
              <span>{weight.points[0].raw} kg</span>
              <span>{P.movingAvg7}</span>
              <span>{weight.points[weight.points.length - 1].smoothed} kg</span>
            </div>
          </>
        ) : (
          <p className="text-[12.5px] text-muted-foreground py-6 text-center">
            {loading ? "…" : P.notEnoughData}
          </p>
        )}
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-block w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

function StackedMacros({
  days,
  targets,
}: {
  days: { date: string; protein: number; carbs: number; fat: number }[]
  targets: { protein: number; carbs: number; fat: number }
}) {
  const W = 330
  const H = 120
  const baseline = 112
  const maxStack = Math.max(1, ...days.map((d) => d.protein + d.carbs + d.fat))
  const scale = (baseline - 8) / maxStack
  const barW = 26
  const gap = (W - days.length * barW) / (days.length + 1)
  const macroDefs: { key: "protein" | "carbs" | "fat"; color: string; hatch: string; tgt: number }[] = [
    { key: "protein", color: "var(--glucose)", hatch: "url(#hv)", tgt: targets.protein },
    { key: "carbs", color: "var(--amber)", hatch: "url(#ha)", tgt: targets.carbs },
    { key: "fat", color: "var(--lipids)", hatch: "url(#hr)", tgt: targets.fat },
  ]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", marginTop: 8 }}>
      <defs>
        {[
          { id: "hv", c: "var(--glucose)" },
          { id: "ha", c: "var(--amber)" },
          { id: "hr", c: "var(--lipids)" },
        ].map((p) => (
          <pattern key={p.id} id={p.id} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="5" height="5" fill={p.c} opacity="0.28" />
            <line x1="0" y1="0" x2="0" y2="5" stroke={p.c} strokeWidth="2.2" />
          </pattern>
        ))}
      </defs>
      {days.map((d, i) => {
        const x = gap + i * (barW + gap)
        let y = baseline
        return (
          <g key={d.date}>
            {macroDefs.map((m) => {
              const v = d[m.key]
              if (v <= 0) return null
              const over = Math.max(0, v - m.tgt)
              const base = Math.min(v, m.tgt)
              const hV = v * scale
              const hOver = over * scale
              const hBase = base * scale
              y -= hV
              return (
                <g key={m.key}>
                  {hOver > 0 && <rect x={x} y={y} width={barW} height={Math.max(0, hOver - 1)} rx="2" fill={m.hatch} />}
                  <rect x={x} y={y + hOver} width={barW} height={Math.max(0, hBase - 1)} rx="3" fill={m.color} />
                </g>
              )
            })}
          </g>
        )
      })}
      <line x1="0" y1={baseline} x2={W} y2={baseline} stroke="var(--border)" />
    </svg>
  )
}

function SmoothedWeightChart({ data }: { data: ReturnType<typeof buildSmoothedWeight> }) {
  if (!data) return null
  const W = 330
  const H = 120
  const pad = 8
  const n = data.points.length
  const span = Math.max(0.4, data.max - data.min)
  const x = (i: number) => (n === 1 ? W / 2 : pad + (i / (n - 1)) * (W - 2 * pad))
  const y = (v: number) => H - 10 - ((v - data.min) / span) * (H - 24)

  const rawLine = data.points.map((p, i) => `${x(i)},${y(p.raw)}`).join(" ")
  const smoothPath = data.points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.smoothed)}`).join(" ")
  const areaPath = `${smoothPath} L${x(n - 1)},${H - 10} L${x(0)},${H - 10} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", marginTop: 8 }}>
      <path d={areaPath} fill="color-mix(in oklab, var(--primary) 14%, transparent)" />
      <polyline points={rawLine} fill="none" stroke="var(--border)" strokeWidth="1.5" />
      <path d={smoothPath} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(n - 1)} cy={y(data.points[n - 1].smoothed)} r="4.5" fill="var(--primary)" />
    </svg>
  )
}
