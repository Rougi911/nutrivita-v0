"use client"

import { WifiOff, Loader2, RefreshCw } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { cn } from "@/lib/utils"

export function OfflineBanner() {
  const { isOffline, serverWaking, reloadData, t } = useApp()

  if (!isOffline && !serverWaking) return null

  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-2 text-[12px] font-medium",
        serverWaking
          ? "bg-[var(--amber-bg)] text-[var(--amber)]"
          : "bg-[var(--risk-bg)] text-[var(--risk)]"
      )}
    >
      <div className="flex items-center gap-2">
        {serverWaking ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <WifiOff className="h-3.5 w-3.5" />
        )}
        <span>{serverWaking ? t("serverWaking") : t("offlineBanner")}</span>
      </div>
      {isOffline && (
        <button onClick={reloadData} className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3" />
          {t("retryLoad")}
        </button>
      )}
    </div>
  )
}
