"use client"

import type { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface MacroPillCardProps {
  icon: LucideIcon
  value: number
  target: number
  label: string
  unit?: string
  color?: string
  className?: string
}

export function MacroPillCard({
  icon: Icon,
  value,
  target,
  label,
  unit = "g",
  color,
  className,
}: MacroPillCardProps) {
  const percentage = Math.min((value / target) * 100, 100)
  const iconColor = color ?? "var(--primary)"
  const barColor = color ?? "var(--primary)"

  return (
    <motion.div
      className={cn(
        "flex flex-col items-center gap-1 rounded-2xl bg-card p-3 border border-border",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Icon className="h-5 w-5" style={{ color: iconColor }} />
      <span className="text-lg font-semibold text-foreground">
        {value}
        <span className="text-sm font-normal text-muted-foreground">{unit}</span>
      </span>
      <span className="label-text text-muted-foreground">{label}</span>
      <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
      </div>
    </motion.div>
  )
}
