"use client"

import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AppProvider, useApp } from "@/lib/app-context"
import { JournalScreen } from "./journal-screen"
import { MealsScreen } from "./meals-screen"
import { StatsScreen } from "./stats-screen"
import { GlucoseScreen } from "./glucose-screen"
import { SettingsScreen } from "./settings-screen"
import { LandingPage } from "./landing-page"
import { OnboardingFlow } from "./onboarding-flow"
import { BottomNavigation } from "./bottom-navigation"
import { HomeScreen } from "./home-screen"
import { GroceriesScreen } from "./groceries-screen"
import { AddSheet } from "./add-sheet"

type AppView = "checking" | "landing" | "onboarding" | "main"

function AppContent() {
  const [appView, setAppView] = useState<AppView>("checking")
  const { activeTab, setActiveTab, showAddSheet, isAuthenticated, isAuthLoading } = useApp()

  const [stackedView, setStackedView] = useState<"glucose" | "settings" | null>(null)

  // Auth-aware routing — runs when auth state or loading changes
  useEffect(() => {
    if (isAuthLoading) return
    if (isAuthenticated && appView !== "main" && appView !== "onboarding") {
      setAppView("main")
    } else if (!isAuthenticated && (appView === "checking" || appView === "main")) {
      setAppView("landing")
    }
  }, [isAuthenticated, isAuthLoading, appView])

  if (appView === "checking" || isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div
          className="h-8 w-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
        />
      </div>
    )
  }

  if (appView === "onboarding") {
    return <OnboardingFlow onComplete={() => setAppView("main")} />
  }

  if (appView === "landing") {
    return <LandingPage onGetStarted={() => setAppView("onboarding")} />
  }

  // ─── Main app ───────────────────────────────────────────────────────────────
  const renderMainScreen = () => {
    if (stackedView === "glucose") {
      return <GlucoseScreen onBack={() => setStackedView(null)} />
    }
    if (stackedView === "settings") {
      return (
        <SettingsScreen
          onBack={() => setStackedView(null)}
          onOpenGlucose={() => setStackedView("glucose")}
        />
      )
    }

    switch (activeTab) {
      case "home":
        return (
          <HomeScreen
            onOpenSettings={() => setStackedView("settings")}
            onOpenGlucose={() => setStackedView("glucose")}
          />
        )
      case "journal":
        return <JournalScreen />
      case "meals":
        return <MealsScreen />
      case "stats":
        return <StatsScreen />
      case "groceries":
        return <GroceriesScreen />
      default:
        return (
          <HomeScreen
            onOpenSettings={() => setStackedView("settings")}
            onOpenGlucose={() => setStackedView("glucose")}
          />
        )
    }
  }

  const screenKey = stackedView ?? activeTab

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key={screenKey}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.18 }}
          className="flex-1 pb-20"
        >
          {renderMainScreen()}
        </motion.div>
      </AnimatePresence>

      {!stackedView && <BottomNavigation />}
      {showAddSheet && <AddSheet />}
    </div>
  )
}

export function NutriVitaApp() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
