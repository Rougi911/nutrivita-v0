"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowDown, ArrowUp, CheckSquare, ChevronRight, Droplets, Eye, EyeOff, Scale, Square } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { register, ApiError } from "@/lib/api"
import { toggleGoal, POIDS_GOALS } from "@/lib/goals"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface OnboardingProps {
  onComplete: () => void
  onSkip?: () => void
}

type Step = 1 | 2 | 3 | 4 | 5 | 6

// POIDS group — mutually exclusive (radio)
const POIDS_OPTIONS = [
  { value: "lose",     icon: ArrowDown, label: "Perdre du poids" },
  { value: "maintain", icon: Scale,     label: "Maintenir le poids" },
  { value: "gain",     icon: ArrowUp,   label: "Prendre du muscle" },
]
// CONDITION group — cumulative
const CONDITION_OPTIONS = [
  { value: "diabetes", icon: Droplets, label: "Gérer le diabète" },
]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function OnboardingFlow({ onComplete, onSkip }: OnboardingProps) {
  const { setUser, user, setIsDiabetic, login: contextLogin } = useApp()
  const [step, setStep] = useState<Step>(1)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    age: "",
    sex: "" as "male" | "female" | "other" | "",
    height: "",
    weight: "",
    goals: [] as string[],
    activityLevel: 3 as 1 | 2 | 3 | 4 | 5,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [isDiabeticStep5, setIsDiabeticStep5] = useState<boolean | null>(null)
  const [consentChecked, setConsentChecked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)

  const hasDiabetes = formData.goals.includes("diabetes")
  // Step 5 (diabetic question) is skipped when "diabetes" already selected in goals
  const totalSteps = hasDiabetes ? 5 : 6

  const handleToggleGoal = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      goals: toggleGoal(prev.goals, value),
    }))
  }

  const derivePrimaryGoal = () => {
    if (formData.goals.includes("lose")) return "lose"
    if (formData.goals.includes("gain")) return "gain"
    return "maintain"
  }

  const calculateCalories = () => {
    const weight  = parseFloat(formData.weight)  || 70
    const height  = parseFloat(formData.height)  || 170
    const age     = parseInt(formData.age)        || 30
    const isFemale = formData.sex === "female"
    const bmr = isFemale
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5
    const multipliers = [1.2, 1.375, 1.55, 1.725, 1.9]
    let tdee = bmr * multipliers[formData.activityLevel - 1]
    const primary = derivePrimaryGoal()
    if (primary === "lose") tdee -= 400
    if (primary === "gain") tdee += 300
    return Math.round(tdee)
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    setRegisterError(null)
    try {
      const targetCalories = calculateCalories()
      const isD = hasDiabetes || isDiabeticStep5 === true

      const result = await register(
        formData.email,
        formData.password,
        formData.name || "Utilisateur",
        consentChecked
      )

      contextLogin(result.token, result.user)

      setIsDiabetic(isD)
      setUser({
        ...user,
        name:          result.user.name || formData.name || "Utilisateur",
        age:           parseInt(formData.age)     || 30,
        sex:           (formData.sex as "male" | "female" | "other") || "male",
        height:        parseFloat(formData.height) || 170,
        weight:        parseFloat(formData.weight) || 70,
        goals:         formData.goals.length > 0 ? formData.goals : ["maintain"],
        activityLevel: formData.activityLevel,
        targetCalories,
        isDiabetic:    isD,
      })

      onComplete()
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0
      if (status === 409) {
        setRegisterError("Un compte avec cet email existe déjà. Connectez-vous depuis la page d’accueil.")
      } else if (status === 400) {
        setRegisterError("Données invalides. Vérifiez vos informations.")
      } else {
        setRegisterError("Erreur d’inscription. Vérifiez votre connexion et réessayez.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const isEmailValid = EMAIL_REGEX.test(formData.email)

  const canProceed = () => {
    switch (step) {
      case 1: return consentChecked
      case 2:
        return (
          isEmailValid &&
          formData.password.length >= 6 &&
          formData.password === formData.confirmPassword
        )
      case 3: return !!(formData.name && formData.age && formData.sex && formData.height && formData.weight)
      case 4: return formData.goals.length > 0
      case 5: return true // diabetic question — can always proceed
      case 6: return true // ready screen
      default: return false
    }
  }

  const nextStep = () => {
    if (step === 4 && hasDiabetes) {
      setStep(6)
    } else if (step < 6) {
      setStep((step + 1) as Step)
    } else {
      handleComplete()
    }
  }

  const displayStep = step === 6 ? totalSteps : Math.min(step, totalSteps)

  const slideVariants = {
    enter:  { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit:   { opacity: 0, x: -40 },
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="px-4 pt-5 pb-0">
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${(displayStep / totalSteps) * 100}%` }}
            transition={{ ease: "easeInOut" }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[12px] text-muted-foreground">{displayStep}/{totalSteps}</span>
          {onSkip && step < 6 && (
            <button onClick={onSkip} className="text-[13px] text-muted-foreground">
              Passer
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1 — Welcome + Consentement RGPD (Art. 9) */}
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
              <span className="text-[36px] font-semibold" style={{ color: "var(--primary)" }}>N</span>
            </div>
            <h1 className="text-[28px] font-semibold text-foreground mb-3">Bienvenue</h1>
            <p className="text-[16px] text-primary mb-2 font-medium">Votre app nutrition</p>
            <p className="text-[14px] text-muted-foreground mb-6">
              Personnalisé pour vous en 2 minutes
            </p>

            {/* Consentement RGPD Art. 9 — obligatoire avant collecte données de santé */}
            <ConsentCheckbox checked={consentChecked} onChange={setConsentChecked} />

            <Button
              size="lg"
              className="w-full max-w-xs h-13 rounded-2xl gap-2 mt-5"
              onClick={nextStep}
              disabled={!consentChecked}
            >
              Commencer
              <ChevronRight className="h-5 w-5" />
            </Button>
          </motion.div>
        )}

        {/* Step 2 — Identifiants (email + mot de passe) */}
        {step === 2 && (
          <motion.div
            key="step2"
            variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            className="flex-1 flex flex-col px-6 py-6"
          >
            <h1 className="text-[22px] font-semibold text-foreground mb-2">Créez votre compte</h1>
            <p className="text-[13px] text-muted-foreground mb-6">Vos identifiants de connexion</p>

            <div className="flex-1 space-y-4">
              <div>
                <label className="text-[13px] font-medium text-foreground mb-1.5 block">Adresse email</label>
                <Input
                  type="email"
                  placeholder="vous@exemple.fr"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-12 rounded-xl"
                  autoComplete="email"
                  inputMode="email"
                />
                {formData.email && !isEmailValid && (
                  <p className="text-[12px] mt-1" style={{ color: "var(--risk)" }}>
                    Adresse email invalide
                  </p>
                )}
              </div>
              <div>
                <label className="text-[13px] font-medium text-foreground mb-1.5 block">Mot de passe</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="6 caractères minimum"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-12 rounded-xl pr-11"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    tabIndex={-1}
                  >
                    {showPassword
                      ? <EyeOff className="h-4 w-4" />
                      : <Eye className="h-4 w-4" />
                    }
                  </button>
                </div>
                {formData.password && formData.password.length < 6 && (
                  <p className="text-[12px] mt-1" style={{ color: "var(--risk)" }}>
                    6 caractères minimum
                  </p>
                )}
              </div>
              <div>
                <label className="text-[13px] font-medium text-foreground mb-1.5 block">Confirmer le mot de passe</label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Répétez le mot de passe"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="h-12 rounded-xl"
                  autoComplete="new-password"
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-[12px] mt-1" style={{ color: "var(--risk)" }}>
                    Les mots de passe ne correspondent pas
                  </p>
                )}
              </div>
            </div>

            <Button
              size="lg"
              className="w-full h-13 rounded-2xl gap-2 mt-6"
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Continuer <ChevronRight className="h-5 w-5" />
            </Button>
          </motion.div>
        )}

        {/* Step 3 — Body info */}
        {step === 3 && (
          <motion.div
            key="step3"
            variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            className="flex-1 flex flex-col px-6 py-6"
          >
            <h1 className="text-[22px] font-semibold text-foreground mb-6">Parlez-nous de vous</h1>
            <div className="flex-1 space-y-4">
              <div>
                <label className="text-[13px] font-medium text-foreground mb-1.5 block">Prénom</label>
                <Input
                  placeholder="Votre prénom"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-medium text-foreground mb-1.5 block">Âge</label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="28"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="h-12 rounded-xl pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">ans</span>
                  </div>
                </div>
                <div>
                  <label className="text-[13px] font-medium text-foreground mb-1.5 block">Sexe</label>
                  <div className="flex rounded-xl border border-border overflow-hidden h-12">
                    {[
                      { value: "male",   label: "H" },
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
                  <label className="text-[13px] font-medium text-foreground mb-1.5 block">Taille</label>
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
                  <label className="text-[13px] font-medium text-foreground mb-1.5 block">Poids</label>
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
            <Button
              size="lg"
              className="w-full h-13 rounded-2xl gap-2 mt-6"
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Continuer <ChevronRight className="h-5 w-5" />
            </Button>
          </motion.div>
        )}

        {/* Step 4 — Goals (POIDS radio + CONDITION cumulative) + Activity */}
        {step === 4 && (
          <motion.div
            key="step4"
            variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            className="flex-1 flex flex-col px-6 py-6"
          >
            <h1 className="text-[22px] font-semibold text-foreground mb-2">Vos objectifs</h1>

            {/* POIDS — radio exclusif */}
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 mt-4">
              Objectif de poids
            </p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {POIDS_OPTIONS.map((goal) => {
                const Icon = goal.icon
                const selected = formData.goals.includes(goal.value)
                return (
                  <button
                    key={goal.value}
                    onClick={() => handleToggleGoal(goal.value)}
                    className={cn(
                      "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all active:scale-95",
                      selected
                        ? "border-primary bg-[var(--badge-positive-bg)]"
                        : "border-border bg-card"
                    )}
                  >
                    <Icon
                      className="h-5 w-5"
                      style={{ color: selected ? "var(--primary)" : "var(--muted-foreground)" }}
                    />
                    <span className="text-[12px] font-medium text-center text-foreground leading-tight">
                      {goal.label}
                    </span>
                    {selected && (
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "var(--primary)" }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* CONDITION — cumulative */}
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Condition de santé (optionnel)
            </p>
            <div className="space-y-2 mb-5">
              {CONDITION_OPTIONS.map((goal) => {
                const Icon = goal.icon
                const selected = formData.goals.includes(goal.value)
                return (
                  <button
                    key={goal.value}
                    onClick={() => handleToggleGoal(goal.value)}
                    className={cn(
                      "w-full p-4 rounded-2xl border-2 flex items-center gap-3 transition-all active:scale-[0.99]",
                      selected
                        ? "border-primary bg-[var(--badge-positive-bg)]"
                        : "border-border bg-card"
                    )}
                  >
                    <Icon
                      className="h-5 w-5 shrink-0"
                      style={{ color: selected ? "var(--primary)" : "var(--muted-foreground)" }}
                    />
                    <span className="text-[14px] font-medium text-foreground">{goal.label}</span>
                    {selected && (
                      <div
                        className="ml-auto w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "var(--primary)" }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Activity level */}
            <div className="mb-4">
              <label className="text-[13px] font-medium text-foreground mb-3 block">
                Niveau d&apos;activité physique
              </label>
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
                <span>Sédentaire</span>
                <span>Très actif</span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full h-13 rounded-2xl gap-2 mt-auto"
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Continuer <ChevronRight className="h-5 w-5" />
            </Button>
          </motion.div>
        )}

        {/* Step 5 — Diabetic question (only when diabetes NOT in goals) */}
        {step === 5 && !hasDiabetes && (
          <motion.div
            key="step5"
            variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            className="flex-1 flex flex-col px-6 py-6"
          >
            <h1 className="text-[22px] font-semibold text-foreground mb-3">Êtes-vous diabétique ?</h1>
            <p className="text-[14px] text-muted-foreground mb-8">
              Cela active le suivi glycémique personnalisé.
            </p>
            <div className="space-y-3 flex-1">
              {([
                { value: true  as boolean, icon: <Droplets className="h-5 w-5" />, label: "Oui, je suis diabétique" },
                { value: false as boolean, icon: <ChevronRight className="h-5 w-5" />, label: "Non, continuer sans" },
              ] as const).map((opt) => {
                const selected = isDiabeticStep5 === opt.value
                return (
                  <button
                    key={String(opt.value)}
                    onClick={() => setIsDiabeticStep5(opt.value)}
                    className={cn(
                      "w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all active:scale-[0.98]",
                      selected ? "border-primary bg-[var(--badge-positive-bg)]" : "border-border bg-card"
                    )}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: selected ? "var(--primary)" : "var(--muted)",
                        color: selected ? "var(--primary-foreground)" : "var(--muted-foreground)",
                      }}
                    >
                      {opt.icon}
                    </div>
                    <span className="text-[15px] font-medium text-foreground">{opt.label}</span>
                  </button>
                )
              })}
            </div>
            <Button size="lg" className="w-full h-13 rounded-2xl gap-2 mt-6" onClick={nextStep}>
              Continuer <ChevronRight className="h-5 w-5" />
            </Button>
          </motion.div>
        )}

        {/* Step 6 — Ready */}
        {step === 6 && (
          <motion.div
            key="step6"
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
              <span className="text-[36px] font-semibold" style={{ color: "var(--primary)" }}>N</span>
            </motion.div>

            <h1 className="text-[28px] font-semibold text-foreground mb-6">Tout est prêt</h1>

            <div className="w-full max-w-sm space-y-3 mb-8">
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-[13px] text-muted-foreground mb-1">Objectif calorique</p>
                <p className="text-[30px] font-semibold text-primary leading-none">
                  {calculateCalories().toLocaleString()} kcal/j
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-[13px] text-muted-foreground mb-2">Macros</p>
                <div className="flex justify-between text-[13px]">
                  <span><strong>{Math.round((calculateCalories() * 0.45) / 4)}g</strong> Glucides</span>
                  <span><strong>{Math.round((calculateCalories() * 0.30) / 4)}g</strong> Protéines</span>
                  <span><strong>{Math.round((calculateCalories() * 0.25) / 9)}g</strong> Lipides</span>
                </div>
              </div>
            </div>

            {registerError && (
              <div className="w-full max-w-sm mb-4 px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/10">
                <p className="text-[13px]" style={{ color: "var(--risk)" }}>{registerError}</p>
              </div>
            )}

            <Button
              size="lg"
              className="w-full max-w-xs h-13 rounded-2xl gap-2"
              onClick={handleComplete}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Création du compte..." : "Commencer"}
              {!isSubmitting && <ChevronRight className="h-5 w-5" />}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── ConsentCheckbox ──────────────────────────────────────────────────────────

function ConsentCheckbox({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 max-w-xs text-left rounded-xl p-3 border border-border bg-card active:scale-[0.98] transition-all"
    >
      <div className="shrink-0 mt-0.5">
        {checked
          ? <CheckSquare className="h-5 w-5" style={{ color: "var(--primary)" }} />
          : <Square className="h-5 w-5 text-muted-foreground" />
        }
      </div>
      <div className="text-[12px] text-muted-foreground leading-snug space-y-1">
        <p>
          J&apos;accepte que mes données de santé soient traitées conformément à la{" "}
          <span className="underline" style={{ color: "var(--primary)" }}>politique de confidentialité</span>
          {" "}&middot; RGPD Art. 9
        </p>
        <p>
          I agree my health data is processed per the{" "}
          <span className="underline" style={{ color: "var(--primary)" }}>privacy policy</span>
          {" "}&middot; GDPR Art. 9
        </p>
        <p dir="rtl">
          {"\\u0623\\u0648\\u0627\\u0641\\u0642 \\u0639\\u0644\\u0649 \\u0645\\u0639\\u0627\\u0644\\u062C\\u0629 \\u0628\\u064A\\u0627\\u0646\\u0627\\u062A\\u064A \\u0627\\u0644\\u0635\\u062D\\u064A\\u0629 \\u00B7 RGPD \\u0627\\u0644\\u0645\\u0627\\u062F\\u0629 9"}
        </p>
      </div>
    </button>
  )
}
