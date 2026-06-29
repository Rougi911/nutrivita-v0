// S27 — Suggestions d'aliments naturels & de saison (France) pour combler les carences.
// Les clés correspondent à celles du radar micronutriments : vitC, vitD, b9, b12, iron,
// calcium, magnesium, zinc. Ainsi le bouton propose des aliments pour EXACTEMENT les
// nutriments que le radar signale (< 70 % VNR), zinc et vitamine C compris.

const NUTRIENT_FOODS: Record<string, string[]> = {
  iron:      ["lentilles", "épinard", "pois chiches", "persil", "tofu", "haricots blancs"],
  calcium:   ["chou kale", "brocoli", "épinard", "amandes", "figue séchée"],
  vitD:      ["champignons", "œuf"],
  b12:       ["levure alimentaire enrichie", "produits enrichis"],
  magnesium: ["épinard", "banane", "haricots noirs", "amandes", "chocolat noir", "graines de courge"],
  b9:        ["épinard", "asperge", "brocoli", "lentilles", "orange", "avocat"],
  zinc:      ["graines de courge", "lentilles", "pois chiches", "noix de cajou", "flocons d'avoine", "graines de sésame"],
  vitC:      ["orange", "kiwi", "poivron", "brocoli", "fraise", "persil"],
}

// Saison France (mois 1-12). null = disponible toute l'année (légumineuse sèche, oléagineux, enrichi…).
const SEASON_FR: Record<string, number[] | null> = {
  "lentilles": null, "pois chiches": null, "tofu": null, "haricots blancs": null,
  "haricots noirs": null, "amandes": null, "figue séchée": null, "graines de courge": null,
  "chocolat noir": null, "œuf": null, "levure alimentaire enrichie": null, "produits enrichis": null,
  "banane": null, "avocat": null, "noix de cajou": null, "flocons d'avoine": null, "graines de sésame": null,
  "épinard": [1, 2, 3, 4, 5, 9, 10, 11, 12],
  "persil": [4, 5, 6, 7, 8, 9, 10],
  "chou kale": [10, 11, 12, 1, 2, 3],
  "brocoli": [6, 7, 8, 9, 10, 11],
  "champignons": [9, 10, 11, 12, 1],
  "asperge": [4, 5, 6],
  "orange": [11, 12, 1, 2, 3, 4],
  "kiwi": [11, 12, 1, 2, 3, 4, 5],
  "poivron": [6, 7, 8, 9, 10],
  "fraise": [5, 6, 7],
}

export function isInSeason(name: string, month: number): boolean {
  const s = SEASON_FR[name]
  return s == null ? true : s.includes(month)
}

export interface NutrientSuggestion {
  key: string
  label: string
  foods: string[]
}

// Pour les nutriments carencés (clé radar + libellé), renvoie jusqu'à `max` aliments DE SAISON
// (ou disponibles toute l'année). Si aucun n'est de saison ce mois-ci, on retombe sur la liste
// complète pour ne jamais laisser une carence sans proposition.
export function suggestSeasonalFoods(
  nutrients: { key: string; label: string }[],
  month: number,
  max = 4,
): NutrientSuggestion[] {
  const out: NutrientSuggestion[] = []
  for (const n of nutrients) {
    const all = NUTRIENT_FOODS[n.key] || []
    if (all.length === 0) continue
    const seasonal = all.filter((f) => isInSeason(f, month))
    const foods = (seasonal.length ? seasonal : all).slice(0, max)
    out.push({ key: n.key, label: n.label, foods })
  }
  return out
}
