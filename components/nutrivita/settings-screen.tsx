"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  ChevronRight,
  Check,
  Trash2,
  Download,
  Star,
  ExternalLink,
} from "lucide-react"
import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
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
import type { Language } from "@/lib/types"

export function SettingsScreen() {
  const { user, setUser, t, language, setLanguage, isRTL } = useApp()
  const [isDarkMode, setIsDarkMode] = useState(false)

  const handleUnitChange = (
    key: keyof typeof user.units,
    value: string
  ) => {
    setUser({
      ...user,
      units: { ...user.units, [key]: value },
    })
  }

  const handleMacroChange = (key: keyof typeof user.macros, value: number) => {
    const newMacros = { ...user.macros, [key]: value }
    // Ensure total is 100%
    const total = newMacros.carbs + newMacros.protein + newMacros.fat
    if (total <= 100) {
      setUser({ ...user, macros: newMacros })
    }
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  const goalLabels = {
    lose: t("loseWeight"),
    maintain: t("maintainWeight"),
    gain: t("gainMuscle"),
    diabetes: t("manageDiabetes"),
  }

  return (
    <div className={cn("flex flex-col pb-32 min-h-screen", isRTL && "rtl")}>
      {/* Profile Card */}
      <div className="p-4">
        <motion.div
          className="p-5 rounded-2xl gradient-hero text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                👤
              </div>
              <div>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-white/80 text-sm">
                  {user.age} ans • {user.height}cm • {user.weight}kg
                </p>
                <p className="text-white/80 text-sm mt-1">
                  {t("objective")}: {goalLabels[user.goal]}
                </p>
                <p className="text-white/90 text-sm font-medium mt-1">
                  {user.targetCalories.toLocaleString()} kcal/jour{" "}
                  {t("recommended")}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              {t("edit")}
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Settings Groups */}
      <div className="px-4 space-y-6">
        {/* Units */}
        <SettingsGroup title={t("units")}>
          <SettingsRow label={t("weight")}>
            <UnitToggle
              value={user.units.weight}
              options={["kg", "lbs"]}
              onChange={(v) => handleUnitChange("weight", v)}
            />
          </SettingsRow>
          <SettingsRow label={t("height")}>
            <UnitToggle
              value={user.units.height}
              options={["cm", "ft"]}
              onChange={(v) => handleUnitChange("height", v)}
            />
          </SettingsRow>
          <SettingsRow label={t("glucose")}>
            <UnitToggle
              value={user.units.glucose}
              options={["mg/dL", "mmol/L"]}
              onChange={(v) => handleUnitChange("glucose", v)}
            />
          </SettingsRow>
          <SettingsRow label="Énergie">
            <UnitToggle
              value={user.units.energy}
              options={["kcal", "kJ"]}
              onChange={(v) => handleUnitChange("energy", v)}
            />
          </SettingsRow>
        </SettingsGroup>

        {/* Macro Goals */}
        <SettingsGroup title={t("macroGoals")}>
          <div className="space-y-4 py-2">
            {[
              { key: "carbs" as const, label: t("carbs"), color: "bg-primary" },
              {
                key: "protein" as const,
                label: t("protein"),
                color: "bg-emerald",
              },
              { key: "fat" as const, label: t("fat"), color: "bg-amber" },
            ].map((macro) => (
              <div key={macro.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{macro.label}</span>
                  <span className="text-sm font-bold">{user.macros[macro.key]}%</span>
                </div>
                <Slider
                  value={[user.macros[macro.key]]}
                  onValueChange={([v]) => handleMacroChange(macro.key, v)}
                  min={10}
                  max={70}
                  step={5}
                  className={macro.color}
                />
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm font-medium">Total</span>
              <span
                className={cn(
                  "text-sm font-bold",
                  user.macros.carbs + user.macros.protein + user.macros.fat ===
                    100
                    ? "text-emerald"
                    : "text-destructive"
                )}
              >
                {user.macros.carbs + user.macros.protein + user.macros.fat}%
                {user.macros.carbs + user.macros.protein + user.macros.fat ===
                  100 && " ✓"}
              </span>
            </div>
          </div>
        </SettingsGroup>

        {/* Appearance */}
        <SettingsGroup title={t("appearance")}>
          <SettingsRow label={t("darkMode")}>
            <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
          </SettingsRow>
          <SettingsRow label={t("language")}>
            <Select
              value={language}
              onValueChange={(v) => setLanguage(v as Language)}
            >
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

        {/* Data */}
        <SettingsGroup title={t("data")}>
          <SettingsRow label={t("databaseSize")}>
            <span className="text-sm text-muted-foreground">2.4 MB</span>
          </SettingsRow>
          <SettingsRow label={t("lastSync")}>
            <span className="text-sm text-muted-foreground">Il y a 2h</span>
          </SettingsRow>

          <div className="pt-2 space-y-2">
            <DangerButton label={t("clearJournal")} />
            <DangerButton label={t("clearWeight")} />
            <DangerButton label={t("clearGlucose")} />
            <Button variant="outline" className="w-full justify-start gap-2">
              <Download className="h-4 w-4" />
              {t("exportData")}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full justify-start gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("deleteAccount")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Êtes-vous sûr de vouloir supprimer votre compte ?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Toutes vos données seront
                    définitivement supprimées.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground">
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </SettingsGroup>

        {/* Integrations */}
        <SettingsGroup title={t("integrations")}>
          <IntegrationRow
            name="Strava"
            status="connected"
            email="ahmed@example.com"
          />
          <IntegrationRow
            name="LibreView"
            status="disconnected"
            actionLabel={t("importCsv")}
          />
          <IntegrationRow
            name="Apple Health"
            status="unavailable"
          />
        </SettingsGroup>

        {/* About */}
        <SettingsGroup title={t("about")}>
          <div className="py-2 text-center text-sm text-muted-foreground">
            NutriVita v1.0.0 • nutrivita.fr
          </div>
          <SettingsRow label={t("privacyPolicy")} arrow />
          <SettingsRow label={t("legalNotice")} arrow />
          <SettingsRow label={t("rateApp")} icon={<Star className="h-4 w-4" />} />
        </SettingsGroup>
      </div>
    </div>
  )
}

function SettingsGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {title}
      </h3>
      <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
        {children}
      </div>
    </motion.div>
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
      <span className="text-sm font-medium">{label}</span>
      {children}
      {arrow && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      {icon}
    </div>
  )
}

function UnitToggle({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium transition-colors",
            value === option
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:bg-muted"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

function DangerButton({ label }: { label: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          <Trash2 className="h-4 w-4 text-destructive" />
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground">
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
        <span className="text-sm font-medium">{name}</span>
        {email && (
          <p className="text-xs text-muted-foreground">{email}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {status === "connected" && (
          <>
            <span className="flex items-center gap-1 text-xs text-emerald">
              <Check className="h-3 w-3" />
              {t("connected")}
            </span>
            <Button variant="ghost" size="sm" className="text-xs">
              {t("disconnect")}
            </Button>
          </>
        )}
        {status === "disconnected" && (
          <Button variant="outline" size="sm" className="text-xs">
            {actionLabel || "Connecter"}
          </Button>
        )}
        {status === "unavailable" && (
          <span className="text-xs text-muted-foreground">
            {t("notAvailable")}
          </span>
        )}
      </div>
    </div>
  )
}
