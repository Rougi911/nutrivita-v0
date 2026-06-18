"use client"

/**
 * MicronutrientsRadar — Radar SVG natif 8 axes, vitamines & minéraux vs VNR.
 * Pas de recharts. Conforme SL-UI : teal #1D9E75, pas de gradient, pas d'émoji.
 */

import type { RadarResult } from "@/lib/micronutrients-radar"

type Props = {
  data: RadarResult
  className?: string
}

const CX = 160
const CY = 160
const R_MAX = 110        // rayon max (= 120 % VNR)
const RINGS = [30, 60, 90, 120] as const  // % affichés
const AXES_COUNT = 8

// Coordonnées polaires → cartésiennes
function polar(angleDeg: number, r: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)]
}

// Convertit un valuePercent (0..120) en rayon SVG
function pctToRadius(pct: number): number {
  return (Math.min(pct, 120) / 120) * R_MAX
}

// Polygone fermé à partir d'une liste de [x, y]
function toPolygon(points: [number, number][]): string {
  return points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ")
}

// Axe i parmi AXES_COUNT axes régulièrement espacés
function axisAngle(i: number): number {
  return (360 / AXES_COUNT) * i
}

export function MicronutrientsRadar({ data, className }: Props) {
  const { nutrients } = data

  // Polygone utilisateur
  const userPoints: [number, number][] = nutrients.map((n, i) =>
    polar(axisAngle(i), pctToRadius(n.valuePercent))
  )

  // Polygone référence 100 %
  const refPoints: [number, number][] = nutrients.map((_, i) =>
    polar(axisAngle(i), pctToRadius(100))
  )

  // Positions des labels (légèrement en dehors du rayon max)
  const LABEL_OFFSET = 16  // px au-delà de R_MAX

  return (
    <svg
      viewBox="0 0 320 320"
      className={className}
      aria-label="Radar vitamines et minéraux"
      role="img"
    >
      {/* ── Anneaux concentriques ─────────────────────────────── */}
      {RINGS.map((pct) => {
        const r = pctToRadius(pct)
        const ringPoints: [number, number][] = Array.from({ length: AXES_COUNT }, (_, i) =>
          polar(axisAngle(i), r)
        )
        return (
          <polygon
            key={pct}
            points={toPolygon(ringPoints)}
            fill="none"
            stroke="var(--border)"
            strokeWidth="0.8"
            strokeOpacity="0.7"
          />
        )
      })}

      {/* ── Rayons (lignes du centre vers chaque axe) ────────── */}
      {nutrients.map((_, i) => {
        const [x, y] = polar(axisAngle(i), R_MAX)
        return (
          <line
            key={i}
            x1={CX}
            y1={CY}
            x2={x}
            y2={y}
            stroke="var(--border)"
            strokeWidth="0.8"
            strokeOpacity="0.7"
          />
        )
      })}

      {/* ── Légendes des anneaux (côté droit, sur l'axe 0°) ─── */}
      {RINGS.map((pct) => {
        const r = pctToRadius(pct)
        const [x, y] = polar(0, r)  // axe 12h (angle -90 → pointé vers le haut = 0°)
        return (
          <text
            key={pct}
            x={x + 3}
            y={y - 2}
            fontSize="9"
            fill="var(--muted-foreground)"
            fontWeight="400"
          >
            {pct}%
          </text>
        )
      })}

      {/* ── Série 100 % référence VNR (polygone pointillé gris) ─ */}
      <polygon
        points={toPolygon(refPoints)}
        fill="none"
        stroke="#9aa3ab"
        strokeWidth="1.4"
        strokeDasharray="4 3"
      />

      {/* ── Série utilisateur (polygone plein teal) ──────────── */}
      <polygon
        points={toPolygon(userPoints)}
        fill="rgba(29,158,117,0.18)"
        stroke="#1D9E75"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* ── Points sur chaque axe ─────────────────────────────── */}
      {userPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill="#1D9E75" />
      ))}

      {/* ── Labels axes ──────────────────────────────────────── */}
      {nutrients.map((n, i) => {
        const angle = axisAngle(i)
        const [lx, ly] = polar(angle, R_MAX + LABEL_OFFSET)
        const isLow = n.valuePercent < 70
        // Alignement horizontal selon position du label
        const radNorm = ((angle % 360) + 360) % 360
        let anchor: "start" | "middle" | "end" = "middle"
        if (radNorm > 15 && radNorm < 165) anchor = "start"
        if (radNorm > 195 && radNorm < 345) anchor = "end"

        return (
          <text
            key={i}
            x={lx.toFixed(2)}
            y={ly.toFixed(2)}
            fontSize="11"
            fontWeight={isLow ? "600" : "400"}
            fill={isLow ? "#BA7517" : "var(--foreground)"}
            textAnchor={anchor}
            dominantBaseline="central"
          >
            {n.label}
          </text>
        )
      })}
    </svg>
  )
}
