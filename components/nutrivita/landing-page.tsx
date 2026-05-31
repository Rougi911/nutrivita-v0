"use client"

import { motion } from "framer-motion"
import { Star, ChevronRight, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LandingPageProps {
  onGetStarted: () => void
}

const features = [
  {
    icon: "🍽️",
    title: "Journal alimentaire intelligent",
    description: "Suivez vos repas avec saisie vocale et reconnaissance photo",
  },
  {
    icon: "🩸",
    title: "Suivi glycémique (diabète)",
    description: "Import CGM, analyse GMI/TIR, alertes personnalisées",
  },
  {
    icon: "🎤",
    title: "Saisie vocale multilingue",
    description: "Parlez en français, arabe ou anglais",
  },
  {
    icon: "⚖️",
    title: "Composition corporelle",
    description: "Modèle Forbes pour estimer masse grasse et musculaire",
  },
  {
    icon: "🌍",
    title: "FR / عربي / EN",
    description: "Interface complète en 3 langues avec support RTL",
  },
  {
    icon: "🔒",
    title: "100% privé, RGPD",
    description: "Vos données restent sur votre appareil",
  },
]

const testimonials = [
  {
    name: "Samira B.",
    location: "Alger",
    text: "Enfin une app qui comprend nos plats traditionnels ! Le couscous, le tajine... tout y est.",
    rating: 5,
  },
  {
    name: "Pierre M.",
    location: "Lyon",
    text: "La saisie vocale est incroyable. Je dis juste ce que je mange et c'est enregistré.",
    rating: 5,
  },
  {
    name: "Fatima Z.",
    location: "Paris",
    text: "Je gère mon diabète bien plus facilement avec le suivi glycémique intégré.",
    rating: 5,
  },
]

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-primary/30" />
        
        {/* Floating food illustrations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {["🥗", "🍎", "🥑", "🍳", "🥕", "🍇"].map((emoji, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl opacity-20"
              style={{
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            >
              {emoji}
            </motion.div>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col">
          {/* Header */}
          <header className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Leaf className="h-8 w-8 text-emerald-400" />
              <span className="text-xl font-bold">NutriVita</span>
            </div>
            <Button
              variant="ghost"
              onClick={onGetStarted}
              className="text-white hover:bg-white/10"
            >
              Connexion
            </Button>
          </header>

          {/* Hero content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center text-white">
            <motion.h1
              className="text-4xl md:text-6xl font-bold mb-4 text-balance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Mangez mieux.
              <br />
              Vivez mieux.
            </motion.h1>
            <motion.p
              className="text-xl text-white/80 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              L&apos;app nutrition conçue pour la France et l&apos;Algérie
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                size="lg"
                onClick={onGetStarted}
                className="w-full gradient-hero text-white text-lg h-14 rounded-2xl"
              >
                Commencer gratuitement
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 h-14 rounded-2xl border-white/30 text-white hover:bg-white/10"
              >
                Voir la démo
              </Button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              className="mt-8 flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 text-amber-400 fill-amber-400"
                  />
                ))}
              </div>
              <span className="text-white/80">4.8/5 • 10,000+ utilisateurs</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-4">
            Fonctionnalités
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Tout ce dont vous avez besoin pour atteindre vos objectifs
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="p-6 rounded-2xl bg-card border border-border"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <span className="text-4xl mb-4 block">{feature.icon}</span>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="py-20 px-6 bg-muted/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Découvrez l&apos;interface
          </h2>

          <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
            {["Journal", "Repas", "Bilan", "Glycémie", "Réglages"].map(
              (screen, i) => (
                <motion.div
                  key={screen}
                  className="flex-shrink-0 w-64 h-[500px] rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-border flex items-center justify-center snap-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <span className="text-muted-foreground">{screen}</span>
                </motion.div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Ce qu&apos;ils en disent
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="p-6 rounded-2xl bg-card border border-border"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex mb-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i <= testimonial.rating
                          ? "text-amber-400 fill-amber-400"
                          : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-foreground mb-4">"{testimonial.text}"</p>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {testimonial.name}
                  </span>
                  , {testimonial.location}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 gradient-hero">
        <div className="max-w-2xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à transformer votre alimentation ?
          </h2>
          <p className="text-white/80 mb-8">
            Rejoignez des milliers d&apos;utilisateurs qui ont déjà changé leur vie
          </p>
          <Button
            size="lg"
            onClick={onGetStarted}
            className="bg-white text-primary hover:bg-white/90 text-lg h-14 px-8 rounded-2xl"
          >
            Créer mon compte gratuit
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-primary" />
              <span className="font-bold">NutriVita</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">
                Politique de confidentialité
              </a>
              <a href="#" className="hover:text-foreground">
                Mentions légales
              </a>
              <a href="#" className="hover:text-foreground">
                Contact
              </a>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2026 NutriVita. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
