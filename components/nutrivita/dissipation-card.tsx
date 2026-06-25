"use client"

import { useState } from "react"
import {
  ChevronDown, ChevronUp, Activity, Bike, Footprints, Waves, Mountain,
  Music, Zap, PersonStanding, Flower2, Wind, Goal, Timer, AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/lib/app-context"
import {
  SPORTS, INTENSITY_ORDER, sportsByIntensity, dissipationMinutes, dailyExcessKcal, isWeightStale,
  type Sport, type SportIntensity,
} from "@/lib/calorie-dissipation"
import type { TranslationKey } from "@/lib/types"

/** Icône lucide par sport (clé stable → composant). */
const SPORT_ICONS: Record<string, typeof Activity> = {
  stretching: PersonStanding, yoga: Flower2, walkCasual: Footprints, taiChi: Wind,
  walkBrisk: Footprints, dance: Music, aquaGym: Waves, swim: Waves, hiking: Mountain,
  basketball: Activity, cyclingLeisure: Bike, football: Goal, hiit: Zap, running: Activity,
  swimFast: Waves, cyclingIntense: Bike, jumpRope: Timer,
}

const INTENSITY_LABEL: Record<SportIntensity, TranslationKey> = {
  gentle: "intensityGentle",
  moderate: "intensityModerate",
  intense: "intensityIntense",
}

interface DissipationCardProps {
  onOpenSettings?: () => void
}

/**
 * S13 — « Dissipation des calories » (Bilan). Affichée uniquement si excédent
 * calorique du jour > 0. Cadrage bien-être REG-05 : information indicative,
 * non médicale, jamais culpabilisante.
 */
export function DissipationCard({ onOpenSettings }: DissipationCardProps) {
  const { t, dailyLog, user, weightHistory, todayBurnedCalories } = useApp()
  const [open, setOpen] = useState(false)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const excess = dailyExcessKcal(dailyLog.totalCalories, user.targetCalories, todayBurnedCalories)
  if (excess <= 0) return null // carte masquée si pas d'excédent

  const latestWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1] : null
  const weightKg = latestWeight?.weight ?? user.weight
  const stale = isWeightStale(latestWeight?.date)

  const groups = sportsByIntensity()
  const selected: Sport | undefined = SPORTS.find((s) => s.key === selectedKey)
  const minutes = selected ? dissipationMinutes(excess, selected.met, weightKg) : 0

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* En-tête activable (replié par défaut) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" style={{ color: "var(--primary)" }} />
          <span className="text-[14px] font-semibold text-foreground">
            {t("dissipationTitle")} ({excess.toLocaleString()} kcal)
          </span>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Menu déroulant de sports, groupés par intensité */}
          <div>
            <p className="text-[12px] text-muted-foreground mb-2">{t("dissipationPickSport")}</p>
            <div className="space-y-3">
              {INTENSITY_ORDER.map((intensity) => (
                <div key={intensity}>
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                    {t(INTENSITY_LABEL[intensity])}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {groups[intensity].map((sport) => {
                      const Icon = SPORT_ICONS[sport.key] ?? Activity
                      const isActive = selectedKey === sport.key
                      return (
                        <button
                          key={sport.key}
                          type="button"
                          onClick={() => setSelectedKey(sport.key)}
                          aria-pressed={isActive}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[12px] font-medium transition-colors",
                            isActive
                              ? "border-[var(--primary)] text-white"
                              : "border-border bg-card text-foreground"
                          )}
                          style={isActive ? { backgroundColor: "var(--primary)" } : undefined}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {t(sport.labelKey)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Durée affichée en grand après sélection */}
          {selected && (
            <div className="flex flex-col items-center py-2">
              <span className="text-[34px] font-semibold leading-none" style={{ color: "var(--primary)" }}>
                {minutes}
              </span>
              <span className="text-[13px] text-muted-foreground mt-1">
                {t("minutesUnit")} · {t(selected.labelKey)}
              </span>
            </div>
          )}

          {/* Rappel poids : périmé (> 3 mois ou absent) ou mention simple */}
          {stale ? (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-muted/40">
              <div className="flex items-start gap-2 min-w-0">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--amber)" }} />
                <p className="text-[11px] text-muted-foreground leading-snug">{t("dissipationWeightStale")}</p>
              </div>
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="text-[12px] font-medium shrink-0"
                  style={{ color: "var(--primary)" }}
                >
                  {t("dissipationUpdateWeight")}
                </button>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              {t("dissipationWeightBasis").replace("{kg}", String(Math.round(weightKg)))}
            </p>
          )}

          {/* Cadrage bien-être REG-05 — non contournable */}
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-muted/40">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--amber)" }} />
            <p className="text-[11px] text-muted-foreground leading-snug">{t("dissipationDisclaimer")}</p>
          </div>
        </div>
      )}
    </div>
  )
}
