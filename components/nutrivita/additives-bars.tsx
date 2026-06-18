"use client"

import { useState } from "react"
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/lib/app-context"
import { Skeleton } from "@/components/ui/skeleton"
import type { AdditivesStats } from "@/lib/api"

interface Props {
  stats: AdditivesStats | null
  loading: boolean
}

const RISK_COLORS: Record<"high" | "moderate" | "low", string> = {
  high:     "#DC2626",
  moderate: "#D97706",
  low:      "#1D9E75",
}

const RISK_LEVELS = ["high", "moderate", "low"] as const

const RISK_LABEL_KEYS = {
  high:     "additivesHigh",
  moderate: "additivesModerate",
  low:      "additivesLow",
} as const

export function AdditivesBars({ stats, loading }: Props) {
  const { t, isRTL } = useApp()
  const [expanded, setExpanded] = useState(false)

  const maxCount = stats
    ? Math.max(1, stats.counts.high, stats.counts.moderate, stats.counts.low)
    : 1

  return (
    <div className={cn("rounded-2xl border border-border bg-card p-4", isRTL && "rtl")}>
      <h3 className="text-[14px] font-semibold text-foreground mb-3">
        {t("additivesTitle")}
      </h3>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-7 w-full rounded-lg" />)}
        </div>
      ) : !stats || stats.totalEntries === 0 ? (
        <p className="text-[13px] text-muted-foreground text-center py-2">
          {t("additivesEmpty")}
        </p>
      ) : stats.entriesWithAdditives === 0 ? (
        <p className="text-[13px] text-muted-foreground text-center py-2">
          {t("additivesNone")}
        </p>
      ) : (
        <>
          {/* 3 barres horizontales */}
          <div className="space-y-2.5 mb-3">
            {RISK_LEVELS.map((risk) => {
              const count = stats.counts[risk]
              const widthPct = Math.round((count / maxCount) * 100)
              return (
                <div key={risk}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-medium text-foreground">
                      {t(RISK_LABEL_KEYS[risk])}
                    </span>
                    <span className="text-[12px] font-semibold" style={{ color: RISK_COLORS[risk] }}>
                      ×{count}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${widthPct}%`, backgroundColor: RISK_COLORS[risk] }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Liste repliable des items */}
          {stats.items.length > 0 && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-2"
            >
              {expanded
                ? <ChevronUp className="h-3.5 w-3.5" />
                : <ChevronDown className="h-3.5 w-3.5" />
              }
              {expanded ? "Masquer le détail" : "Voir le détail"}
            </button>
          )}

          {expanded && (
            <div className="space-y-2 mb-3">
              {RISK_LEVELS.map((risk) => {
                const group = stats.items.filter((it) => it.risk === risk)
                if (group.length === 0) return null
                return (
                  <div key={risk}>
                    <p className="text-[11px] font-semibold mb-1" style={{ color: RISK_COLORS[risk] }}>
                      {t(RISK_LABEL_KEYS[risk])}
                    </p>
                    {group.map((item) => (
                      <div key={item.code} className="flex items-center justify-between py-0.5 ps-2">
                        <span className="text-[12px] text-foreground">
                          <span className="font-mono text-[11px] text-muted-foreground me-1.5">{item.code}</span>
                          {item.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground shrink-0 ms-2">×{item.count}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Disclaimer REG-05 tri-lingue obligatoire */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-muted/40 mt-2">
        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--amber)" }} />
        <div className="space-y-0.5">
          <p className="text-[11px] text-muted-foreground leading-snug">
            {t("additivesLogging")} — Comptage d&apos;expositions, aucune dose.
          </p>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Exposure count, no dose calculated.
          </p>
          <p className="text-[11px] text-muted-foreground leading-snug" dir="rtl">
            {"عد التعرضات — لا تُحسب الجرعة."}
          </p>
        </div>
      </div>
    </div>
  )
}
