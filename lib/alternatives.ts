import type { ScannedProduct } from "@/lib/types"

/**
 * S12 — Produit scanné le moins bien noté (plus petit `score`), référence pour
 * proposer des alternatives plus saines. Les produits « non notés » (`score`
 * null, P1-7) sont ignorés : sans note, ils ne sont ni « le pire » ni exploitables.
 * Retourne null si aucun produit noté (→ bouton désactivé).
 */
export function pickWorstProduct(products: ScannedProduct[]): ScannedProduct | null {
  let worst: ScannedProduct | null = null
  for (const p of products) {
    if (p.score == null) continue
    if (worst == null || p.score < (worst.score ?? Infinity)) worst = p
  }
  return worst
}
