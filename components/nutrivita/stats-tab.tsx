"use client"

// P1 — onglet Bilan avec sous-onglets : Bilan (existant) / Tendances / Score /
// Courses (déplacé hors de la bottom nav selon la maquette). Coexiste avec tout
// l'existant : StatsScreen et GroceriesScreen sont réutilisés tels quels.

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { P1 } from "@/lib/p1-i18n"
import { StatsScreen } from "./stats-screen"
import { TrendsScreen } from "./trends-screen"
import { HealthScoreScreen } from "./health-score-screen"
import { GroceriesScreen } from "./groceries-screen"

type Sub = "report" | "trends" | "score" | "groceries"

export function StatsTab({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { language, isRTL } = useApp()
  const P = P1[language]
  const [sub, setSub] = useState<Sub>("report")

  const tabs: { id: Sub; label: string }[] = [
    { id: "report", label: P.subReport },
    { id: "trends", label: P.subTrends },
    { id: "score", label: P.subScore },
    { id: "groceries", label: P.subGroceries },
  ]

  return (
    <div className={`bg-background min-h-screen ${isRTL ? "rtl" : ""}`}>
      <div className="px-4 pt-4">
        <div className="flex bg-muted rounded-full p-[3px]" role="tablist">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              role="tab"
              aria-selected={sub === tb.id}
              onClick={() => setSub(tb.id)}
              className={`flex-1 text-[12px] font-semibold rounded-full py-2 transition-colors ${
                sub === tb.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {sub === "report" && <StatsScreen onOpenSettings={onOpenSettings} />}
      {sub === "trends" && <TrendsScreen />}
      {sub === "score" && <HealthScoreScreen />}
      {sub === "groceries" && <GroceriesScreen />}
    </div>
  )
}
