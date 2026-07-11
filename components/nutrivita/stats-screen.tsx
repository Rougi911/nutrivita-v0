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
  ReferenceArea,
  Tooltip,
  ScatterChart,
  Scatter,
} from "recharts"
import { useApp } from "@/lib/app-context"
import { getDeficiencies, getAdditivesStats, exportUserData, getJournalRange, getWeightHistory, getGlucoseReadings, getActivitiesRange, type AdditivesStats } from "@/lib/api"
import { suggestSeasonalFoods, type NutrientSuggestion } from "@/lib/seasonal-foods"
import { toast } from "sonner"
import type { ApiDeficiency } from "@/lib/api-types"
import { AdditivesBars } from "@/components/nutrivita/additives-bars"
import { LazyMount } from "./lazy-mount" // BUG-3 — différer les charts sous le fold (anti-gel L2)
import { Skeleton } from "@/components/ui/skeleton"
import { computeGlucoseMetrics } from "@/lib/glucose-metrics"
import { getLocalDateStr } from "@/lib/date-utils"
import { deurenbergBodyFat, leanBodyMass, bmi, tdee } from "@/lib/body-composition"
import {
  getBarFill,
  classifyGlucose,
  computeWeightBand,
  computeEcart,
  mergeSeries,
  metricUnit,
  axisLayout,
  GLUCOSE_BAND,
  type MetricId,
  type DatedValue,
} from "@/lib/stats-charts"
import { formatGlucose } from "@/lib/glucose-units"
import { type DayCalories } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { calcRadarData, DEFAULT_VNR } from "@/lib/micronutrients-radar"
import { MicronutrientsRadar } from "@/components/nutrivita/micronutrients-radar"
import { DissipationCard } from "@/components/nutrivita/dissipation-card"

type Segment = "jour" | "semaine" | "mois" | "annee"

const SEGMENTS: { id: Segment; labelKey: string }[] = [
  { id: "jour",    labelKey: "today" },
  { id: "semaine", labelKey: "days7" },
  { id: "mois",    labelKey: "days30" },
  { id: "annee",   labelKey: "year" },
]


// Métriques disponibles sur le 1er graphe (superposables — EVO-1).
const METRIC_COLOR: Record<MetricId, string> = {
  poids: "var(--primary)",
  calories: "var(--amber)",
  ecart: "var(--lipids)",
  glycemie: "var(--glucose)",
}
const METRIC_DECIMALS: Record<MetricId, number> = { poids: 1, calories: 0, ecart: 0, glycemie: 2 }
const STORAGE_KEY = "nv.bilan.metrics"

export function StatsScreen({ onOpenSettings }: { onOpenSettings?: () => void } = {}) {
  const { t, language, dailyLog, mealEntries, user, weightHistory, glucoseReadings, scannedProducts, isRTL, advancedCharts, glucoseTarget } = useApp()
  // Locale pour les libellés de date des graphes (corrige les axes restés en français sous arabe).
  const dateLocale = language === "ar" ? "ar" : language === "en" ? "en-GB" : "fr-FR"
  const [segment, setSegment] = useState<Segment>("semaine")
  const [deficiencies, setDeficiencies] = useState<ApiDeficiency[]>([])
  const [loadingDef, setLoadingDef] = useState(false)
  const [additivesStats, setAdditivesStats] = useState<AdditivesStats | null>(null)
  const [loadingAdditives, setLoadingAdditives] = useState(false)

  // S22/DEF-8/-9/-10 — données chargées sur la PLAGE du segment (le contexte ne charge que le
  // jour courant pour le journal, 30 j poids, 14 j glycémie → Bilan historique vide/tronqué).
  // Initialisées sur le contexte pour un premier rendu immédiat, puis remplacées par la plage.
  const [periodMeals, setPeriodMeals] = useState(mealEntries)
  const [periodWeight, setPeriodWeight] = useState(weightHistory)
  const [periodGlucose, setPeriodGlucose] = useState(glucoseReadings)
  // Point sélectionné sur un graphe (clic) → affiche valeur + date exacte.
  const [selectedPoint, setSelectedPoint] = useState<{ chart: "weight" | "cal"; date: string; text: string } | null>(null)
  // S27 — suggestions d'aliments de saison (calculées depuis le radar).
  const [seasonalSugg, setSeasonalSugg] = useState<NutrientSuggestion[] | null>(null)
  // G4-a/EVO-1 — métriques superposées sur le 1er graphe + calories brûlées par jour (« écart »).
  const [selectedMetrics, setSelectedMetrics] = useState<MetricId[]>(["poids"])
  const [periodBurned, setPeriodBurned] = useState<{ date: string; burned: number }[]>([])

  // Restaure le choix de séries (persisté localement) au montage.
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null
      if (raw) {
        const arr = JSON.parse(raw)
        const valid = (["poids", "calories", "ecart", "glycemie"] as MetricId[]).filter((m) => arr.includes(m))
        if (valid.length) setSelectedMetrics(valid)
      }
    } catch { /* ignore */ }
  }, [])

  // Active/désactive une métrique (en garde toujours au moins une).
  const toggleMetric = (m: MetricId) => {
    setSelectedMetrics((prev) => {
      const next = prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
      const result = next.length ? next : prev
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result)) } catch { /* ignore */ }
      return result
    })
    setSelectedPoint(null)
  }

  useEffect(() => {
    const fetchDays = segment === "semaine" ? 7 : segment === "mois" ? 30 : segment === "annee" ? 365 : 7
    setSelectedPoint(null)
    let cancelled = false
    // En cas d'échec (ex. 429), on NE remplace PAS par des données périmées : on garde
    // l'état de période précédent (sinon le graphe « revient » au jour courant et semble
    // ne pas se synchroniser au changement d'échelle — bug signalé).
    Promise.all([
      getJournalRange(fetchDays).catch(() => null),
      getWeightHistory(fetchDays).catch(() => null),
      getGlucoseReadings(fetchDays).catch(() => null),
      getActivitiesRange(fetchDays).catch(() => null),
    ]).then(([m, w, g, b]) => {
      if (cancelled) return
      if (m) setPeriodMeals(m)
      if (w) setPeriodWeight(w)
      if (g) setPeriodGlucose(g)
      if (b) setPeriodBurned(b)
    })
    return () => { cancelled = true }
  }, [segment, mealEntries, weightHistory, glucoseReadings])

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

  useEffect(() => {
    const days = segment === "jour" ? 1 : segment === "semaine" ? 7 : segment === "mois" ? 30 : 365
    setLoadingAdditives(true)
    getAdditivesStats(days)
      .then(setAdditivesStats)
      .catch((err) => {
        console.error("[StatsScreen] getAdditivesStats failed:", err)
        setAdditivesStats(null)
      })
      .finally(() => setLoadingAdditives(false))
  }, [segment, scannedProducts.length])

  // Body composition from latest weight entry
  const latest = periodWeight.length > 0 ? periodWeight[periodWeight.length - 1] : null
  const first  = periodWeight.length > 0 ? periodWeight[0] : null
  const currentWeight = latest?.weight ?? user.weight
  const bmiVal  = bmi(currentWeight, user.height)
  const bfPct   = deurenbergBodyFat(currentWeight, user.height, user.age, user.sex)
  const lbm     = leanBodyMass(currentWeight, bfPct)
  const weightDelta = first && latest ? (latest.weight - first.weight) : 0
  const fatDeltaKg  = first && latest
    ? ((latest.bodyFat ?? bfPct) * latest.weight / 100) - ((first.bodyFat ?? bfPct) * first.weight / 100)
    : 0
  // G2 — couleur selon le RYTHME de variation (kg/semaine) : vert si physiologique (≤ 1 kg/sem),
  // orange entre 1 et 1,5, rouge si trop brutal (> 1,5 kg/sem), dans les deux sens.
  const weightSpanDays = first && latest
    ? Math.max(1, (new Date(latest.date).getTime() - new Date(first.date).getTime()) / 86400000)
    : 1
  const weeklyRate = Math.abs(weightDelta) / (weightSpanDays / 7)
  const weightColor = weeklyRate <= 1.0 ? "var(--primary)" : weeklyRate <= 1.5 ? "var(--amber)" : "var(--risk)"

  // BUG-1/2 — cible calorique EFFECTIVE : `targetCalories` si défini, sinon TDEE de maintien
  // calculé (Mifflin-St Jeor × activité). Évite la cible `undefined` → NaN → barres toutes
  // colorées pareil + ligne de référence absente.
  const tdeeMaintain = tdee(currentWeight, user.height, user.age, user.sex, user.activityLevel)
  const effectiveTarget =
    user.targetCalories && user.targetCalories > 0 ? user.targetCalories : tdeeMaintain

  // Calorie data depuis le journal réel. Année : 12 moyennes MENSUELLES (kcal/jour moyen
  // par mois) pour la lisibilité ; jour/semaine/mois : valeurs par jour. Jamais de données fictives.
  const calData: DayCalories[] = useMemo(() => {
    const result: DayCalories[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (segment === "annee") {
      for (let m = 11; m >= 0; m--) {
        const d = new Date(today.getFullYear(), today.getMonth() - m, 1)
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        const byDay: Record<string, { c: number; p: number; g: number; f: number }> = {}
        for (const e of periodMeals) {
          if (!e.date.startsWith(ym)) continue
          const day = (byDay[e.date] ||= { c: 0, p: 0, g: 0, f: 0 })
          day.c += (e.food.calories * e.amount) / 100
          day.p += (e.food.protein * e.amount) / 100
          day.g += (e.food.carbs * e.amount) / 100
          day.f += (e.food.fat * e.amount) / 100
        }
        const vals = Object.values(byDay)
        const n = vals.length || 1
        const avg = (sel: (x: { c: number; p: number; g: number; f: number }) => number) =>
          vals.length ? Math.round(vals.reduce((s, x) => s + sel(x), 0) / n) : 0
        result.push({ date: `${ym}-01`, label: "", calories: avg((x) => x.c), protein: avg((x) => x.p), carbs: avg((x) => x.g), fat: avg((x) => x.f) })
      }
      return result
    }

    const days = segment === "semaine" ? 7 : segment === "mois" ? 30 : 1
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      const dayEntries = periodMeals.filter((m) => m.date === dateStr)
      const calories = Math.round(dayEntries.reduce((s, m) => s + (m.food.calories * m.amount) / 100, 0))
      const protein  = Math.round(dayEntries.reduce((s, m) => s + (m.food.protein  * m.amount) / 100, 0))
      const carbs    = Math.round(dayEntries.reduce((s, m) => s + (m.food.carbs    * m.amount) / 100, 0))
      const fat      = Math.round(dayEntries.reduce((s, m) => s + (m.food.fat      * m.amount) / 100, 0))
      const label = days <= 7
        ? ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][d.getDay()]
        : String(d.getDate())
      result.push({ date: dateStr, label, calories, protein, carbs, fat })
    }
    return result
  }, [periodMeals, segment])

  const avgCalories = calData.length
    ? Math.round(calData.reduce((s, d) => s + d.calories, 0) / calData.length)
    : 0
  // Plafond de l'axe Y des barres calories : englobe la cible pour que la ligne de référence
  // reste TOUJOURS visible (sinon l'axe se cale sur les barres, souvent sous la cible).
  const calYMax = Math.max(effectiveTarget, ...calData.map((d) => d.calories), 0) * 1.08

  // ── Libellés d'axe adaptés à la période ──────────────────────────────────────
  // semaine/jour : jour de la semaine ; mois : n° de jour (clairsemé) ; année : mois.
  // Les libellés sont clairsemés mais TOUS les points restent tracés et cliquables.
  const labelText = (ds: string) => {
    const d = new Date(ds)
    if (segment === "annee") return d.toLocaleDateString(dateLocale, { month: "short" })
    if (segment === "mois") return d.toLocaleDateString(dateLocale, { day: "numeric" })
    return d.toLocaleDateString(dateLocale, { weekday: "short" })
  }
  // Ensemble des dates qui portent un libellé : 1er point de chaque mois (année),
  // 1 sur 5 (mois), tous (semaine/jour). Robuste même si les points sont espacés (ex. poids).
  const tickSetFor = (dates: string[]): Set<string> => {
    const set = new Set<string>()
    if (segment === "jour" || segment === "semaine") { dates.forEach((d) => set.add(d)); return set }
    if (segment === "annee") {
      let lastMonth = -1
      dates.forEach((ds) => { const m = new Date(ds).getMonth(); if (m !== lastMonth) { set.add(ds); lastMonth = m } })
    } else {
      dates.forEach((ds, i) => { if (i % 5 === 0) set.add(ds) })
    }
    return set
  }
  const calTicks = useMemo(() => tickSetFor(calData.map((c) => c.date)), [calData, segment]) // eslint-disable-line react-hooks/exhaustive-deps
  const exactDate = (ds: string) => new Date(ds).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" })

  // EVO-1/2/3 — séries par métrique (mêmes dates), bande poids dynamique, classification glycémie.
  const chart = useMemo(() => {
    // Séries individuelles, ne calculant QUE les métriques sélectionnées.
    const weightPts: DatedValue[] = periodWeight.map((w) => ({ date: w.date, value: w.weight }))
    const caloriePts: DatedValue[] = calData.map((c) => ({ date: c.date, value: c.calories }))

    const burnedByDate: Record<string, number> = {}
    for (const b of periodBurned) burnedByDate[b.date] = b.burned
    const monthAvgBurned = (ym: string) => {
      const mb = periodBurned.filter((b) => b.date.startsWith(ym))
      return mb.length ? Math.round(mb.reduce((s, b) => s + b.burned, 0) / mb.length) : 0
    }
    // BUG-3 — écart = (TDEE + brûlé) − ingéré (≠ ingéré quand exercice 0).
    const ecartPts: DatedValue[] = calData.map((c) => {
      const burned = segment === "annee" ? monthAvgBurned(c.date.slice(0, 7)) : (burnedByDate[c.date] || 0)
      return { date: c.date, value: computeEcart(c.calories, tdeeMaintain, burned) }
    })

    const byDay: Record<string, { sum: number; n: number }> = {}
    for (const r of periodGlucose) {
      const day = getLocalDateStr(new Date(r.timestamp)) // date LOCALE (cohérent avec calData ; plus d'UTC)
      const o = (byDay[day] ||= { sum: 0, n: 0 })
      o.sum += r.value
      o.n += 1
    }
    const glucosePts: DatedValue[] = Object.keys(byDay).sort()
      .map((date) => ({ date, value: Math.round(byDay[date].sum / byDay[date].n) / 100 }))

    const all: Record<MetricId, DatedValue[]> = { poids: weightPts, calories: caloriePts, ecart: ecartPts, glycemie: glucosePts }
    const selected: Partial<Record<MetricId, DatedValue[]>> = {}
    for (const m of selectedMetrics) selected[m] = all[m]

    // EVO-3 — bande dynamique du poids (uniquement si la série poids est active).
    const band = selectedMetrics.includes("poids") ? computeWeightBand(weightPts) : []
    const bandByDate: Record<string, { low: number; high: number; rapid: boolean }> = {}
    for (const p of band) bandByDate[p.date] = { low: p.low, high: p.high, rapid: p.rapid }
    // Segment rouge : pour chaque transition rapide (i-1 → i), on garde les DEUX extrémités
    // dans une série dédiée (null ailleurs) → seul ce segment est tracé en rouge.
    const segValByDate: Record<string, number> = {}
    band.forEach((p, i) => {
      if (p.rapid && i > 0) {
        segValByDate[p.date] = p.value
        segValByDate[band[i - 1].date] = band[i - 1].value
      }
    })

    const rows = mergeSeries(selected).map((row) => {
      const out: Record<string, number | string | boolean> = { ...row }
      const b = bandByDate[row.date as string]
      if (b) { out.poidsLow = b.low; out.poidsHigh = b.high; out.poidsRapid = b.rapid }
      if (segValByDate[row.date as string] != null) out.poidsSeg = segValByDate[row.date as string]
      // EVO-2 — drapeau hors-bande glycémie pour le marqueur du point.
      if (typeof row.glycemie === "number") out.glycemieOut = classifyGlucose(row.glycemie) !== "in"
      return out
    })

    return { rows, axes: axisLayout(selectedMetrics) }
  }, [selectedMetrics, calData, periodWeight, periodGlucose, periodBurned, segment, tdeeMaintain])

  const metricTicks = useMemo(() => tickSetFor(chart.rows.map((d) => d.date as string)), [chart, segment]) // eslint-disable-line react-hooks/exhaustive-deps
  const showWeightBand = selectedMetrics.includes("poids")
  const showGlucoseBand = selectedMetrics.includes("glycemie")
  const chartTitle = selectedMetrics.length === 1
    ? t(({ poids: "chartWeight", calories: "chartCalories", ecart: "chartGap", glycemie: "chartGlucose" } as const)[selectedMetrics[0]])
    : t("stats")
  const METRICS: { id: MetricId; label: string }[] = [
    { id: "poids", label: t("chartWeight") },
    { id: "calories", label: t("chartCalories") },
    { id: "ecart", label: t("chartGap") },
    { id: "glycemie", label: t("chartGlucose") },
  ]
  // Marqueur poids : rouge sur les variations rapides (EVO-3), invisible sinon.
  const renderWeightDot = (p: any) => {
    const { cx, cy, payload, index } = p
    if (cx == null || cy == null) return <g key={`wd-${index}`} />
    if (payload?.poidsRapid)
      return <circle key={`wd-${index}`} cx={cx} cy={cy} r={4} fill="var(--risk)" stroke="var(--card)" strokeWidth={1} />
    return <circle key={`wd-${index}`} cx={cx} cy={cy} r={0} fill="none" />
  }
  // Marqueur glycémie : rouge hors zone de référence (EVO-2), petit point sinon.
  const renderGlucoseDot = (p: any) => {
    const { cx, cy, payload, index } = p
    if (cx == null || cy == null) return <g key={`gd-${index}`} />
    if (payload?.glycemieOut)
      return <circle key={`gd-${index}`} cx={cx} cy={cy} r={4} fill="var(--risk)" stroke="var(--card)" strokeWidth={1} />
    return <circle key={`gd-${index}`} cx={cx} cy={cy} r={2} fill="var(--glucose)" />
  }
  const metricLabel = (m: MetricId) =>
    t(({ poids: "chartWeight", calories: "chartCalories", ecart: "chartGap", glycemie: "chartGlucose" } as const)[m])

  // (S27 — le calcul des suggestions est défini après `radarData`, dont il dépend.)

  // Macro donut (today)
  const macroDonut = [
    { name: t("protein"), value: dailyLog.totalProtein, color: "var(--glucose)" },
    { name: t("carbs"),   value: dailyLog.totalCarbs,   color: "var(--amber)"   },
    { name: t("fat"),     value: dailyLog.totalFat,     color: "var(--lipids)"  },
  ]

  // Glucose de la période sélectionnée (s'adapte à jour / semaine / mois / année)
  const weekGlucose = useMemo(() => {
    const days = segment === "jour" ? 1 : segment === "semaine" ? 7 : segment === "mois" ? 30 : 365
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    return periodGlucose
      .filter((r) => new Date(r.timestamp).getTime() > cutoff)
      .map((r) => r.value)
  }, [periodGlucose, segment])

  const glucoseMetrics = useMemo(
    // Cible utilisateur (ultrareview) — plus de 70/180 figé : TIR cohérent avec l'écran Glycémie.
    () => computeGlucoseMetrics(weekGlucose, glucoseTarget.low, glucoseTarget.high),
    [weekGlucose, glucoseTarget]
  )

  // Mini glucose scatter (7 pts sampled evenly for the stats card)
  const glucoseMiniData = useMemo(() => {
    if (weekGlucose.length === 0) return []
    const step = Math.max(1, Math.floor(weekGlucose.length / 7))
    return weekGlucose.filter((_, i) => i % step === 0).slice(0, 7).map((v, i) => ({ x: i, y: v }))
  }, [weekGlucose])

  // Index code additif → noms de produits scannés qui le contiennent (S10b)
  const productsByAdditiveCode = useMemo(() => {
    const index: Record<string, string[]> = {}
    for (const product of scannedProducts) {
      for (const additive of product.additives) {
        const code = (typeof additive === "string" ? additive : (additive?.code ?? "")).toUpperCase()
        if (!code) continue
        if (!index[code]) index[code] = []
        if (!index[code].includes(product.name)) index[code].push(product.name)
      }
    }
    return index
  }, [scannedProducts])

  // Radar vitamines & minéraux — entrées de la période sélectionnée
  const radarData = useMemo(() => {
    const days = segment === "semaine" ? 7 : segment === "mois" ? 30 : segment === "annee" ? 365 : 1
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const cutoffDate = new Date(today)
    cutoffDate.setDate(cutoffDate.getDate() - (days - 1))
    const cutoffStr = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, "0")}-${String(cutoffDate.getDate()).padStart(2, "0")}`
    const periodEntries = periodMeals.filter((m) => m.date >= cutoffStr)
    return calcRadarData(periodEntries, user.sex, DEFAULT_VNR)
  }, [periodMeals, segment, user.sex])

  // S27 — propose des aliments de saison pour les nutriments que le radar signale (< 70 % VNR).
  const loadSeasonalSuggestions = () => {
    const month = new Date().getMonth() + 1
    const deficient = radarData.nutrients
      .filter((n) => n.valuePercent < 70)
      .map((n) => ({ key: n.key, label: n.label }))
    setSeasonalSugg(suggestSeasonalFoods(deficient, month))
  }

  // Export RGPD en CSV lisible (Excel/Sheets) — une section par table, séparateur ';', BOM UTF-8 (S-AUDIT)
  const handleExport = async () => {
    try {
      const data = await exportUserData()
      const SEP = ";"
      const esc = (v: unknown) => {
        if (v == null) return ""
        const s = typeof v === "object" ? JSON.stringify(v) : String(v)
        return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
      }
      const lines: string[] = []
      const scalars: [string, unknown][] = []
      for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
        if (Array.isArray(val)) {
          lines.push("", "# " + key)
          if (!val.length) { lines.push("(vide)"); continue }
          const cols = Array.from(new Set(val.flatMap((o) => (o && typeof o === "object" ? Object.keys(o) : ["valeur"]))))
          lines.push(cols.map(esc).join(SEP))
          for (const row of val) {
            lines.push(row && typeof row === "object"
              ? cols.map((c) => esc((row as Record<string, unknown>)[c])).join(SEP)
              : esc(row))
          }
        } else {
          scalars.push([key, val])
        }
      }
      const head = scalars.length
        ? ["# " + t("exportSectionInfo"), t("exportColField") + SEP + t("exportColValue"), ...scalars.map(([k, v]) => esc(k) + SEP + esc(v))]
        : []
      const csv = "﻿" + [...head, ...lines].join("\r\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `nutrivita-export-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast(t("exportDone"), { duration: 2000 })
    } catch (err) {
      console.error("[StatsScreen] export failed:", err)
      toast(t("errorLoading"), { duration: 3000 })
    }
  }

  return (
    <div className={cn("flex flex-col min-h-screen bg-background pb-8", isRTL && "rtl")}>
      {/* Flat header */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-foreground">{t("stats")}</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Analysez vos progrès</p>
        </div>
        <button onClick={handleExport} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center" aria-label={t("export")}>
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

        {/* ─── Dissipation des calories (S13) — visible seulement si excédent du jour ─── */}
        <DissipationCard onOpenSettings={onOpenSettings} />

        {/* ─── 1. Graphe multi-séries (EVO-1/2/3) : Poids / Calories / Écart / Glycémie ─── */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[14px] font-semibold text-foreground">{chartTitle}</h3>
            {showWeightBand && periodWeight.length > 1 && (
              <div className="flex items-center gap-1.5">
                {weightDelta < 0 ? (
                  <TrendingDown className="h-4 w-4" style={{ color: weightColor }} />
                ) : (
                  <TrendingUp className="h-4 w-4" style={{ color: weightColor }} />
                )}
                <span className="text-[13px] font-semibold" style={{ color: weightColor }}>
                  {weightDelta > 0 ? "+" : ""}{weightDelta.toFixed(1)} kg
                </span>
              </div>
            )}
          </div>
          {/* EVO-1 — sélection MULTIPLE : on superpose les séries cochées. */}
          <div className="flex gap-1.5 mb-3">
            {METRICS.map((mx) => {
              const active = selectedMetrics.includes(mx.id)
              return (
                <button
                  key={mx.id}
                  onClick={() => toggleMetric(mx.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors border",
                    active
                      ? "text-primary-foreground border-transparent"
                      : "bg-muted text-muted-foreground border-transparent"
                  )}
                  style={active ? { backgroundColor: METRIC_COLOR[mx.id] } : undefined}
                >
                  {mx.label}
                </button>
              )
            })}
          </div>
          <ResponsiveContainer width="100%" height={170}>
            {advancedCharts ? (
              <LineChart data={chart.rows} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => (metricTicks.has(v) ? labelText(v) : "")}
                  interval={0}
                  minTickGap={0}
                />
                {chart.axes.map((ax) => (
                  <YAxis
                    key={ax.unit}
                    yAxisId={ax.unit}
                    orientation={ax.orientation}
                    domain={["auto", "auto"]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                    width={ax.unit === "kcal" ? 38 : 30}
                    label={{ value: ax.unit, angle: -90, position: ax.orientation === "left" ? "insideLeft" : "insideRight", fontSize: 9, fill: "var(--muted-foreground)" }}
                  />
                ))}
                {/* EVO-2 — bande de référence glycémie (fixe). */}
                {showGlucoseBand && (
                  <ReferenceArea
                    yAxisId="g/L"
                    y1={GLUCOSE_BAND.low}
                    y2={GLUCOSE_BAND.high}
                    fill="var(--glucose)"
                    fillOpacity={0.12}
                    ifOverflow="extendDomain"
                  />
                )}
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", fontSize: "12px" }}
                  formatter={(value: number, name: string) => {
                    const m = name as MetricId
                    const dec = METRIC_DECIMALS[m] ?? 0
                    return [`${Number(value).toFixed(dec)} ${metricUnit(m)}`, metricLabel(m)]
                  }}
                  labelFormatter={(v) => new Date(v).toLocaleDateString(dateLocale, { day: "numeric", month: "short" })}
                />
                {/* EVO-3 — bornes de la bande dynamique du poids (hors tooltip). */}
                {showWeightBand && (
                  <>
                    <Line yAxisId="kg" type="monotone" dataKey="poidsHigh" stroke="var(--primary)" strokeOpacity={0.35} strokeWidth={1} strokeDasharray="3 3" dot={false} activeDot={false} connectNulls tooltipType="none" isAnimationActive={false} />
                    <Line yAxisId="kg" type="monotone" dataKey="poidsLow" stroke="var(--primary)" strokeOpacity={0.35} strokeWidth={1} strokeDasharray="3 3" dot={false} activeDot={false} connectNulls tooltipType="none" isAnimationActive={false} />
                  </>
                )}
                {/* Une courbe par métrique sélectionnée (EVO-1). */}
                {selectedMetrics.map((m) => (
                  <Line
                    key={m}
                    yAxisId={metricUnit(m)}
                    type="monotone"
                    dataKey={m}
                    stroke={METRIC_COLOR[m]}
                    strokeWidth={2}
                    connectNulls
                    isAnimationActive={false}
                    activeDot={{ r: 4 }}
                    dot={m === "poids" ? renderWeightDot : m === "glycemie" ? renderGlucoseDot : false}
                  />
                ))}
                {/* EVO-3 — segment(s) de variation rapide du poids tracé(s) en rouge (par-dessus). */}
                {showWeightBand && (
                  <Line
                    yAxisId="kg"
                    type="monotone"
                    dataKey="poidsSeg"
                    stroke="var(--risk)"
                    strokeWidth={3}
                    dot={false}
                    activeDot={false}
                    connectNulls={false}
                    tooltipType="none"
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            ) : (
              // P2 — mode simple : mêmes données/axes/unités, en barres (sans les nuances
              // avancées bande de poids / segment rapide, réservées au mode courbes).
              <BarChart data={chart.rows} margin={{ top: 4, right: 4, bottom: 0, left: 4 }} barCategoryGap="25%">
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => (metricTicks.has(v) ? labelText(v) : "")}
                  interval={0}
                  minTickGap={0}
                />
                {chart.axes.map((ax) => (
                  <YAxis
                    key={ax.unit}
                    yAxisId={ax.unit}
                    orientation={ax.orientation}
                    domain={["auto", "auto"]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                    width={ax.unit === "kcal" ? 38 : 30}
                    label={{ value: ax.unit, angle: -90, position: ax.orientation === "left" ? "insideLeft" : "insideRight", fontSize: 9, fill: "var(--muted-foreground)" }}
                  />
                ))}
                {showGlucoseBand && (
                  <ReferenceArea yAxisId="g/L" y1={GLUCOSE_BAND.low} y2={GLUCOSE_BAND.high} fill="var(--glucose)" fillOpacity={0.12} ifOverflow="extendDomain" />
                )}
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", fontSize: "12px" }}
                  formatter={(value: number, name: string) => {
                    const m = name as MetricId
                    const dec = METRIC_DECIMALS[m] ?? 0
                    return [`${Number(value).toFixed(dec)} ${metricUnit(m)}`, metricLabel(m)]
                  }}
                  labelFormatter={(v) => new Date(v).toLocaleDateString(dateLocale, { day: "numeric", month: "short" })}
                />
                {selectedMetrics.map((m) => (
                  <Bar key={m} yAxisId={metricUnit(m)} dataKey={m} fill={METRIC_COLOR[m]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
          {/* Légende dynamique. */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {selectedMetrics.map((m) => (
              <span key={m} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: METRIC_COLOR[m] }} />
                {metricLabel(m)}
              </span>
            ))}
            {showGlucoseBand && (
              <span className="text-[11px] text-muted-foreground">
                · {t("chartGlucose")} {GLUCOSE_BAND.low.toFixed(2)}–{GLUCOSE_BAND.high.toFixed(2)} g/L
              </span>
            )}
          </div>
        </div>

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
            <span className="text-[13px] text-muted-foreground">{t("average")} {avgCalories} kcal</span>
          </div>
          {selectedPoint?.chart === "cal" && (
            <p className="text-[12px] text-muted-foreground -mt-1 mb-2">
              {exactDate(selectedPoint.date)} · <span className="font-semibold text-foreground">{selectedPoint.text}</span>
            </p>
          )}
          <LazyMount minHeight={160}>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={calData}
              barCategoryGap="30%"
              onClick={(s: any) => {
                const p = s?.activePayload?.[0]?.payload
                if (p) setSelectedPoint({ chart: "cal", date: p.date, text: `${p.calories} kcal` })
              }}
            >
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={(v) => (calTicks.has(v) ? labelText(v) : "")}
                interval={0}
                minTickGap={0}
              />
              {/* Domaine Y forcé à inclure la cible → la ligne de référence est TOUJOURS visible
                  (sinon l'axe se cale sur les barres et la cible, plus haute, sort du cadre). */}
              <YAxis hide domain={[0, calYMax]} />
              <ReferenceLine
                y={effectiveTarget}
                stroke="var(--primary)"
                strokeDasharray="4 3"
                strokeOpacity={0.85}
                label={{ value: `${t("calorieGoal")} ${effectiveTarget}`, position: "insideTopRight", fontSize: 10, fill: "var(--primary)" }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", fontSize: "12px" }}
                formatter={(v: number) => [`${Math.round(v)} kcal`, "Calories"]}
                labelFormatter={(_, payload: any) => (payload?.[0]?.payload?.date ? exactDate(payload[0].payload.date) : "")}
              />
              <Bar dataKey="calories" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                {calData.map((entry, idx) => (
                  <Cell key={idx} fill={getBarFill(entry.calories, effectiveTarget)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </LazyMount>
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

        {/* ─── 4. Glycémie — affichée si suivi activé OU si des mesures existent (N<12 guard AL-05) ─── */}
        {(user.isDiabetic || periodGlucose.length > 0) && (
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
                  <LazyMount minHeight={60}>
                  <ResponsiveContainer width="100%" height={60}>
                    <ScatterChart margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                      <XAxis type="number" dataKey="x" hide />
                      <YAxis type="number" dataKey="y" domain={[60, 220]} hide />
                      <ReferenceLine y={70}  stroke="var(--primary)" strokeDasharray="2 2" strokeOpacity={0.5} />
                      <ReferenceLine y={180} stroke="var(--primary)" strokeDasharray="2 2" strokeOpacity={0.5} />
                      <Scatter data={glucoseMiniData} fill="var(--glucose)" />
                    </ScatterChart>
                  </ResponsiveContainer>
                  </LazyMount>
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

        {/* ─── 6. Radar vitamines & minéraux (REG-05) ─────────────────────── */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="text-[14px] font-semibold text-foreground mb-1">
            {t("vitaminMineralRadar")}
          </h3>

          {/* Radar SVG (avancé) ou barres simples par nutriment (simple) — même donnée radarData. */}
          {advancedCharts ? (
            <MicronutrientsRadar data={radarData} className="w-full max-w-[320px] mx-auto block" />
          ) : (
            <div className="space-y-2 py-1">
              {radarData.nutrients.map((n) => {
                const pct = Math.min(100, n.valuePercent)
                const color = n.valuePercent < 70 ? "var(--risk)" : n.valuePercent < 90 ? "var(--amber)" : "var(--primary)"
                return (
                  <div key={n.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] text-foreground">{n.label}</span>
                      <span className="text-[11px] font-semibold" style={{ color }}>{n.valuePercent}% VNR</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Axes < 70% VNR */}
          {radarData.nutrients.filter((n) => n.valuePercent < 70).length > 0 && (
            <div className="mt-3">
              <p className="text-[12px] font-semibold text-foreground mb-1.5">
                {t("improveIntake")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {radarData.nutrients
                  .filter((n) => n.valuePercent < 70)
                  .map((n) => (
                    <span
                      key={n.key}
                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{ backgroundColor: "var(--amber-bg, #FFF3CD)", color: "#BA7517" }}
                    >
                      {n.label} {n.valuePercent}%
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Indicateur de complétude */}
          <p className="text-[11px] text-muted-foreground mt-3 leading-snug">
            {t("estimationBased").replace("{pct}", String(radarData.overallCompleteness))}
          </p>

          {/* Avertissement données insuffisantes */}
          {radarData.overallCompleteness < 40 && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-muted/40 mt-2">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#BA7517" }} />
              <p className="text-[11px] font-semibold leading-snug" style={{ color: "#BA7517" }}>
                {t("lowDataWarning")}
              </p>
            </div>
          )}

          {/* Disclaimer REG-05 obligatoire — langue active uniquement */}
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-muted/40 mt-2">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--amber)" }} />
            <p className="text-[11px] text-muted-foreground leading-snug" dir={isRTL ? "rtl" : undefined}>
              {t("radarDisclaimer")}
            </p>
          </div>

          {/* S27 — Idées d'aliments naturels & de saison pour combler les carences */}
          <button
            onClick={loadSeasonalSuggestions}
            className="w-full mt-3 py-2 rounded-xl border border-border text-[13px] font-medium text-foreground bg-muted/40"
          >
            {t("seasonalFoodIdeas")}
          </button>
          {seasonalSugg && seasonalSugg.length > 0 && (
            <div className="mt-3 space-y-3">
              {seasonalSugg.map((s) => (
                <div key={s.key}>
                  <p className="text-[12px] font-semibold text-foreground mb-1">{s.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.foods.map((f) => (
                      <span
                        key={f}
                        className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{ backgroundColor: "var(--primary-bg, #E6F4EF)", color: "var(--primary)" }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {seasonalSugg && seasonalSugg.length === 0 && (
            <p className="text-[12px] text-muted-foreground mt-2">{t("noDeficiencyPeriod")}</p>
          )}
        </div>

        {/* ─── 7. Additifs EFSA (AL-S4 REG-05) ───────────────────────────── */}
        <AdditivesBars stats={additivesStats} loading={loadingAdditives} productsByAdditiveCode={productsByAdditiveCode} />

        {/* Export button */}
        <Button variant="outline" className="w-full gap-2 rounded-xl" onClick={handleExport}>
          <FileText className="h-4 w-4" />
          {t("export")}
        </Button>
      </div>
    </div>
  )
}
