/**
 * S15 — Catalogue de condiments/sauces côté client (UX du sélecteur).
 * Les valeurs nutritionnelles réelles viennent du backend (seed `products`,
 * résolu via /api/foods/search → product_id réel). Ce fichier ne sert qu'à :
 *  - proposer des raccourcis « condiments courants » dans le sélecteur ;
 *  - pré-remplir la PORTION par défaut (le backend n'expose pas encore
 *    portion_default_g via la recherche ; fallback 15 g sinon).
 * Noms en français = noms du seed backend (la recherche matche par nom).
 */
export interface CondimentDef {
  name: string
  /** Portion par défaut indicative (g). */
  portionG: number
}

export const DEFAULT_CONDIMENT_PORTION_G = 15

export const CONDIMENTS: CondimentDef[] = [
  // Sauces froides / émulsionnées
  { name: "Mayonnaise", portionG: 15 }, { name: "Aïoli", portionG: 15 },
  { name: "Sauce tartare", portionG: 15 }, { name: "Sauce cocktail", portionG: 15 },
  { name: "Sauce andalouse", portionG: 15 }, { name: "Sauce samouraï", portionG: 15 },
  { name: "Sauce algérienne", portionG: 15 }, { name: "Sauce burger", portionG: 15 },
  { name: "Sauce César", portionG: 15 }, { name: "Sauce blanche", portionG: 25 },
  { name: "Sauce au yaourt", portionG: 25 }, { name: "Vinaigrette", portionG: 10 },
  { name: "Pesto", portionG: 15 }, { name: "Tapenade", portionG: 15 },
  { name: "Houmous", portionG: 30 }, { name: "Guacamole", portionG: 30 },
  // Sauces tomate / chaudes
  { name: "Ketchup", portionG: 15 }, { name: "Sauce tomate", portionG: 50 },
  { name: "Bolognaise", portionG: 80 }, { name: "Barbecue", portionG: 20 },
  { name: "Aigre-douce", portionG: 30 }, { name: "Curry", portionG: 40 },
  { name: "Satay", portionG: 30 }, { name: "Béchamel", portionG: 50 },
  { name: "Sauce fromage", portionG: 50 }, { name: "Sauce poivre", portionG: 40 },
  { name: "Sauce champignons", portionG: 50 }, { name: "Hollandaise", portionG: 30 },
  { name: "Béarnaise", portionG: 30 }, { name: "Gravy", portionG: 50 },
  { name: "Chimichurri", portionG: 15 },
  // Asiatiques / pimentées
  { name: "Sauce soja", portionG: 10 }, { name: "Teriyaki", portionG: 15 },
  { name: "Nuoc-mâm", portionG: 10 }, { name: "Sriracha", portionG: 10 },
  { name: "Tabasco", portionG: 5 }, { name: "Sambal oelek", portionG: 10 },
  { name: "Sauce chili sucrée", portionG: 15 }, { name: "Wasabi", portionG: 5 },
  { name: "Sauce huître", portionG: 15 },
  // Maghreb / local
  { name: "Harissa", portionG: 10 }, { name: "Dersa", portionG: 10 },
  { name: "Chermoula", portionG: 15 }, { name: "Smen", portionG: 5 },
  { name: "Felfel", portionG: 30 },
  // Condiments / assaisonnements
  { name: "Huile d'olive", portionG: 10 }, { name: "Huile de tournesol", portionG: 10 },
  { name: "Beurre", portionG: 10 }, { name: "Vinaigre balsamique", portionG: 10 },
  { name: "Vinaigre de cidre", portionG: 10 }, { name: "Jus de citron", portionG: 5 },
  { name: "Moutarde douce", portionG: 10 }, { name: "Moutarde forte", portionG: 10 },
  { name: "Moutarde à l'ancienne", portionG: 10 }, { name: "Miel", portionG: 15 },
  { name: "Sirop d'érable", portionG: 15 }, { name: "Confiture", portionG: 15 },
  { name: "Chutney", portionG: 20 }, { name: "Worcestershire", portionG: 10 },
  { name: "Sauce HP", portionG: 15 }, { name: "Relish", portionG: 15 },
  { name: "Cornichons", portionG: 20 }, { name: "Câpres", portionG: 10 },
  { name: "Olives", portionG: 20 }, { name: "Tahini", portionG: 15 },
  { name: "Levure maltée", portionG: 5 }, { name: "Raifort", portionG: 10 },
  { name: "Ail", portionG: 5 }, { name: "Gingembre", portionG: 5 },
  { name: "Sel", portionG: 1 }, { name: "Poivre", portionG: 1 },
]

/** Portion par défaut (g) pour un condiment donné, par nom (insensible à la casse), sinon 15 g. */
export function defaultPortionG(name: string): number {
  const norm = name.trim().toLowerCase()
  const found = CONDIMENTS.find((c) => c.name.toLowerCase() === norm)
  return found?.portionG ?? DEFAULT_CONDIMENT_PORTION_G
}
