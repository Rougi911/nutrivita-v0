"use client"

import { motion } from "framer-motion"
import {
  BookOpen,
  ChartBar,
  Droplet,
  Settings,
  UtensilsCrossed,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/lib/app-context"

const navItems = [
  { id: "journal", icon: BookOpen, labelKey: "journal" as const },
  { id: "meals", icon: UtensilsCrossed, labelKey: "meals" as const },
  { id: "stats", icon: ChartBar, labelKey: "stats" as const },
  { id: "glucose", icon: Droplet, labelKey: "glucose" as const },
  { id: "settings", icon: Settings, labelKey: "settings" as const },
]

export function BottomNavigation() {
  const { activeTab, setActiveTab, t } = useApp()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <nav className="mx-4 mb-4 rounded-full glass border border-border/50 shadow-lg">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-full transition-all touch-target",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-primary rounded-full"
                    layoutId="activeTab"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <Icon
                  className={cn(
                    "relative z-10 h-5 w-5",
                    isActive && "text-primary-foreground"
                  )}
                />
                <span
                  className={cn(
                    "relative z-10 text-[10px] font-medium",
                    isActive && "text-primary-foreground"
                  )}
                >
                  {t(item.labelKey)}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
