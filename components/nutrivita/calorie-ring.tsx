"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface CalorieRingProps {
  consumed: number
  target: number
  burned?: number
  size?: number
  className?: string
}

export function CalorieRing({
  consumed,
  target,
  burned = 0,
  size = 200,
  className,
}: CalorieRingProps) {
  const cappedBurned = Math.min(burned, 1000) // AL-03 plafond 1000 kcal
  const effectiveTarget = target + cappedBurned
  const percentage = Math.min((consumed / effectiveTarget) * 100, 100)
  const overTarget = consumed > effectiveTarget
  const remaining = effectiveTarget - consumed
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const trackColor = "var(--muted)"
  const progressColor = overTarget ? "var(--destructive)" : "var(--primary)"

  // Font sizes scaled to ring size
  const bigFontSize = Math.max(18, Math.round(size * 0.155))
  const labelFontSize = Math.max(10, Math.round(size * 0.065))
  const ratioFontSize = Math.max(9, Math.round(size * 0.058))

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="rotate-[-90deg]"
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={12}
          strokeOpacity={0.3}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
        <motion.span
          className="font-semibold text-foreground tabular-nums"
          style={{ fontSize: bigFontSize }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {remaining > 0 ? remaining.toLocaleString() : "0"}
        </motion.span>
        <span className="text-muted-foreground mt-0.5" style={{ fontSize: labelFontSize }}>
          kcal restantes
        </span>
        {size >= 160 && (
          <>
            <span className="text-muted-foreground mt-1.5 whitespace-nowrap" style={{ fontSize: ratioFontSize }}>
              {consumed.toLocaleString()} / {effectiveTarget.toLocaleString()} kcal
            </span>
            {cappedBurned > 0 && (
              <p className="whitespace-nowrap mt-0.5" style={{ fontSize: ratioFontSize, color: "var(--primary)" }}>
                +{cappedBurned.toLocaleString()} activité
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
