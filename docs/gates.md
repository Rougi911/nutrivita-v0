# Gates — NutriVita Cycle en V

| Date | Gate | Verdict | Écarts résiduels acceptés |
|------|------|---------|--------------------------|
| 2026-06-12 | Gate SL-UI (entrée) | DOUBLE GO CONDITIONNEL — voir détail ci-dessous | 4 écarts différés (arbitrage Ahmed) |
| 12/06/2026 | SL-UI | GO | tsc --noEmit 0 erreur, 56 TU verts, commit efb0b3f | D1 RGPD onboarding, D2 loi 18-07, D4 perf IA/voix — différés phase 2/3 |
| 12/06/2026 | P4 connexion backend | GO | tsc 0 erreur, 81/81 tests verts, REG-03 corrigé (GET→POST), SL-UI emojis/gradient nettoyés, SL-03 \uXXXX | M-02..M-08 différés P5 |
| 13/06/2026 | P4.5 alignement backend POST /query | GO | 4 POST /query ajoutés (journal, glucose, weight, activities), alias /api/activities, 93/93 TU verts, REG-03 précisé (dates ≠ données santé) | — |
| 13/06/2026 | P4.6 corrections UX (double /api, onboarding, design) | GO | build 0 erreur, 81/81 tests, B1-B4 revue-code résolus, KO-1/KO-2 réglementaire résolus | M-R1, M-T1, M-U1 différés P5 |
| 13/06/2026 | P4.7 chaîne auth complète + objectifs + divers | GO | tsc 0 erreur, 102/102 tests, B1-B4+M-01..M-05+KO REG-04 résolus | M-03 (i18n onboarding/landing all-FR) différé P5 — dette pré-existante ; SL-03 Arabic chars in types.ts différé P5 |

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

---

## Gate P4 — 2026-06-12 — Connexion backend réel + TI

### Agents invoqués
- **revue-code** sur le diff complet P4 (lib/api.ts, app-context.tsx, 4 composants modifiés, 6 suites de tests)
- **réglementaire** sur lib/api.ts, stats-screen.tsx, groceries-screen.tsx, interpret-confirm.tsx

---

### Corrections appliquées (bloquants résolus avant commit)

**C1 — REG-03 (KO réglementaire) — GET santé → POST body**
Les endpoints `getJournal`, `getWeightHistory`, `getGlucoseReadings`, `getActivities` transmettaient des paramètres (date, days) en query string visible dans les logs d'accès Render (infrastructure tierce non HDS). Correction : passage à des endpoints POST dédiés (`/api/journal/query`, `/api/weight/query`, `/api/glucose/query`, `/api/activities/query`) avec les paramètres dans le body JSON chiffré (HTTPS). Contrat `docs/sl-api.md` mis à jour.

**C2 — B-01 (revue-code) — Gradient CSS `gradient-hero` (SL-UI)**
`journal-screen.tsx` ligne 783 : classe `gradient-hero` remplacée par `bg-primary text-primary-foreground`.

**C3 — B-02 (revue-code) — Emoji 👋 (SL-UI)**
Emoji 👋 retiré du composant de salutation (`journal-screen.tsx` ligne 157).

**C4 — B-03/04/05 (revue-code) — Emojis activités et macros (SL-UI)**
`MacroPillCard` refactoré pour accepter `LucideIcon` au lieu de `string`. Emojis 🍚/🥩/🥑 remplacés par `Wheat/Dumbbell/Droplets`. `ACTIVITY_META` et `ACTIVITY_TYPES` migrés vers lucide-react (`Activity/Bike/PersonStanding/Waves/Dumbbell/Zap`). Sources mockées `📚/🇫🇷` remplacées par `"CIQUAL"/"NutriVita"`.

**C5 — B-06 (revue-code) — Chaînes arabes directes nouvelles clés P4 (SL-03)**
7 nouvelles clés i18n arabes ajoutées en P4 (`detectedAt`, `serverWaking`, `offlineBanner`, `loadingData`, `retryLoad`, `errorLoading`, `scanProduct`) converties en échappements `\uXXXX` dans `lib/types.ts`.

---

### Tests MSW mis à jour (suite REG-03)
Les handlers MSW dans `api.test.ts`, `ti-04.test.ts`, `ti-05.test.ts` mis à jour pour utiliser `http.post` sur les nouveaux endpoints `/query`.

---

### Vérifications gate
- `npm run build` ✅ (Turbopack, 0 erreur)
- `npx tsc --noEmit` ✅ (0 erreur TypeScript)
- `npm run test` ✅ 81/81 tests verts (10 suites, worktrees exclus)
- REG-04 : disclaimers glycémie, carences, Forbes permanents confirmés hors bloc isLoading
- REG-05 : formulations neutres confirmées (détection = indicateur, pas diagnostic)
- REG-03 : corrigé — 4 endpoints GET → POST /query, aucune donnée santé en query string
- AL-04 : stockage mg/dL confirmé, conversion uniquement à l'affichage
- AL-10 : confidence < 0.6 → needs_confirmation, testé TI-01/TI-02
- AL-02/AL-03 : Strava calories priment, plafond 1000 kcal/jour, testés TI-04
- SL-UI : 0 gradient, 0 emoji dans les composants, lucide-react uniquement
- SL-03 : 7 nouvelles clés arabes P4 converties en \uXXXX

### Écarts MAJEURS documentés (dette technique P5)
| # | Écart | Décision |
|---|-------|---------|
| M-02 | Mutations locales non synchronisées API (addMealEntry, etc.) | Accepté — branché en P5 (session backend) |
| M-03/04/05 | Quelques chaînes non i18n dans stats/home/journal | Accepté — P5 |
| M-06 | Totaux API groceries ignorés, recalculés localement | Accepté — P5 |
| M-07 | Badge "estimé" manquant pour aliments fallback | Accepté — P5 |
| M-08 | role="alert" manquant sur OfflineBanner | Accepté — P5 |
| M-01 | Math.random() dans animation VoiceInput | Accepté — pré-existant SL-UI |

### Verdict
**GO** — Session P4 terminée. Commit "frontend : connexion backend réel + tests d'intégration (cycle V)".

---

## Gate P4.5 — 2026-06-13 — Alignement backend POST /query

### Contexte
Le frontend (P4) appelle POST /api/journal/query, POST /api/glucose/query, POST /api/weight/query, POST /api/activities/query. Le backend ne disposait pas de ces routes — alignement effectué en P4.5.

### Constat REG-03 (affinement)
Les paramètres `date`, `days`, `from`, `to` sont des paramètres **temporels** (plage d'historique), pas des valeurs de santé. REG-03 ne les vise pas strictement. Le choix POST /body (fait en P4 côté frontend) est conservé pour cohérence avec le contrat déployé, mais ne constitue pas une correction réglementaire obligatoire. La règle REG-03 a été précisée dans `.claude/agents/reglementaire.md`.

### Changements appliqués

**C1 — routes/journal.js**
Extraction de `queryJournalByDate(db, userId, date, lang)`. Ajout `POST /query` lisant `date` dans `req.body`. Export `module.exports.queryJournalByDate`.

**C2 — routes/glucose.js**
Extraction de `queryGlucoseRange(db, userId, from, to)`. Ajout `POST /query` convertissant `{ days }` → from/to ISO. Export `module.exports.queryGlucoseRange`.

**C3 — routes/weight.js**
Extraction de `queryWeightRange(db, userId, from, to)`. Ajout `POST /query` convertissant `{ days }` → from/to date-only. Export `module.exports.queryWeightRange`.

**C4 — routes/activity.js**
Ajout de `queryActivitiesByDate(db, userId, date)` (nouvelle fonction — liste plate d'activités par date, sans la logique riche du GET /bilan/:date). Ajout `POST /query`. Export `module.exports.queryActivitiesByDate`.

**C5 — server.js**
Ajout `app.use('/api/activities', activityRoutes)` — alias pluriel, contrat frontend.

**C6 — backend/package.json + tests/p4.test.js**
Jest installé (devDependency). Script `"test": "jest --testPathPatterns=tests/"`. Fichier `tests/p4.test.js` : 14 tests couvrant les 4 fonctions partagées + calcul date from/to.

**C7 — .claude/agents/reglementaire.md**
Précision REG-03 : paramètres temporels (date, days) ≠ données de santé → GET ?date= ne déclenche pas REG-03.

### Vérifications gate
- `npm test` → 93/93 verts (5 suites : glucoseMetrics, activityCap, p2, p3, p4)
- GET / conservé sur toutes les routes (backward compatible)
- POST /query ajouté sur les 4 routes (contrat frontend P4)
- /api/activities (pluriel) monté en alias de /api/activity
- Aucune donnée de santé exposée en query string (valeurs glycémiques, poids — jamais en URL)
- REG-03 précisé dans l'agent réglementaire

### Verdict
**GO** — Session P4.5 terminée. Commit "backend : POST /query routes + alias /api/activities + tests p4 (cycle V)".

---

## Gate P4.6 — 2026-06-13 — Correction écran blanc (double /api) + retours de test

### Contexte
Phase de correction UX suite aux premiers tests manuels sur l'app déployée (Vercel + Render).

### Agents invoqués
- **revue-code** sur le diff P4.6 (10 fichiers modifiés)
- **réglementaire** sur landing-page.tsx, onboarding-flow.tsx, settings-screen.tsx

### Changements appliqués

**C1 — lib/api.ts — Double préfixe /api (CRITIQUE)**
`API_BASE` normalisé avec `.replace(/\/api\/?$/, "")` — correction du double préfixe causant un écran blanc lorsque `NEXT_PUBLIC_API_URL=https://nutridz.onrender.com/api`.

**C2 — app/globals.css — Design system complet (SL-UI)**
`--primary` → teal `#1D9E75`, ajout `--glucose: #534AB7`, `--lipids: #D4537E`, `--amber: #BA7517`, `--risk: #A32D2D`, `--badge-positive-bg: #E1F5EE`. Déclinaison dark mode.

**C3 — lib/types.ts — goal → goals[]**
`goal: string` remplacé par `goals: string[]` (multi-select d'objectifs).

**C4 — lib/app-context.tsx — Mode offline vide**
Fallback offline = tableaux vides (pas de mock data confondant). Suppression imports mock inutilisés.

**C5 — onboarding-flow.tsx — Multi-select + consentement RGPD**
Step 3 : sélection multiple des objectifs (chips avec checkmark). "Gérer le diabète" coché → `isDiabetic=true` automatiquement, step 4 skippée. Step 4 : OUI/NON avec état visuel sélectionné, `isDiabeticStep4` state dédié. `handleComplete` utilise `hasDiabetes || isDiabeticStep4 === true`. Ajout `ConsentCheckbox` (RGPD Art. 9) en step 1 — bouton Commencer désactivé sans consentement.

**C6 — settings-screen.tsx — goals[]**
`goalLabels[user.goal]` → `user.goals.map(g => goalLabels[g] ?? g).join(" · ")`.

**C7 — calorie-ring.tsx — Fix débordement SVG**
Suppression div `absolute -bottom-1` (overflow hors conteneur). Texte ratio intégré dans div central, tailles de police proportionnelles à `size`, ratio masqué si `size < 160`.

**C8 — macro-pill-card.tsx — Prop couleur + font-semibold**
Ajout `color?: string` pour icône et barre. `font-bold` → `font-semibold` (règle 2 font-weights max). Suppression `shadow-sm`.

**C9 — journal-screen.tsx — Couleurs macros + actions rondes + Math.random**
MacroPillCard : Glucides=`var(--amber)`, Protéines=`var(--glucose)`, Lipides=`var(--lipids)`. Quick actions → 5 boutons ronds (icon + label). `Math.random()` remplacé par constante `FOOD_WAVE_HEIGHTS` (hydration-safe).

**C10 — landing-page.tsx — Phone mockup + disclaimer trilingue**
Placeholder `"Aperçu de l'app"` remplacé par mockup JSX (CalorieRing 120px, barres macro colorées, carte glycémie, mini nav 5 icônes). `aria-hidden="true"` sur le frame téléphone (contenu décoratif). Disclaimer RGPD trilingue FR + EN + AR sur hero et tab Praticien (REG-04).

**C11 — meals-screen.tsx + food-search-sheet.tsx — Gradient supprimé (SL-UI)**
`gradient-hero` retiré des boutons "Créer plat" et "Ajouter au repas" → classe native `Button` (primary/teal).

### Vérifications gate
- `npm run build` ✅ (Turbopack, 0 erreur TypeScript, EXIT 0)
- `npm run test` ✅ 81/81 tests verts (10 suites, aucune régression)
- REG-03 ✅ aucune valeur de santé en query string
- REG-04 ✅ disclaimer trilingue FR/EN/AR sur landing (texte inline + icône Lock dans features)
- REG-05 ✅ aucune formulation diagnostique
- REG-06 ✅ ConsentCheckbox RGPD Art. 9 ajouté step 1 onboarding (bloque Commencer sans consentement)
- SL-UI ✅ 0 gradient, 0 emoji, lucide-react, teal primary, couleurs sémantiques
- AL-03 ✅ cappedBurned Math.min(burned, 1000) préservé

### Écarts MAJEURS documentés (dette technique P5)
| # | Écart | Décision |
|---|-------|---------|
| M-R1 | REG-01 : pas de disclaimer santé sur écran Journal | Accepté — pré-existant gate SL-UI D1, non aggravé par P4.6 |
| M-T1 | Chaînes onboarding non i18n (FR dur codé) | Accepté P5 — clés FR/AR/EN à ajouter |
| M-U1 | `text-emerald` utilisé pour positif dans modales activité | Accepté P5 — harmoniser avec `var(--primary)` |

### Verdict
**GO** — Session P4.6 terminée. Build 0 erreur · 81/81 tests · BLOQUANTS revue-code et réglementaire résolus.

| Date | Gate | Verdict | Écarts résiduels |
|------|------|---------|------------------|
| 2026-06-13 | P4.6 | GO | M-R1 (Journal disclaimer), M-T1 (i18n onboarding), M-U1 (emerald→primary) — différés P5 |
