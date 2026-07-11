"use client"

// P2 — Bilan composition mensuelle (sucres ajoutés / sel / graisses saturées vs
// repère OMS), extrait de GroceriesScreen pour être visible aussi dans le scroll
// de Bilan (retour utilisateur : ne pas cacher ces données derrière l'onglet
// Courses). Reste utilisé tel quel par GroceriesScreen (pas de duplication).

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { getGrocerySummary, type GrocerySummary } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

function ProgressBar({ label, valueG, percent }: { label: string; valueG: number; percent: number }) {
  const color = percent > 80 ? "var(--risk)" : percent > 55 ? "var(--amber)" : "var(--primary)"
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] text-foreground">{label}</span>
        {/* Retour utilisateur : afficher la valeur réelle (g), pas seulement le % */}
        <span className="text-[12px] font-semibold text-foreground">{valueG.toFixed(1)}g · {percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, percent)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export function GrocerySummaryCard() {
  const { t } = useApp()
  const currentMonthStr = new Date().toISOString().slice(0, 7)
  const [month, setMonth] = useState(currentMonthStr)
  const [summary, setSummary] = useState<GrocerySummary | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    setLoadingStats(true)
    getGrocerySummary(month).then(setSummary).catch(() => setSummary(null)).finally(() => setLoadingStats(false))
  }, [month])

  const shiftMonth = (delta: number) => {
    const [y, m] = month.split("-").map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (next <= currentMonthStr) setMonth(next)
  }
  const monthLabel = new Date(month + "-01T00:00:00").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })

  if (loadingStats) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <Skeleton className="h-4 w-32 rounded" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-semibold text-foreground">{t("monthlyOverview")}</h3>
        <div className="flex items-center gap-1">
          <button onClick={() => shiftMonth(-1)} className="p-1 rounded-lg text-muted-foreground hover:bg-muted" aria-label="Mois précédent">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[12px] text-muted-foreground w-24 text-center capitalize">{monthLabel}</span>
          <button onClick={() => shiftMonth(1)} disabled={month >= currentMonthStr} className="p-1 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30" aria-label="Mois suivant">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="space-y-3">
        <ProgressBar label={t("addedSugars")} valueG={summary?.sugars.total_g ?? 0} percent={summary?.sugars.pct ?? 0} />
        <ProgressBar label={t("salt")} valueG={summary?.salt.total_g ?? 0} percent={summary?.salt.pct ?? 0} />
        <ProgressBar label={t("saturatedFat")} valueG={summary?.sat_fat.total_g ?? 0} percent={summary?.sat_fat.pct ?? 0} />
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">{t("vsOmsReference")}</p>
    </div>
  )
}
