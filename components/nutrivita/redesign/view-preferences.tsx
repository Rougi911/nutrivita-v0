"use client"
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react"
import { LayoutList, SlidersHorizontal, ChevronDown } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { uiCopy } from "@/lib/redesign-copy"
import { readViewMode, writeViewMode, type ViewMode } from "@/lib/view-mode"
const ViewContext = createContext<{
  mode: ViewMode
  setMode: (mode: ViewMode) => void
}>({ mode: "summary", setMode: () => {} })
export function ViewPreferences({ children }: { children: ReactNode }) {
  const [mode, updateMode] = useState<ViewMode>("summary")
  useEffect(() => {
    updateMode(readViewMode())
  }, [])
  return (
    <ViewContext.Provider
      value={{
        mode,
        setMode: (value) => {
          updateMode(value)
          writeViewMode(value)
        },
      }}
    >
      {children}
    </ViewContext.Provider>
  )
}
export const useViewMode = () => useContext(ViewContext)
export function ViewModeSwitch({ hint = false }: { hint?: boolean }) {
  const { language } = useApp()
  const c = uiCopy(language)
  const { mode, setMode } = useViewMode()
  return (
    <div className="nv-view-switch">
      <div className="nv-segment" role="group" aria-label={c.view}>
        {(["summary", "details"] as const).map((value) => {
          const Icon = value === "summary" ? LayoutList : SlidersHorizontal
          return (
            <button
              type="button"
              key={value}
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
            >
              <Icon size={16} aria-hidden="true" />
              {c[value]}
            </button>
          )
        })}
      </div>
      {hint && <p className="nv-caption mt-2">{c.viewHint}</p>}
    </div>
  )
}
/** A display preference controls the initial disclosure, never the underlying data. */
export function IndicatorSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  const { mode } = useViewMode()
  const [open, setOpen] = useState(mode === "details")
  const id = useId()
  useEffect(() => {
    setOpen(mode === "details")
  }, [mode])
  return (
    <section className="nv-disclosure">
      <button
        type="button"
        className="nv-disclosure-button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <span>
          <span className="nv-section-title">{title}</span>
          {description && (
            <span className="nv-caption block mt-1">{description}</span>
          )}
        </span>
        <ChevronDown
          size={20}
          className={open ? "rotate-180 shrink-0" : "shrink-0"}
        />
      </button>
      <div id={id} hidden={!open}>
        {open && <div className="nv-disclosure-content">{children}</div>}
      </div>
    </section>
  )
}
