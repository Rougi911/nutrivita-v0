"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppProvider, useApp } from "@/lib/app-context";
import { JournalScreen } from "./journal-screen";
import { MealsScreen } from "./meals-screen";
import { StatsScreen } from "./stats-screen";
import { GlucoseScreen } from "./glucose-screen";
import { SettingsScreen } from "./settings-screen";
import { LandingPage } from "./landing-page";
import { OnboardingFlow } from "./onboarding-flow";
import { BottomNavigation } from "./bottom-navigation";

type AppView = "landing" | "onboarding" | "main";

function AppContent() {
  const [appView, setAppView] = useState<AppView>("landing");
  const { activeTab } = useApp();

  const handleGetStarted = () => {
    setAppView("onboarding");
  };

  const handleOnboardingComplete = () => {
    setAppView("main");
  };

  const handleSkipOnboarding = () => {
    setAppView("main");
  };

  if (appView === "landing") {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  if (appView === "onboarding") {
    return (
      <OnboardingFlow
        onComplete={handleOnboardingComplete}
        onSkip={handleSkipOnboarding}
      />
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case "journal":
        return <JournalScreen />;
      case "meals":
        return <MealsScreen />;
      case "stats":
        return <StatsScreen />;
      case "glucose":
        return <GlucoseScreen />;
      case "settings":
        return <SettingsScreen />;
      default:
        return <JournalScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex-1 pb-20"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
      <BottomNavigation />
    </div>
  );
}

export function NutriVitaApp() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
