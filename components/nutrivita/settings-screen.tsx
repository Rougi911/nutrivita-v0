"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Download,
  Star,
  Trash2,
  X,
} from "lucide-react"
import { useTheme } from "next-themes"
import { AnimatePresence, motion } from "framer-motion"
import { useApp } from "@/lib/app-context"
import { adjustMacros } from "@/lib/macros"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import type { Language, GlucoseUnit, TranslationKey } from "@/lib/types"

interface SettingsScreenProps {
  onBack?: () => void
  onOpenGlucose?: () => void
}

export function SettingsScreen({ onBack, onOpenGlucose }: SettingsScreenProps) {
  const {
    user, setUser,
    t, language, setLanguage, isRTL,
    clearJournal, clearWeight, clearGlucose,
    isDiabetic, setIsDiabetic,
    glucoseTarget, setGlucoseTarget,
  } = useApp()

  // (e) useTheme — NOT classList.toggle
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [editName,   setEditName]   = useState(user.name)
  const [editAge,    setEditAge]    = useState(user.age.toString())
  const [editWeight, setEditWeight] = useState(user.weight.toString())

  const initials = user.name.slice(0, 2).toUpperCase()

  const handleUnitChange = (key: keyof typeof user.units, value: string) => {
    setUser({ ...user, units: { ...user.units, [key]: value } })
  }

  // (d) adjustMacros with AL-11 logic
  const handleMacroChange = (key: keyof typeof user.macros, value: number) => {
    const newMacros = adjustMacros(user.macros, key, value)
    setUser({ ...user, macros: newMacros })
  }

  const handleSaveProfile = () => {
    setUser({
      ...user,
      name: editName.trim() || user.name,
      age: parseInt(editAge) || user.age,
      weight: parseFloat(editWeight) || user.weight,
    })
    setShowProfileEdit(false)
  }

  const goalLabels: Record<string, string> = {
    lose:     t("loseWeight"),
    maintain: t("maintainWeight"),
    gain:     t("gainMuscle"),
    diabetes: t("manageDiabetes"),
  }

  const macroConfig = [
    { key: "carbs"   as const, label: t("carbs"),   color: "var(--amber)" },
    { key: "protein" as const, label: t("protein"), color: "var(--glucose)" },
    { key: "fat"     as const, label: t("fat"),     color: "var(--lipids)" },
  ]

  return (
    <div className={cn("flex flex-col min-h-screen bg-background pb-8", isRTL && "rtl")}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
        )}
        <h1 className="text-[18px] font-semibold text-foreground">{t("settings")}</h1>
      </div>

      <div className="px-4 space-y-6 pb-6">

        {/* (a) Flat profile card — no gradient, initials avatar */}
        <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 text-primary-foreground text-[18px] font-semibold"
            style={{ backgroundColor: "var(--primary)" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-semibold text-foreground">{user.name}</p>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {user.age} ans · {user.height} cm · {user.weight} kg
            </p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {goalLabels[user.goal]} · {user.targetCalories} kcal/j
            </p>
          </div>
          <button
            onClick={() => setShowProfileEdit(true)}
            className="px-3 py-1.5 rounded-xl border border-border text-[13px] font-medium text-foreground bg-muted shrink-0"
          >
            {t("edit")}
          </button>
        </div>

        {/* Units — (b) 3-option glucose toggle: g/L / mg/dL / mmol/L */}
        <SettingsGroup title={t("units")}>
          <SettingsRow label={t("weight")}>
            <UnitToggle value={user.units.weight} options={["kg", "lbs"]} onChange={(v) => handleUnitChange("weight", v)} />
          </SettingsRow>
          <SettingsRow label={t("height")}>
            <UnitToggle value={user.units.height} options={["cm", "ft"]} onChange={(v) => handleUnitChange("height", v)} />
          </SettingsRow>
          <SettingsRow label={t("glucose")}>
            <UnitToggle
              value={user.units.glucose}
              options={["g/L", "mg/dL", "mmol/L"] satisfies GlucoseUnit[]}
              onChange={(v) => handleUnitChange("glucose", v as GlucoseUnit)}
            />
          </SettingsRow>
          <SettingsRow label="Énergie">
            <UnitToggle value={user.units.energy} options={["kcal", "kJ"]} onChange={(v) => handleUnitChange("energy", v)} />
          </SettingsRow>
        </SettingsGroup>

        {/* (c) Santé group */}
        <SettingsGroup title={t("healthGroup")}>
          <SettingsRow label={t("diabeticToggle")}>
            <Switch
              checked={isDiabetic}
              onCheckedChange={(v) => {
                setIsDiabetic(v)
                setUser({ ...user, isDiabetic: v })
              }}
            />
          </SettingsRow>
          {isDiabetic && (
            <>
              <SettingsRow label={`${t("glucoseTargetLabel")} min`}>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    className="w-20 h-8 text-[13px] text-center"
                    value={glucoseTarget.low}
                    onChange={(e) =>
                      setGlucoseTarget({ ...glucoseTarget, low: Number(e.target.value) })
                    }
                  />
                  <span className="text-[12px] text-muted-foreground">mg/dL</span>
                </div>
              </SettingsRow>
              <SettingsRow label={`${t("glucoseTargetLabel")} max`}>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    className="w-20 h-8 text-[13px] text-center"
                    value={glucoseTarget.high}
                    onChange={(e) =>
                      setGlucoseTarget({ ...glucoseTarget, high: Number(e.target.value) })
                    }
                  />
                  <span className="text-[12px] text-muted-foreground">mg/dL</span>
                </div>
              </SettingsRow>
              {onOpenGlucose && (
                <button
                  className="flex items-center justify-between w-full px-4 py-3 text-left"
                  onClick={onOpenGlucose}
                >
                  <span className="text-[14px] font-medium">{t("glucoseTracking")}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </>
          )}
        </SettingsGroup>

        {/* (d) Macro sliders with adjustMacros() */}
        <SettingsGroup title={t("macroGoals")}>
          <div className="px-4 py-3 space-y-4">
            {macroConfig.map((macro) => (
              <div key={macro.key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] font-medium text-foreground">{macro.label}</span>
                  <span className="text-[14px] font-semibold text-foreground">{user.macros[macro.key]}%</span>
                </div>
                <Slider
                  value={[user.macros[macro.key]]}
                  onValueChange={([v]) => handleMacroChange(macro.key, v)}
                  min={10}
                  max={80}
                  step={5}
                  style={{ "--slider-color": macro.color } as React.CSSProperties}
                  className="[&_[data-slot=slider-range]]:bg-[var(--slider-color,var(--primary))]"
                />
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-[13px] text-muted-foreground">Total</span>
              <span className="text-[14px] font-semibold" style={{ color: "var(--primary)" }}>
                {user.macros.carbs + user.macros.protein + user.macros.fat}%
              </span>
            </div>
          </div>
        </SettingsGroup>

        {/* (e) Appearance — useTheme(), not classList.toggle */}
        <SettingsGroup title={t("appearance")}>
          <SettingsRow label={t("darkMode")}>
            <Switch
              checked={isDark}
              onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
            />
          </SettingsRow>
          <SettingsRow label={t("language")}>
            <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
              <SelectTrigger className="w-24 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">FR</SelectItem>
                <SelectItem value="ar">عربي</SelectItem>
                <SelectItem value="en">EN</SelectItem>
              </SelectContent>
            </Select>
          </SettingsRow>
        </SettingsGroup>

        {/* (f) Data — clearX handlers wired */}
        <SettingsGroup title={t("data")}>
          <SettingsRow label={t("databaseSize")}>
            <span className="text-[13px] text-muted-foreground">2.4 MB</span>
          </SettingsRow>
          <SettingsRow label={t("lastSync")}>
            <span className="text-[13px] text-muted-foreground">Il y a 2h</span>
          </SettingsRow>
          <div className="px-4 pb-3 pt-2 space-y-2">
            <ConfirmButton label={t("clearJournal")}    onConfirm={clearJournal}    t={t} />
            <ConfirmButton label={t("clearWeight")}     onConfirm={clearWeight}     t={t} />
            <ConfirmButton label={t("clearGlucose")}    onConfirm={clearGlucose}    t={t} />
            <Button variant="outline" className="w-full justify-start gap-2 rounded-xl">
              <Download className="h-4 w-4" />
              {t("exportData")}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full justify-start gap-2 rounded-xl">
                  <Trash2 className="h-4 w-4" />
                  {t("deleteAccount")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("deleteAccountConfirm")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground">
                    {t("deleteAccount")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </SettingsGroup>

        {/* Integrations */}
        <SettingsGroup title={t("integrations")}>
          <IntegrationRow name="Strava"       status="connected"    email="ahmed@example.com" />
          <IntegrationRow name="LibreView"    status="disconnected" actionLabel={t("importCsv")} />
          <IntegrationRow name="Apple Health" status="unavailable" />
        </SettingsGroup>

        {/* About */}
        <SettingsGroup title={t("about")}>
          <div className="px-4 py-2 text-[12px] text-muted-foreground">NutriVita v1.0.0 · nutrivita.fr</div>
          <SettingsRow label={t("privacyPolicy")} arrow />
          <SettingsRow label={t("legalNotice")} arrow />
          <SettingsRow label={t("rateApp")} icon={<Star className="h-4 w-4 text-muted-foreground" />} />
        </SettingsGroup>
      </div>

      {/* (a) Profile edit bottom sheet */}
      <AnimatePresence>
        {showProfileEdit && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowProfileEdit(false)} />
            <motion.div
              className="relative w-full max-w-md mx-auto bg-background rounded-t-3xl border-t border-border p-6"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
            >
              <div className="flex justify-center mb-3">
                <div className="w-9 h-1 rounded-full bg-muted-foreground/25" />
              </div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[17px] font-semibold">{t("profileEdit")}</h2>
                <button onClick={() => setShowProfileEdit(false)}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[12px] text-muted-foreground mb-1 block">{t("firstName")}</label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-11" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] text-muted-foreground mb-1 block">{t("age")} ({t("years")})</label>
                    <Input type="number" value={editAge} onChange={(e) => setEditAge(e.target.value)} className="h-11" />
                  </div>
                  <div>
                    <label className="text-[12px] text-muted-foreground mb-1 block">{t("weight")} (kg)</label>
                    <Input type="number" step="0.1" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} className="h-11" />
                  </div>
                </div>
                <Button className="w-full h-12 rounded-2xl mt-2" onClick={handleSaveProfile}>
                  {t("saveProfile")}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
        {title}
      </h3>
      <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
        {children}
      </div>
    </div>
  )
}

function SettingsRow({
  label,
  children,
  arrow,
  icon,
}: {
  label: string
  children?: React.ReactNode
  arrow?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 min-h-[52px]">
      <span className="text-[14px] font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {children}
        {arrow && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        {icon}
      </div>
    </div>
  )
}

function UnitToggle({
  value,
  options,
  onChange,
}: {
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "px-2.5 py-1.5 text-[12px] font-medium transition-colors",
            value === opt
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function ConfirmButton({
  label,
  onConfirm,
  t,
}: {
  label: string
  onConfirm: () => void
  t: (key: TranslationKey) => string
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2 rounded-xl">
          <Trash2 className="h-4 w-4 text-destructive" />
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
          <AlertDialogDescription>{t("irreversible")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground"
            onClick={onConfirm}
          >
            Effacer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function IntegrationRow({
  name,
  status,
  email,
  actionLabel,
}: {
  name: string
  status: "connected" | "disconnected" | "unavailable"
  email?: string
  actionLabel?: string
}) {
  const { t } = useApp()
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <span className="text-[14px] font-medium text-foreground">{name}</span>
        {email && <p className="text-[12px] text-muted-foreground">{email}</p>}
      </div>
      <div className="flex items-center gap-2">
        {status === "connected" && (
          <>
            <span className="flex items-center gap-1 text-[12px]" style={{ color: "var(--primary)" }}>
              <Check className="h-3 w-3" />
              {t("connected")}
            </span>
            <Button variant="ghost" size="sm" className="text-[12px]">{t("disconnect")}</Button>
          </>
        )}
        {status === "disconnected" && (
          <Button variant="outline" size="sm" className="text-[12px] rounded-lg">{actionLabel ?? "Connecter"}</Button>
        )}
        {status === "unavailable" && (
          <span className="text-[12px] text-muted-foreground">{t("notAvailable")}</span>
        )}
      </div>
    </div>
  )
}
