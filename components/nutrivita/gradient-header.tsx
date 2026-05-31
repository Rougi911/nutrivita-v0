"use client"

import { cn } from "@/lib/utils"

interface GradientHeaderProps {
  title: string
  subtitle?: string
  icon?: string
  variant?: "indigo" | "emerald" | "glucose" | "slate"
  className?: string
  children?: React.ReactNode
}

const gradientClasses = {
  indigo: "gradient-hero",
  emerald: "gradient-health",
  glucose: "gradient-glucose",
  slate: "bg-gradient-to-br from-slate-700 to-slate-900",
}

export function GradientHeader({
  title,
  subtitle,
  icon,
  variant = "indigo",
  className,
  children,
}: GradientHeaderProps) {
  return (
    <div
      className={cn(
        "px-4 py-6 text-white rounded-b-3xl",
        gradientClasses[variant],
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-2xl">{icon}</span>}
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            {subtitle && (
              <p className="text-sm text-white/80">{subtitle}</p>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
