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
  const effectiveTarget = target + burned
  const percentage = Math.min((consumed / effectiveTarget) * 100, 100)
  const overTarget = consumed > effectiveTarget
  const remaining = effectiveTarget - consumed
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="rotate-[-90deg]"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={12}
          className="text-muted/30"
        />
        {/* Progress circle with gradient */}
        <defs>
          <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={overTarget ? "#EF4444" : "#6366F1"} />
            <stop offset="100%" stopColor={overTarget ? "#F97316" : "#8B5CF6"} />
          </linearGradient>
        </defs>
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#calorieGradient)"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="hero-number text-foreground"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {consumed.toLocaleString()}
        </motion.span>
        <span className="text-muted-foreground text-base">
          / {effectiveTarget.toLocaleString()} kcal
        </span>
      </div>
      {/* Bottom label */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
        <span
          className={cn(
            "text-sm font-medium whitespace-nowrap",
            overTarget ? "text-destructive" : "text-emerald"
          )}
        >
          {overTarget
            ? `+${Math.abs(remaining).toLocaleString()} kcal`
            : `${remaining.toLocaleString()} kcal restantes`}
        </span>
        {burned > 0 && (
          <span className="text-xs font-medium text-emerald whitespace-nowrap">
            +{burned.toLocaleString()} kcal activité
          </span>
        )}
      </div>
    </div>
  )
}
