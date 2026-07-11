"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Download,
  Loader2,
  LogOut,
  Trash2,
  X,
} from "lucide-react"
import { useTheme } from "next-themes"
import { AnimatePresence, motion } from "framer-motion"
import { useApp } from "@/lib/app-context"
import { adjustMacros } from "@/lib/macros"
import { formatWeight, formatHeight, formatEnergy, toWeightUnit, fromWeightUnit } from "@/lib/units"
import { enablePush, pushSupported } from "@/lib/push"
import { getNotificationPrefs, updateNotificationPrefs, type NotificationPrefs } from "@/lib/api"
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
import {
  getStravaStatus,
  getStravaConnectUrl,
  syncStrava,
  disconnectStrava,
} from "@/lib/api"
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
    advancedCharts, setAdvancedCharts,
    clearJournal, clearWeight, clearGlucose,
    isDiabetic, setIsDiabetic,
    glucoseTarget, setGlucoseTarget,
    logout,
  } = useApp()

  // (e) useTheme — NOT classList.toggle
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [editName,   setEditName]   = useState(user.name)
  const [editAge,    setEditAge]    = useState(user.age.toString())
  // U1 — saisie du poids dans l'unité choisie ; conversion → kg au stockage.
  const [editWeight, setEditWeight] = useState(toWeightUnit(user.weight, user.units.weight).toString())

  // S26 — préférences de rappels (chargées depuis le backend).
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs | null>(null)
  useEffect(() => {
    getNotificationPrefs().then(setNotifPrefs).catch(() => {})
  }, [])
  const savePref = async (patch: Partial<NotificationPrefs>) => {
    setNotifPrefs((p) => ({ ...(p as NotificationPrefs), ...patch }))
    try {
      const r = await updateNotificationPrefs(patch)
      setNotifPrefs(r.prefs)
    } catch { /* hors-ligne : la valeur optimiste reste affichée */ }
  }
  const toggleReminder = async (key: keyof NotificationPrefs, v: boolean) => {
    if (v && pushSupported()) {
      const ok = await enablePush() // permission navigateur + abonnement push
      if (!ok) { toast(t("notifBlocked")); return }
    }
    await savePref({ [key]: v } as Partial<NotificationPrefs>)
  }

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
      weight: editWeight ? fromWeightUnit(parseFloat(editWeight), user.units.weight) : user.weight,
    })
    setShowProfileEdit(false)
  }

  const handleExportData = () => {
    try {
      const data = JSON.stringify({ exportedAt: new Date().toISOString(), user }, null, 2)
      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `nutrivita-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast(t("exportDone"), { duration: 3000 })
    } catch {
      toast(t("errorLoading"), { duration: 3000 })
    }
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
              {user.age} ans · {formatHeight(user.height, user.units.height)} · {formatWeight(user.weight, user.units.weight)}
            </p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {user.goals.map((g) => goalLabels[g] ?? g).join(" · ")} · {formatEnergy(user.targetCalories, user.units.energy)}/j
            </p>
          </div>
          <button
            onClick={() => {
              // Réinitialise les champs dans les bonnes unités à l'ouverture (U1).
              setEditName(user.name)
              setEditAge(user.age.toString())
              setEditWeight(toWeightUnit(user.weight, user.units.weight).toString())
              setShowProfileEdit(true)
            }}
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
          <SettingsRow label={t("energyLabel")}>
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

        {/* S26 — Notifications / rappels (push). Activer demande la permission + l'abonnement. */}
        <SettingsGroup title={t("notifications")}>
          <SettingsRow label={t("reminderJournal")}>
            <Switch checked={!!notifPrefs?.journal_enabled} onCheckedChange={(v) => toggleReminder("journal_enabled", v)} />
          </SettingsRow>
          {notifPrefs?.journal_enabled && (
            <SettingsRow label={t("reminderTime")}>
              <Input type="time" value={notifPrefs.journal_time} onChange={(e) => savePref({ journal_time: e.target.value })} className="w-28 h-9" />
            </SettingsRow>
          )}
          <SettingsRow label={t("reminderGlucose")}>
            <Switch checked={!!notifPrefs?.glucose_enabled} onCheckedChange={(v) => toggleReminder("glucose_enabled", v)} />
          </SettingsRow>
          {notifPrefs?.glucose_enabled && (
            <SettingsRow label={t("reminderTime")}>
              <Input type="time" value={notifPrefs.glucose_time} onChange={(e) => savePref({ glucose_time: e.target.value })} className="w-28 h-9" />
            </SettingsRow>
          )}
          <SettingsRow label={t("reminderHydration")}>
            <Switch checked={!!notifPrefs?.hydration_enabled} onCheckedChange={(v) => toggleReminder("hydration_enabled", v)} />
          </SettingsRow>
          <SettingsRow label={t("reminderDeficiency")}>
            <Switch checked={!!notifPrefs?.deficiency_enabled} onCheckedChange={(v) => toggleReminder("deficiency_enabled", v)} />
          </SettingsRow>
        </SettingsGroup>

        {/* (e) Appearance — useTheme(), not classList.toggle */}
        <SettingsGroup title={t("appearance")}>
          <SettingsRow label={t("darkMode")}>
            <Switch
              checked={isDark}
              onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
            />
          </SettingsRow>
          {/* P2 — bascule complexité des graphiques (Glycémie / Bilan) */}
          <SettingsRow label={t("advancedCharts")} description={t("advancedChartsDesc")}>
            <Switch
              checked={advancedCharts}
              onCheckedChange={(v) => setAdvancedCharts(v)}
            />
          </SettingsRow>
          <SettingsRow label={t("language")}>
            <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
              <SelectTrigger className="w-24 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">FR</SelectItem>
                <SelectItem value="ar">{"\u0639\u0631\u0628\u064A"}</SelectItem>
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
            <Button variant="outline" className="w-full justify-start gap-2 rounded-xl" onClick={handleExportData}>
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
          {/* S16 — ligne Strava réelle : statut via /status, OAuth + sync (REG-05). */}
          <StravaIntegrationRow />
          <IntegrationRow name="LibreView"    status="disconnected" />
          <IntegrationRow name="Apple Health" status="unavailable" />
        </SettingsGroup>

        {/* About */}
        <SettingsGroup title={t("about")}>
          <div className="px-4 py-2 text-[12px] text-muted-foreground">NutraLance v1.0.0 · nutrivita.fr</div>
          {/* Politique de confidentialité + Mentions légales conservées (points
              d'accès RGPD obligatoires) — contenu réel à brancher ultérieurement.
              P1-6 : « Évaluer l'app » retiré (aucun lien store disponible). */}
          <SettingsRow label={t("privacyPolicy")} arrow />
          <SettingsRow label={t("legalNotice")} arrow />
        </SettingsGroup>

        {/* Déconnexion */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("logoutTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{t("logoutDesc")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground"
                onClick={logout}
              >
                {t("logout")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
                    <label className="text-[12px] text-muted-foreground mb-1 block">{t("weight")} ({user.units.weight})</label>
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
  description,
  children,
  arrow,
  icon,
}: {
  label: string
  description?: string
  children?: React.ReactNode
  arrow?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 min-h-[52px] gap-3">
      <div className="min-w-0">
        <span className="text-[14px] font-medium text-foreground">{label}</span>
        {description && (
          <p className="text-[11.5px] text-muted-foreground leading-snug mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
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
            {t("clearAction")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// S16 — Strava : statut réel + OAuth (consentement REG-05) + sync au retour.
// Les tokens restent backend-only ; le front ne voit que { connected, athleteName }.
function StravaIntegrationRow() {
  const { t, reloadData } = useApp()
  const [status, setStatus] = useState<"loading" | "connected" | "disconnected">("loading")
  const [athleteName, setAthleteName] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [showConsent, setShowConsent] = useState(false)

  const refreshStatus = useCallback(async () => {
    try {
      const s = await getStravaStatus()
      setStatus(s.connected ? "connected" : "disconnected")
      setAthleteName(s.athleteName)
      return s.connected
    } catch {
      // 401/503/réseau → on retombe sur "non connecté" plutôt que de bloquer l'écran.
      setStatus("disconnected")
      setAthleteName(null)
      return false
    }
  }, [])

  const runSync = useCallback(async () => {
    setBusy(true)
    toast(t("stravaSyncing"), { duration: 2000 })
    try {
      const r = await syncStrava()
      if (r.connected) {
        toast(`${t("stravaSyncDone")}${r.imported > 0 ? ` (${r.imported})` : ""}`, { duration: 3000 })
        reloadData() // rafraîchit la carte Activité + le Bilan avec les activités importées
      }
    } catch {
      toast(t("stravaSyncError"), { duration: 3000 })
    } finally {
      setBusy(false)
    }
  }, [t, reloadData])

  // Statut au montage + déclenchement du sync au retour OAuth (?strava=ok).
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const connected = await refreshStatus()
      if (cancelled || typeof window === "undefined") return
      const params = new URLSearchParams(window.location.search)
      const flag = params.get("strava")
      if (!flag) return
      // Nettoie l'URL pour éviter un re-sync au prochain rendu / partage de lien.
      params.delete("strava"); params.delete("athlete"); params.delete("reason")
      const qs = params.toString()
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""))
      if (flag === "ok" && connected) {
        await runSync()
      } else if (flag === "error") {
        toast(t("stravaConnectError"), { duration: 3000 })
      }
    })()
    return () => { cancelled = true }
  }, [refreshStatus, runSync, t])

  const handleConnect = async () => {
    setShowConsent(false)
    setBusy(true)
    try {
      const url = await getStravaConnectUrl()
      window.location.href = url // redirection plein écran vers Strava OAuth
    } catch {
      setBusy(false)
      toast(t("stravaConnectError"), { duration: 3000 })
    }
  }

  const handleDisconnect = async () => {
    setBusy(true)
    try {
      await disconnectStrava()
      setStatus("disconnected")
      setAthleteName(null)
      toast(t("stravaDisconnected"), { duration: 3000 })
    } catch {
      toast(t("stravaDisconnectError"), { duration: 3000 })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="min-w-0">
        <span className="text-[14px] font-medium text-foreground">Strava</span>
        {status === "connected" && athleteName && (
          <p className="text-[12px] text-muted-foreground truncate">{athleteName}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {status === "loading" && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}

        {status === "connected" && (
          <>
            <span className="flex items-center gap-1 text-[12px]" style={{ color: "var(--primary)" }}>
              <Check className="h-3 w-3" />
              {t("connected")}
            </span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  disabled={busy}
                  aria-label={t("disconnect")}
                  aria-busy={busy}
                  className="px-2.5 py-1.5 rounded-lg border border-border text-[12px] font-medium text-foreground disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : t("disconnect")}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("disconnect")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("stravaDisconnectConfirm")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground"
                    onClick={handleDisconnect}
                  >
                    {t("disconnect")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {status === "disconnected" && (
          <AlertDialog open={showConsent} onOpenChange={setShowConsent}>
            <AlertDialogTrigger asChild>
              <button
                disabled={busy}
                aria-label={t("stravaConnect")}
                aria-busy={busy}
                className="px-2.5 py-1.5 rounded-lg text-[12px] font-medium bg-primary text-primary-foreground disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : t("stravaConnect")}
              </button>
            </AlertDialogTrigger>
            {/* REG-05 — consentement explicite au partage des données d'activité avant l'OAuth. */}
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("stravaConsentTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{t("stravaConsentDesc")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleConnect}>
                  {t("stravaConsentConfirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}

function IntegrationRow({
  name,
  status,
  email,
}: {
  name: string
  status: "connected" | "disconnected" | "unavailable"
  email?: string
}) {
  const { t } = useApp()
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <span className="text-[14px] font-medium text-foreground">{name}</span>
        {email && <p className="text-[12px] text-muted-foreground">{email}</p>}
      </div>
      {/* P1-6 : actions d'intégration (Déco./Connecter) retirées tant que le flux
          OAuth/import n'est pas branché — on n'affiche que le statut. */}
      <div className="flex items-center gap-2">
        {status === "connected" && (
          <span className="flex items-center gap-1 text-[12px]" style={{ color: "var(--primary)" }}>
            <Check className="h-3 w-3" />
            {t("connected")}
          </span>
        )}
        {status === "disconnected" && (
          <span className="text-[12px] text-muted-foreground">{t("notConnected")}</span>
        )}
        {status === "unavailable" && (
          <span className="text-[12px] text-muted-foreground">{t("notAvailable")}</span>
        )}
      </div>
    </div>
  )
}
