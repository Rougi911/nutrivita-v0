# Tests P4.13 — Finition fonctionnelle (meal_type, vocal sport, voir plus, recherche, scanner)

> Scénarios à rejouer après chaque déploiement sur **nutrivita-v0.onrender.com** via l'extension Chrome.
> Pour chaque test : statut HTTP attendu, corps de réponse clé, et rendu dans l'UI.

---

## T1 — meal_type vocal (PROB 1 + 2)

**Contexte :** L'utilisateur est connecté.

**Action :** Ouvrir AddSheet → "Vocal" → prononcer :
> "Ce matin j'ai mangé deux oeufs"

**Attendu :**
- `POST /api/interpret` → `200`
- Corps : `intents[0].type = "food"`, `intents[0].meal_type = "breakfast"` (ou équivalent)
- Écran InterpretConfirm : chips de repas visibles, chip **Petit-déjeuner** sélectionné
- Après confirmation → entrée créée avec `meal_type = "breakfast"` (visible dans la section Petit-déjeuner du journal)
- Les 4 chips (Petit-déj / Déjeuner / Collation / Dîner) sont modifiables avant validation

**Résultat à rapporter :** statut HTTP, valeur `meal_type` dans la réponse, chip pré-sélectionné dans l'UI.

---

## T2 — meal_type déduit par l'heure (PROB 1)

**Contexte :** L'utilisateur ajoute un aliment manuellement (FoodSearchSheet) sans contexte horaire vocal.

**Action :** Ouvrir AddSheet → "Recherche" → taper "pomme" → sélectionner un résultat

**Attendu :**
- Chip de repas pré-rempli selon l'heure courante du serveur/client :
  - < 11h → Petit-déjeuner
  - 11h–15h → Déjeuner
  - 15h–19h → Collation
  - > 19h → Dîner
- Chip modifiable avant clic "Ajouter"
- Entrée créée avec le repas sélectionné

**Résultat à rapporter :** heure locale au moment du test, repas pré-rempli, repas final après éventuelle modification.

---

## T3 — "Voir plus" (PROB 3)

**Contexte :** Le journal est vide pour la journée.

**Action :**
1. Ajouter 6 aliments dans la même section (ex. Déjeuner) en répétant l'ajout
2. Observer la liste dans MealSectionCard

**Attendu :**
- Les 3 premiers aliments sont visibles
- Bouton "3 de plus" (ou le nombre correct) apparaît
- Clic sur "3 de plus" → les 6 aliments sont visibles
- Bouton "Voir moins" permet de réduire
- Aucun rechargement de page nécessaire

**Résultat à rapporter :** nombre initial affiché, comportement du bouton, présence de tous les 6 éléments après dépliage.

---

## T4 — Recherche aliments (PROB 4)

**Contexte :** Backend nutridz déployé et accessible.

**Action :** Ouvrir AddSheet → "Recherche" → taper "pomme" dans le champ de recherche

**Attendu :**
- `GET /api/foods/search?q=pomme` → `200`
- Corps : tableau d'aliments (`[{ id, name, calories, protein, carbs, fat, source }]`) avec au moins 1 résultat
- Les résultats backend s'affichent (pas seulement les données locales)
- Clic sur un résultat → bottom sheet quantité → confirmation → entrée ajoutée au journal avec le bon `meal_type`

**Résultat à rapporter :** statut HTTP, nombre de résultats retournés, aliment ajouté visible dans le journal.

---

## T5 — Scanner produit connu (PROB 5a)

**Contexte :** Produit avec code-barres présent dans OpenFoodFacts.

**Action :** Ouvrir AddSheet → "Scanner" → scanner ou saisir un code-barres connu (ex. `5449000000996` pour Coca-Cola 500ml)

**Attendu :**
- `POST /api/scan` → `200`
- Corps : `{ barcode, name, nutri_score, score, verdict, additives, sucres, sel, ags }`
- Produit ajouté aux courses (scannedProducts)
- Pas d'erreur ni de message "produit inconnu"

**Résultat à rapporter :** statut HTTP, nom produit retourné, Nutri-Score affiché.

---

## T6 — Scanner produit inconnu + photo étiquette (PROB 5b)

**Contexte :** Code-barres inexistant dans OpenFoodFacts.

**Action :**
1. Ouvrir AddSheet → "Scanner" → saisir un code bidon (ex. `9999999999999`)
2. Observer le message "Produit non reconnu" et les 2 choix
3. Choisir "Photographier l'étiquette" → photographier un tableau nutritionnel réel

**Attendu (étape 1) :**
- `POST /api/scan` → `404` ou `200 { status: "product_unknown" }`
- Écran "Produit non reconnu" avec 2 boutons : "Saisir le code manuellement" + "Photographier l'étiquette"

**Attendu (étape 3) :**
- `POST /api/scan/label` → `200`
- Corps : `{ source: "label_declared_by_manufacturer", kcal, glucides, sucres, proteines, lipides, satures, sel, fibres }` (champs absents = `null`, jamais `0` inventé)
- Valeurs pré-remplies dans l'écran de confirmation
- Champ "Nom du produit" éditable
- Clic "Ajouter au journal" → entrée créée avec les valeurs extraites et la source affichée

**Résultat à rapporter :** statut HTTP de chaque étape, valeurs extraites (au moins kcal), produit visible dans le journal.

---

## T7 — Vocal sport (PROB 6)

**Contexte :** L'utilisateur est connecté.

**Action :** Ouvrir le Journal → bouton vocal (rapide actions) → prononcer :
> "J'ai couru 30 minutes"

**Attendu :**
- `POST /api/interpret` → `200`
- Corps : `intents[0].type = "activity"`, `intents[0].sport = "course"` (ou équivalent), `intents[0].duration_min = 30`
- Écran InterpretConfirm : l'intent est de type activité (pas alimentaire) — badge ambre/orange
- Confirmation → activité "course / 30 min" apparaît dans la section Activité du bilan
- Calories brûlées estimées (AL-02 MET : 9.0 × poids_kg × 0.5h) visibles
- L'anneau calorique est mis à jour (crédit activité)

**Résultat à rapporter :** statut HTTP, type/sport/duration_min dans la réponse, activité visible dans le bilan, calories brûlées affichées.

---

## Matrice de couverture

| Test | Prob | Composant frontend | Endpoint backend |
|------|------|--------------------|-----------------|
| T1   | 1,2  | InterpretConfirm (chips meal_type) | POST /api/interpret |
| T2   | 1    | FoodSearchSheet (chip horaire) | POST /api/journal |
| T3   | 3    | MealSectionCard (voir plus) | — |
| T4   | 4    | FoodSearchSheet (backend search) | GET /api/foods/search |
| T5   | 5a   | ScannerModal (caméra + manuel) | POST /api/scan |
| T6   | 5b   | ScannerModal (inconnu + étiquette) | POST /api/scan + POST /api/scan/label |
| T7   | 6    | VoiceInputModal → InterpretConfirm (activity) | POST /api/interpret |
