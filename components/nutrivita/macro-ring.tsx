"use client"

import { macroArcSegments, type MealTotals } from "@/lib/meal-macros"

/** Couleurs macros — tokens du design system (protéines violet, glucides ambre, lipides rose). */
export const MACRO_COLORS: Record<"protein" | "carbs" | "fat", string> = {
  protein: "var(--glucose)",
  carbs: "var(--amber)",
  fat: "var(--lipids)",
}

interface MacroRingProps {
  totals: MealTotals
  size?: number
}

/**
 * S14 — Anneau calorique d'un repas : kcal au centre, arcs proportionnels à
 * l'apport calorique protéines/glucides/lipides. Repas vide → piste seule + 0.
 */
export function MacroRing({ totals, size = 120 }: MacroRingProps) {
  const stroke = 12
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const segments = macroArcSegments(totals)

  let cumulative = 0
  const arcs = segments
    .filter((s) => s.fraction > 0)
    .map((s) => {
      const len = s.fraction * circumference
      const offset = cumulative * circumference
      cumulative += s.fraction
      return { key: s.key, len, offset, color: MACRO_COLORS[s.key] }
    })

  const kcal = Math.round(totals.kcal)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
        {/* Piste de fond */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
          strokeOpacity={0.3}
        />
        {/* Arcs macros */}
        {arcs.map((a) => (
          <circle
            key={a.key}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={a.color}
            strokeWidth={stroke}
            strokeDasharray={`${a.len} ${circumference - a.len}`}
            strokeDashoffset={-a.offset}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[18px] font-semibold text-foreground tabular-nums leading-none">
          {kcal.toLocaleString()}
        </span>
        <span className="text-[11px] text-muted-foreground mt-0.5">kcal</span>
      </div>
    </div>
  )
}
