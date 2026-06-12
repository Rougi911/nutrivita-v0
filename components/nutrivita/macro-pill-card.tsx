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
  className?: string
}

export function MacroPillCard({
  icon: Icon,
  value,
  target,
  label,
  unit = "g",
  className,
}: MacroPillCardProps) {
  const percentage = Math.min((value / target) * 100, 100)

  return (
    <motion.div
      className={cn(
        "flex flex-col items-center gap-1 rounded-2xl bg-card p-3 shadow-sm border border-border",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-lg font-bold text-foreground">
        {value}
        <span className="text-sm font-normal text-muted-foreground">{unit}</span>
      </span>
      <span className="label-text text-muted-foreground">{label}</span>
      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full",
            percentage >= 100 ? "bg-emerald" : "bg-primary"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
      </div>
    </motion.div>
  )
}
