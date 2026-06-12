# SL-API — Contrat d'interface backend nutridz

> **À VÉRIFIER** contre l'API déployée avant branchement. Les shapes ci-dessous sont dérivés de
> SL-02 (cycle-v-nutrivita.md), AL-10, et SL-03 (conventions snake_case).

Base URL : `process.env.NEXT_PUBLIC_API_URL` (défaut `https://nutridz.onrender.com`)
Auth : cookie de session httpOnly (`credentials: 'include'`).

## POST /api/interpret
Input: `{ mode: "photo" | "voice", content: string }` (content = base64 pour photo, texte pour voix)
Output (AL-10):
```json
{
  "intents": [
    { "type": "meal", "items": [{ "name": "Chorba", "quantity_g": 300 }], "confidence": 0.92 },
    { "type": "activity", "sport": "course", "duration_min": 30, "confidence": 0.88 },
    { "type": "glucose", "valeur": 1.15, "unite": "g/L", "contexte": "pontuelle", "confidence": 0.95 }
  ],
  "needs_confirmation": false
}
```
`needs_confirmation: true` si confidence < 0.6 sur au moins un intent → confirmation obligatoire.

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

## GET /api/journal?date=YYYY-MM-DD
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

## GET /api/weight?days=30
Output: `[{ "date": "2026-06-12", "weight_kg": 81.7, "body_fat": 21.3 }]`

## POST /api/weight
Input: `{ date, weight_kg, body_fat? }`

## GET /api/glucose?days=14
Output: `[{ "id": "g1", "value": 92, "timestamp": "2026-06-12T07:00:00Z", "type": "fasting", "source": "manual" }]`
(valeurs toujours en mg/dL — AL-04)

## POST /api/glucose
Input: `{ value, timestamp, type, source }` (value en mg/dL)

## GET /api/activities?date=YYYY-MM-DD
Output: `[{ "id": "a1", "type": "Course", "duration": 35, "calories_burned": 310, "date": "2026-06-12", "source": "strava", "created_at": "2026-06-12T06:30:00Z" }]`

## POST /api/activities
Input: `{ type, duration, calories_burned, date, source }`

## DELETE /api/activities/:id
