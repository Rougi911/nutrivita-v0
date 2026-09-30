# NutraLance — frontend Synthèse / Détails

Branche de travail : `feat/nutralance-ui-synthese-details`.
Base : `d18d793e523dac1a0d69cd3e0ebfb75caafa862b`.
Date : 29 septembre 2026.

## Périmètre

Cette proposition implémente la direction visuelle discutée avec Ahmed sur le frontend existant. Elle conserve les fonctionnalités et les indicateurs développés. Il ne s'agit pas d'une réécriture de l'API, d'une validation clinique ou d'une autorisation de mise en production.

L'absence de données dans les captures initiales provenait du compte de test. Le mode démo ci-dessous utilise maintenant des données fictives remplies pour permettre une revue représentative de la densité d'information.

### Deux réglages indépendants

- **Synthèse / Détails** : quantité d'information affichée initialement ; préférence conservée sur l'appareil, indépendante du compte et de la langue. Aucune donnée santé dans cette préférence. Les sections restent dépliables individuellement dans les deux modes.
- **Graphiques avancés**, réglage préexistant conservé : barres ou courbes/radars dans les composants qui le prennent en charge. Ce réglage ne modifie pas le niveau de détail.

Le mode synthèse est le point de départ proposé, modifiable. Un utilisateur peut vouloir une saisie rapide au déjeuner et un bilan approfondi le week-end : deux modes ne supposent pas deux marchés déjà démontrés.

## Démarrer avec des données de démonstration

Node.js et npm requis. Les dépendances et le lockfile du projet n'ont pas été changés.

PowerShell :

```powershell
git switch feat/nutralance-ui-synthese-details
Copy-Item .env.ui-demo.example .env.local
npm ci
npm run dev -- --hostname 127.0.0.1
```

macOS/Linux :

```bash
git switch feat/nutralance-ui-synthese-details
cp .env.ui-demo.example .env.local
npm ci
npm run dev -- --hostname 127.0.0.1
```

Ouvrir http://localhost:3000. Ne pas écraser un `.env.local` existant : dans ce cas, ajouter seulement `NEXT_PUBLIC_UI_DEMO=true` à votre configuration locale.

Le mode démo est **opt-in**. Il est activé uniquement avec `NEXT_PUBLIC_UI_DEMO=true`. Il remplace les appels de `lib/api.ts` par un adaptateur en mémoire, ne lit pas le vrai jeton d'authentification et ne retombe jamais sur le serveur réel pour une action non simulée. Les mutations de démonstration sont réinitialisées au rechargement. La préférence d'affichage et la langue persistent. Un bandeau identifie les données fictives.

Pris en charge dans la démo : journal, recherche, ajout de repas, ajustement de portion, lecture poids/glycémie/activité, historique, résultat photo simulé, score de démonstration, exports et préférences de notification. Les integrations réelles, paiements, OAuth, import capteur et certaines mutations d'activité ne sont pas simulés ; ils renvoient une erreur et ne contactent pas l'API. L'analyse photo de démonstration retourne toujours le même exemple : ce n'est pas de la reconnaissance d'image.

## Revenir au backend

1. Supprimer `NEXT_PUBLIC_UI_DEMO` ou le définir à `false`.
2. Renseigner `NEXT_PUBLIC_API_URL` avec le backend cible (préproduction recommandée).
3. Redémarrer Next ; pour un build de production, reconstruire avec `npm run build`. Les variables `NEXT_PUBLIC_*` sont intégrées au build.
4. Se connecter avec un compte de l'environnement cible.

**Ne pas activer la démo dans le déploiement destiné aux vrais utilisateurs.** Sans configuration de l'URL, la valeur historique de `lib/api.ts` reste utilisée. Aucun endpoint ni schéma d'authentification n'a été remplacé dans le mode normal.

## Écrans et composants

| Écran | Évolution | Conservation |
|---|---|---|
| Accueil | Titres clairs, énergie explicite, ajout visible, repas du jour, suivis ; bascule de détail | Vue historique détaillée et tous ses indicateurs |
| Journal | Résumé compact, repas avant activité, bloc de nutrition dépliable | Édition, sauces/condiments, activité, vocal, copie, navigation de date |
| Ajouter | Méthodes en liste, photo mise en avant, clavier et focus dans la feuille | Photo, recherche, voix et code-barres existants |
| Vérifier | Quantité modifiable par aliment, valeurs de portion recalculées, validation 1–5 000 g | Type de repas et date ; types d'intentions existants |
| Bilan | Résumé du jour et sections accessibles individuellement | Nutrition, composition corporelle, micronutriments, tendances, score, produits et additifs |
| Glycémie | Choix de détail et sections repas/mesures/corrélations | Mesures, GMI/TIR/CV, import, corrélations et avertissement permanent |
| Profil | Préférences de présentation et accès groupés | Écran complet Réglages accessible en un clic |
| Navigation | Barre mobile, rail desktop | Glycémie conserve une entrée permanente ; profil par avatar et rail |

L'anneau détaillé historique de l'accueil utilise désormais le même résumé énergétique que la synthèse, avec le crédit d'activité plafonné déjà prévu par AL-03. Les indicateurs de macronutriments restent affichés. Les métriques cliniques et leurs calculs n'ont pas été révisés dans cette branche.

Les thèmes clair et sombre sont conservés. Les nouvelles chaînes sont disponibles en français, anglais et arabe ; l'arabe utilise des échappements Unicode. RTL et zoom restent utilisables. Le vert plus sombre de la proposition (#087F67), le fond ivoire et les rayons des cartes constituent l'évolution de SL-UI explicitement demandée par la nouvelle direction visuelle. Les couleurs sémantiques des indicateurs sont conservées.

### Références d'implémentation

- `components/nutrivita/redesign/` : accueil, profil, résumé quotidien, préférence et sections.
- `lib/view-mode.ts` : lecture/écriture robuste de la préférence non sensible.
- `lib/redesign-copy.ts` : nouvelles chaînes FR/EN/AR.
- `lib/interpret-portion.ts` : conversion des valeurs par portion pour la correction avant ajout.
- `lib/ui-demo.ts` : adaptateur explicite de démonstration, sans réseau de repli.
- `lib/mock-data.ts` : données fictives centralisées.
- `app/globals.css` : thème et nouveaux composants visuels.

## Contrats conservés pour le câblage

| Domaine | Appels utilisés |
|---|---|
| Profil | `getProfile()` ; les problèmes historiques de mise à jour du profil restent à corriger dans le lot fonctionnel |
| Repas | `getJournal`, `getJournalRange`, `addJournalEntry`, édition/suppression existantes |
| Photo / voix | `interpretMedia` ; nutrition API **par portion** ; normalisation en valeurs /100 g à l'enregistrement |
| Poids / glycémie / activité | Fonctions existantes de `lib/api.ts`, stockage glycémie en mg/dL |
| Bilan | `getDeficiencies`, `getHealthScore`, `getAdditivesStats`, historiques et résumé courses |
| Préférences d'interface | Stockage local non sensible ; pas de nouveau champ backend obligatoire |

Aucune connexion à la base PostgreSQL ni mutation de production n'a été utilisée pour la revue UI.

## Limites et travaux avant merge / production

Cette branche ne prétend pas corriger l'ensemble de l'audit précédent. Restent notamment à traiter : persistance du profil, commandes RGPD effectives, export complet de Réglages, gestion unifiée de session, erreurs de synchronisation de certains parcours, dépendances et validation scientifique des calculs. Les avertissements existants restent présents. Garder un indicateur ne signifie pas que son interprétation a été validée.

Le mode démo facilite la revue UI mais ne prouve pas l'intégration avec PostgreSQL, les permissions caméra/microphone sur appareils réels ou le fonctionnement d'un capteur. Safari iOS et Android réel restent à tester. Les écrans historiques détaillés conservent certains libellés/espacements et problèmes antérieurs ; aucune suppression de fonctionnalité n'a été utilisée pour les masquer.

## Validation produit : détail ou simplicité ?

Hypothèses à tester, pas segmentation acquise :

| Usage | Besoin principal | Présentation à comparer |
|---|---|---|
| Journal occasionnel | Enregistrer et corriger sans effort | Synthèse avec accès rapide à un détail |
| Suivi nutrition/sport régulier | Comparer macros, énergie, activité et poids | Détails nutritionnels et tendances |
| Suivi glycémique personnel | Retrouver mesures, contexte et historique | Accès direct au module spécialisé, limites visibles |

### Protocole proposé

1. Recruter 5–6 personnes par usage pour une première étude qualitative. Ce volume sert à trouver les difficultés, pas à établir une significativité statistique.
2. Faire réaliser les mêmes tâches sur les deux modes : ajouter un repas, corriger une portion, retrouver une mesure, expliquer un graphique. Alterner l'ordre des modes pour limiter l'effet d'apprentissage.
3. Mesurer réussite sans aide, erreurs, temps et capacité à expliquer les indicateurs. Demander ensuite pourquoi la personne choisit un mode, au lieu de demander uniquement lequel elle préfère visuellement.
4. Sur une bêta de 2–4 semaines, laisser le choix, observer les changements de mode et la réutilisation des modules. Ne pas confondre ouvertures de graphiques et compréhension utile. Les choix volontaires ne constituent pas un A/B test causal.
5. Comparer activation et rétention par besoin initial, fréquence de suivi et mode utilisé. Une expérience randomisée ultérieure exige un calcul de taille d'échantillon basé sur le trafic et l'effet minimal recherché.
6. Garder un seul produit tant que les données et les parcours restent communs. Envisager une offre dédiée uniquement si l'usage, la disposition à payer, les canaux d'acquisition et le support divergent durablement.

Ne pas rendre les avertissements, unités, sources ou l'exercice des droits moins accessibles dans le mode synthèse. Ne pas utiliser la complexité visuelle seule comme justification d'un tarif Premium.

Références de méthode : [NN/g, divulgation progressive](https://www.nngroup.com/articles/progressive-disclosure/) ; [GOV.UK, tests d'utilisabilité modérés](https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing).

## Traçabilité

| Exigence | Implémentation | Vérification |
|---|---|---|
| EB-01 / AL-10 | Correction de portion | TU-UI-01 et parcours navigateur 300 g → 100 g, 420 → 140 kcal |
| EB-05 / AL-03 | Résumé quotidien partagé | Fonctions existantes, unités et contrôle visuel |
| EB-06 / EB-09 | Sections de détail, composants conservés | Navigation Bilan/Glycémie et avertissement permanent |
| EB-11 | Chaînes FR/EN/AR | TypeScript et captures anglais/arabe RTL |
| EB-12 / EB-14 / SL-UI | Préférence et navigation responsive | TU-UI-02 ; mobile 390 px, ordinateur 1 440 px |
| Isolation démo | Adaptateur sans HTTP de repli | TI-UI-03 + compteur de requêtes API navigateur à zéro |

Captures et résultat navigateur : `docs/ui-review/`. Les captures longues montrent parfois la barre fixe au milieu de l'image : elle est bien au bas du viewport en utilisation réelle.

### Réserves de revue

Les alertes glycémie restent hors accordéons et le streak reste visible dans les deux modes. La démo ignore entièrement le cache nominatif réel. Le focus clavier couvre aussi la confirmation photo. Dettes historiques hors périmètre : transmission des fibres depuis la confirmation, synchronisation optimiste et imperfections RTL des anciennes vues.
