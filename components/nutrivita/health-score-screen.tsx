"use client"

// P1-5 — Score Santé hebdomadaire (maquette 4). Agrège en un chiffre les
// richesses déjà calculées par NutraLance : adhérence calorique (40 %), qualité
// produits (25 %), micronutriments vs VNR (20 %), équilibre macros (15 %).
// Actions chiffrées + évolution 8 semaines. Calcul 100 % client (premier jet).

import { useEffect, useState } from "react"
import { useApp } from "@/lib/app-context"
import { getJournalRange, getHealthScore } from "@/lib/api"
import { P1 } from "@/lib/p1-i18n"
import { computeHealthScore, SCORE_ACTION_TEXT, type HealthScore, type ScoreActionKey } from "@/lib/p1-insights"
import { LazyMount } from "./lazy-mount"

function ScoreRing({ score, size = 150 }: { score: number; size?: number }) {
  const r = size / 2 - 11
  const c = 2 * Math.PI * r
  const dash = (Math.max(0, Math.min(100, score)) / 100) * c
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={12} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--primary)" strokeWidth={12} strokeLinecap="round" strokeDasharray={`${dash} ${c}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <b className="text-[34px] font-extrabold leading-none text-foreground">{score}</b>
      </div>
    </div>
  )
}

export function HealthScoreScreen() {
  const { user, language, isRTL } = useApp()
  const P = P1[language]
  const [score, setScore] = useState<HealthScore | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    // Serveur d'abord (calcul réel additifs EFSA + micronutriments ANSES) ;
    // repli sur l'heuristique client si l'endpoint n'est pas déployé / hors ligne.
    getHealthScore()
      .then((s) => {
        if (!alive) return
        setScore({
          total: s.total,
          prevTotal: s.prevTotal,
          components: s.components,
          history: s.history,
          actions: s.actions.map((a) => ({ points: a.points, textKey: a.key as ScoreActionKey })),
        })
        setLoading(false)
      })
      .catch(() => {
        getJournalRange(60)
          .then((rows) => { if (alive) { setScore(computeHealthScore(rows, user)); setLoading(false) } })
          .catch(() => { if (alive) setLoading(false) })
      })
    return () => { alive = false }
    // Fix E2E : fetch une seule fois au montage. `[user]` (réf recréée à chaque
    // render) relançait l'effet en boucle → rafales d'appels + gel du renderer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!score) {
    return <div className="py-16 text-center text-[13px] text-muted-foreground">{loading ? "…" : P.notEnoughData}</div>
  }
  const delta = score.prevTotal !== null ? score.total - score.prevTotal : null

  const components: { key: keyof typeof score.components; label: string; color: string; icon: string }[] = [
    { key: "adherence", label: P.calorieAdherence, color: "var(--primary)", icon: "🎯" },
    { key: "quality", label: P.productQuality, color: "var(--amber)", icon: "🏷️" },
    { key: "micro", label: P.micronutrients, color: "var(--glucose)", icon: "🧬" },
    { key: "macro", label: P.macroBalance, color: "var(--lipids)", icon: "⚖️" },
  ]

  const mood = score.total >= 75 ? P.scoreGood : score.total >= 50 ? P.scoreMid : P.scoreLow
  const maxHist = Math.max(1, ...score.history.map((h) => h.score))

  return (
    <div className={`space-y-3 ${isRTL ? "rtl" : ""}`}>
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{P.healthScore}</p>

      {/* Score principal */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex flex-col items-center">
          <ScoreRing score={score.total} />
          <div className="text-[12px] text-muted-foreground mt-2 text-center">
            {P.outOf}
            {delta !== null && (
              <span style={{ color: delta >= 0 ? "var(--primary)" : "var(--risk)" }}>
                {"  ·  "}{delta >= 0 ? "+" : ""}{delta} {P.vsLastWeek}
              </span>
            )}
          </div>
          <p className="text-[13px] text-foreground text-center mt-2 font-medium">{loading ? "…" : mood}</p>
        </div>
      </div>

      {/* Composantes */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        {components.map((comp) => {
          const val = score.components[comp.key]
          return (
            <div key={comp.key} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[16px]" style={{ backgroundColor: `color-mix(in oklab, ${comp.color} 15%, transparent)` }}>
                {comp.icon}
              </div>
              <div className="flex-1 min-w-0">
                <b className="text-[13px] text-foreground block mb-1.5">{comp.label}</b>
                <div className="h-[7px] rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${val}%`, backgroundColor: comp.color }} />
                </div>
              </div>
              <span className="text-[14px] font-extrabold text-foreground w-8 text-right">{val}</span>
            </div>
          )
        })}
      </div>

      {/* Actions chiffrées */}
      {score.actions.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide mb-2">{P.toGainPoints}</div>
          {score.actions.map((a) => (
            <div key={a.textKey} className="flex items-start gap-2.5 py-2.5 border-b border-border last:border-0 text-[12.5px]">
              <span className="font-extrabold w-8 shrink-0" style={{ color: "var(--primary)" }}>+{a.points}</span>
              <div>{SCORE_ACTION_TEXT[language][a.textKey]}</div>
            </div>
          ))}
        </div>
      )}

      {/* Évolution 8 semaines */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">{P.scoreEvolution}</span>
          <span className="text-[11px] font-bold rounded-full px-2.5 py-1" style={{ backgroundColor: "color-mix(in oklab, var(--primary) 14%, transparent)", color: "var(--primary)" }}>
            8 {P.weeksShort}
          </span>
        </div>
        <LazyMount minHeight={90}><ScoreEvolution history={score.history} maxHist={maxHist} /></LazyMount>
      </div>
    </div>
  )
}

function ScoreEvolution({ history, maxHist }: { history: { week: string; score: number }[]; maxHist: number }) {
  const W = 330
  const H = 90
  const pad = 10
  const n = history.length
  const x = (i: number) => (n === 1 ? W / 2 : pad + (i / (n - 1)) * (W - 2 * pad))
  const y = (v: number) => H - 12 - (v / maxHist) * (H - 24)
  const line = history.map((h, i) => `${x(i).toFixed(1)},${y(h.score).toFixed(1)}`).join(" ")
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", marginTop: 8 }}>
      <polyline points={line} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {history.map((h, i) => (
        <circle key={h.week + i} cx={x(i)} cy={y(h.score)} r={i === n - 1 ? 4.5 : 3} fill="var(--primary)" />
      ))}
      <line x1="0" y1={H - 12} x2={W} y2={H - 12} stroke="var(--border)" />
    </svg>
  )
}
