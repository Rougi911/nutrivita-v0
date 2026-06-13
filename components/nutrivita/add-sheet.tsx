"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Camera, Loader2, Mic, ScanLine, Search, X, KeyboardIcon } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { interpretMedia, scanBarcode } from "@/lib/api"
import { SAMPLE_FOODS } from "@/lib/types"
import type { ApiInterpretResponse } from "@/lib/api-types"
import { InterpretConfirm } from "@/components/nutrivita/interpret-confirm"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const recentFoodIds = ["1", "3", "9", "5", "7"]

const quickActions = [
  {
    id: "photo",
    labelKey: "photo" as const,
    icon: Camera,
    color: "var(--primary)",
    bg: "var(--badge-positive-bg)",
    comingSoon: false,
  },
  {
    id: "voice",
    labelKey: "voice" as const,
    icon: Mic,
    color: "var(--glucose)",
    bg: "var(--glucose-bg)",
    comingSoon: false,
  },
  {
    id: "scanner",
    labelKey: "scanner" as const,
    icon: ScanLine,
    color: "var(--amber)",
    bg: "var(--amber-bg)",
    comingSoon: false,
  },
  {
    id: "search",
    labelKey: "search" as const,
    icon: Search,
    color: "var(--muted-foreground)",
    bg: "var(--muted)",
    comingSoon: false,
  },
] as const

export function AddSheet() {
  const { setShowAddSheet, t, setShowFoodSearch, language, addMealEntry, currentDate, addScannedProduct } = useApp()

  const [interpResult, setInterpResult] = useState<ApiInterpretResponse | null>(null)
  const [interpreting, setInterpreting] = useState(false)
  const [interpError, setInterpError] = useState<string | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const recentFoods = recentFoodIds
    .map((id) => SAMPLE_FOODS.find((f) => f.id === id))
    .filter(Boolean)

  const callInterpretText = async (text: string) => {
    setInterpreting(true)
    setInterpError(null)
    try {
      // mode:"text" for transcribed text (backend contract: photo|voice|text)
      const result = await interpretMedia("text", text, language)
      setInterpResult(result)
    } catch (err) {
      console.error("[AddSheet] interpret text failed:", err)
      setInterpError(t("errorLoading"))
    } finally {
      setInterpreting(false)
    }
  }

  const handleRelogFood = (food: (typeof SAMPLE_FOODS)[number]) => {
    addMealEntry({
      foodId: food.id,
      food,
      amount: 100,
      mealType: "lunch",
      date: currentDate,
    })
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
      // mode:"photo", payload = base64 string
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

  const handleVoiceInput = () => {
    type AnySpeechRecognition = {
      lang: string
      interimResults: boolean
      maxAlternatives: number
      onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null
      onerror: (() => void) | null
      start: () => void
    }
    type SpeechRecognitionCtor = new () => AnySpeechRecognition

    const SpeechRecognitionClass =
      typeof window !== "undefined"
        ? ((window as unknown as Record<string, unknown>)["SpeechRecognition"] ??
           (window as unknown as Record<string, unknown>)["webkitSpeechRecognition"]) as
             | SpeechRecognitionCtor
             | undefined
        : undefined

    if (!SpeechRecognitionClass) {
      setInterpError(t("voiceSpeechNotSupported"))
      return
    }

    const recognition = new SpeechRecognitionClass()
    recognition.lang = language === "ar" ? "ar-DZ" : language === "en" ? "en-US" : "fr-FR"
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      callInterpretText(transcript)
    }
    recognition.onerror = () => setInterpError(t("errorLoading"))
    recognition.start()
  }

  // Dismiss on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowAddSheet(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [setShowAddSheet])

  // If interpret result available, show the confirmation screen
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
          className="relative w-full max-w-md mx-auto bg-background rounded-t-3xl border-t border-border overflow-hidden"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-9 h-1 rounded-full bg-muted-foreground/25" />
          </div>

          <div className="px-4 pb-8 pt-2">
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
                        handleVoiceInput()
                        return
                      }
                      if (action.id === "search") {
                        setShowFoodSearch(true)
                        setShowAddSheet(false)
                      }
                      if (action.id === "scanner") {
                        setShowScanner(true)
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

          {/* Loading overlay while API processes */}
          {interpreting && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-3 rounded-t-3xl">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
              <p className="text-[14px] text-muted-foreground">{t("analyzing")}</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>

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

// ─── ScannerModal ─────────────────────────────────────────────────────────────

function ScannerModal({
  onClose,
  onScanned,
}: {
  onClose: () => void
  onScanned: (product: import("@/lib/types").ScannedProduct) => void
}) {
  const { t } = useApp()
  const [manualBarcode, setManualBarcode] = useState("")
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [showManual, setShowManual] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const activeRef = useRef(true)

  const handleBarcode = useCallback(async (barcode: string) => {
    if (!activeRef.current) return
    setScanning(true)
    setError(null)
    try {
      const product = await scanBarcode(barcode)
      onScanned(product)
      onClose()
    } catch (err) {
      console.error("[ScannerModal] scanBarcode failed:", err)
      setError(t("scannerError"))
    } finally {
      setScanning(false)
    }
  }, [onClose, onScanned, t])

  useEffect(() => {
    activeRef.current = true
    if (showManual) return

    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })
        if (!activeRef.current) { stream.getTracks().forEach((tr) => tr.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }

        // Use native BarcodeDetector if available (Chrome/Android)
        const win = window as unknown as Record<string, unknown>
        if (typeof win["BarcodeDetector"] === "function") {
          type BD = { detect: (src: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> }
          const BarcodeDetector = win["BarcodeDetector"] as new (opts: object) => BD
          const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "code_128", "qr_code"] })
          const loop = async () => {
            if (!activeRef.current || !videoRef.current) return
            try {
              const codes = await detector.detect(videoRef.current)
              if (codes.length > 0) {
                activeRef.current = false
                stream.getTracks().forEach((tr) => tr.stop())
                handleBarcode(codes[0].rawValue)
              } else {
                requestAnimationFrame(loop)
              }
            } catch {
              requestAnimationFrame(loop)
            }
          }
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => { if (activeRef.current) requestAnimationFrame(loop) }
          }
        } else {
          // No BarcodeDetector → switch to manual entry
          setCameraError(null)
          setShowManual(true)
        }
      } catch {
        if (activeRef.current) setCameraError(t("cameraPermissionDenied"))
        setShowManual(true)
      }
    })()

    return () => {
      activeRef.current = false
      streamRef.current?.getTracks().forEach((tr) => tr.stop())
    }
  }, [showManual, handleBarcode, t])

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

        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          {!showManual && !cameraError ? (
            <>
              {/* Camera viewfinder */}
              <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                {/* Scanning frame overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-primary rounded-xl opacity-80" />
                </div>
              </div>
              <p className="text-[13px] text-muted-foreground text-center">{t("scannerScanBarcode")}</p>
              <button
                onClick={() => setShowManual(true)}
                className="flex items-center gap-2 text-[13px] text-primary"
              >
                <KeyboardIcon className="h-4 w-4" />
                {t("scannerManualBarcode")}
              </button>
            </>
          ) : (
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
                {error && (
                  <p className="text-[12px]" style={{ color: "var(--risk)" }}>{error}</p>
                )}
                <Button
                  className="w-full rounded-xl"
                  disabled={manualBarcode.length < 8 || scanning}
                  onClick={() => handleBarcode(manualBarcode.trim())}
                >
                  {scanning ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  {t("scannerScanBarcode")}
                </Button>
                {!cameraError && (
                  <button
                    onClick={() => setShowManual(false)}
                    className="w-full text-[13px] text-primary text-center"
                  >
                    {t("scannerOpenCamera")}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
