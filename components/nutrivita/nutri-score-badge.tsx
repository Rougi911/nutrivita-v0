/** Badge Nutri-Score officiel (A–E). null/inconnu → ne rend rien. */
export function NutriScoreBadge({ score }: { score: "A" | "B" | "C" | "D" | "E" | null }) {
  if (!score) return null
  const colors: Record<string, { bg: string; text: string }> = {
    A: { bg: "#038141", text: "#fff" },
    B: { bg: "#85BB2F", text: "#fff" },
    C: { bg: "#FECB02", text: "#000" },
    D: { bg: "#EE8100", text: "#fff" },
    E: { bg: "#E63312", text: "#fff" },
  }
  const c = colors[(score ?? "").toUpperCase()] ?? { bg: "var(--muted)", text: "var(--muted-foreground)" }
  return (
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {(score ?? "").toUpperCase()}
    </div>
  )
}
