"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Download, Share, X } from "lucide-react"
import { useApp } from "@/lib/app-context"

const DISMISS_KEY = "nv-install-dismissed"

/** Event `beforeinstallprompt` (non typé par lib.dom standard). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

/**
 * Invite d'installation PWA (S18).
 *  - Android/Chromium : capte `beforeinstallprompt`, propose un bouton « Installer ».
 *  - iOS Safari (pas d'événement natif) : affiche les instructions « Partager → Sur l'écran d'accueil ».
 *  - Masquée si l'app est déjà installée (mode standalone) ou si l'utilisateur a fermé l'invite.
 */
export function InstallPrompt() {
  const { t } = useApp()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [iosHint, setIosHint] = useState(false)
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    const alreadyDismissed = window.localStorage.getItem(DISMISS_KEY) === "1"

    if (standalone || alreadyDismissed) {
      setHidden(true)
      return
    }
    setHidden(false)

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)

    // iOS Safari ne déclenche jamais beforeinstallprompt → instructions manuelles.
    const ua = window.navigator.userAgent
    const isIos = /iphone|ipad|ipod/i.test(ua)
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|android/i.test(ua)
    if (isIos && isSafari) setIosHint(true)

    // App installée pendant la session → on referme l'invite.
    const onInstalled = () => dismiss()
    window.addEventListener("appinstalled", onInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1")
    } catch {
      // localStorage indisponible (mode privé) : on masque juste pour la session.
    }
    setHidden(true)
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    dismiss()
  }

  const visible = !hidden && (deferred !== null || iosHint)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-x-0 bottom-[88px] z-50 px-4"
        >
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: "var(--badge-positive-bg)" }}
              >
                <Download className="h-5 w-5" style={{ color: "var(--primary)" }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{t("installTitle")}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                  {t("installBody")}
                </p>

                {deferred ? (
                  <button
                    onClick={install}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
                    style={{ backgroundColor: "var(--primary)" }}
                  >
                    <Download className="h-4 w-4" />
                    {t("installAction")}
                  </button>
                ) : (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                    <Share className="h-4 w-4 shrink-0" style={{ color: "var(--primary)" }} />
                    {t("installIosHint")}
                  </p>
                )}
              </div>
              <button
                onClick={dismiss}
                aria-label={t("installDismiss")}
                className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
