"use client"
import {
  ChevronRight,
  Settings,
  ShieldCheck,
  Droplet,
  ShoppingBag,
  UserRound,
} from "lucide-react"
import { useApp } from "@/lib/app-context"
import { uiCopy } from "@/lib/redesign-copy"
import { ViewModeSwitch } from "./view-preferences"
import { Switch } from "@/components/ui/switch"
export function ProfileScreen({ onSettings }: { onSettings: () => void }) {
  const a = useApp()
  const c = uiCopy(a.language)
  return (
    <div className="nv-page">
      <header className="nv-page-header">
        <div>
          <p className="nv-eyebrow">NutraLance</p>
          <h1>{c.profile}</h1>
        </div>
        <UserRound className="text-primary" />
      </header>
      <div className="nv-card flex items-center gap-4">
        <span className="nv-avatar">
          {a.user.name.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="nv-section-title">{a.user.name}</h2>
          <p className="nv-caption truncate">{a.user.email}</p>
        </div>
        <button className="nv-text-button" onClick={onSettings}>
          {c.edit}
        </button>
      </div>
      <section className="nv-card">
        <h2 className="nv-section-title mb-3">{c.display}</h2>
        <ViewModeSwitch hint />
        <p className="nv-caption mt-2">{c.localPreference}</p>
        <div className="flex items-center gap-3 border-t border-border pt-4 mt-4">
          <label htmlFor="nv-charts" className="flex-1">
            <span className="font-semibold">{c.charts}</span>
            <span className="nv-caption block mt-1">{c.chartsHint}</span>
          </label>
          <Switch
            id="nv-charts"
            checked={a.advancedCharts}
            onCheckedChange={a.setAdvancedCharts}
          />
        </div>
      </section>
      <h2 className="nv-section-title">{c.preferences}</h2>
      <button className="nv-inline-card" onClick={onSettings}>
        <Settings size={22} />
        <span className="flex-1 text-start">
          <span className="font-semibold block">{c.settings}</span>
          <span className="nv-caption">{c.settingsHint}</span>
        </span>
        <ChevronRight size={18} />
      </button>
      <button className="nv-inline-card" onClick={onSettings}>
        <ShieldCheck size={22} />
        <span className="flex-1 text-start">
          <span className="font-semibold block">{c.privacy}</span>
          <span className="nv-caption">{c.privacyHint}</span>
        </span>
        <ChevronRight size={18} />
      </button>
      <h2 className="nv-section-title">{c.follow}</h2>
      <button
        className="nv-inline-card"
        onClick={() => a.setActiveTab("glucose")}
      >
        <Droplet size={22} />
        <span className="flex-1 text-start">{a.t("glucose")}</span>
        <ChevronRight size={18} />
      </button>
      <button
        className="nv-inline-card"
        onClick={() => a.setActiveTab("groceries")}
      >
        <ShoppingBag size={22} />
        <span className="flex-1 text-start">{c.groceries}</span>
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
