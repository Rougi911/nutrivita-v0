"use client"

// P2 — Glycémie fusionnée en un seul écran défilant (style Strava/Garmin) :
// résumé du jour en haut, puis on descend vers plus de détail. Remplace l'ancien
// découpage en sous-onglets « × Repas » / « Suivi » — aucune fonctionnalité
// retirée, seulement réorganisée en un scroll continu. Voir GlucoseMealsScreen
// (timeline + événements + pattern) et GlucoseScreen (période/GMI/TIR/CV/
// scatter/répartition/stats par type + modal d'ajout), désormais rendus comme
// des sections d'une seule page plutôt que deux écrans séparés.

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { GlucoseMealsScreen } from "./glucose-meals-screen"
import { GlucoseScreen, type GlucosePeriod } from "./glucose-screen"
import { GlucoseCorrelationChart } from "./glucose-correlation-chart"

interface GlucoseTabProps {
  /** Fourni uniquement quand affiché en vue empilée (ex. depuis Profil), pas depuis l'onglet bottom nav. */
  onBack?: () => void
}

export function GlucoseTab({ onBack }: GlucoseTabProps = {}) {
  const { t, isRTL, advancedCharts } = useApp()
  const [period, setPeriod] = useState<GlucosePeriod>("14d")

  return (
    <div className={`bg-background min-h-screen pb-8 ${isRTL ? "rtl" : ""}`}>
      {/* En-tête unique de la page (auparavant dupliqué dans les 2 sous-écrans) */}
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
        <h1 className="text-[18px] font-semibold text-foreground">{t("glucoseTracking")}</h1>
      </div>

      {/* Disclaimer REG-04 unique — permanent, non-dismissable */}
      <div className="mx-4 mb-3 px-3 py-2 rounded-xl border border-border bg-muted/40">
        <p className="text-[11px] text-muted-foreground leading-snug">{t("glucoseDisclaimer")}</p>
      </div>

      <div className="px-4 space-y-3">
        {/* Aujourd'hui : TIR/pic, timeline, événements, pattern 14j (ex-« × Repas ») */}
        <GlucoseMealsScreen />

        <div className="pt-2 border-t border-border" />

        {/* Tendances : période partagée, hypo alert, GMI/TIR/CV/Moyenne, scatter,
            répartition, stats par type de mesure (ex-« Suivi ») */}
        <GlucoseScreen period={period} onPeriodChange={setPeriod} />

        {/* Corrélation repas/sport — section avancée (réglage Profil), même période */}
        {advancedCharts && <GlucoseCorrelationChart period={period} />}
      </div>
    </div>
  )
}
