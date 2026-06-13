# SL-API — Contrat d'interface backend nutridz

> **À VÉRIFIER** contre l'API déployée avant branchement. Les shapes ci-dessous sont dérivés de
> SL-02 (cycle-v-nutrivita.md), AL-10, et SL-03 (conventions snake_case).

Base URL : `process.env.NEXT_PUBLIC_API_URL` (défaut `https://nutridz.onrender.com`)
Auth : cookie de session httpOnly (`credentials: 'include'`).

## POST /api/interpret
Input: `{ mode: "photo" | "voice" | "text", payload: string, lang?: "fr"|"ar"|"en", mimeType?: string }`
(`payload` = base64 pour photo, texte brut pour voice/text)

Output (SL-API-01 — contrat `type:"food"` officiel depuis P4.11) :
```json
{
  "intents": [
    {
      "type": "food",
      "name": "Chorba",
      "quantity_g": 300,
      "meal_type": "dejeuner",
      "confidence": 0.92,
      "needs_confirmation": false,
      "nutrition": {
        "kcal": 255,
        "glucides": 24,
        "proteines": 18,
        "lipides": 9,
        "fibres": 6,
        "source": "ciqual",
        "quantity_g": 300,
        "estimated_portion": false
      },
      "nutrition_found": true
    },
    {
      "type": "activity",
      "sport": "course",
      "duration_min": 30,
      "confidence": 0.88,
      "needs_confirmation": false
    },
    {
      "type": "glucose",
      "glucose_mg_dl": 115,
      "confidence": 0.95,
      "needs_confirmation": false
    }
  ]
}
```

**Notes contrat :**
- `needs_confirmation: true` si `confidence < 0.6` (par intent).
- `nutrition.quantity_g` = portion utilisée (issue de `quantity_g` de l'intent, ou 100 g par défaut).
- `estimated_portion: true` quand `quantity_g` absent de l'intent — la portion de 100 g est estimée.
- `nutrition.source` : `"ciqual"` (préféré) ou `"usda"` (fallback, préférence Foundation/SR Legacy sur Branded).
- `nutrition_found: false` si ni CIQUAL ni USDA ne trouvent l'aliment (jamais de fallback LLM).

## POST /api/scan
Input: `{ barcode: string }`
Output:
```json
{
  "barcode": "5449000000996",
  "name": "Coca-Cola 500ml",
  "nutri_score": "E",
  "score": 12,
  "verdict": "Mauvais",
  "additives": ["E150d", "E338"],
  "sucres": 10.6,
  "sel": 0.0,
  "ags": 0.0
}
```

## GET /api/groceries/summary
Output:
```json
{
  "products": [{ "barcode": "...", "name": "...", "nutri_score": "E", "score": 12, "verdict": "Mauvais", "additives": [], "sucres": 0, "sel": 0, "ags": 0, "times_this_month": 5 }],
  "total_sucres_g": 145.2,
  "total_sel_g": 23.8,
  "total_ags_g": 38.1
}
```

## GET /api/stats/deficiencies
Output:
```json
{
  "deficiencies": [
    { "nutrient": "Vitamine D", "status": "probable", "amount_pct": 42 },
    { "nutrient": "Fer", "status": "a_surveiller", "amount_pct": 63 }
  ],
  "period_days": 14
}
```

## POST /api/journal/query
Input: `{ date: "YYYY-MM-DD" }` — REG-03 : paramètre de santé en body, pas en query string.
Output: tableau de MealEntry backend (snake_case) :
```json
[{
  "id": "m1", "food_id": "42",
  "food": { "id": "42", "name": "Chorba", "cuisine": "Maghreb", "calories": 95, "protein": 5.2, "carbs": 12, "fat": 2.1, "source": "nutrivita" },
  "amount": 300, "meal_type": "lunch", "date": "2026-06-12", "created_at": "2026-06-12T12:15:00Z"
}]
```

## POST /api/journal
Input: `{ food_id, amount, meal_type, date }` — output: objet MealEntry backend.

## DELETE /api/journal/:id

## POST /api/weight/query
Input: `{ days: number }` — REG-03 : paramètre en body.
Output: `[{ "date": "2026-06-12", "weight_kg": 81.7, "body_fat": 21.3 }]`

## POST /api/weight
Input: `{ date, weight_kg, body_fat? }`

## POST /api/glucose/query
Input: `{ days: number }` — REG-03 : données glycémiques (cat. 9 RGPD) transmises en body chiffré.
Output: `[{ "id": "g1", "value": 92, "timestamp": "2026-06-12T07:00:00Z", "type": "fasting", "source": "manual" }]`
(valeurs toujours en mg/dL — AL-04)

## POST /api/glucose
Input: `{ value, timestamp, type, source }` (value en mg/dL)

## POST /api/activities/query
Input: `{ date: "YYYY-MM-DD" }` — REG-03 : paramètre en body.
Output: `[{ "id": "a1", "type": "Course", "duration": 35, "calories_burned": 310, "date": "2026-06-12", "source": "strava", "created_at": "2026-06-12T06:30:00Z" }]`

## POST /api/activities
Input: `{ type, duration, calories_burned, date, source }`

## DELETE /api/activities/:id
