"use client"

// P1-4 — Glycémie × Repas (maquette 3). LE différenciateur marché : ni Yazio,
// ni MyFitnessPal, ni Lifesum ne croisent journal alimentaire et glycémie.
// Timeline de la journée + delta post-prandial par repas + détection de pattern
// sur 14 j. Disclaimer REG-04 permanent en tête.

import { useEffect, useState } from "react"
import { useApp } from "@/lib/app-context"
import { getJournalRange, getGlucoseMeals } from "@/lib/api"
import { formatGlucose, toGlucoseUnit } from "@/lib/glucose-units"
import { getLocalDateStr } from "@/lib/date-utils"
import { P1 } from "@/lib/p1-i18n"
import { buildDayTimeline, detectGlucosePattern, type MealType, type DayTimeline, type GlucosePattern } from "@/lib/p1-insights"
import { LazyMount } from "./lazy-mount"

const MEAL_EMOJI: Record<MealType, string> = { breakfast: "☕", lunch: "🍽️", snack: "🍎", dinner: "🌙" }
const MEAL_NAME: Record<MealType, { fr: string; ar: string; en: string }> = {
  breakfast: { fr: "Petit-déjeuner", ar: "الفطور", en: "Breakfast" },
  lunch: { fr: "Déjeuner", ar: "الغداء", en: "Lunch" },
  snack: { fr: "Collation", ar: "وجبة خفيفة", en: "Snack" },
  dinner: { fr: "Dîner", ar: "العشاء", en: "Dinner" },
}

function deltaColor(deltaMgDl: number | null): { bg: string; fg: string } {
  if (deltaMgDl === null) return { bg: "var(--muted)", fg: "var(--muted-foreground)" }
  const token = deltaMgDl >= 40 ? "risk" : deltaMgDl >= 25 ? "amber" : "primary"
  return { bg: `color-mix(in oklab, var(--${token}) 15%, transparent)`, fg: `var(--${token})` }
}

export function GlucoseMealsScreen() {
  const { glucoseReadings, user, language, isRTL } = useApp()
  const P = P1[language]
  const unit = user.units.glucose
  const today = getLocalDateStr()
  const [timeline, setTimeline] = useState<DayTimeline>({ points: [], markers: [], tir: null, maxPeakDeltaMgDl: null })
  const [pattern, setPattern] = useState<GlucosePattern | null>(null)

  useEffect(() => {
    let alive = true
    // Fix E2E : dépendance sur `today` UNIQUEMENT. Avant, `glucoseReadings` et
    // `user.glucoseTarget` (réfs recréées à chaque render) relançaient l'effet en
    // boucle → rafales d'appels 404 + gel du renderer. On fetch une fois par jour.
    getGlucoseMeals(today)
      .then((r) => {
        if (!alive) return
        setTimeline(r.timeline as unknown as DayTimeline)
        setPattern(r.pattern)
      })
      .catch(() => {
        getJournalRange(14)
          .then((rows) => {
            if (!alive) return
            setTimeline(buildDayTimeline(today, glucoseReadings, rows, user.glucoseTarget))
            setPattern(detectGlucosePattern(rows, glucoseReadings))
          })
          .catch(() => {})
      })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today])

  const dateLabel = new Date(today + "T00:00:00").toLocaleDateString(
    { fr: "fr-FR", ar: "ar", en: "en-US" }[language],
    { weekday: "long", day: "numeric", month: "short" },
  )

  const hasData = timeline.points.length > 0
  const patternText = pattern
    ? {
        fr: `${pattern.count} fois sur ${pattern.total}, un déjeuner à plus de ${pattern.carbThreshold} g de glucides précède un pic au-dessus de ${formatGlucose(pattern.peakThresholdMgDl, unit)} ${unit}. Les jours plus riches en protéines au déjeuner : moins de pics.`,
        ar: `${pattern.count} من ${pattern.total} مرات، غداء بأكثر من ${pattern.carbThreshold} غ كربوهيدرات يسبق ارتفاعًا فوق ${formatGlucose(pattern.peakThresholdMgDl, unit)} ${unit}. الأيام الأغنى بالبروتين في الغداء: ارتفاعات أقل.`,
        en: `${pattern.count} times out of ${pattern.total}, a lunch above ${pattern.carbThreshold} g of carbs precedes a peak over ${formatGlucose(pattern.peakThresholdMgDl, unit)} ${unit}. Higher-protein lunches: fewer peaks.`,
      }[language]
    : null

  return (
    <div className={`space-y-3 ${isRTL ? "rtl" : ""}`}>
      {/* P2 — fusion long-scroll : le H2 + le disclaimer de section sont remontés
          une seule fois en tête de GlucoseTab. On garde juste le repère temporel. */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{P.glucoseMeals}</p>
        <span className="text-[11px] font-bold rounded-full px-2.5 py-1 capitalize" style={{ backgroundColor: "color-mix(in oklab, var(--glucose) 14%, transparent)", color: "var(--glucose)" }}>
          {dateLabel}
        </span>
      </div>

      {/* Cartes TIR + pic */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card border border-border p-3">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{P.tir}</span>
          <div className="mt-1.5">
            <span className="text-[20px] font-extrabold" style={{ color: "var(--primary)" }}>
              {timeline.tir !== null ? `${timeline.tir}%` : "—"}
            </span>
          </div>
        </div>
        <div className="rounded-2xl bg-card border border-border p-3">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{P.postprandialPeak}</span>
          <div className="mt-1.5">
            <span className="text-[20px] font-extrabold" style={{ color: "var(--amber)" }}>
              {timeline.maxPeakDeltaMgDl !== null
                ? `+${(toGlucoseUnit(timeline.maxPeakDeltaMgDl, unit)).toFixed(unit === "mg/dL" ? 0 : 2)}`
                : "—"}
            </span>{" "}
            <span className="text-[11px] text-muted-foreground">{unit}</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">{P.dayOf} {dateLabel}</span>
        </div>
        {hasData ? (
          <LazyMount minHeight={150}><TimelineChart timeline={timeline} target={user.glucoseTarget} unit={unit} /></LazyMount>
        ) : (
          <p className="text-[12.5px] text-muted-foreground py-8 text-center">{P.noGlucoseForCorrelation}</p>
        )}
        <div className="flex justify-between text-[9.5px] text-muted-foreground mt-1">
          <span>6h</span><span>10h</span><span>14h</span><span>18h</span><span>22h</span>
        </div>
      </div>

      {/* Événements */}
      {timeline.markers.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide mb-1">{P.eventsOfDay}</div>
          {timeline.markers.map((m) => {
            const c = deltaColor(m.deltaMgDl)
            const timeStr = `${String(Math.floor(m.minutes / 60)).padStart(2, "0")}:${String(m.minutes % 60).padStart(2, "0")}`
            return (
              <div key={m.mealType} className="flex items-start gap-2.5 py-2.5 border-b border-border last:border-0 text-[12.5px]">
                <span className="font-bold text-muted-foreground text-[11.5px] w-11 shrink-0 pt-0.5">{timeStr}</span>
                <div className="min-w-0">
                  <span>{MEAL_EMOJI[m.mealType]} {MEAL_NAME[m.mealType][language]}</span>
                  <span className="text-muted-foreground"> · {m.kcal} kcal, {m.carbs} g {language === "ar" ? "كربوهيدرات" : language === "en" ? "carbs" : "glucides"}</span>
                </div>
                <span className="ml-auto text-[11px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap shrink-0" style={{ backgroundColor: c.bg, color: c.fg }}>
                  {m.deltaMgDl !== null ? `+${toGlucoseUnit(m.deltaMgDl, unit).toFixed(unit === "mg/dL" ? 0 : 2)}` : "—"}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Pattern détecté */}
      {patternText && (
        <div className="rounded-2xl p-4 text-white" style={{ background: "linear-gradient(135deg, var(--primary), #3ECF9A)" }}>
          <div className="text-[12px] font-bold" style={{ color: "rgba(255,255,255,.8)" }}>🔍 {P.patternDetected} (14 {P.days30 === "30 j" ? "j" : "d"})</div>
          <p className="text-[13.5px] leading-snug mt-1.5">{patternText}</p>
        </div>
      )}
    </div>
  )
}

function TimelineChart({
  timeline,
  target,
  unit,
}: {
  timeline: ReturnType<typeof buildDayTimeline>
  target: { low: number; high: number }
  unit: import("@/lib/glucose-units").GlucoseUnit
}) {
  const W = 330
  const H = 150
  const vals = timeline.points.map((p) => p.valueMgDl)
  const dataMin = Math.min(...vals, target.low)
  const dataMax = Math.max(...vals, target.high)
  const lo = dataMin - 15
  const hi = dataMax + 15
  const span = Math.max(20, hi - lo)
  const x = (min: number) => (min / 1440) * W
  const y = (v: number) => H - 26 - ((v - lo) / span) * (H - 40)

  const line = timeline.points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.minutes).toFixed(1)},${y(p.valueMgDl).toFixed(1)}`).join(" ")
  const peakMarker = timeline.markers.find((m) => m.deltaMgDl === timeline.maxPeakDeltaMgDl && m.peakMgDl !== null)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", marginTop: 8 }}>
      {/* bande cible */}
      <rect x="0" y={y(target.high)} width={W} height={Math.max(0, y(target.low) - y(target.high))} fill="color-mix(in oklab, var(--primary) 12%, transparent)" />
      <line x1="0" y1={y(target.high)} x2={W} y2={y(target.high)} stroke="var(--primary)" strokeDasharray="4 4" strokeWidth="1" opacity="0.5" />
      <line x1="0" y1={y(target.low)} x2={W} y2={y(target.low)} stroke="var(--primary)" strokeDasharray="4 4" strokeWidth="1" opacity="0.5" />
      {/* marqueurs repas */}
      {timeline.markers.map((m) => (
        <g key={m.mealType}>
          <line x1={x(m.minutes)} y1="24" x2={x(m.minutes)} y2={H - 24} stroke="var(--amber)" strokeWidth="1.5" opacity="0.5" />
          <text x={x(m.minutes)} y={H - 8} fontSize="13" textAnchor="middle">{MEAL_EMOJI[m.mealType]}</text>
        </g>
      ))}
      {/* courbe glycémie */}
      <path d={line} fill="none" stroke="var(--glucose)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* pic */}
      {peakMarker && peakMarker.peakMgDl !== null && (
        <>
          <circle cx={x(peakMarker.minutes + 30)} cy={y(peakMarker.peakMgDl)} r="5" fill="var(--risk)" />
          <text x={x(peakMarker.minutes + 30) + 8} y={y(peakMarker.peakMgDl) - 4} fontSize="10" fill="var(--risk)" fontWeight="700">
            {formatGlucose(peakMarker.peakMgDl, unit)}
          </text>
        </>
      )}
    </svg>
  )
}
