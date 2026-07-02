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
import { FoodSearchSheet } from "./food-search-sheet"
import { InstallPrompt } from "./install-prompt"

type AppView = "checking" | "landing" | "onboarding" | "main"

function AppContent() {
  const [appView, setAppView] = useState<AppView>("checking")
  const { activeTab, setActiveTab, showAddSheet, isAuthenticated, isAuthLoading, serverWaking } = useApp()

  const [stackedView, setStackedView] = useState<"glucose" | "settings" | null>(null)

  // P0-1 — reset du scroll à chaque changement de vue (onglet ou vue empilée).
  // Sans ça, la position de scroll est conservée et l'utilisateur arrive sur un
  // écran blanc (constat audit L1).
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo(0, 0)
  }, [activeTab, stackedView])

  // S16 — retour OAuth Strava (`/reglages?strava=ok|error`) : ouvre l'écran Réglages
  // pour que la ligne Strava lise le paramètre et déclenche le sync.
  useEffect(() => {
    if (typeof window === "undefined") return
    if (new URLSearchParams(window.location.search).has("strava")) {
      setStackedView("settings")
    }
  }, [])

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
    // P0-6 — splash brandé (au lieu d'un spinner nu) + message d'attente si le
    // serveur gratuit Render est en train de se réveiller (30-60 s).
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-8">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg">
          N
        </div>
        <p className="text-[17px] font-semibold text-foreground">NutriVita</p>
        <div
          className="h-7 w-7 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
        />
        {serverWaking && (
          <p className="text-[12.5px] text-muted-foreground text-center max-w-[260px]">
            Le serveur se réveille, cela peut prendre jusqu'à une minute…
          </p>
        )}
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
        return <StatsScreen onOpenSettings={() => setStackedView("settings")} />
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
          className="flex-1 pb-20 w-full max-w-lg mx-auto"
        >
          {renderMainScreen()}
        </motion.div>
      </AnimatePresence>

      {!stackedView && <BottomNavigation />}
      {!showAddSheet && <InstallPrompt />}
      {showAddSheet && <AddSheet />}
      <FoodSearchSheet />
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
