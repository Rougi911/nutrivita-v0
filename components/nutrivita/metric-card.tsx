"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  status?: "good" | "warning" | "danger" | "neutral"
  statusText?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  className?: string
  gradient?: string
}

export function MetricCard({
  label,
  value,
  unit,
  status = "neutral",
  statusText,
  trend,
  trendValue,
  className,
  gradient,
}: MetricCardProps) {
  const statusColors = {
    good: "text-emerald bg-emerald/10 border-emerald/20",
    warning: "text-amber bg-amber/10 border-amber/20",
    danger: "text-destructive bg-destructive/10 border-destructive/20",
    neutral: "text-foreground bg-muted border-border",
  }

  const statusBadgeColors = {
    good: "bg-emerald/20 text-emerald",
    warning: "bg-amber/20 text-amber",
    danger: "bg-destructive/20 text-destructive",
    neutral: "bg-muted text-muted-foreground",
  }

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus

  return (
    <motion.div
      className={cn(
        "rounded-2xl border p-4 flex flex-col gap-2",
        gradient ? `${gradient} text-white border-transparent` : statusColors[status],
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <span className={cn(
        "label-text",
        gradient ? "text-white/80" : "text-muted-foreground"
      )}>
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className={cn(
          "text-3xl font-bold",
          gradient ? "text-white" : ""
        )}>
          {value}
        </span>
        {unit && (
          <span className={cn(
            "text-sm",
            gradient ? "text-white/70" : "text-muted-foreground"
          )}>
            {unit}
          </span>
        )}
      </div>
      {(statusText || trendValue) && (
        <div className="flex items-center gap-2 flex-wrap">
          {statusText && (
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                gradient ? "bg-white/20 text-white" : statusBadgeColors[status]
              )}
            >
              {status === "good" && "✓ "}
              {statusText}
            </span>
          )}
          {trend && trendValue && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                gradient ? "text-white/70" : "text-muted-foreground"
              )}
            >
              <TrendIcon className="h-3 w-3" />
              {trendValue}
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}
