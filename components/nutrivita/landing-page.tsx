"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { BarChart3, BookOpen, Camera, ChevronRight, Droplets, Globe, Home, Lock, Mic, Settings, ShoppingCart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CalorieRing } from "./calorie-ring"

interface LandingPageProps {
  onGetStarted: () => void
}

const features = [
  { icon: Camera,       title: "Détection par photo",       desc: "L'IA identifie le plat et calcule les calories automatiquement" },
  { icon: Droplets,     title: "Suivi glycémique",          desc: "Import CGM, analyse GMI/TIR, alertes personnalisées" },
  { icon: ShoppingCart, title: "Scan des courses",          desc: "Nutri-Score, additifs à risque, alternatives plus saines" },
  { icon: Mic,          title: "Saisie vocale",             desc: "Parlez en français, arabe ou anglais" },
  { icon: Globe,        title: "FR / عربي / EN",            desc: "Interface complète en 3 langues avec support RTL" },
  { icon: Lock,         title: "Données protégées · RGPD",  desc: "Vos données restent sur votre appareil, chiffrées" },
]

const testimonials = [
  { name: "Samira B.", location: "Alger", text: "Enfin une app qui comprend nos plats ! Le couscous, le tajine... tout y est.", rating: 5 },
  { name: "Pierre M.", location: "Lyon",  text: "La saisie vocale est incroyable. Je dis juste ce que je mange.", rating: 5 },
  { name: "Fatima Z.", location: "Paris", text: "Je gère mon diabète bien plus facilement avec le suivi glycémique.", rating: 5 },
]

type Tab = "user" | "pro"

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [tab, setTab] = useState<Tab>("user")
  const [proEmail, setProEmail] = useState("")

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Nav ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          {/* Logo — "N" + NutriVita, no emoji */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground text-[15px] font-bold"
              style={{ backgroundColor: "var(--primary)" }}
            >
              N
            </div>
            <span className="text-[16px] font-semibold text-foreground">NutriVita</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab toggle: Utilisateur / Praticien */}
            <div className="hidden sm:flex rounded-full border border-border overflow-hidden">
              {(["user", "pro"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                    tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {t === "user" ? "Utilisateur" : "Praticien"}
                </button>
              ))}
            </div>
            <Button size="sm" className="rounded-xl h-9 gap-1.5 text-[13px]" onClick={onGetStarted}>
              Commencer <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ─── User tab content ──────────────────────────────── */}
      {tab === "user" && (
        <>
          {/* Hero — flat, 2-column on desktop */}
          <section className="max-w-4xl mx-auto px-5 pt-16 pb-12">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <motion.div
                className="flex-1 text-center md:text-left"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h1 className="text-[32px] md:text-[42px] font-semibold text-foreground leading-tight mb-4">
                  Comprenez ce que vous mangez,<br className="hidden md:block" /> en une photo
                </h1>
                <p className="text-[16px] text-muted-foreground mb-6">
                  Photo, voix, calories, poids, glycémie et courses — en FR, عربي et EN
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <Button size="lg" className="h-12 rounded-2xl gap-2 px-6 text-[15px]" onClick={onGetStarted}>
                    Commencer gratuitement <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-4 text-[12px] text-muted-foreground">
                  Données protégées · RGPD &nbsp;|&nbsp; Protected data · GDPR &nbsp;|&nbsp; {"بيانات محمية · RGPD"}
                </p>
              </motion.div>

              {/* Phone mock — decorative only, aria-hidden */}
              <motion.div
                className="shrink-0 w-52 h-[420px] rounded-[36px] bg-card border-2 border-border overflow-hidden flex flex-col"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                aria-hidden="true"
              >
                {/* Status bar */}
                <div className="flex items-center justify-between px-5 pt-3 pb-0.5">
                  <span className="text-[8px] font-semibold text-foreground">9:41</span>
                  <div className="flex items-center gap-0.5">
                    <div className="w-4 h-1.5 rounded-sm border border-foreground/40 p-px">
                      <div className="h-full w-3/4 rounded-sm bg-foreground/40" />
                    </div>
                  </div>
                </div>
                {/* Header */}
                <div className="px-4 pt-0.5 pb-1">
                  <p className="text-[11px] font-semibold text-foreground">Bonjour Ahmed</p>
                </div>
                {/* Calorie ring */}
                <div className="flex justify-center py-1">
                  <CalorieRing consumed={1420} target={2100} burned={350} size={120} />
                </div>
                {/* Macro bars */}
                <div className="grid grid-cols-3 gap-1.5 px-3 mt-1">
                  {[
                    { label: "Glucides",  value: 180, target: 236, color: "var(--amber)" },
                    { label: "Protéines", value: 65,  target: 158, color: "var(--glucose)" },
                    { label: "Lipides",   value: 38,  target: 58,  color: "var(--lipids)" },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl border border-border bg-background p-1.5 flex flex-col items-center gap-0.5">
                      <span className="text-[11px] font-bold text-foreground">{m.value}g</span>
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
                {/* Glucose card */}
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
                {/* Mini bottom nav */}
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

          {/* Features — 4-icon row */}
          <section className="border-t border-border bg-muted/30 py-12 px-5">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-[22px] font-semibold text-foreground text-center mb-8">Fonctionnalités</h2>
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
                      <p className="text-[14px] font-semibold text-foreground leading-tight mb-1">{feat.title}</p>
                      <p className="text-[12px] text-muted-foreground leading-snug">{feat.desc}</p>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-12 px-5">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-[22px] font-semibold text-foreground text-center mb-8">Ce qu&apos;ils en disent</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {testimonials.map((t, i) => (
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
                          className={`h-3.5 w-3.5 ${j < t.rating ? "fill-current" : ""}`}
                          style={{ color: j < t.rating ? "var(--amber)" : "var(--muted-foreground)" }}
                        />
                      ))}
                    </div>
                    <p className="text-[13px] text-foreground mb-3">&ldquo;{t.text}&rdquo;</p>
                    <p className="text-[12px] text-muted-foreground">
                      <span className="font-medium text-foreground">{t.name}</span>, {t.location}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA — flat teal, no gradient */}
          <section className="py-12 px-5" style={{ backgroundColor: "var(--primary)" }}>
            <div className="max-w-xl mx-auto text-center text-primary-foreground">
              <h2 className="text-[24px] font-semibold mb-3">
                Prêt à transformer votre alimentation ?
              </h2>
              <p className="text-primary-foreground/80 mb-6 text-[14px]">
                Rejoignez des milliers d&apos;utilisateurs déjà inscrits
              </p>
              <Button
                size="lg"
                onClick={onGetStarted}
                className="bg-background text-foreground hover:bg-background/90 h-12 px-8 rounded-2xl text-[15px]"
              >
                Créer mon compte gratuit <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </section>
        </>
      )}

      {/* ─── Pro tab content ───────────────────────────────── */}
      {tab === "pro" && (
        <section className="max-w-xl mx-auto px-5 pt-16 pb-12 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: "var(--badge-positive-bg)" }}
          >
            <span className="text-[28px] font-bold" style={{ color: "var(--primary)" }}>N</span>
          </div>
          <h2 className="text-[24px] font-semibold text-foreground mb-3">Espace professionnel</h2>
          <p className="text-[14px] text-muted-foreground mb-6">
            Bientôt disponible — réservé aux praticiens partenaires (diététiciens, endocrinologues)
          </p>
          <div className="flex flex-col gap-3 max-w-sm mx-auto">
            <input
              type="email"
              placeholder="votre@email.fr"
              value={proEmail}
              onChange={(e) => setProEmail(e.target.value)}
              className="h-12 rounded-xl border border-border bg-card px-4 text-[14px] text-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button className="h-12 rounded-xl" disabled={!proEmail.includes("@")}>
              Être prévenu du lancement
            </Button>
          </div>
          <p className="mt-4 text-[11px] text-muted-foreground">
            Données protégées · RGPD &nbsp;|&nbsp; Protected data · GDPR &nbsp;|&nbsp; {"بيانات محمية · RGPD"}
          </p>
        </section>
      )}

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-border py-8 px-5">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-primary-foreground text-[11px] font-bold"
              style={{ backgroundColor: "var(--primary)" }}
            >
              N
            </div>
            <span className="font-semibold text-foreground">NutriVita</span>
          </div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-foreground transition-colors">Politique de confidentialité</a>
            <a href="#" className="hover:text-foreground transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
          <p>© 2026 NutriVita</p>
        </div>
      </footer>
    </div>
  )
}
