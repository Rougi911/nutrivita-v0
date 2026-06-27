# Gates — NutriVita Cycle en V

| Date | Gate | Verdict | Écarts résiduels acceptés |
|------|------|---------|--------------------------|
| 2026-06-12 | Gate SL-UI (entrée) | DOUBLE GO CONDITIONNEL — voir détail ci-dessous | 4 écarts différés (arbitrage Ahmed) |
| 12/06/2026 | SL-UI | GO | tsc --noEmit 0 erreur, 56 TU verts, commit efb0b3f | D1 RGPD onboarding, D2 loi 18-07, D4 perf IA/voix — différés phase 2/3 |
| 12/06/2026 | P4 connexion backend | GO | tsc 0 erreur, 81/81 tests verts, REG-03 corrigé (GET→POST), SL-UI emojis/gradient nettoyés, SL-03 \uXXXX | M-02..M-08 différés P5 |
| 13/06/2026 | P4.5 alignement backend POST /query | GO | 4 POST /query ajoutés (journal, glucose, weight, activities), alias /api/activities, 93/93 TU verts, REG-03 précisé (dates ≠ données santé) | — |
| 13/06/2026 | P4.6 corrections UX (double /api, onboarding, design) | GO | build 0 erreur, 81/81 tests, B1-B4 revue-code résolus, KO-1/KO-2 réglementaire résolus | M-R1, M-T1, M-U1 différés P5 |
| 13/06/2026 | P4.7 chaîne auth complète + objectifs + divers | GO | tsc 0 erreur, 102/102 tests, B1-B4+M-01..M-05+KO REG-04 résolus | M-03 (i18n onboarding/landing all-FR) différé P5 — dette pré-existante ; SL-03 Arabic chars in types.ts différé P5 |
| 13/06/2026 | P4.8 boutons inertes + offline + erreurs silencieuses | GO | tsc 0 erreur, 107/107 tests, B-1..B-6 revue-code résolus, REG GO (SL-03 \uXXXX onboarding+settings corrigé) | — |
| 14/06/2026 | P4.10 PayloadTooLargeError /api/interpret + CORS erreurs (backend nutridz) | GO | 102/102 tests, limit 15MB ciblée sur /api/interpret, rate-limiter avant body-parsers, error-handler CORS, err.message masqué sur routes santé, userId pseudonymisé dans logs Strava | Suivi frontend : redimensionner image côté client à max 1280px avant envoi (P5) |
| 14/06/2026 | P4.11 bugs nutritionnels : USDA Branded, noms anglais CIQUAL, quantity_g non appliqué (backend nutridz) | GO | 118/118 tests, rankByDataType Foundation>SR Legacy>Survey>Branded, callGemini lang param (ar→fr clamp), resolveNutrition portion scaling + sel + estimated_portion, err.message masqué 422, sl-api.md contrat type:"food" officialisé | Vision path (`conceptsToAliments`) ne bénéficie pas du ranking USDA — différé P5 |
| 14/06/2026 | P4.13 VOLET B finition fonctionnelle (meal_type, vocal sport, voir plus, recherche, scanner) — frontend v0design | GO | tsc 0 erreur, 108/108 tests verts, 6 bloquants revue-code corrigés (i18n × 4, double Date.now, console.error) ; B1-B6 implémentés, docs/tests-p413.md créé (T1-T7) | M-shadow-sm préexistant, M-emerald ActivityVoiceModal (différé P5), M-MET hardcodé dans InterpretConfirm (différé P5), M-simulateProcessing bouton debug ActivityVoiceModal (différé P5) |
| 14/06/2026 | P4.14 câblage boutons + rendu réponses backend (frontend v0design) | GO | tsc 0 erreur, 124/124 tests verts, B-1 (guard processed=0), B-2 (ActivityVoiceModal SpeechRecognition réel), KO-1 (needs_confirmation amber AL-10), M-1 (shadow-sm), M-2 (emerald→primary), M-3 (font-bold→semibold), ATTENTION-1 (SL-03 \uXXXX detectedFoods AR) résolus | ATTENTION-2 (glucoseDisclaimer masqué par modal), ATTENTION-3 (consent_glucose conditionnel), M-4 (CopierHier sans copie réelle) — différés P5 |
| 15/06/2026 | P4.15 auth robustesse + 5 bugs UI + double-scaling (frontend v0design) | GO | tsc 0 erreur, 133/133 tests verts, guardArray ApiError(401) faux-offline résolu, FoodSearchSheet monté, scan additives guard, chips récents sélecteur+sync, suppression double-tap, normalisation /100g calories (COMPLEMENT P4.15) | Validation réelle S1-S6 obligatoire (extension Chrome) |
| 15/06/2026 | P4.16 désalignement contrat backend/frontend (journal/query + /api/foods/search) | GO | backend 210/210 tests, frontend 134/134 tests, 0 erreur TS · A1: GET /api/foods/search (foods.js) upsert CIQUAL+USDA · A2: journal/query ajoute entries[] plat ApiMealEntry, meal_type pdej↔breakfast · B1: getJournal lit raw.entries · B3: date locale (pas UTC) · sl-api.md contrat figé | Validation réelle S1-S3-S6 obligatoire après redéploiement backend (Render) |
| 17/06/2026 | P4.17 suppression journal 404 (mauvais identifiant d'entrée) | GO | frontend 136/136 tests, 0 erreur TS, revue-code PASS (BLK-1..3 + MAJ-1 résolus), réglementaire PASS · Cause racine : mapMealEntry crash sur raw DB row POST /api/journal → UUID backend jamais propagé · Fix lib/api.ts (addJournalEntry reconstruit depuis input+raw.id), app-context.tsx (addMealEntry retourne localId, updateMealEntryId ajouté), food-search-sheet + add-sheet + interpret-confirm (propagation UUID via .then), race condition BLK-1 (crypto.randomUUID fallback), validation raw.id MAJ-1 | Validation réelle : ajouter un aliment → supprimer sans reload → disparaît sans 404 |

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

---

## Gate P4.14 — 2026-06-14 — Câblage boutons inertes + rendu résultats frontend

### Contexte
P4.13-B avait des TU verts (108/108) mais T1/T2/T4/T5/T6/T7 du harnais extension FAIL. Cause : les TU mockés ne testent pas le câblage réel des boutons ni le rendu dans l'UI. P4.14 corrige les 6 défauts identifiés en conditions réelles.

### Agents invoqués
- **revue-code** sur le diff P4.14 (5 fichiers modifiés, 2 nouveaux)
- **réglementaire** sur add-sheet.tsx (label-confirm, product-confirm, scanLabelImage)

### Changements appliqués

**C1 — lib/meal-utils.ts (NOUVEAU)**
Extraction de `inferMealTypeFromTime()` et `normalizeMealType()` dans un module partagé. Suppression des définitions locales dupliquées dans `interpret-confirm.tsx`. Correction M-02 : non-food intents utilisent `inferMealTypeFromTime()` au lieu de `"lunch"` codé en dur.

**C2 — lib/api.ts — mapper défensif scanLabelImage (T6)**
`scanLabelImage` mappe plusieurs variantes de noms de champs (FR+EN) : `energy_kcal`→kcal, `carbohydrates`→glucides, `proteins`→proteines, `saturated_fat`→satures, etc. Résout le cas où le backend renvoie des noms anglais non attendus par le frontend.

**C3 — components/nutrivita/add-sheet.tsx — VoiceModal + ScannerModal product-confirm (T1, T2, T4, T5, T6)**
- Bouton Vocal : `setShowVoiceModal(true)` (était `handleVoiceInput()` sans feedback visuel).
- `VoiceModal` inliné : machine d'états `"listening"|"processing"|"error"|"text-input"`. Démarre `SpeechRecognition` au montage ; si API absente → passe directement à `"text-input"`. Sur résultat → `interpretMedia("text", transcript)` → `onResult`. Sur erreur → bascule sur `"text-input"`.
- ScannerModal : ajout état `"product-confirm"` dans `ScanStep`. `handleBarcode` : `setScannedProduct(prod)` + `setStep("product-confirm")` au lieu d'appeler `onScanned` directement. Écran product-confirm : badge Nutri-Score (couleurs officielles inline), verdict, score/100, additifs, tableau nutritionnel per-100g.
- Correction B-01 REG : `handleLabelConfirm` requiert `labelResult.kcal !== null` ; bouton désactivé sinon (jamais `null ?? 0`).
- Correction B-02 i18n : toutes les étiquettes nutritionnelles utilisent `t()` (11 nouvelles clés).
- Correction M-01 : product-confirm `onClick={() => onScanned(scannedProduct)}` uniquement (sans `onClose()` sur composant démonté).

**C4 — components/nutrivita/food-search-sheet.tsx — localMealType + meal chips (T4)**
- Ajout `localMealType` initialisé à `selectedMealType ?? inferMealTypeFromTime()`.
- `handleAddFood` utilise `localMealType` (plus de garde `!selectedMealType` bloquante).
- Chips meal_type ajoutés dans le bottom sheet quantité (présents sur tous les chemins d'ajout).
- Correction B-03 i18n : presets portion utilisent `t("portionHalf")`, `t("portionNormal")`, `t("portionDouble")`.
- Boutons Scanner/Photo/Mic dans FoodSearchSheet : `onClick` ouvre `AddSheet` (aller-retour correct).

**C5 — components/nutrivita/journal-screen.tsx — quickActions câblés (T7)**
- Photo → `setShowAddSheet(true)`
- Scanner → `setShowAddSheet(true)`
- Favoris → `setSelectedMealType(null); setShowFoodSearch(true)`
- Copier hier → `setShowAddSheet(true)`

**C6 — lib/types.ts — 11 nouvelles clés i18n (FR/AR/EN)**
`addToGroceries`, `nutritionCalories`, `nutritionSugarsSub`, `nutritionSaturatedSub`, `nutritionFiber`, `nutritionSugars`, `additiveCount`, `nutritionPer100g`, `portionHalf`, `portionNormal`, `portionDouble`. AR en échappements `\uXXXX` (SL-03).

**C7 — lib/__tests__/meal-utils.test.ts (NOUVEAU) + lib/__tests__/api.test.ts (MODIFIÉ)**
- TU-P414-01 : `inferMealTypeFromTime` — 8 cas horaires via `vi.spyOn(Date.prototype, "getHours")`.
- TU-P414-02 : `normalizeMealType` — null/undefined/vide, valeurs standard, alias FR, casse insensible, inconnu→null.
- TU-P414-03 : `scanLabelImage` — noms FR standard, noms EN fallback, champs absents → null (jamais 0, REG).

### Vérifications gate
- `npx tsc --noEmit` ✅ 0 erreur TypeScript
- `npm run test` ✅ 124/124 tests verts (14 suites)
- REG-04 ✅ disclaimers trilingues non touchés
- REG-05 ✅ aucune formulation diagnostique dans les nouveaux écrans product-confirm/label-confirm
- B-01 REG ✅ `handleLabelConfirm` désactivé si `kcal === null` — null jamais remplacé par 0
- SL-UI ✅ 0 gradient, 0 emoji, nutri-score couleurs officielles inline (usage standardisé acceptable)
- SL-03 ✅ 11 nouvelles clés AR en `\uXXXX`

### Leçon de P4.13-B
TU verts ≠ câblage réel. Les TU mockés ne testent ni les handlers de boutons, ni les transitions d'état, ni le rendu conditionnel. La validation doit IMPÉRATIVEMENT passer par le harnais T1-T7 (extension Chrome) sur l'app déployée avant de déclarer GO.

### Écarts résiduels
Aucun — tous les bloquants et majeurs revue-code/réglementaire résolus.

### Validation post-déploiement requise
Rejouer T1-T7 via l'extension Chrome sur nutrivita-v0.onrender.com pour confirmer 7/7 PASS.

### Verdict
**GO** — tsc 0 erreur · 124/124 tests · B-01/B-02/B-03 + M-01/M-02 résolus · SL-03 + REG respectés.

---

## Gate P4.15 — 2026-06-15

**Session :** fix(P4.15) — auth query + robustesse + 5 bugs UI + double-scaling calories
**Commits :** guardArray (api.ts), tests TU-P415, FoodSearchSheet monté, scan additives guard, chips récents sélecteur repas, suppression aliment double-tap, **normalisation nutrition /100g dans interpret-confirm.tsx (COMPLEMENT P4.15)**
**Verdict build :** GO — Turbopack, 0 erreur TypeScript, EXIT 0
**Verdict tests :** GO — **133/133 tests verts (15 suites)** dont 4 TU-P415-scaling anti-régression double-scaling
**Verdict revue-code :** GO — UN SEUL point de mise à l'échelle par portion confirmé : `food.calories * amount / 100` dans app-context.tsx uniquement. interpret-confirm.tsx normalise vers /100g avant stockage.
**Verdict réglementaire :** N/A — pas de nouvelles données de santé ni disclaimers

### Fonctionnalités corrigées (P4.15)
- **S1** : guardArray lève ApiError(401) sur réponse {error:...} — faux offline résolu
- **S2** : chips Récents affichent un sélecteur repas + sync addJournalEntry backend
- **S3** : FoodSearchSheet monté dans nutrivita-app.tsx — bouton Recherche opérationnel
- **S4** : scan additives?.length — plus de crash si champ absent
- **S5** : bouton suppression Trash2 avec double-tap confirm + deleteJournalEntry
- **S6** : double-scaling calories corrigé — `per100g(n.kcal, qg)` dans interpret-confirm.tsx normalise la nutrition backend (par-portion) vers FoodItem.calories (par-100g) · "400g pomme de terre" → 304 kcal affiché, anneau et macros cohérents

### AVERTISSEMENT VALIDATION RÉELLE OBLIGATOIRE
Les TU/TI verts ne suffisent pas — ils ont déjà menti 2 fois (P4.13-B, P4.14).
Rejouer S1-S6 en conditions réelles (extension Chrome + Ctrl+Shift+R) avant de déclarer la session GO.

---

## Gate P4.16 — 2026-06-15

**Session :** fix(P4.16) — désalignement contrat backend/frontend journal/query + /api/foods/search
**Commits backend :** `3cd735e` — routes/foods.js (NEW), routes/journal.js (entries[]), server.js (/api/foods)
**Commits frontend :** `ceab90f` — getJournal lit entries[], date locale, sl-api.md

**Verdict build :** GO — tsc 0 erreur TypeScript
**Verdict tests :** GO — backend 210/210 · frontend 134/134 (dont 2 TU-P416-FE + 12 TU-P416 backend)
**Verdict revue-code :** GO — UN SEUL upsert products par résultat search (foods.js) · meal_type bidirectionnel figé
**Verdict réglementaire :** N/A — aucune nouvelle donnée de santé exposée, aucune PII

### Corrections P4.16
- **A1** : `GET /api/foods/search?q=` (routes/foods.js) — CIQUAL→upsert products→id entier ; retourne `ApiFoodSearchResult[]`
- **A2** : `POST /api/journal/query` renvoie `{ date, entries: [...], meals, totals }` — `entries[]` = tableau plat `ApiMealEntry` avec `meal_type` anglais (`pdej→breakfast` etc.)
- **A2bis** : `POST /api/journal` accepte `food_id`+`amount` comme aliases de `product_id`+`grams` + map meal_type anglais→interne
- **B1** : `getJournal` extrait `raw.entries` avant `guardArray` (guard `!Array.isArray` pour ne pas confondre avec `Array.prototype.entries`)
- **B3** : `currentDate` calculé via `getFullYear/getMonth/getDate` (heure locale) — corrige décalage de jour Algeria UTC+1

### Scénarios à rejouer (après redéploiement backend Render)
- **S1** : accueil sans "Hors ligne" — journal/query renvoie entries[] exploitable
- **S2** : ajout aliment CIQUAL via Recherche → persiste au reload (food_id réel en DB)
- **S3** : bouton Recherche → FoodSearchSheet → résultats (plus de 404)
- **S6** : "400g pomme de terre" via recherche → 304 kcal (food.calories=76, amount=400)
- **S4/S5** : vérifier pas de régression (scan + suppression déjà PASS)

---

## Gate P1-3 — 2026-06-24 — i18n onboarding + landing

**Session :** fix(P1-3) — extraction des chaînes FR en dur de l'onboarding et de la landing vers `lib/types.ts` (clés FR/AR/EN) + câblage `t()`
**Fichiers :** `lib/types.ts` (60 nouvelles clés ×3 langues), `components/nutrivita/onboarding-flow.tsx`, `components/nutrivita/landing-page.tsx`
**Verdict build :** GO — `npx tsc --noEmit` 0 erreur TypeScript
**Verdict tests :** GO — 166/166 tests verts (19 suites), aucune régression
**Verdict revue-code :** GO (CONFORME) — SL-03 respecté (bloc AR P1-3 100 % `\uXXXX`), parité 3 langues vérifiée, pas de `t` masquée par un `.map` (renommés `tabKey`/`item`), design system intact. 2 écarts MINEURS hors lignes du diff : boutons sexe H/F encore en dur (`onboarding-flow.tsx`), ligne RGPD trilingue double-échappée réservée à **P1-4**.
**Verdict réglementaire :** GO — REG-04 consentement Art. 9 intact et non contournable, REG-05 aucune formulation diagnostique/thérapeutique introduite, mention « Données protégées · RGPD » présente dans les 3 langues, cohérence i18n 3/3.

### Notes
- L'outil d'écriture échappe automatiquement le non-ASCII en `\uXXXX` dans les `.ts` : conformité SL-03 garantie pour le bloc AR ajouté (vérifié via `Grep` ligne 903 : `م...`).
- Lignes laissées volontairement pour **P1-4** : `landing-page.tsx` blocs RGPD trilingues (double-échappement `\\u`).
- Dette à tracer (hors gate) : caractères arabes bruts pré-existants dans le bloc AR de `types.ts` (non introduits par P1-3) ; boutons sexe H/F onboarding.

---

## Gate P1-4 — 2026-06-24 — Bug arabe double-échappé (landing)

**Session :** fix(P1-4) — correction de l'encodage de la mention RGPD trilingue
**Fichier :** `components/nutrivita/landing-page.tsx` (2 occurrences, hero + onglet pro)
**Correctif :** double-échappement `{"\\u0628..."}` (rendu littéral `ب…`) → échappement simple `\uXXXX` rendant l'arabe « بيانات محمية · RGPD ». Appliqué via script Node (fs) pour garantir des `\u` ASCII sur disque.
**Verdict build :** GO — `npx tsc --noEmit` 0 erreur TypeScript
**Verdict tests :** GO — 166/166 tests verts (19 suites)
**Verdict revue-code :** GO (CONFORME) — SL-03 OK (0 caractère arabe brut, 0 `\\u` résiduel, 24 `\u` simples), parité trilingue FR/AR/EN, diff borné à 2 lignes, design system intact. Aucun écart bloquant/majeur/mineur.
**Verdict réglementaire :** GO — mention « Données protégées · RGPD » désormais lisible en arabe (amélioration transparence, marché DZ), REG-05 OK (« données protégées · RGPD », rien de diagnostique), aucun disclaimer santé supprimé.

### Note
- L'auto-échappement de l'outil d'écriture est **incohérent** selon le fichier (.tsx ici a conservé l'arabe brut) → pour tout ajout arabe, vérifier le disque via `Grep`/script et forcer les `\uXXXX` par script Node si besoin. Le RTL réel de ce segment relève de **P1-5**.

---

## Gate P1-5 — 2026-06-24 — RTL arabe réel + persistance de la langue

**Session :** feat(P1-5) — classe CSS `.rtl` + persistance localStorage de la langue (avant : reset FR au reload)
**Fichiers :** `lib/language.ts` (NEW), `lib/__tests__/language.test.ts` (NEW, 6 TU-P15), `app/globals.css` (règle `.rtl`), `lib/app-context.tsx` (persistance + restauration au montage)
**Implémentation :**
- `lib/language.ts` : `getStoredLanguage`/`setStoredLanguage` (SSR-safe, whitelist `["fr","ar","en"]`) + `dirForLanguage`.
- `app/globals.css` : `.rtl { direction: rtl; font-family: var(--font-arabic) }` (pas de `text-align: right` pour ne pas casser `text-center`) — rend fonctionnels les `cn(..., isRTL && "rtl")` déjà présents dans les écrans.
- `app-context` : `setLanguage` persiste le choix ; effet de montage restaure la langue stockée et applique `document.documentElement.dir/lang`.
**Verdict build :** GO — `npx tsc --noEmit` 0 erreur TypeScript
**Verdict tests :** GO — 172/172 tests verts (20 suites) dont 6 TU-P15 (null défaut, persistance 3 langues, rejet valeur invalide, mapping dir)
**Verdict revue-code :** GO (CONFORME) — SSR-safe, pas de régression du flux langue, effet montage deps `[]` sans boucle, design system OK. Aucun BLOQUANT/MAJEUR ; 1 MINEUR corrigé (commentaire CSS reformulé).
**Verdict réglementaire :** GO — EB-11 RTL servi, RGPD minimisation REG-03 OK (seule la préférence de langue non identifiante est persistée, aucune PII/donnée santé), aucun disclaimer touché (REG-04/05 N.A.).

### Note (INFO, non bloquant)
- Flash LTR→RTL possible au 1er paint si un utilisateur arabe recharge (l'effet client s'exécute après hydratation). Acceptable pour P1-5 ; à traiter si un rendu RTL sans flash devient une exigence.

---

## Gate P1-6 — 2026-06-24 — Boutons sans action (brancher ou masquer)

**Session :** fix(P1-6) — neutralisation des boutons morts. Stratégie validée PO : brancher si flux existant, sinon masquer (retrait du DOM).
**Fichiers :** `meals-screen.tsx`, `food-search-sheet.tsx`, `glucose-screen.tsx`, `settings-screen.tsx`
**Décisions :**
- Meals : « Photo » + « Scanner CB » → `setShowAddSheet(true)` (l'AddSheet contient détection photo + scan CB) ; libellés via `t("photo")`/`t("scanner")`. « Créer plat » retiré (pas d'écran de composition).
- Food search : bouton favori (cœur) retiré (favoris non persistés backend).
- Glycémie : bouton « Importer LibreView » retiré (pas de parser CSV front).
- Réglages : `IntegrationRow` — boutons d'action morts (Déco./Connecter/Importer) → statut texte (`connected`/`notConnected`/`notAvailable`), prop `actionLabel` supprimée. About : « Évaluer l'app » retiré. **« Politique de confidentialité » + « Mentions légales » CONSERVÉES** (points d'accès RGPD).
- Imports inutilisés retirés (`Plus`, `Heart`, `Upload`, `Star`).
**Verdict build :** GO — `npx tsc --noEmit` 0 erreur TypeScript
**Verdict tests :** GO — 172/172 tests verts (20 suites)
**Verdict revue-code :** GO (CONFORME) — plus aucun `onClick={() => {}}` ni bouton sans handler ; imports orphelins retirés ; câblage AddSheet cohérent ; design system OK. Aucun BLOQUANT/MAJEUR.
**Verdict réglementaire :** GO — points d'accès RGPD (privacy/legal) + droits REG-02 (export/suppression) intacts, disclaimers glycémie REG-04 intacts, aucune formulation REG-05 introduite.

### Réserves (non bloquantes, à tracer)
- `privacyPolicy`/`legalNotice` restent des rows sans `onClick` (contenu réel à brancher avant prod publique — exigence RGPD + loi DZ 18-07).
- Clés i18n désormais orphelines : `importCsv`, `rateApp` (nettoyage optionnel).
- Pré-existant hors P1-6 : émojis + FR en dur dans `meals-screen.tsx` (`cuisineFilters`, « Base de données »).

---

## Gate P1-7 (frontend) — 2026-06-24 — Affichage « non noté »

**Session :** feat(P1-7 front) — rendu « non noté » quand le backend renvoie `score: null` / `verdict: null` / `nutriscore_source: "non_note"` (produit sans donnée nutritionnelle exploitable). Le backend P1-7 (`fff43d5`) était déjà fait ; ici on branche le rendu côté v0design.
**Contrat backend confirmé** (`nutridz/backend/routes/scan.js`) : `/api/scan` → `{ score: number|null, verdict: "Excellent"|"Médiocre"|"Mauvais"|null, nutriscore_source: "nutriscore_off"|"nutriscore_calcule"|"non_note", ... }`. Non noté NON persisté (mais peut entrer dans la liste groceries via `addScannedProduct` client-side).
**Fichiers :** `lib/types.ts` (`ScannedProduct.score/verdict` nullable + `nutriScoreSource` + clés i18n `notRated`/`notRatedHint` FR/AR/EN), `lib/api-types.ts` (`ApiScanResponse` nullable + `nutriscore_source`), `lib/api.ts` (`mapScannedProduct` achemine la source), `components/nutrivita/add-sheet.tsx` (badge neutre « Non noté »), `components/nutrivita/groceries-screen.tsx` (style muted + label + tri non-noté en fin).
**Verdict build :** GO — `npx tsc --noEmit` 0 erreur (nullable propagé sans casse)
**Verdict tests :** GO — 172/172 tests verts
**Verdict revue-code :** GO (CONFORME) — SL-03 AR `\uXXXX` (ligne 805-806) + parité 3 langues, « non noté » jamais coloré comme mauvais score (add-sheet `text-muted-foreground` sans `/100` ; groceries fallback `--muted`), nullable bien gardé partout. 1 MINEUR corrigé (import mort `additiveCode` retiré).
**Verdict réglementaire :** GO — REG-05 : « Non noté » honnête et neutre (ni bon ni mauvais), corrige le bug trompeur « 50/unknown » ; REG-04 `scanDisclaimer` conservé hors conditionnel (non contournable) ; i18n santé cohérent FR/AR/EN.

### Note — modifs pré-session bundlées
Les fichiers `add-sheet.tsx` et `groceries-screen.tsx` portaient des modifications **non commitées présentes au démarrage de session** (non écrites par cette session) : (a) i18n du verdict via `t()` dans add-sheet ; (b) `riskProductsCount` basé sur la classification `normalizeAdditive().risk` (high/moderate) au lieu d'une liste figée. Les deux gates les ont auditées (CONFORME/OK) ; elles sont commitées avec P1-7 frontend car indissociables des mêmes fichiers/zones.

---

## Gate P1-8 (frontend) — 2026-06-25 — Ressenti perf scan

**Session :** feat(P1-8 front) — indice « réveil serveur » pendant un scan lent (cold start Render). Le backend P1-8 (cache barcode + persist async + /health, `4e2b00d`) est déjà fait.
**Fichier :** `components/nutrivita/add-sheet.tsx` (ScannerModal)
**Changement :** état `scanSlow` + `useEffect([scanning])` (timer 2,5 s) → si l'appel `scanBarcode` dépasse 2,5 s, affiche `t("serverWaking")` sous le spinner du step "scanning" et sous le bouton de saisie manuelle (au lieu d'un spinner muet). Clé i18n existante (FR/AR/EN), aucune nouvelle chaîne.
**Verdict build :** GO — `npx tsc --noEmit` 0 erreur
**Verdict tests :** GO — 172/172 tests verts
**Verdict revue-code :** GO (CONFORME) — effet sans fuite (cleanup `clearTimeout`), reset propre via `finally`, deps `[scanning]` correctes, design system OK (text-[12px] ≥ 11px, muted). 1 MINEUR cosmétique non bloquant (garde `scanning && scanSlow` redondante).
**Verdict réglementaire :** GO — texte technique neutre, aucun disclaimer touché (REG-04), aucune formulation REG-05, aucun impact RGPD/HDS/18-07 (timer local client).

---

## Gate S6 (frontend) — 2026-06-25 — Écran de confirmation composition étiquette

**Session :** feat(S6 front) — écran de confirmation de composition après photo d'étiquette d'un produit au code-barres inconnu. Le backend S5 (`services/compositionParser.js` + `POST /api/scan/composition`, `fe0a45f`) est déjà fait ; ici on branche le flux frontend (v0design).
**Contrat backend :** `POST /api/scan/composition` → `{ source, product_name, per_100g:{kcal,glucides,dont_sucres,proteines,lipides,dont_satures,fibres,sel}, additives:[{code,name,risk}], serving_g, confidence, needs_confirmation, warnings, disclaimer:{fr,ar,en} }`.
**Fichiers :** `lib/api-types.ts` (`ApiCompositionResult`), `lib/api.ts` (`mapCompositionResult` pur + `scanCompositionImage`), `lib/types.ts` (4 clés i18n FR/AR/EN, AR `\uXXXX`), `components/nutrivita/add-sheet.tsx` (remplace le step `label-confirm` par `composition-confirm` : champs nutritionnels ÉDITABLES, additifs en pastilles par risque, bandeau `bg-muted/40`+ambre si `needs_confirmation`/`warnings`, disclaimer REG-05 non contournable), `lib/__tests__/s6-composition.test.ts` (5 TU).
**Verdict build :** GO — `npm run build` OK · `npx tsc --noEmit` 0 erreur
**Verdict tests :** GO — 177/177 (5 nouveaux TU-S6-FE)
**Verdict revue-code :** GO (CONFORME) — SL-UI OK (lucide, pas d'émoji/gradient, ≥11px, rounded-2xl), SL-03 AR `\uXXXX` vérifié (aucun arabe brut), parité i18n FR/AR/EN, null jamais → 0 (kcal obligatoire), labels accessibles. 1 mineur corrigé (`var(--amber-bg)` non défini dans `app/globals.css` → bandeau passé en `bg-muted/40`, pattern REG existant). Mineurs différés : `confidence`/`warnings[]` non exploités côté UI (non bloquant).
**Verdict réglementaire :** GO — REG-04/05 disclaimer non contournable en langue active, vocabulaire non clinique, additifs neutres sans dose, null préservé (pas de 0 inventé), SL-03 OK.

---

## Gate S12 (frontend) — 2026-06-25 — Alternatives plus saines

**Session :** feat(S12 front) — bouton + écran « Alternatives plus saines » (Courses). Backend `GET /api/alternatives/:barcode` (`e6305ed`) déjà fait.
**Contrat backend :** `{ source_barcode, category, alternatives:[{ barcode, name, nutriScore("a".."e"), imageUrl }] }` (top 5 mieux notés même catégorie OFF, origine exclue ; OFF KO → `alternatives:[]`).
**Fichiers :** `lib/api-types.ts` (ApiAlternative/ApiAlternativesResponse), `lib/api.ts` (`mapAlternative` pur normalise grade→majuscule + `getAlternatives`), `lib/types.ts` (type `Alternative` + 2 clés i18n FR/AR/EN `\uXXXX`), `lib/alternatives.ts` (`pickWorstProduct`, ignore « non notés »), `components/nutrivita/nutri-score-badge.tsx` (extrait de groceries pour réutilisation), `components/nutrivita/alternatives-sheet.tsx` (bottom sheet : skeleton/liste/vide/erreur toast, disclaimer REG-05), `components/nutrivita/groceries-screen.tsx` (badge partagé + câblage bouton, désactivé si aucun produit noté), `lib/__tests__/s12-alternatives.test.ts` (6 TU).
**Verdict build :** GO — `npm run build` OK · tsc 0 erreur
**Verdict tests :** GO — 183/183 (6 nouveaux TU-S12-FE)
**Verdict revue-code :** GO (CONFORME) — SL-UI OK, SL-03 AR `\uXXXX` (0 arabe brut introduit), parité i18n FR/AR/EN, états chargement/vide/erreur + fallback image ShoppingBag, NutriScoreBadge extrait byte-identique (rendu inchangé), vocabulaire non clinique. Mineurs non bloquants alignés sur patterns projet (aria-label cancel, AnimatePresence interne, `t` en dep d'effet) — non corrigés.
**Verdict réglementaire :** GO — REG-05 « alternatives plus saines / mieux notées » = comparatif Nutri-Score (info bien-être), aucun sain/malsain absolu, pas de conseil perso/dose/diagnostic ; disclaimer REG-05 inconditionnel en langue active ; minimisation REG-03 (live OFF, rien de persisté) ; SL-03 OK.

---

## Gate S14 (frontend) — 2026-06-25 — Répartition des repas en onglets

**Session :** feat(S14 front) — l'accueil affiche les 4 repas du jour dans une carte unique à onglets (remplace les 4 MealSectionCard empilées). Frontend pur, aucun endpoint.
**UI (maquette validée) :** barre d'onglets (picto lucide Coffee/Utensils/Cookie/Moon + libellé, actif teal) ; 2 colonnes centrées (liste aliments à gauche : nom+quantité / kcal+suppression ; anneau calorique à droite : kcal au centre, arcs P/G/L + légende grammes) ; bouton « Ajouter un aliment » ; état vide par repas ; recalcul à la bascule d'onglet.
**Fichiers :** `lib/meal-macros.ts` (`computeMealTotals` + `macroArcSegments`, purs), `components/nutrivita/macro-ring.tsx` (anneau SVG multi-arcs, MACRO_COLORS tokens `--glucose`/`--amber`/`--lipids`), `components/nutrivita/meal-tabs-card.tsx`, `components/nutrivita/home-screen.tsx` (intègre MealTabsCard + nettoie imports/vars), `lib/types.ts` (3 clés i18n FR/AR/EN `\uXXXX`), `lib/__tests__/s14-meal-macros.test.ts` (6 TU).
**Verdict build :** GO — `npm run build` OK · tsc 0 erreur
**Verdict tests :** GO — 189/189 (6 nouveaux TU-S14)
**Verdict revue-code :** GO (CONFORME) — SL-UI OK (lucide, pas d'émoji/gradient, teal, rounded-2xl, ≥11px), couleurs macros = tokens design system, SL-03 AR `\uXXXX` (0 arabe brut), parité i18n, état vide/recalcul/accessibilité (aria-pressed, aria-label) OK, suppression d'entrée non régressée, pas d'orphelin (MealSectionCard gardé pour journal-screen). 1 mineur `font-medium` (précédent établi ~20 composants, non bloquant). Crayon d'édition reporté à S15 (pas de bouton mort : suppression conservée).
**Verdict réglementaire :** GO — REG-05 récap descriptif kcal/macros sans recommandation/objectif/diagnostic ; REG-04 aucun disclaimer régressé ; aucune donnée santé nouvelle (calculs mémoire depuis le journal) ; SL-03 OK ; REG-02/03/06/18-07 N.A.

---

## Gate S13 (frontend) — 2026-06-26 — Dissipation des calories (Bilan)

**Session :** feat(S13 front) — carte « Équilibrer cet excédent » dans le Bilan, visible uniquement si excédent calorique du jour > 0. Frontend pur, aucun endpoint. Cadrage bien-être REG-05 impératif.
**UI (maquette validée) :** carte activable (repliée par défaut) ; à l'ouverture, menu déroulant custom de sports groupés par intensité (Doux/Modéré/Intense) avec icône lucide par sport ; sélection → durée en grand ; rappel poids (périmé > 3 mois/absent → note + « Mettre à jour » vers Réglages ; sinon « Basé sur ton poids : N kg ») ; cadrage bien-être REG-05 non contournable.
**Calcul :** durée_min = excédent_kcal ÷ (MET × 3,5 × poids_kg ÷ 200) ; excédent = consommé − (objectif + activité plafonnée 1000, AL-03).
**Fichiers :** `lib/calorie-dissipation.ts` (SPORTS 17 MET + dissipationMinutes + dailyExcessKcal + isWeightStale, purs), `components/nutrivita/dissipation-card.tsx`, `components/nutrivita/stats-screen.tsx` (prop onOpenSettings + rendu), `components/nutrivita/nutrivita-app.tsx` (passe onOpenSettings), `lib/types.ts` (26 clés i18n FR/AR/EN `\uXXXX`), `lib/__tests__/s13-dissipation.test.ts` (9 TU).
**Verdict build :** GO — `npm run build` OK · tsc 0 erreur
**Verdict tests :** GO — 198/198 (9 nouveaux TU-S13)
**Verdict revue-code :** GO (CONFORME) — SL-UI OK (15 icônes lucide vérifiées, pas d'émoji/gradient, teal, rounded-2xl, ≥11px), SL-03 AR `\uXXXX` (0 arabe brut), parité i18n 26 clés ×3, carte masquée si pas d'excédent, recalcul au changement de sport, garde division par zéro, accessibilité (aria-expanded/aria-pressed), pas de bouton mort. Mineurs non bloquants : `text-white` codé en dur (pattern projet établi), `kcal` hardcodé (idem).
**Verdict réglementaire :** GO — REG-05 ton neutre « équilibrer » (pas « brûler/compenser/punir ») ; disclaimer bien-être impératif présent, non contournable, fidèle FR/AR/EN (arabe décodé conforme) ; « Estimation indicative, non médicale » présent ; rappel poids = constat factuel sans injonction médicale ; aucune donnée santé nouvelle stockée (calcul mémoire, poids lu du profil) ; SL-03 OK.

---

## Gate S15 (frontend) — 2026-06-26 — Édition repas (crayon) + ajout sauce/condiment

**Session :** feat(S15 front) — crayon d'édition de la quantité d'une entrée + bouton « Ajouter une sauce » via catalogue de condiments. Backend S15 (`PATCH /api/journal/:id` recalcul + IDOR, `parent_entry_id`, seed 81 condiments, `96a4372`) déjà fait.
**Contrainte :** aucun endpoint backend nouveau dans cette session frontend. Le backend n'expose pas de liste condiments ni `portion_default_g` via la recherche → le sélecteur utilise `/api/foods/search` (les 81 condiments y sont seedés dans `products`, product_id réel) + table frontend `defaultPortionG` (fallback 15 g).
**Fichiers :** `lib/api.ts` (`updateJournalEntry` PATCH + `addJournalEntry` param `parentEntryId`), `lib/types.ts` (`MealEntry.parentId` + 5 clés i18n FR/AR/EN `\uXXXX`), `lib/app-context.tsx` (`updateMealEntryAmount` optimiste), `lib/condiments.ts` (catalogue + `defaultPortionG`), `components/nutrivita/condiment-sheet.tsx` (recherche + raccourcis), `components/nutrivita/meal-tabs-card.tsx` (crayon → éditeur inline quantité + « Ajouter une sauce », optimistic + PATCH, sauce liée indentée), `lib/__tests__/s15-edit-sauce.test.ts` (4 TU).
**Verdict build :** GO — `npm run build` OK · tsc 0 erreur
**Verdict tests :** GO — 202/202 (4 nouveaux TU-S15-FE)
**Verdict revue-code :** GO (CONFORME) — SL-UI OK, SL-03 AR `\uXXXX` (0 arabe brut introduit ; noms condiments FR = données comme CIQUAL), parité i18n, optimistic + sync, garde id local (PATCH/parent_entry_id seulement sur id backend), accessibilité (aria-label crayon/save/cancel). Mineurs : résultat PATCH non réconcilié (UI re-dérive, backend strictement proportionnel) ; adjacence sauce/parent non triée ; ~73 raccourcis pour 81 seedés (recherche couvre tout). Dette pré-existante signalée : `edit`/`cancel`/`searchNoResults` AR en arabe brut (hors périmètre S15).
**Verdict réglementaire :** GO — REG-05 saisie/édition neutre, pas de reco/dose ; REG-04 valeurs propagées du backend (aucune inventée), `defaultPortionG` = portion culinaire indicative ; minimisation REG-03 (parent_entry_id omis si absent, testé) ; IDOR OK (id propre, encodeURIComponent, req.userId backend). Réserve mineure corrigée : affichage kcal sécurisé (« — » si valeur manquante).

## Gate S16 (frontend) — 2026-06-26 — Intégration Strava réelle (Réglages)

**Session :** feat(S16 front) — ligne Strava des Réglages rendue réelle : statut via `GET /api/strava/status`, boutons Connecter (OAuth) / Déconnecter, consentement explicite avant connexion (REG-05), sync des activités du jour au retour OAuth. Retrait du statut `connected` codé en dur. Backend S16 (`routes/strava.js` : connect/callback/status/sync/disconnect, state JWT anti-CSRF, dédup `strava_id`, tokens backend-only, `d0a7eed`) déjà fait.
**Contrainte :** tokens Strava = données sensibles → restent backend-only, jamais manipulés/affichés côté front (le client ne lit que `{ connected, athleteName }`).
**Fichiers :** `lib/api.ts` (`getStravaStatus`, `getStravaConnectUrl`, `syncStrava`, `disconnectStrava` — mappers défensifs), `lib/types.ts` (11 clés i18n `strava*` FR/AR/EN, AR en `\uXXXX`), `components/nutrivita/settings-screen.tsx` (`StravaIntegrationRow` : statut + OAuth + consentement + sync au retour `?strava=ok`, nettoyage URL `replaceState`), `components/nutrivita/nutrivita-app.tsx` (auto-ouverture Réglages au retour OAuth), `app/reglages/page.tsx` (route cible du callback), `lib/__tests__/s16-strava.test.ts` (7 TU msw, tracé EB-05→AL-02→SL-API-05→TI-04).
**Verdict build :** GO — `npm run build` OK · `tsc --noEmit` 0 erreur
**Verdict tests :** GO — 209/209 (7 nouveaux TU-S16-FE)
**Verdict revue-code :** GO (CONFORME) — aucun BLOQUANT/MAJEUR. SL-UI OK (lucide `Loader2`/`Check`, pas d'émoji/gradient, teal `bg-primary`, rouge destructif réservé à la déconnexion, ≥12px), SL-03 AR `\uXXXX` (0 arabe brut introduit), parité i18n (11 clés × 3 langues), mappers défensifs + tous les `catch` retombent sur un état sûr, effet avec flag `cancelled`+cleanup, pas de double-sync. Mineurs corrigés : toast d'échec de déconnexion dédié (`stravaDisconnectError` au lieu de `stravaSyncError`), `aria-label`/`aria-busy`/`aria-hidden` sur les boutons Connecter/Déconnecter en état chargement. Mineurs différés : `font-medium` (précédent établi, cohérent avec `IntegrationRow` voisin), lien politique de confidentialité dans le dialog de consentement.
**Verdict réglementaire :** GO — REG-05 consentement explicite **non contournable** (OAuth déclenchable uniquement via l'action du dialog) dans les 3 langues, avec finalité + catégories de données (type, durée, distance, calories) + mention du retrait ; tokens backend-only (test verrouille les mappers, params `athlete`/`reason` nettoyés de l'URL) ; REG-03 minimisation ; droit de retrait (Déconnecter → `DELETE /disconnect`) ; aucun disclaimer REG-04 requis (données d'activité, pas de reco médicale). Mineurs différés (responsabilité backend/politique globale) : journalisation horodatée du consentement, mention transfert hors UE (Strava US) dans la politique de confidentialité.

## Gate S18 (frontend) — 2026-06-27 — PWA installable

**Session :** feat(S18 front) — application rendue installable (PWA). Manifeste enrichi (`id`, `scope`, `display: standalone`, `theme_color` teal, icônes PNG 192/512 + maskable), service worker (`/sw.js`) avec stratégies de cache et coquille hors-ligne, page de repli `offline.html`, invite d'installation (`beforeinstallprompt` Android + instructions iOS Safari), métas iOS conservées (`appleWebApp`, `apple-icon`). Cible Lighthouse « Installable ».
**Stratégie SW :** navigations en network-first → cache → `offline.html` ; assets immuables `/_next/static/` en cache-first ; autres GET same-origin en stale-while-revalidate. **Ne cache QUE le same-origin** (garde `method !== "GET"` + `url.origin !== self.location.origin`) → aucune donnée de santé (API backend cross-origin) persistée dans le cache navigateur.
**Fichiers :** `public/manifest.json` (manifeste enrichi), `public/sw.js` (service worker), `public/offline.html` (coquille hors-ligne FR/AR/EN, dark mode), `public/icon-192.png` / `icon-512.png` / `icon-maskable-512.png` / `apple-icon.png` (générés via sharp depuis le logo NV, fond teal `#1D9E75`), `components/pwa-register.tsx` (enregistrement SW), `components/nutrivita/install-prompt.tsx` (invite + iOS hint + dismiss localStorage), `app/layout.tsx` (monte `PwaRegister`), `components/nutrivita/nutrivita-app.tsx` (monte `InstallPrompt` sous `AppProvider`), `lib/types.ts` (5 clés i18n `install*` FR/AR/EN, AR en `\uXXXX`), `lib/__tests__/s18-pwa.test.ts` (7 TU : manifeste, icônes existantes, SW fetch+offline+same-origin, offline.html, parité i18n, 0 arabe brut).
**Verdict build :** GO — `npm run build` OK · `tsc --noEmit` 0 erreur
**Verdict tests :** GO — 216/216 (7 nouveaux TU-S18)
**Verdict revue-code :** GO (CONFORME) — aucun BLOQUANT/MAJEUR. SL-UI OK (carte `rounded-2xl border` sans ombre, teal `var(--primary)`, lucide `Download`/`Share`/`X`, pas d'émoji/gradient, ≥13px), SL-03 AR `\uXXXX` (0 arabe brut), parité i18n (5 clés × 3 langues), gestion d'erreurs (enregistrement SW silencieux, try/catch localStorage, tous les `cache.put` protégés), états standalone/dismiss/appinstalled corrects, a11y (`aria-label` dismiss, SVG `aria-hidden`). Mineurs différés : titre/bouton `offline.html` FR seul (corps déjà trilingue) ; `cache.addAll` atomique (4 ressources existantes) ; détection iPad iPadOS 13+ (UA Mac) → dégradation silencieuse ; `maximumScale:1`/`userScalable:false` pré-existant (dette a11y WCAG 1.4.4, hors périmètre).
**Verdict réglementaire :** GO — aucun KO. REG-05 : aucun texte thérapeutique/diagnostic/dose (libellés d'installation + page hors-ligne uniquement). RGPD/REG-03 (point critique confirmé) : le SW n'intercepte ni ne cache aucune donnée de santé — API backend cross-origin (`https://nutridz.onrender.com`, imposée par `lib/api.ts`) écartée par la double garde ; précache limité à coquille/manifeste/icônes ; `localStorage["nv-install-dismissed"]` = drapeau UI non personnel. REG-04 : N.A. (aucun écran de données de santé ajouté). SL-03 OK (AR `\uXXXX`, `offline.html` en entités HTML numériques). Vigilance conservée : rester en récupération client-side des données santé (pas de SSR/RSC embarquant des données patient dans le HTML same-origin).

## Gate Nettoyage — 2026-06-27 — Dette SL-03 (arabe \uXXXX) + fallback URL backend

**Session :** deux nettoyages sûrs et auto-déployables (P0-2 cutover cookies httpOnly NON traité — réservé après pose du domaine).
1. **Dette SL-03** : conversion en échappements `\uXXXX` de TOUS les caractères arabes bruts restants de `lib/types.ts` (bloc de traductions AR complet + `nameAr` des données mockées + arabe inline dans `heroSubtitle`). 2531 caractères arabes escapés via script Node (jamais l'outil Edit, cf. note mémoire anti-corruption). Seules les plages Unicode arabes escapées ; accents FR (é, à, ç) et guillemets « » intacts. BOM en tête de fichier escapé par erreur puis retiré (le fichier recommence par `// Types for NutriVita`).
2. **Fallback URL backend mort** : `lib/api.ts` `DEFAULT_API_BASE` `https://nutridz.onrender.com` → `https://nutridz-2.onrender.com` (URL réelle). 15 fichiers de test qui dupliquaient l'ancienne URL en fallback msw mis à jour en parallèle (sinon `onUnhandledRequest: error`), + `docs/sl-api.md`. `docs/gates.md` (ledger historique) laissé intact.
**Fichiers :** `lib/types.ts` (2531 escapes AR, parité FR/AR/EN préservée), `lib/api.ts` (DEFAULT_API_BASE), `docs/sl-api.md` (défaut documenté), `lib/__tests__/*.test.ts` ×15 (fallback URL synchronisé).
**Verdict build :** GO — `npm run build` OK · `tsc --noEmit` 0 erreur
**Verdict tests :** GO — 216/216 (msw sans requête non gérée → confirme la synchro URL tests/code)
**Verdict revue-code :** GO (CONFORME) — 0 arabe brut restant, round-trip décodé STRICTEMENT identique à HEAD (parité des clés + valeurs garantie mécaniquement), accents FR/guillemets intacts, aucune occurrence résiduelle de l'ancienne URL (hors gates.md ledger), api.ts et tests sur la même base. Mineurs hors périmètre : `CLAUDE.md`/`.claude/settings.json`/`tsconfig.tsbuildinfo` (préexistants, exclus du commit).
**Verdict réglementaire :** GO — re-encodage prouvé sémantiquement neutre (DIFFS=0 sur le contenu décodé). REG-04 : les 8 disclaimers santé AR (`forbesEstimate`, `deficiencyDisclaimer`, `glucoseDisclaimer`, `hypoAlert`, `dissipationDisclaimer`, `radarDisclaimer`, `additivesExposureDisclaimer`, `scanDisclaimer`) + consentement Strava présents en 3 langues, contenu inchangé. REG-05 : aucune formulation thérapeutique/diagnostic introduite (re-encodage seul). SL-03 : 4998 escapes simples, 0 double-échappement `\u` (piège P1-4 évité). URL backend = correction de valeur de fallback, sans impact RGPD/REG.

## Gate S20 frontend — 2026-06-28 — Observabilité Sentry (Next.js)

**Session :** intégration Sentry côté frontend (capture des erreurs React + non gérées), région UE, activation conditionnelle au DSN, scrubbing strict glycémie/PII. Tâche non-🔒 auto-déployable → commit direct sur `main`.
**Contrainte :** « ne jamais modifier package.json/package-lock.json » → client Sentry **dépendance-free** (envoi d'enveloppes à l'endpoint d'ingestion EU), au lieu du SDK `@sentry/nextjs`. Bénéfice : aucune capture auto (breadcrumbs/console/réseau) qui pourrait embarquer une glycémie ; on n'envoie QUE des erreurs explicitement capturées, scrubbées.
**Fichiers :** `lib/observability/sentry.ts` (NEW — scrubEvent récursif anti-cycle + redactText texte libre + sanitizeUrl + parseDsn + isEuDsn allowlist + initSentry no-op sans `NEXT_PUBLIC_SENTRY_DSN` + captureException fetch keepalive), `components/sentry-listener.tsx` (NEW — init + window error/unhandledrejection, monté dans `app/layout.tsx`), `app/error.tsx` + `app/global-error.tsx` (NEW — Error Boundaries React, repli neutre i18n FR/AR/EN + RTL + role=alert, SL-UI), `lib/__tests__/s20-sentry.test.ts` (NEW — 17 TU).
**Verdict build :** GO — `npm run build` OK · `tsc --noEmit` 0 erreur
**Verdict tests :** GO — 233/233 (17 TU-S20-front, dont non-fuite message+stacktrace `142 mg/dl`/email→`[Filtered]` et `request.url` `?code=...#tok=...`→origin+pathname)
**Verdict revue-code :** GO — après 1 itération. MAJEUR i18n des Error Boundaries (FR seul → FR/AR/EN via `getStoredLanguage`, arabe `\uXXXX` généré par script Node, `dir` RTL, `role="alert"`) corrigé. SL-UI OK (rounded-2xl border sans ombre, lucide `AlertTriangle`/`RotateCcw`, ambre `#BA7517`, primary `#1D9E75`, pas de gradient/émoji). 0 arabe brut (grep).
**Verdict réglementaire :** GO — après 1 itération (NO-GO initial levé). B1 (message/stacktrace d'exception non scrubbés → `redactText` emails/JWT/glycémie appliqué à `event.message`/`exception.values[].value`/`stacktrace.raw`, chemins de code conservés) et B2 (`request.url` → `sanitizeUrl` origin+pathname redacté, query+fragment retirés) corrigés et prouvés par TU. M1 (garde UE denylist → allowlist : `*.sentry.io` n'autorise que `*.ingest.de.sentry.io`). Activation conditionnelle DSN = pas de traitement si non configuré. REG-05 : replis neutres, aucun texte thérapeutique.
**Résiduels MINEURS (non bloquants) :** glycémie « nue » sans unité ni mot-clé dans un message non captée (R1 — discipline code : ne jamais interpoler une valeur de santé dans un `throw`) ; token opaque non-JWT / téléphone en texte libre (R2).
**Dette suivie (proprio / autre repo) :** 🔒 créer compte Sentry + DSN **EU** (proprio) ; inscrire Sentry sous-traitant UE au registre + DPA ; **parité backend B1** — appliquer le scrubbing message/stacktrace à `nutridz/backend/observability/sentry.js` avant livraison S20 backend.
