// P1 redesign — moteur de calcul client (fonctions pures) pour les 4 nouveaux
// écrans. Aucune dépendance réseau ici : on dérive tout des données déjà
// disponibles (journal, glycémie, poids, profil). Là où un vrai endpoint backend
// donnerait un meilleur résultat (NOVA/additifs par repas, détection de patterns
// serveur), c'est marqué « TODO backend » — premier jet volontairement heuristique.

import type { MealEntry, GlucoseReading, WeightEntry, User } from "@/lib/types"
import { getLocalDateStr } from "@/lib/date-utils"
import { calcRadarData } from "@/lib/micronutrients-radar"

// ────────────────────────────────────────────────────────────────────────────
// Helpers de base
// ────────────────────────────────────────────────────────────────────────────

export interface Totals {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export function entryKcal(m: MealEntry): number {
  return (m.food.calories * m.amount) / 100
}

export function totalsFor(entries: MealEntry[]): Totals {
  return entries.reduce<Totals>(
    (acc, m) => {
      const f = m.food
      const k = m.amount / 100
      acc.kcal += (f.calories || 0) * k
      acc.protein += (f.protein || 0) * k
      acc.carbs += (f.carbs || 0) * k
      acc.fat += (f.fat || 0) * k
      return acc
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

export interface MacroTargetsG {
  protein: number
  carbs: number
  fat: number
}

export function macroTargetsG(user: User): MacroTargetsG {
  return {
    protein: Math.round((user.targetCalories * (user.macros.protein / 100)) / 4),
    carbs: Math.round((user.targetCalories * (user.macros.carbs / 100)) / 4),
    fat: Math.round((user.targetCalories * (user.macros.fat / 100)) / 9),
  }
}

/** Regroupe des repas par date (YYYY-MM-DD). */
export function groupByDate(entries: MealEntry[]): Map<string, MealEntry[]> {
  const map = new Map<string, MealEntry[]>()
  for (const m of entries) {
    const arr = map.get(m.date)
    if (arr) arr.push(m)
    else map.set(m.date, [m])
  }
  return map
}

/** Renvoie les N derniers jours (dates locales), du plus ancien au plus récent. */
export function lastNDates(n: number, end: Date = new Date()): string[] {
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)
    out.push(getLocalDateStr(d))
  }
  return out
}

// ────────────────────────────────────────────────────────────────────────────
// Écran 1 — Accueil : insight du jour + prochaine action
// ────────────────────────────────────────────────────────────────────────────

export type MealType = MealEntry["mealType"]

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "snack", "dinner"]

/** Repère le créneau de repas attendu selon l'heure. */
export function currentMealSlot(now: Date = new Date()): MealType {
  const h = now.getHours()
  if (h < 10) return "breakfast"
  if (h < 15) return "lunch"
  if (h < 18) return "snack"
  return "dinner"
}

export interface NextAction {
  mealType: MealType
  yesterdayLabel: string | null
  yesterdayKcal: number | null
}

/**
 * Prochaine action contextuelle : le prochain repas non saisi aujourd'hui,
 * avec un rappel de ce qui avait été mangé hier au même créneau (1 tap = dupliquer).
 */
export function buildNextAction(
  todayMeals: MealEntry[],
  historyMeals: MealEntry[],
  now: Date = new Date(),
): NextAction {
  const loggedSlots = new Set(todayMeals.map((m) => m.mealType))
  const slot = currentMealSlot(now)
  // Prochain créneau non encore saisi, à partir du créneau courant.
  let target: MealType = slot
  const startIdx = MEAL_ORDER.indexOf(slot)
  for (let i = startIdx; i < MEAL_ORDER.length; i++) {
    if (!loggedSlots.has(MEAL_ORDER[i])) {
      target = MEAL_ORDER[i]
      break
    }
  }

  const yesterday = getLocalDateStr(new Date(now.getTime() - 86400000))
  const yEntries = historyMeals.filter((m) => m.date === yesterday && m.mealType === target)
  if (yEntries.length === 0) {
    return { mealType: target, yesterdayLabel: null, yesterdayKcal: null }
  }
  const kcal = Math.round(totalsFor(yEntries).kcal)
  const main = [...yEntries].sort((a, b) => entryKcal(b) - entryKcal(a))[0]
  return { mealType: target, yesterdayLabel: main.food.name, yesterdayKcal: kcal }
}

export interface DailyInsight {
  text: string
  cta: "glucose" | null
}

/**
 * Insight du jour — heuristique premier jet à partir des données existantes.
 * TODO backend : remplacer par un vrai moteur d'insights côté serveur.
 * `lang` sert à choisir la langue du texte généré (fr/ar/en couverts).
 */
export function buildDailyInsight(
  historyMeals: MealEntry[],
  glucose: GlucoseReading[],
  user: User,
  lang: "fr" | "ar" | "en",
): DailyInsight | null {
  const pattern = detectGlucosePattern(historyMeals, glucose)
  if (pattern) {
    const txt = {
      fr: "Tes déjeuners riches en glucides rapides précèdent souvent tes pics de glycémie de l'après-midi. Ajouter des protéines au déjeuner pourrait lisser la courbe.",
      ar: "غالبًا ما تسبق وجبات الغداء الغنية بالكربوهيدرات السريعة ارتفاعات سكر الدم بعد الظهر. إضافة البروتين للغداء قد يخفّف المنحنى.",
      en: "Your carb-heavy lunches often precede afternoon glucose spikes. Adding protein at lunch could smooth the curve.",
    }[lang]
    return { text: txt, cta: "glucose" }
  }

  // Sinon : protéines nettement sous la cible sur les 3 derniers jours ?
  const recent = lastNDates(3)
  const byDate = groupByDate(historyMeals)
  const tgt = macroTargetsG(user)
  let deficitDays = 0
  let counted = 0
  for (const d of recent) {
    const entries = byDate.get(d)
    if (!entries || entries.length === 0) continue
    counted++
    if (totalsFor(entries).protein < tgt.protein * 0.7) deficitDays++
  }
  if (counted >= 2 && deficitDays >= 2) {
    const txt = {
      fr: `Tes apports en protéines sont sous ta cible (${tgt.protein} g/j) ces derniers jours. Un œuf, du yaourt grec ou des légumineuses aident à combler l'écart.`,
      ar: `كان تناولك للبروتين أقل من هدفك (${tgt.protein} غ/يوم) هذه الأيام. بيضة أو زبادي يوناني أو بقوليات تساعد على سدّ الفارق.`,
      en: `Your protein intake has been below target (${tgt.protein} g/day) recently. An egg, Greek yogurt or legumes help close the gap.`,
    }[lang]
    return { text: txt, cta: null }
  }

  return null
}

// ────────────────────────────────────────────────────────────────────────────
// Écran 2 — Tendances : heatmap, macros empilées, poids lissé
// ────────────────────────────────────────────────────────────────────────────

export type AdherenceLevel = "empty" | "partial" | "in" | "over"

export interface HeatCell {
  date: string
  level: AdherenceLevel
  kcal: number
  isToday: boolean
}

/** Heatmap d'adhérence calorique sur `days` jours (défaut 30). */
export function buildAdherenceHeatmap(
  historyMeals: MealEntry[],
  user: User,
  days = 30,
): { cells: HeatCell[]; inTarget: number } {
  const byDate = groupByDate(historyMeals)
  const target = user.targetCalories || 2000
  const todayStr = getLocalDateStr()
  const cells: HeatCell[] = lastNDates(days).map((date) => {
    const entries = byDate.get(date)
    const kcal = entries ? Math.round(totalsFor(entries).kcal) : 0
    let level: AdherenceLevel = "empty"
    if (kcal > 0) {
      const ratio = kcal / target
      if (ratio > 1.15) level = "over"
      else if (ratio >= 0.8) level = "in"
      else level = "partial"
    }
    return { date, level, kcal, isToday: date === todayStr }
  })
  const inTarget = cells.filter((c) => c.level === "in").length
  return { cells, inTarget }
}

export interface DayMacros {
  date: string
  weekdayShort: string
  protein: number
  carbs: number
  fat: number
}

const WEEKDAY_SHORT: Record<string, string[]> = {
  fr: ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"],
  ar: ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
}

/** Séries de macros empilées par jour, sur `days` jours (défaut 7). */
export function buildDailyMacros(
  historyMeals: MealEntry[],
  days = 7,
  lang: "fr" | "ar" | "en" = "fr",
): DayMacros[] {
  const byDate = groupByDate(historyMeals)
  const labels = WEEKDAY_SHORT[lang] ?? WEEKDAY_SHORT.fr
  return lastNDates(days).map((date) => {
    const entries = byDate.get(date) ?? []
    const t = totalsFor(entries)
    const wd = new Date(date + "T00:00:00").getDay()
    return {
      date,
      weekdayShort: labels[wd],
      protein: Math.round(t.protein),
      carbs: Math.round(t.carbs),
      fat: Math.round(t.fat),
    }
  })
}

export interface WeightPoint {
  date: string
  raw: number
  smoothed: number
}

export interface SmoothedWeight {
  points: WeightPoint[]
  slopePerMonth: number // kg/mois (négatif = perte)
  min: number
  max: number
}

/** Poids brut + moyenne mobile 7 j + pente en kg/mois. */
export function buildSmoothedWeight(weightHistory: WeightEntry[]): SmoothedWeight | null {
  const sorted = [...weightHistory]
    .filter((w) => typeof w.weight === "number")
    .sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length < 2) return null

  const points: WeightPoint[] = sorted.map((w, i) => {
    const window = sorted.slice(Math.max(0, i - 6), i + 1)
    const avg = window.reduce((s, x) => s + x.weight, 0) / window.length
    return { date: w.date, raw: w.weight, smoothed: Math.round(avg * 10) / 10 }
  })

  const first = points[0]
  const last = points[points.length - 1]
  const spanDays = Math.max(
    1,
    (new Date(last.date).getTime() - new Date(first.date).getTime()) / 86400000,
  )
  const slopePerMonth =
    Math.round(((last.smoothed - first.smoothed) / spanDays) * 30 * 10) / 10

  const vals = points.flatMap((p) => [p.raw, p.smoothed])
  return {
    points,
    slopePerMonth,
    min: Math.min(...vals),
    max: Math.max(...vals),
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Écran 3 — Glycémie × Repas
// ────────────────────────────────────────────────────────────────────────────

export interface GlucosePoint {
  minutes: number // depuis minuit
  valueMgDl: number
}

export interface MealMarker {
  minutes: number
  mealType: MealType
  kcal: number
  carbs: number
  deltaMgDl: number | null
  peakMgDl: number | null
  foodName: string
}

export interface DayTimeline {
  points: GlucosePoint[]
  markers: MealMarker[]
  tir: number | null // % dans la cible pour la journée
  maxPeakDeltaMgDl: number | null
}

function minutesOf(ts: string): number {
  const d = new Date(ts)
  return d.getHours() * 60 + d.getMinutes()
}

/**
 * Delta post-prandial d'un repas : pic dans les 2 h suivant le repas,
 * moins la dernière lecture avant le repas (fenêtre 45 min).
 */
export function postprandial(
  mealMs: number,
  readings: GlucoseReading[],
): { deltaMgDl: number; peakMgDl: number } | null {
  const pre = readings
    .filter((r) => {
      const t = new Date(r.timestamp).getTime()
      return t <= mealMs && t >= mealMs - 45 * 60000
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
  const after = readings.filter((r) => {
    const t = new Date(r.timestamp).getTime()
    return t > mealMs && t <= mealMs + 2 * 3600000
  })
  if (!pre || after.length === 0) return null
  const peak = Math.max(...after.map((r) => r.value))
  return { deltaMgDl: Math.round(peak - pre.value), peakMgDl: Math.round(peak) }
}

/** Construit la timeline glycémie × repas pour une date donnée. */
export function buildDayTimeline(
  date: string,
  glucose: GlucoseReading[],
  meals: MealEntry[],
  target: { low: number; high: number },
): DayTimeline {
  const dayGlucose = glucose
    .filter((r) => getLocalDateStr(new Date(r.timestamp)) === date)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const points: GlucosePoint[] = dayGlucose.map((r) => ({
    minutes: minutesOf(r.timestamp),
    valueMgDl: r.value,
  }))

  // Un marqueur par créneau de repas saisi ce jour.
  const dayMeals = meals.filter((m) => m.date === date)
  const bySlot = new Map<MealType, MealEntry[]>()
  for (const m of dayMeals) {
    const arr = bySlot.get(m.mealType)
    if (arr) arr.push(m)
    else bySlot.set(m.mealType, [m])
  }

  const markers: MealMarker[] = []
  for (const slot of MEAL_ORDER) {
    const entries = bySlot.get(slot)
    if (!entries || entries.length === 0) continue
    const withTime = entries.filter((e) => e.createdAt)
    const ts = withTime.length ? withTime[0].createdAt : `${date}T12:00:00`
    const mealMs = new Date(ts).getTime()
    const t = totalsFor(entries)
    const pp = postprandial(mealMs, dayGlucose)
    const main = [...entries].sort((a, b) => entryKcal(b) - entryKcal(a))[0]
    markers.push({
      minutes: minutesOf(ts),
      mealType: slot,
      kcal: Math.round(t.kcal),
      carbs: Math.round(t.carbs),
      deltaMgDl: pp?.deltaMgDl ?? null,
      peakMgDl: pp?.peakMgDl ?? null,
      foodName: main.food.name,
    })
  }

  let tir: number | null = null
  if (dayGlucose.length > 0) {
    const inRange = dayGlucose.filter((r) => r.value >= target.low && r.value <= target.high).length
    tir = Math.round((inRange / dayGlucose.length) * 100)
  }
  const deltas = markers.map((m) => m.deltaMgDl).filter((d): d is number => d !== null)
  const maxPeakDeltaMgDl = deltas.length ? Math.max(...deltas) : null

  return { points, markers, tir, maxPeakDeltaMgDl }
}

export interface GlucosePattern {
  count: number
  total: number
  carbThreshold: number
  peakThresholdMgDl: number
}

/**
 * Détection de pattern simple sur ~14 j : déjeuners riches en glucides suivis
 * d'un pic. TODO backend : moteur de corrélation serveur plus robuste.
 */
export function detectGlucosePattern(
  historyMeals: MealEntry[],
  glucose: GlucoseReading[],
): GlucosePattern | null {
  const CARB = 80
  const PEAK = 170 // mg/dL (~1,70 g/L)
  const cutoff = Date.now() - 14 * 86400000
  const lunches = historyMeals.filter(
    (m) => m.mealType === "lunch" && new Date(m.date + "T00:00:00").getTime() >= cutoff,
  )
  // Regrouper les déjeuners par jour et sommer les glucides.
  const byDate = new Map<string, MealEntry[]>()
  for (const m of lunches) {
    const arr = byDate.get(m.date)
    if (arr) arr.push(m)
    else byDate.set(m.date, [m])
  }
  let total = 0
  let count = 0
  for (const [date, entries] of byDate) {
    const carbs = totalsFor(entries).carbs
    if (carbs < CARB) continue
    total++
    const lunchMs = new Date(entries.find((e) => e.createdAt)?.createdAt ?? `${date}T12:30:00`).getTime()
    const after = glucose.filter((r) => {
      const t = new Date(r.timestamp).getTime()
      return t > lunchMs && t <= lunchMs + 3 * 3600000
    })
    if (after.some((r) => r.value >= PEAK)) count++
  }
  if (total < 3 || count < 2) return null
  return { count, total, carbThreshold: CARB, peakThresholdMgDl: PEAK }
}

// ────────────────────────────────────────────────────────────────────────────
// Écran 4 — Score Santé hebdomadaire
// ────────────────────────────────────────────────────────────────────────────

export interface ScoreComponents {
  adherence: number
  quality: number
  micro: number
  macro: number
}

export interface HealthScore {
  total: number
  prevTotal: number | null
  components: ScoreComponents
  history: { week: string; score: number }[]
  actions: { points: number; textKey: ScoreActionKey }[]
}

export type ScoreActionKey = "reduceUltraProcessed" | "addLegumes" | "logMissedDay" | "moreProtein"

const WEIGHTS = { adherence: 0.4, quality: 0.25, micro: 0.2, macro: 0.15 }

function scoreForRange(
  meals: MealEntry[],
  user: User,
  dates: string[],
): ScoreComponents {
  const byDate = groupByDate(meals)
  const target = user.targetCalories || 2000
  const tgt = macroTargetsG(user)

  // Adhérence : jours (avec saisie) dont kcal dans [0.8, 1.15] × cible.
  let logged = 0
  let inBand = 0
  const macroDiffs: number[] = []
  let qualityAccWeight = 0
  let qualityAccGood = 0
  for (const d of dates) {
    const entries = byDate.get(d)
    if (!entries || entries.length === 0) continue
    logged++
    const t = totalsFor(entries)
    const ratio = t.kcal / target
    if (ratio >= 0.8 && ratio <= 1.15) inBand++
    // Équilibre macros : écart % vs cible.
    const totG = t.protein + t.carbs + t.fat || 1
    const actPct = { p: t.protein / totG, c: t.carbs / totG, f: t.fat / totG }
    const tgtG = tgt.protein + tgt.carbs + tgt.fat || 1
    const tgtPct = { p: tgt.protein / tgtG, c: tgt.carbs / tgtG, f: tgt.fat / tgtG }
    const diff =
      Math.abs(actPct.p - tgtPct.p) + Math.abs(actPct.c - tgtPct.c) + Math.abs(actPct.f - tgtPct.f)
    macroDiffs.push(diff)
    // Qualité produits : approx par source (estimated = moins fiable/moins bon).
    // TODO backend : vrai score NOVA + additifs EFSA par produit.
    for (const m of entries) {
      qualityAccWeight++
      if (m.food.source === "ciqual" || m.food.source === "nutrivita") qualityAccGood += 1
      else if (m.food.source === "usda") qualityAccGood += 0.85
      else qualityAccGood += 0.5 // estimated / photo IA
    }
  }

  const adherence = logged > 0 ? Math.round((inBand / logged) * 100) : 0
  const macro =
    macroDiffs.length > 0
      ? Math.round(Math.max(0, 100 - (macroDiffs.reduce((s, x) => s + x, 0) / macroDiffs.length) * 100))
      : 0
  const quality = qualityAccWeight > 0 ? Math.round((qualityAccGood / qualityAccWeight) * 100) : 0

  // Micronutriments : moyenne des % vs VNR (calcRadarData gère les null).
  const radar = calcRadarData(meals.filter((m) => dates.includes(m.date)), user.sex)
  const micro =
    radar.nutrients.length > 0
      ? Math.round(radar.nutrients.reduce((s, n) => s + Math.min(100, n.valuePercent), 0) / radar.nutrients.length)
      : 0

  return { adherence, quality, micro, macro }
}

function weightedTotal(c: ScoreComponents): number {
  return Math.round(
    c.adherence * WEIGHTS.adherence +
      c.quality * WEIGHTS.quality +
      c.micro * WEIGHTS.micro +
      c.macro * WEIGHTS.macro,
  )
}

/** Score Santé hebdo agrégé + 8 semaines d'historique + actions chiffrées. */
export function computeHealthScore(historyMeals: MealEntry[], user: User): HealthScore {
  const thisWeek = lastNDates(7)
  const components = scoreForRange(historyMeals, user, thisWeek)
  const total = weightedTotal(components)

  const prevWeekEnd = new Date()
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 7)
  const prevWeek = lastNDates(7, prevWeekEnd)
  const prevComponents = scoreForRange(historyMeals, user, prevWeek)
  const prevHasData = prevWeek.some((d) => historyMeals.some((m) => m.date === d))
  const prevTotal = prevHasData ? weightedTotal(prevComponents) : null

  // Historique 8 semaines.
  const history: { week: string; score: number }[] = []
  for (let w = 7; w >= 0; w--) {
    const end = new Date()
    end.setDate(end.getDate() - w * 7)
    const dates = lastNDates(7, end)
    const hasData = dates.some((d) => historyMeals.some((m) => m.date === d))
    const sc = hasData ? weightedTotal(scoreForRange(historyMeals, user, dates)) : 0
    history.push({ week: `S${isoWeek(end)}`, score: sc })
  }

  // Actions : dérivées des composantes les plus faibles.
  const actions: { points: number; textKey: ScoreActionKey }[] = []
  const ranked = (Object.entries(components) as [keyof ScoreComponents, number][]).sort(
    (a, b) => a[1] - b[1],
  )
  for (const [key] of ranked) {
    if (actions.length >= 3) break
    if (key === "quality") actions.push({ points: 6, textKey: "reduceUltraProcessed" })
    else if (key === "micro") actions.push({ points: 4, textKey: "addLegumes" })
    else if (key === "adherence") actions.push({ points: 3, textKey: "logMissedDay" })
    else if (key === "macro") actions.push({ points: 3, textKey: "moreProtein" })
  }

  return { total, prevTotal, components, history, actions }
}

function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export const SCORE_ACTION_TEXT: Record<"fr" | "ar" | "en", Record<ScoreActionKey, string>> = {
  fr: {
    reduceUltraProcessed: "Remplace un produit ultra-transformé par une alternative brute (NOVA 1-2).",
    addLegumes: "Ajoute 2 portions de légumineuses pour combler fer et folates.",
    logMissedDay: "Tiens le journal le jour où tu oublies le plus souvent.",
    moreProtein: "Vise ta cible de protéines à chaque repas principal.",
  },
  ar: {
    reduceUltraProcessed: "استبدل منتجًا فائق المعالجة ببديل طبيعي (نوفا ١-٢).",
    addLegumes: "أضف حصتين من البقوليات لسدّ نقص الحديد والفولات.",
    logMissedDay: "سجّل يومياتك في اليوم الذي تنساه غالبًا.",
    moreProtein: "استهدف حصتك من البروتين في كل وجبة رئيسية.",
  },
  en: {
    reduceUltraProcessed: "Swap one ultra-processed product for a whole-food alternative (NOVA 1-2).",
    addLegumes: "Add 2 servings of legumes to close iron and folate gaps.",
    logMissedDay: "Log your journal on the day you most often forget.",
    moreProtein: "Hit your protein target at every main meal.",
  },
}
