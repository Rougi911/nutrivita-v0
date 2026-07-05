"use client"

// P2 — Bilan fusionné en un seul écran défilant (style Strava/Garmin) : apports,
// composition corporelle, glycémie, carences, radar micronutriments, additifs,
// puis tendances/adhérence, score santé, et le résumé produits transformés —
// remplace l'ancien découpage en 4 sous-onglets (Bilan/Tendances/Score/Courses).
// Rien n'est retiré : StatsScreen, TrendsScreen, HealthScoreScreen sont réutilisés
// tels quels (juste allégés de leur propre chrome de page). GroceriesScreen reste
// accessible en entier via le bouton "Voir mes courses" (scanner/gérer les
// produits est un usage différent d'une page de bilan passive).

import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { StatsScreen } from "./stats-screen"
import { TrendsScreen } from "./trends-screen"
import { HealthScoreScreen } from "./health-score-screen"
import { GrocerySummaryCard } from "./grocery-summary-card"

export function StatsTab({
  onOpenSettings,
  onOpenGroceries,
}: {
  onOpenSettings: () => void
  onOpenGroceries: () => void
}) {
  const { t, isRTL } = useApp()

  return (
    <div className={isRTL ? "rtl" : ""}>
      <StatsScreen onOpenSettings={onOpenSettings} />

      <div className="px-4 pb-8 space-y-3 -mt-4">
        <div className="pt-2 border-t border-border" />

        {/* Tendances : heatmap adhérence, macros empilées, poids lissé */}
        <TrendsScreen />

        <div className="pt-2 border-t border-border" />

        {/* Score santé : 4 composantes, actions, évolution 8 semaines */}
        <HealthScoreScreen />

        <div className="pt-2 border-t border-border" />

        {/* Produits transformés : additifs/sel/sucre/graisses saturées vs OMS —
            visible ici en plus de l'écran Courses complet (retour utilisateur). */}
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{t("myGroceries")}</p>
        <GrocerySummaryCard />
        <Button variant="outline" className="w-full gap-2 rounded-xl" onClick={onOpenGroceries}>
          {t("openGroceries")}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
