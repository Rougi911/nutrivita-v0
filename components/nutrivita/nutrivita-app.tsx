"use client"

import { useState } from "react"
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

type AppView = "landing" | "onboarding" | "main"

function AppContent() {
  const [appView, setAppView] = useState<AppView>("landing")
  const { activeTab, setActiveTab, showAddSheet } = useApp()

  // Stacked views accessible via back button (not in nav bar)
  const [stackedView, setStackedView] = useState<"glucose" | "settings" | null>(null)

  if (appView === "landing") {
    return <LandingPage onGetStarted={() => setAppView("onboarding")} />
  }

  if (appView === "onboarding") {
    return (
      <OnboardingFlow
        onComplete={() => setAppView("main")}
        onSkip={() => setAppView("main")}
      />
    )
  }

  const renderMainScreen = () => {
    // Stacked views with back button
    if (stackedView === "glucose") {
      return (
        <GlucoseScreen
          onBack={() => setStackedView(null)}
        />
      )
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

      {/* Hide nav bar when a stacked view is open */}
      {!stackedView && <BottomNavigation />}

      {/* Add bottom sheet — triggered by central + button */}
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
