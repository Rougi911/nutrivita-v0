import type { AdditiveRef } from "@/lib/types"

type RiskLevel = "high" | "moderate" | "low" | "unknown" | null | undefined

/** Normalise un additif vers { code, name?, risk? }. Accepte objet ou chaîne. Ne crashe jamais. */
export function normalizeAdditive(
  a: AdditiveRef | null | undefined,
): { code: string; name?: string; risk?: RiskLevel } {
  if (a == null) return { code: "" }
  if (typeof a === "string") return { code: a.trim() }
  if (typeof a === "object") return { code: (a.code ?? "").trim(), name: a.name, risk: a.risk }
  return { code: String(a) }
}

/** Renvoie uniquement le code (comparaisons / join). */
export function additiveCode(a: AdditiveRef | null | undefined): string {
  return normalizeAdditive(a).code
}

const RISK_COLORS: Record<string, string> = {
  high:     "#DC2626",
  moderate: "#D97706",
  low:      "#1D9E75",
}

/** Couleur CSS pour un niveau de risque. Gris neutre si absent/inconnu. Ne crashe jamais. */
export function additiveRiskColor(risk: RiskLevel): string {
  if (risk && RISK_COLORS[risk]) return RISK_COLORS[risk]
  return "var(--muted-foreground)"
}
