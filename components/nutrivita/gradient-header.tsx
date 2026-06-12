"use client"

import { cn } from "@/lib/utils"

interface FlatHeaderProps {
  title: string
  subtitle?: string
  className?: string
  children?: React.ReactNode
}

/** Flat screen header — replaces the old gradient header per design system SL-UI §1. */
export function GradientHeader({
  title,
  subtitle,
  className,
  children,
}: FlatHeaderProps) {
  return (
    <div className={cn("px-4 pt-5 pb-4 bg-background", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-foreground leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
