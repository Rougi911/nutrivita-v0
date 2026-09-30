"use client"
import { AlertTriangle } from "lucide-react"
import { useApp } from "@/lib/app-context"
import type { GlucosePeriod } from "../glucose-screen"

/** Existing <54 mg/dL warning stays visible regardless of disclosure mode. */
export function GlucoseLowAlert({ period }: { period: GlucosePeriod }) {
  const { glucoseReadings, t } = useApp()
  const days = period === "7d" ? 7 : period === "14d" ? 14 : 30
  const cutoff = Date.now() - days * 86400000
  const count = glucoseReadings.filter(r => new Date(r.timestamp).getTime() > cutoff && r.value < 54).length
  if (!count) return null
  const label = period === "7d" ? t("periodLabel7d") : period === "14d" ? t("periodLabel14d") : t("periodLabel30d")
  return <div role="alert" className="rounded-2xl border px-4 py-3 flex items-start gap-3" style={{ borderColor: "var(--risk)", backgroundColor: "var(--risk-bg)" }}>
    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" style={{ color: "var(--risk)" }} />
    <div style={{ color: "var(--risk)" }}><p className="text-[13px] font-medium">{count} {t("hypoAlert")}</p><p className="text-xs mt-1">{label}</p></div>
  </div>
}
