"use client"

import { useState, useEffect } from "react"
import { AppProvider, useApp } from "@/lib/app-context"
import { JournalScreen } from "./journal-screen"
import { MealsScreen } from "./meals-screen"
import { SettingsScreen } from "./settings-screen"
import { LandingPage } from "./landing-page"
import { OnboardingFlow } from "./onboarding-flow"
import { BottomNavigation } from "./bottom-navigation"
import { HomeScreenV2 } from "./home-screen-v2"
import { StatsTab } from "./stats-tab"
import { GlucoseTab } from "./glucose-tab"
import { GroceriesScreen } from "./groceries-screen"
import { AddSheet } from "./add-sheet"
import { FoodSearchSheet } from "./food-search-sheet"
import { InstallPrompt } from "./install-prompt"

type AppView = "checking" | "landing" | "onboarding" | "main"

function AppContent() {
  const [appView, setAppView] = useState<AppView>("checking")
  const { activeTab, setActiveTab, showAddSheet, isAuthenticated, isAuthLoading, serverWaking } = useApp()

  const [stackedView, setStackedView] = useState<"glucose" | "settings" | null>(null)

  // P0-1 / Fix E2E (L1) — reset du scroll à chaque changement de vue.
  // Le simple window.scrollTo(0,0) était inefficace : AnimatePresence mode="wait"
  // monte le nouvel écran APRÈS l'animation de sortie (~180 ms), donc le reset
  // s'appliquait avant le montage → l'utilisateur arrivait sur un écran blanc.
  // On rejoue le reset après le paint (rAF) et après l'animation (timeout), sur
  // window ET les conteneurs de scroll possibles.
  useEffect(() => {
    if (typeof window === "undefined") return
    const reset = () => {
      window.scrollTo(0, 0)
      document.scrollingElement?.scrollTo?.({ top: 0, left: 0 })
      if (document.documentElement) document.documentElement.scrollTop = 0
      if (document.body) document.body.scrollTop = 0
    }
    reset()
    const raf = requestAnimationFrame(() => requestAnimationFrame(reset))
    const timer = setTimeout(reset, 260)
    return () => { cancelAnimationFrame(raf); clearTimeout(timer) }
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
        <p className="text-[17px] font-semibold text-foreground">NutraLance</p>
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
      // P2 — vue empilée depuis Profil : même écran fusionné que l'onglet bottom nav, avec bouton retour.
      return <GlucoseTab onBack={() => setStackedView(null)} />
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
          <HomeScreenV2
            onOpenSettings={() => setStackedView("settings")}
            onOpenGlucose={() => setActiveTab("glucose")}
          />
        )
      case "journal":
        return <JournalScreen />
      case "meals":
        return <MealsScreen />
      case "glucose":
        return <GlucoseTab />
      case "stats":
        return (
          <StatsTab
            onOpenSettings={() => setStackedView("settings")}
            onOpenGroceries={() => setActiveTab("groceries")}
          />
        )
      case "groceries":
        return <GroceriesScreen onBack={() => setActiveTab("stats")} />
      default:
        return (
          <HomeScreenV2
            onOpenSettings={() => setStackedView("settings")}
            onOpenGlucose={() => setActiveTab("glucose")}
          />
        )
    }
  }

  const screenKey = stackedView ?? activeTab

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fix BUG-2 (écran blanc au changement d'onglet) : l'ancien AnimatePresence
          mode="wait" + motion.div restait bloqué à son état initial (opacity:0,
          translateX 20px) quand la sortie ne se terminait pas → écran invisible.
          On rend l'écran directement (toujours visible). Le `key` force le remount
          par onglet (et déclenche le reset de scroll). */}
      <div key={screenKey} className="flex-1 pb-20 w-full max-w-lg mx-auto">
        {renderMainScreen()}
      </div>

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
