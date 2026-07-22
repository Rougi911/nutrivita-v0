"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Camera, Loader2, Mic, ScanLine, Search, X, KeyboardIcon, ShoppingBag, AlertTriangle } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { interpretMedia, scanBarcode, scanCompositionImage, ProductUnknownError, addJournalEntry, type CompositionResult } from "@/lib/api"
import { SAMPLE_FOODS, MEALS } from "@/lib/types"
import type { ApiInterpretResponse } from "@/lib/api-types"
import { inferMealTypeFromTime } from "@/lib/meal-utils"
import type { MealType } from "@/lib/meal-utils"
import { normalizeAdditive, additiveRiskColor } from "@/lib/additives-format"
import { InterpretConfirm } from "@/components/nutrivita/interpret-confirm"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { BrowserMultiFormatReader } from "@zxing/browser"
import { NotFoundException } from "@zxing/library"
import type { IScannerControls } from "@zxing/browser"

// Pre-computed heights for VoiceModal waveform — no Math.random() in render
const VOICE_WAVE_HEIGHTS = [32, 44, 24, 52, 28, 48, 20, 48, 36, 28, 40, 52, 24, 44, 32, 52, 28, 44, 20, 48]

const recentFoodIds = ["1", "3", "9", "5", "7"]

const quickActions = [
  {
    id: "photo",
    labelKey: "photo" as const,
    icon: Camera,
    color: "var(--primary)",
    bg: "var(--badge-positive-bg)",
  },
  {
    id: "voice",
    labelKey: "voice" as const,
    icon: Mic,
    color: "var(--glucose)",
    bg: "var(--glucose-bg)",
  },
  {
    id: "scanner",
    labelKey: "scanner" as const,
    icon: ScanLine,
    color: "var(--amber)",
    bg: "var(--amber-bg)",
  },
  {
    id: "search",
    labelKey: "search" as const,
    icon: Search,
    color: "var(--muted-foreground)",
    bg: "var(--muted)",
  },
] as const

export function AddSheet() {
  const { setShowAddSheet, t, setShowFoodSearch, language, addMealEntry, updateMealEntryId, currentDate, addScannedProduct } = useApp()

  const [interpResult, setInterpResult] = useState<ApiInterpretResponse | null>(null)
  const [interpreting, setInterpreting] = useState(false)
  const [interpError, setInterpError] = useState<string | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [pendingRelogFood, setPendingRelogFood] = useState<(typeof SAMPLE_FOODS)[number] | null>(null)
  const [pendingMealType, setPendingMealType] = useState<MealType>(inferMealTypeFromTime())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const recentFoods = recentFoodIds
    .map((id) => SAMPLE_FOODS.find((f) => f.id === id))
    .filter(Boolean)

  const handleRelogFood = (food: (typeof SAMPLE_FOODS)[number]) => {
    setPendingMealType(inferMealTypeFromTime())
    setPendingRelogFood(food)
  }

  const handleConfirmRelog = () => {
    if (!pendingRelogFood) return
    const entry = {
      foodId: pendingRelogFood.id,
      food: pendingRelogFood,
      amount: 100,
      mealType: pendingMealType,
      date: currentDate,
    }
    const localId = addMealEntry(entry)
    addJournalEntry(entry)
      .then((backendEntry) => { updateMealEntryId(localId, backendEntry.id) })
      .catch((err) => { console.error("[AddSheet] addJournalEntry (relog) sync failed:", err) })
    setPendingRelogFood(null)
    setShowAddSheet(false)
  }

  const handlePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setInterpreting(true)
    setInterpError(null)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "")
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const result = await interpretMedia("photo", base64)
      setInterpResult(result)
    } catch (err) {
      console.error("[AddSheet] interpret photo failed:", err)
      setInterpError(t("errorLoading"))
    } finally {
      setInterpreting(false)
      if (e.target) e.target.value = ""
    }
  }

  // Dismiss on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowAddSheet(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [setShowAddSheet])

  if (interpResult) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <InterpretConfirm
          result={interpResult}
          onBack={() => setInterpResult(null)}
          onDone={() => { setInterpResult(null); setShowAddSheet(false) }}
        />
      </div>
    )
  }

  return (
    <>
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Overlay */}
        <motion.div
          className="absolute inset-0 bg-black/40"
          onClick={() => setShowAddSheet(false)}
        />

        {/* Sheet */}
        <motion.div
          className="relative w-full max-w-md mx-auto bg-background rounded-t-3xl border-t border-border overflow-hidden flex flex-col max-h-[88vh]"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-9 h-1 rounded-full bg-muted-foreground/25" />
          </div>

          <div className="px-4 pb-8 pt-2 flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-semibold text-foreground">{t("addMeal")}</h2>
              <button
                onClick={() => setShowAddSheet(false)}
                className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"
                aria-label={t("cancel")}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* 2×2 quick action grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={() => {
                      if (action.id === "photo") {
                        fileInputRef.current?.click()
                        return
                      }
                      if (action.id === "voice") {
                        setShowVoiceModal(true)
                        return
                      }
                      if (action.id === "search") {
                        setShowFoodSearch(true)
                        setShowAddSheet(false)
                        return
                      }
                      if (action.id === "scanner") {
                        setShowScanner(true)
                        return
                      }
                    }}
                    className="flex items-center gap-3 rounded-2xl border border-border p-3.5 active:scale-[0.97] transition-transform text-left"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: action.bg }}
                    >
                      <Icon className="h-5 w-5" style={{ color: action.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-foreground leading-tight">
                        {t(action.labelKey)}
                      </p>
                      {action.id === "photo" && (
                        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                          {t("detectByPhoto")}
                        </p>
                      )}
                      {action.id === "voice" && (
                        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                          {t("sayMeal")}
                        </p>
                      )}
                      {action.id === "scanner" && (
                        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                          {t("barcode")}
                        </p>
                      )}
                      {action.id === "search" && (
                        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                          {t("searchCiqual")}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Recent foods pills */}
            {recentFoods.length > 0 && (
              <div>
                <p className="text-[12px] text-muted-foreground font-medium mb-2">
                  {t("recentFoods")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {recentFoods.map((food) =>
                    food ? (
                      <button
                        key={food.id}
                        onClick={() => handleRelogFood(food)}
                        className="px-3 py-1.5 rounded-full border border-border bg-card text-[13px] text-foreground font-medium active:scale-95 transition-transform"
                      >
                        {food.name}
                        <span className="ml-1.5 text-muted-foreground text-[11px]">
                          {food.calories} kcal/100g
                        </span>
                      </button>
                    ) : null
                  )}
                </div>
              </div>
            )}

            {/* Mini-sélecteur repas pour les chips Récents */}
            {pendingRelogFood && (
              <div className="mt-3 p-4 rounded-2xl border border-border bg-muted/50">
                <p className="text-[13px] font-semibold text-foreground mb-2">
                  {pendingRelogFood.name}
                  <span className="ml-2 text-muted-foreground font-normal text-[11px]">
                    {pendingRelogFood.calories} kcal/100g
                  </span>
                </p>
                <div className="flex gap-1.5 mb-3">
                  {MEALS.map((m) => (
                    <button
                      key={m.type}
                      onClick={() => setPendingMealType(m.type)}
                      className={cn(
                        "flex-1 text-[11px] font-medium rounded-xl py-1.5 border transition-colors",
                        pendingMealType === m.type
                          ? "border-[var(--primary)] text-white"
                          : "bg-card text-muted-foreground border-border"
                      )}
                      style={pendingMealType === m.type ? { backgroundColor: "var(--primary)" } : {}}
                    >
                      {t(m.type)}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPendingRelogFood(null)}
                    className="flex-1 py-2 rounded-xl border border-border text-[13px] text-muted-foreground"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    onClick={handleConfirmRelog}
                    className="flex-1 py-2 rounded-xl text-[13px] font-semibold text-white"
                    style={{ backgroundColor: "var(--primary)" }}
                  >
                    {t("add")}
                  </button>
                </div>
              </div>
            )}

            {/* Error message */}
            {interpError && (
              <p className="text-[12px] text-center mt-2" style={{ color: "var(--risk)" }}>{interpError}</p>
            )}
          </div>

          {/* Hidden file input for photo capture */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoFile}
          />

          {/* Loading overlay for photo processing */}
          {interpreting && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-3 rounded-t-3xl">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
              <p className="text-[14px] text-muted-foreground">{t("analyzing")}</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>

    {/* Voice modal — above the sheet (z-[60]) */}
    {showVoiceModal && (
      <VoiceModal
        language={language}
        onClose={() => setShowVoiceModal(false)}
        onResult={(r) => { setShowVoiceModal(false); setInterpResult(r) }}
      />
    )}

    <AnimatePresence>
      {showScanner && (
        <ScannerModal
          onClose={() => setShowScanner(false)}
          onScanned={(product) => {
            addScannedProduct(product)
            setShowScanner(false)
            setShowAddSheet(false)
          }}
        />
      )}
    </AnimatePresence>
    </>
  )
}

// ─── VoiceModal ───────────────────────────────────────────────────────────────

function VoiceModal({
  language,
  onClose,
  onResult,
}: {
  language: string
  onClose: () => void
  onResult: (result: ApiInterpretResponse) => void
}) {
  const [state, setState] = useState<"listening" | "processing" | "error" | "text-input">("listening")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [textInput, setTextInput] = useState("")
  const { t } = useApp()

  const processText = useCallback(async (text: string) => {
    setState("processing")
    try {
      const result = await interpretMedia("text", text, language)
      onResult(result)
    } catch (err) {
      console.error("[VoiceModal] /api/interpret failed:", err)
      setErrorMsg(t("errorLoading"))
      setState("error")
    }
  }, [language, onResult, t])

  useEffect(() => {
    type AnySpeechRecognition = {
      lang: string
      interimResults: boolean
      maxAlternatives: number
      onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null
      onerror: (() => void) | null
      start: () => void
      stop: () => void
    }
    type SpeechRecognitionCtor = new () => AnySpeechRecognition

    const SRC =
      typeof window !== "undefined"
        ? ((window as unknown as Record<string, unknown>)["SpeechRecognition"] ??
            (window as unknown as Record<string, unknown>)["webkitSpeechRecognition"]) as
          | SpeechRecognitionCtor
          | undefined
        : undefined

    if (!SRC) {
      setState("text-input")
      return
    }

    const recognition = new SRC()
    recognition.lang = language === "ar" ? "ar-DZ" : language === "en" ? "en-US" : "fr-FR"
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      processText(transcript)
    }

    recognition.onerror = () => {
      console.error("[VoiceModal] SpeechRecognition error — falling back to text input")
      setState("text-input")
    }

    recognition.start()
    return () => { try { recognition.stop() } catch { /* ignore on unmount */ } }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-6 safe-bottom"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25 }}
      >
        {state === "listening" && (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="flex items-center gap-1 h-16">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full"
                  style={{ backgroundColor: "var(--primary)" }}
                  animate={{ height: [8, VOICE_WAVE_HEIGHTS[i % VOICE_WAVE_HEIGHTS.length], 8] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                />
              ))}
            </div>
            <motion.div
              className="p-6 rounded-full"
              style={{ backgroundColor: "var(--badge-positive-bg)" }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Mic className="h-8 w-8" style={{ color: "var(--primary)" }} />
            </motion.div>
            <p className="text-[17px] font-semibold text-foreground">{t("speakNow")}</p>
            <p className="text-[13px] text-muted-foreground text-center">{t("sayMeal")}</p>
          </div>
        )}

        {state === "processing" && (
          <div className="flex flex-col items-center gap-6 py-8">
            <Loader2 className="h-10 w-10 animate-spin" style={{ color: "var(--primary)" }} />
            <p className="text-[16px] text-muted-foreground">{t("analyzing")}</p>
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col items-center gap-6 py-8">
            <p className="text-[14px] text-center" style={{ color: "var(--risk)" }}>
              {errorMsg ?? t("errorLoading")}
            </p>
            <Button
              variant="outline"
              onClick={() => setState("text-input")}
              className="rounded-xl"
            >
              {t("search")}
            </Button>
          </div>
        )}

        {state === "text-input" && (
          <div className="space-y-4 py-4">
            <p className="text-[15px] font-semibold text-foreground">{t("sayMeal")}</p>
            <p className="text-[12px] text-muted-foreground">{t("voiceSpeechNotSupported")}</p>
            <Input
              placeholder={t("searchFood")}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && textInput.trim()) processText(textInput.trim()) }}
              className="h-11 rounded-xl"
              autoFocus
            />
            <Button
              className="w-full rounded-xl"
              disabled={!textInput.trim()}
              onClick={() => processText(textInput.trim())}
            >
              {t("add")}
            </Button>
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center"
          aria-label={t("cancel")}
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── ScannerModal ─────────────────────────────────────────────────────────────

type ScanStep =
  | "camera"            // caméra active (@zxing/browser)
  | "scanning"          // code détecté — appel réseau en cours (évite écran noir)
  | "manual"            // saisie manuelle
  | "unknown"           // produit non trouvé — choix à faire
  | "label-processing"  // analyse Gemini en cours
  | "composition-confirm" // S6 — composition extraite, champs éditables avant ajout
  | "product-confirm"   // fiche produit — confirmation après scan réussi

// S6 — champs nutritionnels éditables de l'écran de confirmation composition.
const COMPOSITION_FIELDS = [
  { key: "kcal",      labelKey: "nutritionCalories" as const,    unit: "kcal" },
  { key: "glucides",  labelKey: "carbs" as const,                unit: "g" },
  { key: "sucres",    labelKey: "nutritionSugarsSub" as const,   unit: "g" },
  { key: "proteines", labelKey: "protein" as const,              unit: "g" },
  { key: "lipides",   labelKey: "fat" as const,                  unit: "g" },
  { key: "satures",   labelKey: "nutritionSaturatedSub" as const,unit: "g" },
  { key: "sel",       labelKey: "salt" as const,                 unit: "g" },
  { key: "fibres",    labelKey: "nutritionFiber" as const,       unit: "g" },
] as const

type CompositionFieldKey = (typeof COMPOSITION_FIELDS)[number]["key"]

function nutriScoreColor(score: "A" | "B" | "C" | "D" | "E" | null): string {
  switch (String(score ?? "").toUpperCase()) {
    case "A": return "#038148"
    case "B": return "#85bb2f"
    case "C": return "#fecb02"
    case "D": return "#ee8100"
    case "E": return "#e63312"
    default:  return "var(--muted-foreground)"
  }
}

function ScannerModal({
  onClose,
  onScanned,
}: {
  onClose: () => void
  onScanned: (product: import("@/lib/types").ScannedProduct) => void
}) {
  const { t, addMealEntry, updateMealEntryId, currentDate } = useApp()
  const [step, setStep] = useState<ScanStep>("camera")
  const [manualBarcode, setManualBarcode] = useState("")
  const [scanning, setScanning] = useState(false)
  // P1-8 (ressenti perf) — au-delà de ~2,5 s d'attente réseau (cold start Render),
  // on affiche un indice « réveil serveur » plutôt qu'un spinner muet.
  const [scanSlow, setScanSlow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [unknownBarcode, setUnknownBarcode] = useState("")
  // S6 — résultat composition + champs éditables (clé → valeur saisie, "" = inconnu)
  const [compResult, setCompResult] = useState<CompositionResult | null>(null)
  const [compName, setCompName] = useState("")
  const [compEdits, setCompEdits] = useState<Record<CompositionFieldKey, string>>(
    () => Object.fromEntries(COMPOSITION_FIELDS.map((f) => [f.key, ""])) as Record<CompositionFieldKey, string>
  )
  const [scannedProduct, setScannedProduct] = useState<import("@/lib/types").ScannedProduct | null>(null)
  const [productImgFailed, setProductImgFailed] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerControlsRef = useRef<IScannerControls | undefined>(undefined)
  const activeRef = useRef(true)
  const labelInputRef = useRef<HTMLInputElement>(null)

  const handleBarcode = useCallback(async (barcode: string) => {
    setScanning(true)
    setError(null)
    try {
      const product = await scanBarcode(barcode)
      // Show product card instead of closing immediately (T5)
      setScannedProduct(product)
      setStep("product-confirm")
    } catch (err) {
      if (err instanceof ProductUnknownError) {
        setUnknownBarcode(barcode)
        setStep("unknown")
        return
      }
      console.error("[ScannerModal] scanBarcode failed:", "/api/scan", err)
      setError(t("scannerError"))
      setStep("manual")
    } finally {
      setScanning(false)
    }
  }, [t])

  // P1-8 — déclenche l'indice « réveil serveur » si l'appel scan dépasse 2,5 s.
  useEffect(() => {
    if (!scanning) {
      setScanSlow(false)
      return
    }
    const id = setTimeout(() => setScanSlow(true), 2500)
    return () => clearTimeout(id)
  }, [scanning])

  // S6 — parse une valeur saisie (FR virgule ou EN point) → nombre ou null (jamais 0 par défaut).
  const parseField = (k: CompositionFieldKey): number | null => {
    const v = parseFloat((compEdits[k] ?? "").replace(",", "."))
    return Number.isFinite(v) && v >= 0 ? v : null
  }

  const handleCompositionPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setStep("label-processing")
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "")
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const result = await scanCompositionImage(base64)
      setCompResult(result)
      setCompName(result.productName ?? "")
      // Pré-remplit les champs éditables ; null reste "" (REG : pas de 0 inventé).
      setCompEdits(
        Object.fromEntries(
          COMPOSITION_FIELDS.map((f) => {
            const v = result.per100g[f.key]
            return [f.key, v === null ? "" : String(v)]
          })
        ) as Record<CompositionFieldKey, string>
      )
      setStep("composition-confirm")
    } catch (err) {
      console.error("[ScannerModal] /api/scan/composition failed:", err)
      setError(t("errorLoading"))
      setStep("unknown")
    } finally {
      if (e.target) e.target.value = ""
    }
  }

  const handleCompositionConfirm = () => {
    const kcal = parseField("kcal")
    if (kcal === null) return // kcal obligatoire — REG : ne pas stocker 0 à la place d'une valeur inconnue
    const foodId = `label-${Date.now()}`
    const fibres = parseField("fibres")
    const sucres = parseField("sucres")
    const food = {
      id: foodId,
      name: compName || t("unknownFoodName"),
      nameEn: compName || t("unknownFoodName"),
      cuisine: "International",
      calories: kcal,
      protein: parseField("proteines") ?? 0,
      carbs: parseField("glucides") ?? 0,
      fat: parseField("lipides") ?? 0,
      fiber: fibres ?? undefined,
      sugar: sucres ?? undefined,
      source: "estimated" as const,
    }
    const entry = { foodId, food, amount: 100, mealType: inferMealTypeFromTime(), date: currentDate }
    const localId = addMealEntry(entry)
    // Sync to backend — estimated foods may not be in products DB yet; error is non-blocking
    addJournalEntry(entry)
      .then((backendEntry) => { updateMealEntryId(localId, backendEntry.id) })
      .catch((err) => { console.error("[ScannerModal] addJournalEntry (composition) sync failed:", err) })
    onClose()
  }

  useEffect(() => {
    if (step !== "camera") return
    activeRef.current = true

    const codeReader = new BrowserMultiFormatReader()

    codeReader.decodeFromVideoDevice(
      undefined,
      videoRef.current ?? undefined,
      (result, err) => {
        if (result) {
          if (!activeRef.current) return   // déduplication : ignorer si déjà en cours
          activeRef.current = false        // bloquer les détections suivantes
          const code = result.getText().trim()
          scannerControlsRef.current?.stop()
          scannerControlsRef.current = undefined
          setStep("scanning")
          handleBarcode(code)
          return
        }
        if (err && !(err instanceof NotFoundException)) {
          console.warn("[Scanner] zxing error:", err)
        }
        // NotFoundException = rien détecté encore, ignorer
      }
    ).then((controls) => {
      if (!activeRef.current) {
        controls.stop()
        return
      }
      scannerControlsRef.current = controls
    }).catch(() => {
      if (activeRef.current) setCameraError(t("cameraPermissionDenied"))
      setStep("manual")
    })

    return () => {
      activeRef.current = false
      scannerControlsRef.current?.stop()
      scannerControlsRef.current = undefined
    }
  }, [step, handleBarcode, t])

  return (
    <motion.div
      className="fixed inset-0 z-[60] bg-background"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
            aria-label={t("cancel")}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
          <h2 className="text-[16px] font-semibold text-foreground">{t("scanProduct")}</h2>
        </div>

        <div
          className={cn(
            "flex-1 min-h-0 flex flex-col items-center gap-6 px-6 overflow-y-auto overscroll-contain",
            step === "composition-confirm" || step === "product-confirm"
              ? "justify-start py-6"
              : "justify-center"
          )}
        >

          {/* ── Caméra ── */}
          {step === "camera" && (
            <>
              <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-black">
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-primary rounded-xl opacity-80" />
                </div>
              </div>
              <p className="text-[13px] text-muted-foreground text-center">{t("scannerScanBarcode")}</p>
              <button
                onClick={() => setStep("manual")}
                className="flex items-center gap-2 text-[13px] text-primary"
              >
                <KeyboardIcon className="h-4 w-4" />
                {t("scannerManualBarcode")}
              </button>
            </>
          )}

          {/* ── Analyse code-barres en cours ── */}
          {step === "scanning" && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin" style={{ color: "var(--primary)" }} />
              <p className="text-[14px] text-muted-foreground">{t("analyzingBarcode")}</p>
              {scanSlow && (
                <p className="text-[12px] text-muted-foreground text-center">{t("serverWaking")}</p>
              )}
            </div>
          )}

          {/* ── Saisie manuelle ── */}
          {step === "manual" && (
            <>
              {cameraError && (
                <p className="text-[13px] text-center" style={{ color: "var(--amber)" }}>{cameraError}</p>
              )}
              <div className="w-full max-w-sm space-y-3">
                <p className="text-[14px] font-medium text-foreground">{t("scannerManualBarcode")}</p>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex. 5449000000996"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  className="h-12 rounded-xl"
                  autoFocus
                />
                {error && <p className="text-[12px]" style={{ color: "var(--risk)" }}>{error}</p>}
                <Button
                  className="w-full rounded-xl"
                  disabled={manualBarcode.length < 8 || scanning}
                  onClick={() => handleBarcode(manualBarcode.trim())}
                >
                  {scanning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                  {t("scannerScanBarcode")}
                </Button>
                {scanning && scanSlow && (
                  <p className="text-[12px] text-muted-foreground text-center">{t("serverWaking")}</p>
                )}
                {!cameraError && (
                  <button onClick={() => setStep("camera")} className="w-full text-[13px] text-primary text-center">
                    {t("scannerOpenCamera")}
                  </button>
                )}
              </div>
            </>
          )}

          {/* ── Produit inconnu — choix ── */}
          {step === "unknown" && (
            <div className="w-full max-w-sm space-y-4">
              <div className="text-center space-y-1">
                <p className="text-[15px] font-semibold text-foreground">{t("scannerUnknownProduct")}</p>
                {unknownBarcode && (
                  <p className="text-[12px] text-muted-foreground">{unknownBarcode}</p>
                )}
              </div>
              <button
                onClick={() => setStep("manual")}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border border-border bg-card text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <KeyboardIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-[14px] font-medium text-foreground">{t("scannerChoiceManual")}</p>
              </button>
              <button
                onClick={() => labelInputRef.current?.click()}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border border-border bg-card text-left"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--badge-positive-bg)" }}>
                  <Camera className="h-5 w-5" style={{ color: "var(--primary)" }} />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-foreground">{t("scannerLabelPhoto")}</p>
                  <p className="text-[11px] text-muted-foreground">{t("scannerLabelPhotoHint")}</p>
                </div>
              </button>
              <input
                ref={labelInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleCompositionPhoto}
              />
            </div>
          )}

          {/* ── Analyse étiquette en cours ── */}
          {step === "label-processing" && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin" style={{ color: "var(--primary)" }} />
              <p className="text-[14px] text-muted-foreground">{t("analyzing")}</p>
            </div>
          )}

          {/* ── Confirmation composition (S6) — champs éditables, OCR faillible ── */}
          {step === "composition-confirm" && compResult && (
            <div className="w-full max-w-sm space-y-4">
              <div>
                <p className="text-[15px] font-semibold text-foreground">{t("compositionTitle")}</p>
                <p className="text-[11px] text-muted-foreground">{t("labelExtracted")}</p>
              </div>

              {/* Bandeau si lecture incertaine (needs_confirmation ou warnings) */}
              {(compResult.needsConfirmation || compResult.warnings.length > 0) && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-muted/40">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--amber)" }} />
                  <p className="text-[12px] leading-snug" style={{ color: "var(--amber)" }}>
                    {t("compositionNeedsCheck")}
                  </p>
                </div>
              )}

              <Input
                placeholder={t("productNamePlaceholder")}
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
                className="h-11 rounded-xl"
              />

              {/* Champs nutritionnels éditables — null/"" = à compléter (jamais 0 inventé) */}
              <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5">
                {COMPOSITION_FIELDS.map(({ key, labelKey, unit }) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <label htmlFor={`comp-${key}`} className="text-[13px] text-muted-foreground">
                      {t(labelKey)}
                    </label>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Input
                        id={`comp-${key}`}
                        type="text"
                        inputMode="decimal"
                        value={compEdits[key]}
                        onChange={(e) =>
                          setCompEdits((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        className="h-9 w-20 rounded-lg text-right text-[13px]"
                      />
                      <span className="text-[12px] text-muted-foreground w-8">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Additifs détectés — pastilles colorées par risque */}
              <div className="space-y-1.5">
                <p className="text-[12px] font-medium text-foreground">{t("compositionAdditivesLabel")}</p>
                {compResult.additives.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {compResult.additives.map((a) => {
                      const { code, name, risk } = normalizeAdditive(a)
                      if (!code) return null
                      const color = additiveRiskColor(risk)
                      return (
                        <span
                          key={code}
                          className="text-[11px] px-2 py-0.5 rounded-full border"
                          style={{ color, borderColor: color, backgroundColor: `${color}18` }}
                        >
                          {name ?? code}
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-[12px] text-muted-foreground">{t("compositionNoAdditives")}</p>
                )}
              </div>

              {/* Disclaimer REG-05 (langue active) */}
              <p className="text-[11px] text-muted-foreground leading-snug">{t("scanDisclaimer")}</p>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep("unknown")}>
                  {t("cancel")}
                </Button>
                {/* Disabled si kcal vide/invalide — REG : ne pas stocker 0 à la place d'une valeur inconnue */}
                <Button
                  className="flex-1 rounded-xl"
                  disabled={parseField("kcal") === null}
                  onClick={handleCompositionConfirm}
                >
                  {t("addToJournal")}
                </Button>
              </div>
            </div>
          )}

          {/* ── Fiche produit après scan réussi (T5) ── */}
          {step === "product-confirm" && scannedProduct && (
            <div className="w-full max-w-sm space-y-4">
              <div className="flex items-center gap-3">
                {scannedProduct.imageUrl && !productImgFailed ? (
                  <img
                    src={scannedProduct.imageUrl}
                    alt={scannedProduct.name}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                    onError={() => setProductImgFailed(true)}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[17px] font-semibold text-foreground leading-tight">
                    {scannedProduct.name}
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{scannedProduct.barcode}</p>
                </div>
              </div>

              {/* Nutri-Score + verdict + score */}
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card">
                {scannedProduct.nutriScore && (
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-lg shrink-0"
                    style={{ backgroundColor: nutriScoreColor(scannedProduct.nutriScore) }}
                  >
                    {scannedProduct.nutriScore}
                  </div>
                )}
                <div>
                  {scannedProduct.score === null ? (
                    <>
                      {/* P1-7 — « non noté » : aucune donnée exploitable, ton neutre (pas de score, pas de couleur risque). */}
                      <p className="text-[15px] font-semibold text-muted-foreground">{t("notRated")}</p>
                      <p className="text-[12px] text-muted-foreground">
                        {t("notRatedHint")} · {(scannedProduct.additives ?? []).length} {t("additiveCount")}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[15px] font-semibold text-foreground">
                        {scannedProduct.verdict === "Excellent" ? t("excellent")
                          : scannedProduct.verdict === "Mauvais" ? t("bad")
                          : t("mediocre")}
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        {scannedProduct.score}/100 · {(scannedProduct.additives ?? []).length} {t("additiveCount")}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Additives list */}
              {(scannedProduct.additives ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(scannedProduct.additives ?? []).map((a) => {
                    const { code, name, risk } = normalizeAdditive(a)
                    const color = additiveRiskColor(risk)
                    return (
                      <span
                        key={code}
                        className="text-[11px] px-2 py-0.5 rounded-full border"
                        style={{ color, borderColor: color, backgroundColor: `${color}18` }}
                      >
                        {name ?? code}
                      </span>
                    )
                  })}
                </div>
              )}

              {/* Nutrition data if available */}
              {(scannedProduct.sucres != null || scannedProduct.sel != null || scannedProduct.ags != null) && (
                <div className="rounded-2xl border border-border bg-card p-3 space-y-1.5">
                  {([
                    { labelKey: "nutritionSugars" as const, value: scannedProduct.sucres },
                    { labelKey: "salt" as const,            value: scannedProduct.sel },
                    { labelKey: "saturatedFat" as const,    value: scannedProduct.ags },
                  ] as const).map(({ labelKey, value }) => value != null && (
                    <div key={labelKey} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t(labelKey)}</span>
                      <span className="font-medium text-foreground">{value} {t("nutritionPer100g")}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Disclaimer REG-05 (langue active) */}
              <p className="text-[11px] text-muted-foreground leading-snug">
                {t("scanDisclaimer")}
              </p>

              {/* Actions */}
              <div className="space-y-2">
                {/* M-01 : onScanned appelle déjà setShowScanner(false)+setShowAddSheet(false) */}
                <Button
                  className="w-full rounded-xl"
                  onClick={() => onScanned(scannedProduct)}
                >
                  {t("addToGroceries")}
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={onClose}
                >
                  {t("cancel")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
