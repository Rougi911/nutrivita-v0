# Gates — NutriVita Cycle en V

| Date | Gate | Verdict | Écarts résiduels acceptés |
|------|------|---------|--------------------------|
| 2026-06-12 | Gate SL-UI (entrée) | DOUBLE GO CONDITIONNEL — voir détail ci-dessous | 4 écarts différés (arbitrage Ahmed) |

---

## Gate SL-UI — 2026-06-12 — Entrée de phase Implémentation

### Agents invoqués
- **critique-spec** sur sections 1–10 de refonte-design-nutrivita.txt
- **réglementaire** sur sections 1–10 de refonte-design-nutrivita.txt

---

### Corrections appliquées (bloquants résolus avant implémentation)

**C1 — REG-05 / critique-spec #1 — Alerte hypo (Section 5c)**
Correction : la carte alerte hypo affiche "X épisode(s) de glycémie inférieure à 54 mg/dL détecté(s) sur la période" (affichage neutre de tendance). Un disclaimer permanent non masquable est ajouté en haut de l'écran Glycémie dans les 3 langues via une clé i18n dédiée (`disclaimer_glucose`) : "Indicateur de tendance — ne remplace pas un avis médical" (FR), "مؤشر اتجاه — لا يغني عن استشارة طبية" (AR), "Trend indicator — does not replace medical advice" (EN). Ce disclaimer apparaît toujours, pas seulement en cas d'alerte.

**C2 — REG-05 / critique-spec #2 — Badges ambre seuils glycémiques (Section 5b)**
Non-correction : l'écart était basé sur une lecture partielle. La Section 8c spécifie déjà explicitement que les cibles glycémiques sont stockées dans `user.glucoseTarget` et "utilisées par l'écran glycémie à la place des constantes en dur". Les badges ambre s'appuient sur l'objectif personnel déclaré, pas sur des seuils cliniques fixes — la spec est auto-cohérente sur ce point. Aucune correction nécessaire.

**C3 — AL-05 / critique-spec #3 — Résumé glycémie Stats (Section 6, item 4)**
Correction : la mini-courbe 7 points dans les Stats doit afficher "N mesures" et non un "% dans la cible" si N < 12 (application de la garde statistique AL-05). Badge "% dans la cible" uniquement si N ≥ 12 ; sinon badge gris "Données insuffisantes (N mesures)".

**C4 — critique-spec #4 — Nommage fonctions glucose-units.ts**
Correction : adopter définitivement `toGlucoseUnit(valueMgDl, unit)` et `fromGlucoseUnit(value, unit)` dans tout le code et les TU (Section 11, TU-01). Le document cadre cite `toGlucose` (forme courte) — la forme longue de refonte-design est retenue comme nom canonique.

**C5 — REG-04 — Disclaimers dans les 3 langues**
Correction : tous les disclaimers REG-04 (carences, composition corporelle, glycémie) sont traités comme des clés i18n protégées dans app-context.tsx, avec traduction obligatoire FR/AR/EN vérifiée par l'agent réglementaire au gate de fin de session (Section 12c).

---

### Écarts résiduels — Décisions Ahmed (2026-06-12)

| # | Écart | Décision |
|---|-------|---------|
| D1 | REG-01 consentement RGPD (onboarding) | **Accepté** — hors scope session UI. Traité dans prompt onboarding/backend phase 2. |
| D2 | Loi 18-07 ANPDP Algérie | **Accepté** — analyse juridique avant lancement DZ phase 3. Inscrit au backlog réglementaire. |
| D3 | "Conforme RGPD" sur landing page | **Corrigé** — remplacer par "Données protégées · RGPD" (moins affirmatif avant AIPD). |
| D4 | Critères perf EB-01/02 photo/voix | **Accepté** — spécifiés dans annexe SL-API session backend avec seuils AL-10 (confidence ≥ 0.6). |

---

### Verdict final

**GO** — Implémentation UI démarrée le 2026-06-12.
Conditions : corrections C1–C5 appliquées pendant l'implémentation · D3 appliqué en Section 10 · gate de fin de session (Section 12) obligatoire avant commit.

---

## Gate SL-UI — 2026-06-12 — Fin de session implémentation

### Sections livrées
- **Section 1** : Design system — globals.css (OKLCH), gradient-header (flat), calorie-ring (solid teal), meal-section-card (no emoji)
- **Section 2** : Navigation — BottomNavigation 5 onglets (Home/Journal/+/Stats/Courses), NutriVitaApp routing avec vues empilées Glucose/Settings
- **Section 3** : HomeScreen — date, salutation, CalorieRing, 3 barres macros, grille 2 cartes (Glucose+Activité), repas du jour, hydratation
- **Section 4** : AddSheet (bouton +), AddConfirm (confirmation détection IA)
- **Section 5** : GlucoseScreen — unité g/L par défaut, conversions glucose-units.ts, guard AL-05, alerte hypo neutre (REG-05), état vide, axe Y [40,350], disclaimer REG-04 permanent
- **Section 6** : StatsScreen — 4 segments (pas d'onglet Evolution), données stables mock-data.ts, composition corporelle + disclaimer Forbes, calories bar chart, résumé glycémie avec guard N<12, carences + disclaimer REG-04
- **Section 7** : GroceriesScreen — bilan mensuel (barres OMS), alerte additifs, liste produits triée NutriScore
- **Section 8** : SettingsScreen — avatar initiales (flat), glucose 3 options (g/L défaut), groupe Santé (glucoseTarget + isDiabetic), adjustMacros() AL-11, useTheme(), clearX() branchés
- **Section 9** : types.ts (GlucoseUnit "g/L", glucoseTarget, isDiabetic, ScannedProduct), mock-data.ts (stables, 0 Math.random()), app-context.tsx (g/L défaut, activeTab="home", scannedProducts, clearX)
- **Section 10** : OnboardingFlow (flat/teal, step "isDiabetic"), LandingPage (flat nav, hero 2 colonnes, features icônes, onglet Praticien, "Données protégées · RGPD")
- **Section 11** : vitest.config.ts, TU-01 (27 tests), TU-02 (14 tests), TU-05 (8 tests), TU-07 (7 tests) — **56 tests, 4/4 suites vertes**

### Vérifications gate
- `npm run test` → 56/56 vert
- REG-04 : disclaimers glycémie, Forbes, carences présents dans les 3 langues (FR/AR/EN) dans translations + composants
- REG-05 : aucune recommandation thérapeutique — alerte hypo = "X épisode(s) détecté(s) sur la période" (neutre)
- AL-04 : stockage interne mg/dL partout, conversion uniquement à l'affichage via toGlucoseUnit/fromGlucoseUnit
- AL-05 : guard N<12 dans computeGlucoseMetrics + composants glucose-screen et stats-screen
- AL-03 : cappedBurned = Math.min(burned, 1000) dans calorie-ring.tsx
- AL-11 : adjustMacros() avec min 10%, somme=100 dans settings-screen.tsx + test TU-07
- D3 : "Données protégées · RGPD" sur landing-page.tsx (pas "Conforme RGPD")
- 0 émoji dans composants — lucide-react uniquement
- 0 gradient CSS — couleurs solides

### Verdict
**GO** — Session UI terminée. Prêt pour revue-code et commit.
