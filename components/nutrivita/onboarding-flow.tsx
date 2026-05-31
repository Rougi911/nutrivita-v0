"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ArrowDown, ArrowUp, Droplet } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface OnboardingProps {
  onComplete: () => void
}

type Step = 1 | 2 | 3 | 4

export function OnboardingFlow({ onComplete }: OnboardingProps) {
  const { t, setUser, user } = useApp()
  const [step, setStep] = useState<Step>(1)
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    sex: "" as "male" | "female" | "other" | "",
    height: "",
    weight: "",
    goal: "" as "lose" | "maintain" | "gain" | "diabetes" | "",
    activityLevel: 3 as 1 | 2 | 3 | 4 | 5,
  })

  const calculateCalories = () => {
    // Mifflin-St Jeor equation
    const weight = parseFloat(formData.weight) || 70
    const height = parseFloat(formData.height) || 170
    const age = parseInt(formData.age) || 30
    
    let bmr: number
    if (formData.sex === "female") {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5
    }

    const activityMultipliers = [1.2, 1.375, 1.55, 1.725, 1.9]
    const tdee = bmr * activityMultipliers[formData.activityLevel - 1]

    // Adjust for goal
    let targetCalories = tdee
    if (formData.goal === "lose") targetCalories -= 500
    if (formData.goal === "gain") targetCalories += 300

    return Math.round(targetCalories)
  }

  const handleComplete = () => {
    const targetCalories = calculateCalories()
    setUser({
      ...user,
      name: formData.name || "Utilisateur",
      age: parseInt(formData.age) || 30,
      sex: formData.sex || "male",
      height: parseFloat(formData.height) || 170,
      weight: parseFloat(formData.weight) || 70,
      goal: formData.goal || "maintain",
      activityLevel: formData.activityLevel,
      targetCalories,
    })
    onComplete()
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return true
      case 2:
        return formData.name && formData.age && formData.sex && formData.height && formData.weight
      case 3:
        return formData.goal
      case 4:
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    if (step < 4) setStep((step + 1) as Step)
    else handleComplete()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-8 pb-4">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              s === step ? "bg-primary" : s < step ? "bg-primary/50" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Skip button */}
      {step < 4 && (
        <button
          onClick={handleComplete}
          className="absolute top-8 right-4 text-sm text-muted-foreground"
        >
          Passer
        </button>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Welcome */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center"
          >
            <motion.div
              className="text-8xl mb-8"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🥗
            </motion.div>
            <h1 className="text-3xl font-bold text-foreground mb-3">
              {t("welcome")} 🎉
            </h1>
            <p className="text-xl text-primary mb-2">{t("tagline")}</p>
            <p className="text-muted-foreground mb-8">
              Personnalisé pour vous en 2 minutes
            </p>
            <Button
              size="lg"
              className="w-full max-w-xs gradient-hero text-white text-lg h-14 rounded-2xl"
              onClick={nextStep}
            >
              {t("getStarted")}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        )}

        {/* Step 2: Body info */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col px-6 py-8"
          >
            <h1 className="text-2xl font-bold text-foreground mb-6">
              {t("tellUs")} 📝
            </h1>

            <div className="space-y-4 flex-1">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t("firstName")}
                </label>
                <Input
                  placeholder="Ahmed"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t("age")}
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="28"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData({ ...formData, age: e.target.value })
                      }
                      className="h-12 rounded-xl pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {t("years")}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t("sex")}
                  </label>
                  <div className="flex rounded-xl border border-border overflow-hidden h-12">
                    {[
                      { value: "male", label: "♂", full: t("male") },
                      { value: "female", label: "♀", full: t("female") },
                      { value: "other", label: "◎", full: t("other") },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            sex: option.value as typeof formData.sex,
                          })
                        }
                        className={cn(
                          "flex-1 text-lg transition-colors",
                          formData.sex === option.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t("height")}
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="178"
                      value={formData.height}
                      onChange={(e) =>
                        setFormData({ ...formData, height: e.target.value })
                      }
                      className="h-12 rounded-xl pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      cm
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t("weight")}
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="75"
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData({ ...formData, weight: e.target.value })
                      }
                      className="h-12 rounded-xl pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      kg
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full gradient-hero text-white text-lg h-14 rounded-2xl mt-6"
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Continuer
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        )}

        {/* Step 3: Goal */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col px-6 py-8"
          >
            <h1 className="text-2xl font-bold text-foreground mb-6">
              {t("yourGoal")} 🎯
            </h1>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { value: "lose", icon: <ArrowDown className="h-8 w-8" />, label: t("loseWeight") },
                { value: "maintain", icon: "➡️", label: t("maintainWeight") },
                { value: "gain", icon: <ArrowUp className="h-8 w-8" />, label: t("gainMuscle") },
                { value: "diabetes", icon: <Droplet className="h-8 w-8" />, label: t("manageDiabetes") },
              ].map((goal) => (
                <motion.button
                  key={goal.value}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      goal: goal.value as typeof formData.goal,
                    })
                  }
                  className={cn(
                    "p-6 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all",
                    formData.goal === goal.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
                  )}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-3xl">
                    {typeof goal.icon === "string" ? goal.icon : goal.icon}
                  </span>
                  <span className="text-sm font-medium text-center">
                    {goal.label}
                  </span>
                </motion.button>
              ))}
            </div>

            <div className="mb-6">
              <label className="text-sm font-medium mb-3 block">
                {t("activityLevel")}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        activityLevel: level as typeof formData.activityLevel,
                      })
                    }
                    className={cn(
                      "flex-1 py-3 rounded-xl text-sm font-medium transition-colors",
                      formData.activityLevel === level
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{t("sedentary")}</span>
                <span>{t("extraActive")}</span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full gradient-hero text-white text-lg h-14 rounded-2xl mt-auto"
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Continuer
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        )}

        {/* Step 4: Ready */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center"
          >
            <motion.div
              className="text-8xl mb-8"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              🚀
            </motion.div>
            <h1 className="text-3xl font-bold text-foreground mb-6">
              {t("ready")}
            </h1>

            <div className="w-full max-w-sm space-y-4 mb-8">
              <div className="p-4 rounded-2xl bg-card border border-border">
                <p className="text-sm text-muted-foreground mb-1">
                  {t("dailyGoal")}
                </p>
                <p className="text-3xl font-bold text-primary">
                  {calculateCalories().toLocaleString()} kcal{t("perDay")}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border">
                <p className="text-sm text-muted-foreground mb-2">Macros</p>
                <div className="flex justify-between text-sm">
                  <span>
                    <strong>{Math.round((calculateCalories() * 0.5) / 4)}g</strong>{" "}
                    {t("carbs")}
                  </span>
                  <span>
                    <strong>{Math.round((calculateCalories() * 0.2) / 4)}g</strong>{" "}
                    {t("protein")}
                  </span>
                  <span>
                    <strong>{Math.round((calculateCalories() * 0.3) / 9)}g</strong>{" "}
                    {t("fat")}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground mb-8">
              <p>🍽️ Journal alimentaire intelligent</p>
              <p>🩸 Suivi glycémique intégré</p>
              <p>🎤 Saisie vocale multilingue</p>
            </div>

            <Button
              size="lg"
              className="w-full max-w-xs gradient-hero text-white text-lg h-14 rounded-2xl"
              onClick={handleComplete}
            >
              {t("startJourney")}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
