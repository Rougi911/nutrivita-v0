"use client"
import {
  BookOpen,
  Home,
  Plus,
  Droplet,
  TrendingUp,
  Leaf,
  UserRound,
} from "lucide-react"
import { useApp } from "@/lib/app-context"
import { uiCopy } from "@/lib/redesign-copy"
export function BottomNavigation() {
  const a = useApp()
  const c = uiCopy(a.language)
  const items = [
    { id: "home", icon: Home, label: a.t("home") },
    { id: "journal", icon: BookOpen, label: a.t("journal") },
    { id: "__add__", icon: Plus, label: a.t("add") },
    { id: "glucose", icon: Droplet, label: a.t("glucose") },
    { id: "stats", icon: TrendingUp, label: a.t("stats") },
  ]
  return (
    <nav className="nv-navigation" aria-label="NutraLance">
      <div className="nv-rail-brand">
        <Leaf size={28} />
        <span>NutraLance</span>
      </div>
      <div className="nv-nav-items">
        {items.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            className={id === "__add__" ? "nv-nav-add" : "nv-nav-link"}
            aria-label={label}
            aria-current={a.activeTab === id ? "page" : undefined}
            onClick={() => {
              if (id === "__add__") {
                a.setSelectedMealType(null)
                a.setAddSheetMode("menu")
                a.setShowAddSheet(true)
              } else a.setActiveTab(id)
            }}
          >
            <span className="nv-nav-icon">
              <Icon size={22} />
            </span>
            <span>{label}</span>
          </button>
        ))}
      </div>
      <button
        className="nv-rail-profile nv-nav-link"
        aria-current={a.activeTab === "profile" ? "page" : undefined}
        onClick={() => a.setActiveTab("profile")}
      >
        <UserRound size={21} />
        <span>{c.profile}</span>
      </button>
    </nav>
  )
}
