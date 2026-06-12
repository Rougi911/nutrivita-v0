"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowDown, ArrowRight, ArrowUp, ChevronRight, Droplets, Scale } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface OnboardingProps {
  onComplete: () => void
  onSkip?: () => void
}

type Step = 1 | 2 | 3 | 4 | 5

export function OnboardingFlow({ onComplete, onSkip }: OnboardingProps) {
  const { t, setUser, user, setIsDiabetic } = useApp()
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
  const [diabeticAnswer, setDiabeticAnswer] = useState<boolean | null>(null)

  const totalSteps = 5

  const calculateCalories = () => {
    const weight = parseFloat(formData.weight) || 70
    const height = parseFloat(formData.height) || 170
    const age    = parseInt(formData.age)       || 30
    const isFemale = formData.sex === "female"
    const bmr = isFemale
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5
    const multipliers = [1.2, 1.375, 1.55, 1.725, 1.9]
    let tdee = bmr * multipliers[formData.activityLevel - 1]
    if (formData.goal === "lose") tdee -= 500
    if (formData.goal === "gain") tdee += 300
    return Math.round(tdee)
  }

  const handleComplete = () => {
    const targetCalories = calculateCalories()
    const isD = diabeticAnswer === true || formData.goal === "diabetes"
    setIsDiabetic(isD)
    setUser({
      ...user,
      name:          formData.name || "Utilisateur",
      age:           parseInt(formData.age)     || 30,
      sex:           (formData.sex as "male" | "female" | "other") || "male",
      height:        parseFloat(formData.height) || 170,
      weight:        parseFloat(formData.weight) || 70,
      goal:          (formData.goal as "lose" | "maintain" | "gain" | "diabetes") || "maintain",
      activityLevel: formData.activityLevel,
      targetCalories,
      isDiabetic: isD,
    })
    onComplete()
  }

  const canProceed = () => {
    switch (step) {
      case 1: return true
      case 2: return !!(formData.name && formData.age && formData.sex && formData.height && formData.weight)
      case 3: return !!formData.goal
      case 4: return diabeticAnswer !== null
      case 5: return true
      default: return false
    }
  }

  const nextStep = () => {
    if (step < totalSteps) setStep((step + 1) as Step)
    else handleComplete()
  }

  const slideVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  }

  const goals = [
    { value: "lose",     icon: <ArrowDown className="h-6 w-6" />, label: t("loseWeight") },
    { value: "maintain", icon: <Scale className="h-6 w-6" />,     label: t("maintainWeight") },
    { value: "gain",     icon: <ArrowUp className="h-6 w-6" />,   label: t("gainMuscle") },
    { value: "diabetes", icon: <Droplets className="h-6 w-6" />,  label: t("manageDiabetes") },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="px-4 pt-5 pb-0">
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ ease: "easeInOut" }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[12px] text-muted-foreground">{step}/{totalSteps}</span>
          {onSkip && step < totalSteps && (
            <button onClick={onSkip} className="text-[13px] text-muted-foreground">
              Passer
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1 — Welcome */}
        {step === 1 && (
          <motion.div
            key="step1"
            variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            className="flex-1 flex flex-col items-center justify-center px-6 text-center pb-8"
          >
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8"
              style={{ backgroundColor: "var(--badge-positive-bg)" }}
            >
              <span className="text-[36px] font-bold" style={{ color: "var(--primary)" }}>N</span>
            </div>
            <h1 className="text-[28px] font-semibold text-foreground mb-3">{t("welcome")}</h1>
            <p className="text-[16px] text-primary mb-2 font-medium">{t("tagline")}</p>
            <p className="text-[14px] text-muted-foreground mb-10">
              Personnalisé pour vous en 2 minutes
            </p>
            <Button size="lg" className="w-full max-w-xs h-13 rounded-2xl gap-2" onClick={nextStep}>
              {t("getStarted")}
              <ChevronRight className="h-5 w-5" />
            </Button>
          </motion.div>
        )}

        {/* Step 2 — Body info */}
        {step === 2 && (
          <motion.div
            key="step2"
            variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            className="flex-1 flex flex-col px-6 py-6"
          >
            <h1 className="text-[22px] font-semibold text-foreground mb-6">{t("tellUs")}</h1>
            <div className="flex-1 space-y-4">
              <div>
                <label className="text-[13px] font-medium text-foreground mb-1.5 block">{t("firstName")}</label>
                <Input
                  placeholder="Ahmed"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-medium text-foreground mb-1.5 block">{t("age")}</label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="28"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="h-12 rounded-xl pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">
                      {t("years")}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-[13px] font-medium text-foreground mb-1.5 block">{t("sex")}</label>
                  <div className="flex rounded-xl border border-border overflow-hidden h-12">
                    {[
                      { value: "male",   label: "M" },
                      { value: "female", label: "F" },
                      { value: "other",  label: "·" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFormData({ ...formData, sex: opt.value as "male" | "female" | "other" })}
                        className={cn(
                          "flex-1 text-[14px] font-semibold transition-colors",
                          formData.sex === opt.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-muted-foreground"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-medium text-foreground mb-1.5 block">{t("height")}</label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="178"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      className="h-12 rounded-xl pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">cm</span>
                  </div>
                </div>
                <div>
                  <label className="text-[13px] font-medium text-foreground mb-1.5 block">{t("weight")}</label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="75"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="h-12 rounded-xl pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">kg</span>
                  </div>
                </div>
              </div>
            </div>
            <Button size="lg" className="w-full h-13 rounded-2xl gap-2 mt-6" onClick={nextStep} disabled={!canProceed()}>
              Continuer <ChevronRight className="h-5 w-5" />
            </Button>
          </motion.div>
        )}

        {/* Step 3 — Goal */}
        {step === 3 && (
          <motion.div
            key="step3"
            variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            className="flex-1 flex flex-col px-6 py-6"
          >
            <h1 className="text-[22px] font-semibold text-foreground mb-6">{t("yourGoal")}</h1>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {goals.map((goal) => (
                <button
                  key={goal.value}
                  onClick={() => setFormData({ ...formData, goal: goal.value as typeof formData.goal })}
                  className={cn(
                    "p-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all active:scale-95",
                    formData.goal === goal.value
                      ? "border-primary bg-[var(--badge-positive-bg)]"
                      : "border-border bg-card"
                  )}
                >
                  <div style={{ color: formData.goal === goal.value ? "var(--primary)" : "var(--muted-foreground)" }}>
                    {goal.icon}
                  </div>
                  <span className="text-[13px] font-medium text-center text-foreground">{goal.label}</span>
                </button>
              ))}
            </div>
            <div className="mb-6">
              <label className="text-[13px] font-medium text-foreground mb-3 block">{t("activityLevel")}</label>
              <div className="flex gap-2">
                {([1, 2, 3, 4, 5] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setFormData({ ...formData, activityLevel: level })}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-[14px] font-semibold transition-colors",
                      formData.activityLevel === level
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-1.5 text-[11px] text-muted-foreground">
                <span>{t("sedentary")}</span>
                <span>{t("extraActive")}</span>
              </div>
            </div>
            <Button size="lg" className="w-full h-13 rounded-2xl gap-2 mt-auto" onClick={nextStep} disabled={!canProceed()}>
              Continuer <ChevronRight className="h-5 w-5" />
            </Button>
          </motion.div>
        )}

        {/* Step 4 — Diabetic question */}
        {step === 4 && (
          <motion.div
            key="step4"
            variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            className="flex-1 flex flex-col px-6 py-6"
          >
            <h1 className="text-[22px] font-semibold text-foreground mb-3">{t("diabeticQuestion")}</h1>
            <p className="text-[14px] text-muted-foreground mb-8">{t("diabeticToggleHint")}</p>
            <div className="space-y-3 flex-1">
              <button
                onClick={() => setDiabeticAnswer(true)}
                className={cn(
                  "w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all active:scale-[0.98]",
                  diabeticAnswer === true
                    ? "border-primary bg-[var(--badge-positive-bg)]"
                    : "border-border bg-card"
                )}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: diabeticAnswer === true ? "var(--primary)" : "var(--muted)" }}
                >
                  <Droplets className="h-5 w-5" style={{ color: diabeticAnswer === true ? "var(--primary-foreground)" : "var(--muted-foreground)" }} />
                </div>
                <span className="text-[15px] font-medium text-foreground">{t("diabeticYes")}</span>
              </button>
              <button
                onClick={() => setDiabeticAnswer(false)}
                className={cn(
                  "w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all active:scale-[0.98]",
                  diabeticAnswer === false
                    ? "border-primary bg-[var(--badge-positive-bg)]"
                    : "border-border bg-card"
                )}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: diabeticAnswer === false ? "var(--primary)" : "var(--muted)" }}
                >
                  <ArrowRight className="h-5 w-5" style={{ color: diabeticAnswer === false ? "var(--primary-foreground)" : "var(--muted-foreground)" }} />
                </div>
                <span className="text-[15px] font-medium text-foreground">{t("diabeticNo")}</span>
              </button>
            </div>
            <Button size="lg" className="w-full h-13 rounded-2xl gap-2 mt-6" onClick={nextStep} disabled={diabeticAnswer === null}>
              Continuer <ChevronRight className="h-5 w-5" />
            </Button>
          </motion.div>
        )}

        {/* Step 5 — Ready */}
        {step === 5 && (
          <motion.div
            key="step5"
            variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            className="flex-1 flex flex-col items-center justify-center px-6 text-center pb-8"
          >
            <motion.div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8"
              style={{ backgroundColor: "var(--badge-positive-bg)" }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <span className="text-[36px] font-bold" style={{ color: "var(--primary)" }}>N</span>
            </motion.div>

            <h1 className="text-[28px] font-semibold text-foreground mb-6">{t("ready")}</h1>

            <div className="w-full max-w-sm space-y-3 mb-8">
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-[13px] text-muted-foreground mb-1">{t("dailyGoal")}</p>
                <p className="text-[30px] font-semibold text-primary leading-none">
                  {calculateCalories().toLocaleString()} kcal{t("perDay")}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-[13px] text-muted-foreground mb-2">Macros</p>
                <div className="flex justify-between text-[13px]">
                  <span><strong>{Math.round((calculateCalories() * 0.45) / 4)}g</strong> {t("carbs")}</span>
                  <span><strong>{Math.round((calculateCalories() * 0.30) / 4)}g</strong> {t("protein")}</span>
                  <span><strong>{Math.round((calculateCalories() * 0.25) / 9)}g</strong> {t("fat")}</span>
                </div>
              </div>
            </div>

            <Button size="lg" className="w-full max-w-xs h-13 rounded-2xl gap-2" onClick={handleComplete}>
              {t("startJourney")}
              <ChevronRight className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
