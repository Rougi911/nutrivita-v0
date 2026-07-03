"use client"

// P1 — onglet Glycémie (promu dans la bottom nav) avec sous-onglets :
// × Repas (nouvel écran de corrélation, maquette 3) / Suivi (GlucoseScreen
// existant réutilisé tel quel, sans bouton retour puisque c'est un onglet).

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { P1 } from "@/lib/p1-i18n"
import { GlucoseMealsScreen } from "./glucose-meals-screen"
import { GlucoseScreen } from "./glucose-screen"

type Sub = "correlation" | "tracking"

export function GlucoseTab() {
  const { language, isRTL } = useApp()
  const P = P1[language]
  const [sub, setSub] = useState<Sub>("correlation")

  const tabs: { id: Sub; label: string }[] = [
    { id: "correlation", label: P.subCorrelation },
    { id: "tracking", label: P.subTracking },
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

      {sub === "correlation" && <GlucoseMealsScreen />}
      {sub === "tracking" && <GlucoseScreen />}
    </div>
  )
}
