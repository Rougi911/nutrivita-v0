import type { AdditiveRef } from "@/lib/types"

/** Normalise un additif vers { code, name? }. Accepte objet {code,name} (/api/scan)
 *  ou chaîne legacy ("E150d"). Ne crashe jamais. */
export function normalizeAdditive(
  a: AdditiveRef | null | undefined,
): { code: string; name?: string } {
  if (a == null) return { code: "" }
  if (typeof a === "string") return { code: a.trim() }
  if (typeof a === "object") return { code: (a.code ?? "").trim(), name: a.name }
  return { code: String(a) }
}

/** Renvoie uniquement le code (comparaisons / join). */
export function additiveCode(a: AdditiveRef | null | undefined): string {
  return normalizeAdditive(a).code
}
