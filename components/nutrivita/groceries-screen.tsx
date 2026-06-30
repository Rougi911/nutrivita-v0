"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, ScanLine, Trash2, ShoppingBag, Leaf, ChevronLeft, ChevronRight } from "lucide-react"
import { Loader2 } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { getMonthlyScannedStats } from "@/lib/mock-data"
import { scanBarcode, deleteScannedProduct, getGrocerySummary, type GrocerySummary } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { OfflineBanner } from "@/components/nutrivita/offline-banner"
import { cn } from "@/lib/utils"
import type { ScannedProduct } from "@/lib/types"
import { normalizeAdditive, additiveRiskColor } from "@/lib/additives-format"
import { pickWorstProduct } from "@/lib/alternatives"
import { NutriScoreBadge } from "@/components/nutrivita/nutri-score-badge"
import { AlternativesSheet } from "@/components/nutrivita/alternatives-sheet"
import { toast } from "sonner"

function ProductCard({ product, onDelete, onAlternatives }: { product: ScannedProduct; onDelete?: () => void; onAlternatives?: () => void }) {
  const { t } = useApp()
  const [imgFailed, setImgFailed] = useState(false)

  // P1-7 — « non noté » (verdict null) : ton neutre muted, surtout PAS amber/risk.
  const verdictStyle =
    product.verdict === "Excellent"
      ? { bg: "var(--badge-positive-bg)", color: "var(--badge-positive)" }
      : product.verdict === "Mauvais"
      ? { bg: "var(--risk-bg)", color: "var(--risk)" }
      : product.verdict === "Médiocre"
      ? { bg: "var(--amber-bg)", color: "var(--amber)" }
      : { bg: "var(--muted)", color: "var(--muted-foreground)" }

  const avatar = product.imageUrl && !imgFailed
    ? (
      <img
        src={product.imageUrl}
        alt={product.name}
        className="w-10 h-10 rounded-lg object-cover shrink-0"
        onError={() => setImgFailed(true)}
      />
    )
    : product.nutriScore
    ? <NutriScoreBadge score={product.nutriScore} />
    : (
      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
      </div>
    )

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {avatar}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-foreground truncate">{product.name}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
            style={{ backgroundColor: verdictStyle.bg, color: verdictStyle.color }}
          >
            {product.verdict === "Excellent" ? t("excellent") :
             product.verdict === "Mauvais"   ? t("bad")       :
             product.verdict === "Médiocre"  ? t("mediocre")  : t("notRated")}
          </span>
          {product.additives.slice(0, 3).map((a) => {
            const { code, name, risk } = normalizeAdditive(a)
            if (!code) return null
            const color = additiveRiskColor(risk)
            return (
              <span
                key={code}
                className="text-[10px] px-1.5 py-0.5 rounded-full border"
                style={{ color, borderColor: color, backgroundColor: `${color}18` }}
              >
                {name ?? code}
              </span>
            )
          })}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[12px] text-muted-foreground">
          ×{product.timesThisMonth}
        </span>
        {onAlternatives && (
          <button
            onClick={onAlternatives}
            className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
            aria-label={t("seeAlternatives")}
          >
            <Leaf className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
            aria-label={t("deleteProduct")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

function ProgressBar({
  label,
  value,
  percent,
  danger,
}: {
  label: string
  value: number
  percent: number
  danger?: boolean
}) {
  const color = percent > 80 ? "var(--risk)" : percent > 55 ? "var(--amber)" : "var(--primary)"
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] text-foreground">{label}</span>
        <span className="text-[12px] font-semibold text-foreground">{percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, percent)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export function GroceriesScreen() {
  const { t, scannedProducts, addScannedProduct, removeScannedProductById, loadScannedProducts, isRTL, setShowAddSheet } = useApp()

  const [scanInput, setScanInput] = useState("")
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  // S12 — produit cible pour l'écran d'alternatives (le moins bien noté)
  const [altTarget, setAltTarget] = useState<ScannedProduct | null>(null)
  // C3 — bilan composition par mois (backend, vs référence OMS) + navigation.
  const currentMonthStr = new Date().toISOString().slice(0, 7)
  const [month, setMonth] = useState(currentMonthStr)
  const [summary, setSummary] = useState<GrocerySummary | null>(null)

  const stats = getMonthlyScannedStats(scannedProducts)
  const worstProduct = pickWorstProduct(scannedProducts)

  // Produits contenant au moins un additif classé high/moderate (basé sur la classification, pas une liste figée)
  const riskProductsCount = scannedProducts.filter(
    (p) => p.additives.some((a) => {
      const r = normalizeAdditive(a).risk
      return r === "high" || r === "moderate"
    })
  ).length

  // Sort: worst first. P1-7 — « non noté » (score null) en fin de liste (ni bon ni mauvais).
  const sorted = [...scannedProducts].sort(
    (a, b) => (a.score ?? Infinity) - (b.score ?? Infinity)
  )

  useEffect(() => {
    loadScannedProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // C3 — recharge le bilan composition à chaque changement de mois.
  useEffect(() => {
    setLoadingStats(true)
    getGrocerySummary(month).then(setSummary).catch(() => setSummary(null)).finally(() => setLoadingStats(false))
  }, [month])

  const shiftMonth = (delta: number) => {
    const [y, m] = month.split("-").map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (next <= currentMonthStr) setMonth(next)
  }
  const monthLabel = new Date(month + "-01T00:00:00").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })

  const handleDelete = async (product: ScannedProduct) => {
    if (product.id == null) return
    setDeletingId(product.id)
    try {
      await deleteScannedProduct(product.id)
      removeScannedProductById(product.id)
      toast(t("productRemoved"), { duration: 2000 })
    } catch {
      toast(t("errorLoading"), { duration: 3000 })
    } finally {
      setDeletingId(null)
    }
  }

  const handleScan = async () => {
    const code = scanInput.trim()
    if (!code) return
    if (!/^\d+$/.test(code)) {
      setScanError(t("scannerError"))
      return
    }
    setScanning(true)
    setScanError(null)
    try {
      const product = await scanBarcode(code)
      addScannedProduct(product)
      setScanInput("")
    } catch {
      setScanError(t("errorLoading"))
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className={cn("flex flex-col min-h-screen bg-background pb-24", isRTL && "rtl")}>
      <OfflineBanner />

      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-foreground">{t("myGroceries")}</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">{scannedProducts.length} {t("products")}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder={t("scanProduct")}
            value={scanInput}
            onChange={(e) => { setScanInput(e.target.value); setScanError(null) }}
            onKeyDown={(e) => { if (e.key === "Enter") handleScan() }}
            className="h-9 rounded-xl border border-border bg-muted px-3 text-[13px] w-36 focus:outline-none"
          />
          <Button size="sm" className="gap-1.5 rounded-xl" onClick={() => setShowAddSheet(true)}>
            <ScanLine className="h-4 w-4" />
            {t("scanner")}
          </Button>
        </div>
      </div>
      {scanError && (
        <p className="text-[12px] px-4 pb-2" style={{ color: "var(--risk)" }}>{scanError}</p>
      )}

      <div className="px-4 space-y-4">

        {/* Bilan du mois */}
        {loadingStats ? (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <Skeleton className="h-4 w-32 rounded" />
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-semibold text-foreground">{t("monthlyOverview")}</h3>
              <div className="flex items-center gap-1">
                <button onClick={() => shiftMonth(-1)} className="p-1 rounded-lg text-muted-foreground hover:bg-muted" aria-label="Mois précédent">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-[12px] text-muted-foreground w-24 text-center capitalize">{monthLabel}</span>
                <button onClick={() => shiftMonth(1)} disabled={month >= currentMonthStr} className="p-1 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30" aria-label="Mois suivant">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <ProgressBar label={t("addedSugars")}   value={summary?.sugars.total_g  ?? 0} percent={summary?.sugars.pct  ?? 0} />
              <ProgressBar label={t("salt")}           value={summary?.salt.total_g    ?? 0} percent={summary?.salt.pct    ?? 0} />
              <ProgressBar label={t("saturatedFat")}   value={summary?.sat_fat.total_g ?? 0} percent={summary?.sat_fat.pct ?? 0} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">{t("vsOmsReference")}</p>
          </div>
        )}

        {/* Additives alert card */}
        {stats.riskAdditives.length > 0 && (
          <div
            className="rounded-2xl border px-4 py-3 flex items-start gap-3"
            style={{ borderColor: "var(--risk)", backgroundColor: "var(--risk-bg)" }}
          >
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--risk)" }} />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "var(--risk)" }}>
                {stats.riskAdditives.length} {t("riskAdditives")}
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--risk)" }}>
                {stats.riskAdditives.join(", ")} — {t("presentIn")} {riskProductsCount} {t("products")}
              </p>
            </div>
          </div>
        )}

        {/* Scanned products list */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-[14px] font-semibold text-foreground">{t("scannedProducts")}</h3>
          </div>
          <div className="divide-y divide-border">
            {sorted.map((product) => (
              <ProductCard
                key={product.id ?? product.barcode}
                product={product}
                onDelete={product.id != null ? () => handleDelete(product) : undefined}
                onAlternatives={product.score != null ? () => setAltTarget(product) : undefined}
              />
            ))}
          </div>
        </div>

        {/* See alternatives button (S12) — désactivé si aucun produit noté */}
        <Button
          variant="outline"
          className="w-full gap-2 rounded-xl"
          disabled={!worstProduct}
          onClick={() => worstProduct && setAltTarget(worstProduct)}
        >
          {t("seeAlternatives")}
        </Button>
      </div>

      {altTarget && (
        <AlternativesSheet
          barcode={altTarget.barcode}
          productName={altTarget.name}
          onClose={() => setAltTarget(null)}
        />
      )}
    </div>
  )
}
