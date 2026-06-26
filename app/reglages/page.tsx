import { NutriVitaApp } from "@/components/nutrivita/nutrivita-app";

// S16 — cible de redirection du callback OAuth Strava (`/reglages?strava=ok|error`).
// Rend la même SPA ; `nutrivita-app` ouvre l'écran Réglages et déclenche le sync au retour.
export default function Reglages() {
  return <NutriVitaApp />;
}
