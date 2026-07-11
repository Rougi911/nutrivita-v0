"use client"

import { motion } from "framer-motion"
import { BookOpen, Home, Plus, Droplet, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/lib/app-context"

// P1 — Glycemie promue dans la bottom nav (pilier de la cible metabolique).
// Courses (groceries) deplace en sous-onglet du Bilan (cf. StatsTab).
const navItems = [
  { id: "home", icon: Home, labelKey: "home" as const },
  { id: "journal", icon: BookOpen, labelKey: "journal" as const },
  { id: "__add__", icon: Plus, labelKey: "add" as const }, // central + button
  { id: "glucose", icon: Droplet, labelKey: "glucose" as const },
  { id: "stats", icon: TrendingUp, labelKey: "stats" as const },
]

export function BottomNavigation() {
  const { activeTab, setActiveTab, setShowAddSheet, t } = useApp()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="bg-background/95 backdrop-blur-sm border-t border-border">
        <nav className="flex items-end justify-around px-2 pt-2 pb-3 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isCenter = item.id === "__add__"
            const isActive = activeTab === item.id

            if (isCenter) {
              return (
                <button
                  key={item.id}
                  onClick={() => setShowAddSheet(true)}
                  className="relative -mt-5 flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-lg active:scale-95 transition-transform"
                  aria-label={t("add")}
                >
                  <Plus className="h-7 w-7 text-primary-foreground stroke-[2.5]" />
                </button>
              )
            }

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[52px]",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-primary/8"
                    layoutId="activeNavTab"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <Icon
                  className={cn(
                    "relative z-10 h-5 w-5",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span
                  className={cn(
                    "relative z-10 text-[10px] font-medium leading-none",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {t(item.labelKey)}
                </span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
