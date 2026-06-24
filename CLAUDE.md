# NutriVita — Frontend (nutrivita-v0)

Stack : Next.js 16 · TypeScript · Tailwind v4 · shadcn/ui · lucide-react · framer-motion · recharts

## Processus Cycle en V

Ce projet suit le Cycle en V défini dans `docs/cycle-v-nutrivita.md`. Charger ce fichier en début de chaque session.

### Règles impératives
- Aucun passage à l'étape suivante sans double GO au gate (agent critique + agent réglementaire).
- Toute modification d'une spec amont en cours de phase aval = retour au gate amont.
- Traçabilité obligatoire : chaque EB-xx doit couvrir au moins un AL-xx ou SL-xx, chaque AL/SL couvre au moins un TU/TI.

## Agents disponibles (`.claude/agents/`)

| Agent | Quand l'invoquer |
|-------|-----------------|
| `critique-spec` | Après toute production ou modification de spec |
| `critique-algo` | Sur la section SA et toute implémentation d'un AL-xx |
| `revue-code` | En fin de chaque session d'implémentation, avant commit |
| `testeur` | Pour écrire/exécuter les TU-xx/TI-xx |
| `reglementaire` | À CHAQUE gate de fin de phase + avant tout commit touchant données de santé |

## Gate de fin de session (OBLIGATOIRE avant tout commit)

1. `npm run build` sans erreur TypeScript
2. `npm run test` entièrement au vert
3. Invoquer `revue-code` sur le diff complet
4. Invoquer `reglementaire` (disclaimers REG-04 dans les 3 langues, REG-05)
5. Corriger tous les écarts BLOQUANTS et MAJEURS
6. Consigner le gate dans `docs/gates.md`

## Conventions (SL-03 — NE PAS dévier)

- `req.userId` (jamais `req.user.id`)
- Champs snake_case : `weight_kg`, `glucose_mg_dl`, `calories_burned`
- Chaînes arabes en échappements Unicode `\uXXXX` (jamais de caractères arabes directs)
- CORS whitelist stricte

## Design system (SL-UI)

- Aucun dégradé CSS (gradient-*), aucun émoji — icônes lucide-react uniquement
- Accent unique : teal `#1D9E75` (`--primary`)
- Couleurs sémantiques : violet `#534AB7` = glycémie · ambre `#BA7517` = avertissements · rouge `#A32D2D` = risques · vert teal clair `#E1F5EE` = positif
- Cartes : `rounded-2xl` border `1px` sans ombre
- 2 font-weight max : regular + semibold · pas de texte < 11px

## Tests

Framework : Vitest (`npm run test`)
Les tests unitaires sont dans `lib/__tests__/` ou colocalisés avec les fichiers `lib/`. Chaque test cite son identifiant TU-xx et l'algorithme AL-xx tracé. Un test qui échoue = écart à corriger côté code (ne jamais assouplir l'assertion).

## Stockage glycémie

Stockage interne TOUJOURS en mg/dL. Conversion uniquement à l'affichage et à la saisie via `lib/glucose-units.ts` (`toGlucoseUnit` / `fromGlucoseUnit`). Défaut utilisateur : g/L.

## Données mockées

Toutes les données mockées sont dans `lib/mock-data.ts` (données fixes, aucun `Math.random()` dans les `useMemo`). Aucune connexion backend dans la session UI — les appels API seront branchés lors de la session backend.

## Boucle de dev autonome (déclencheur : « lance la boucle »)

Quand l'utilisateur dit « lance la boucle » : lire `C:\AppliSanteNutriVita\BACKLOG.md`, appliquer ses règles, et traiter **uniquement les tâches frontend** dans l'ordre (P1-3 i18n, P1-4 arabe double-échappé, P1-5 RTL, P1-6 boutons morts, + affichage « non noté » lié à P1-7 et ressenti perf lié à P1-8).

Pour chaque tâche :
1. Implémenter la modif minimale.
2. **Passer le Gate de fin de session ci-dessus** (`npm run build`, `npm run test` au vert, `revue-code` + `reglementaire` sur le diff). Corriger tout écart BLOQUANT/MAJEUR.
3. Si vert → `git add` (fichiers touchés) + commit conventionnel + `git push` → mettre à jour le Journal du backlog + cocher la case.
4. Enchaîner la tâche suivante **sans redemander**.

Pousser sur `main` (= déploiement auto Render) est autorisé pour ces tâches : le gate + le CI servent de garde-fou, une régression visuelle n'est pas critique.

**Rappels** : respecter SL-03 (arabe en `\uXXXX` simple — pour P1-4, corriger le double-échappement `\\u` → `\u`, ne JAMAIS introduire de caractères arabes bruts). Ne jamais modifier `package.json`/`package-lock.json`.

**EXCEPTION — cutover P0-2 (bascule cookies httpOnly dans `lib/api.ts`, withCredentials + X-CSRF-Token + /refresh + /logout)** :
- NE PAS pousser sur `main`. Créer une branche `feat/jwt-httponly-front`, committer dessus, ouvrir une PR, puis **s'arrêter**. Le merge (= déploiement, déconnexion possible de tous les users en prod) est une décision humaine.

**S'arrêter et demander** aussi si : tâche 🔒, décision produit, ou blocage après 2 essais.
