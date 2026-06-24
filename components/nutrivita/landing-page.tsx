"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { BarChart3, BookOpen, Camera, ChevronRight, Droplets, Globe, Home, Lock, Mic, Settings, ShoppingCart, Star, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CalorieRing } from "./calorie-ring"
import { useApp } from "@/lib/app-context"
import { loginApi, ApiError } from "@/lib/api"
import type { TranslationKey } from "@/lib/types"

interface LandingPageProps {
  onGetStarted: () => void
}

const features: { icon: typeof Camera; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: Camera,       titleKey: "featurePhoto",       descKey: "featurePhotoDesc" },
  { icon: Droplets,     titleKey: "featureGlucose",     descKey: "featureGlucoseDesc" },
  { icon: ShoppingCart, titleKey: "featureBarcode",     descKey: "featureBarcodeDesc" },
  { icon: Mic,          titleKey: "featureVoice",       descKey: "featureVoiceDesc" },
  { icon: Globe,        titleKey: "featureMultilingual", descKey: "featureMultilingualDesc" },
  { icon: Lock,         titleKey: "dataProtected",      descKey: "featurePrivacyDesc" },
]

const testimonials: { name: string; location: string; textKey: TranslationKey; rating: number }[] = [
  { name: "Samira B.", location: "Alger", textKey: "testimonial1", rating: 5 },
  { name: "Pierre M.", location: "Lyon",  textKey: "testimonial2", rating: 5 },
  { name: "Fatima Z.", location: "Paris", textKey: "testimonial3", rating: 5 },
]

type Tab = "user" | "pro"

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const { login, t } = useApp()
  const [tab, setTab] = useState<Tab>("user")
  const [proEmail, setProEmail] = useState("")

  // Login form state
  const [showLogin, setShowLogin] = useState(false)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setLoginError(null)
    try {
      const result = await loginApi(loginEmail, loginPassword)
      login(result.token, result.user)
      // isAuthenticated becomes true → nutrivita-app.tsx effect routes to "main"
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0
      if (status === 401 || status === 400) {
        setLoginError(t("loginErrorInvalid"))
      } else {
        setLoginError(t("loginErrorNetwork"))
      }
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Nav ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground text-[15px] font-semibold"
              style={{ backgroundColor: "var(--primary)" }}
            >
              N
            </div>
            <span className="text-[16px] font-semibold text-foreground">NutriVita</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex rounded-full border border-border overflow-hidden">
              {(["user", "pro"] as Tab[]).map((tabKey) => (
                <button
                  key={tabKey}
                  onClick={() => setTab(tabKey)}
                  className={`px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                    tab === tabKey ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {tabKey === "user" ? t("userTabTitle") : t("practitioner")}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowLogin((v) => !v)}
              className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("signIn")}
            </button>
            <Button size="sm" className="rounded-xl h-9 gap-1.5 text-[13px]" onClick={onGetStarted}>
              {t("getStarted")} <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Login panel (slide-down) ──────────────────────── */}
      {showLogin && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-border bg-card"
        >
          <div className="max-w-sm mx-auto px-5 py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-semibold text-foreground">{t("signIn")}</h2>
              <button onClick={() => setShowLogin(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-[13px] font-medium text-foreground mb-1.5 block">{t("emailAddress")}</label>
                <Input
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="h-11 rounded-xl"
                  autoComplete="email"
                  required
                />
              </div>
              <div>
                <label className="text-[13px] font-medium text-foreground mb-1.5 block">{t("password")}</label>
                <Input
                  type="password"
                  placeholder={t("passwordPlaceholder")}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="h-11 rounded-xl"
                  autoComplete="current-password"
                  required
                />
              </div>
              {loginError && (
                <p className="text-[12px]" style={{ color: "var(--risk)" }}>{loginError}</p>
              )}
              <Button
                type="submit"
                className="w-full h-11 rounded-xl"
                disabled={isLoggingIn || !loginEmail || !loginPassword}
              >
                {isLoggingIn ? t("signingIn") : t("signIn")}
              </Button>
              <p className="text-center text-[12px] text-muted-foreground">
                {t("noAccountYet")}{" "}
                <button
                  type="button"
                  onClick={() => { setShowLogin(false); onGetStarted() }}
                  className="underline"
                  style={{ color: "var(--primary)" }}
                >
                  {t("createAccountShort")}
                </button>
              </p>
            </form>
          </div>
        </motion.div>
      )}

      {/* ─── User tab content ──────────────────────────────── */}
      {tab === "user" && (
        <>
          {/* Hero */}
          <section className="max-w-4xl mx-auto px-5 pt-16 pb-12">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <motion.div
                className="flex-1 text-center md:text-left"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h1 className="text-[32px] md:text-[42px] font-semibold text-foreground leading-tight mb-4">
                  {t("heroTitle")}
                </h1>
                <p className="text-[16px] text-muted-foreground mb-6">
                  {t("heroSubtitle")}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <Button size="lg" className="h-12 rounded-2xl gap-2 px-6 text-[15px]" onClick={onGetStarted}>
                    {t("startFree")} <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-4 text-[12px] text-muted-foreground">
                  Données protégées · RGPD &nbsp;|&nbsp; Protected data · GDPR &nbsp;|&nbsp; {"\\u0628\\u064A\\u0627\\u0646\\u0627\\u062A \\u0645\\u062D\\u0645\\u064A\\u0629 \\u00B7 RGPD"}
                </p>
              </motion.div>

              {/* Phone mock — decorative only */}
              <motion.div
                className="shrink-0 w-52 h-[420px] rounded-[36px] bg-card border-2 border-border overflow-hidden flex flex-col"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                aria-hidden="true"
              >
                <div className="flex items-center justify-between px-5 pt-3 pb-0.5">
                  <span className="text-[8px] font-semibold text-foreground">9:41</span>
                  <div className="flex items-center gap-0.5">
                    <div className="w-4 h-1.5 rounded-sm border border-foreground/40 p-px">
                      <div className="h-full w-3/4 rounded-sm bg-foreground/40" />
                    </div>
                  </div>
                </div>
                <div className="px-4 pt-0.5 pb-1">
                  <p className="text-[11px] font-semibold text-foreground">Bonjour Ahmed</p>
                </div>
                <div className="flex justify-center py-1">
                  <CalorieRing consumed={1420} target={2100} burned={350} size={120} />
                </div>
                <div className="grid grid-cols-3 gap-1.5 px-3 mt-1">
                  {[
                    { label: "Glucides",  value: 180, target: 236, color: "var(--amber)" },
                    { label: "Protéines", value: 65,  target: 158, color: "var(--glucose)" },
                    { label: "Lipides",   value: 38,  target: 58,  color: "var(--lipids)" },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl border border-border bg-background p-1.5 flex flex-col items-center gap-0.5">
                      <span className="text-[11px] font-semibold text-foreground">{m.value}g</span>
                      <span className="text-[7px] text-muted-foreground">{m.label}</span>
                      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(Math.round((m.value / m.target) * 100), 100)}%`,
                            backgroundColor: m.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mx-3 mt-2 rounded-xl border border-border bg-background p-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div
                      className="w-5 h-5 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "var(--badge-positive-bg)" }}
                    >
                      <Droplets className="h-2.5 w-2.5" style={{ color: "var(--glucose)" }} />
                    </div>
                    <span className="text-[9px] text-muted-foreground">Glycémie</span>
                  </div>
                  <span className="text-[13px] font-semibold" style={{ color: "var(--glucose)" }}>1.2 g/L</span>
                </div>
                <div className="mt-auto border-t border-border flex justify-around px-2 py-2.5">
                  {[
                    { Icon: Home,         active: true  },
                    { Icon: BookOpen,     active: false },
                    { Icon: ShoppingCart, active: false },
                    { Icon: BarChart3,    active: false },
                    { Icon: Settings,     active: false },
                  ].map(({ Icon, active }, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <Icon
                        className="h-4 w-4"
                        style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}
                      />
                      {active && (
                        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "var(--primary)" }} />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>

          {/* Features */}
          <section className="border-t border-border bg-muted/30 py-12 px-5">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-[22px] font-semibold text-foreground text-center mb-8">{t("features")}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {features.map((feat, i) => {
                  const Icon = feat.icon
                  return (
                    <motion.div
                      key={i}
                      className="rounded-2xl border border-border bg-background p-4"
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      viewport={{ once: true }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                        style={{ backgroundColor: "var(--badge-positive-bg)" }}
                      >
                        <Icon className="h-5 w-5" style={{ color: "var(--primary)" }} />
                      </div>
                      <p className="text-[14px] font-semibold text-foreground leading-tight mb-1">{t(feat.titleKey)}</p>
                      <p className="text-[12px] text-muted-foreground leading-snug">{t(feat.descKey)}</p>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-12 px-5">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-[22px] font-semibold text-foreground text-center mb-8">{t("testimonialsTitle")}</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {testimonials.map((item, i) => (
                  <motion.div
                    key={i}
                    className="rounded-2xl border border-border bg-card p-4"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex mb-3">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          className={`h-3.5 w-3.5 ${j < item.rating ? "fill-current" : ""}`}
                          style={{ color: j < item.rating ? "var(--amber)" : "var(--muted-foreground)" }}
                        />
                      ))}
                    </div>
                    <p className="text-[13px] text-foreground mb-3">&ldquo;{t(item.textKey)}&rdquo;</p>
                    <p className="text-[12px] text-muted-foreground">
                      <span className="font-medium text-foreground">{item.name}</span>, {item.location}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA — flat teal */}
          <section className="py-12 px-5" style={{ backgroundColor: "var(--primary)" }}>
            <div className="max-w-xl mx-auto text-center text-primary-foreground">
              <h2 className="text-[24px] font-semibold mb-3">
                {t("ctaTitle")}
              </h2>
              <p className="text-primary-foreground/80 mb-6 text-[14px]">
                {t("ctaSubtitle")}
              </p>
              <Button
                size="lg"
                onClick={onGetStarted}
                className="bg-background text-foreground hover:bg-background/90 h-12 px-8 rounded-2xl text-[15px]"
              >
                {t("ctaButton")} <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </section>
        </>
      )}

      {/* ─── Pro tab ──────────────────────────────────────── */}
      {tab === "pro" && (
        <section className="max-w-xl mx-auto px-5 pt-16 pb-12 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: "var(--badge-positive-bg)" }}
          >
            <span className="text-[28px] font-semibold" style={{ color: "var(--primary)" }}>N</span>
          </div>
          <h2 className="text-[24px] font-semibold text-foreground mb-3">{t("proTabTitle")}</h2>
          <p className="text-[14px] text-muted-foreground mb-6">
            {t("proDescriptionFull")}
          </p>
          <div className="flex flex-col gap-3 max-w-sm mx-auto">
            <input
              type="email"
              placeholder={t("emailPlaceholder")}
              value={proEmail}
              onChange={(e) => setProEmail(e.target.value)}
              className="h-12 rounded-xl border border-border bg-card px-4 text-[14px] text-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button className="h-12 rounded-xl" disabled={!proEmail.includes("@")}>
              {t("proNotifyEmail")}
            </Button>
          </div>
          <p className="mt-4 text-[11px] text-muted-foreground">
            Données protégées · RGPD &nbsp;|&nbsp; Protected data · GDPR &nbsp;|&nbsp; {"\\u0628\\u064A\\u0627\\u0646\\u0627\\u062A \\u0645\\u062D\\u0645\\u064A\\u0629 \\u00B7 RGPD"}
          </p>
        </section>
      )}

      {/* ─── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-border py-8 px-5">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-primary-foreground text-[11px] font-semibold"
              style={{ backgroundColor: "var(--primary)" }}
            >
              N
            </div>
            <span className="font-semibold text-foreground">NutriVita</span>
          </div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-foreground transition-colors">{t("privacyPolicy")}</a>
            <a href="#" className="hover:text-foreground transition-colors">{t("legalNotice")}</a>
            <a href="#" className="hover:text-foreground transition-colors">{t("contact")}</a>
          </div>
          <p>© 2026 NutriVita</p>
        </div>
      </footer>
    </div>
  )
}
