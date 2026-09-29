import { afterEach, describe, expect, it, vi } from "vitest"
import { withPortion } from "../interpret-portion"
import { readViewMode, writeViewMode, VIEW_MODE_KEY } from "../view-mode"
import type { ApiIntent } from "../api-types"
const intent: ApiIntent = {
  type: "food",
  name: "Riz cuit",
  quantity_g: 200,
  confidence: 0.8,
  needs_confirmation: true,
  nutrition: {
    kcal: 260,
    glucides: 56,
    proteines: 5,
    lipides: 0.6,
    fibres: 2,
    sel: 0.1,
    source: "ciqual",
    quantity_g: 200,
    estimated_portion: true,
  },
}
afterEach(() => vi.unstubAllGlobals())
describe("TU-UI-01 / EB-01 / AL-10 — portion correction", () => {
  it("rescales all per-portion nutrients without mutating the API response", () => {
    const corrected = withPortion(intent, 100)
    expect(corrected.nutrition).toMatchObject({
      kcal: 130,
      glucides: 28,
      proteines: 2.5,
      lipides: 0.3,
      fibres: 1,
      sel: 0.05,
      quantity_g: 100,
    })
    expect(intent.nutrition?.kcal).toBe(260)
  })
  it.each([0, -1, NaN, Infinity, 5001])("rejects invalid grams %s", (grams) =>
    expect(() => withPortion(intent, grams)).toThrow()
  )
  it("preserves missing nutrition as unknown", () =>
    expect(
      withPortion({ ...intent, nutrition: null }, 150).nutrition
    ).toBeNull())
})
describe("TU-UI-02 / EB-12,14 / SL-UI — detail preference", () => {
  it("does not require a browser for SSR", () =>
    expect(readViewMode()).toBe("summary"))
  it("restores details and safely ignores unknown values", () => {
    const data = new Map<string, string>()
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => data.get(k),
        setItem: (k: string, v: string) => data.set(k, v),
      },
    })
    writeViewMode("details")
    expect(readViewMode()).toBe("details")
    data.set(VIEW_MODE_KEY, "corrupt")
    expect(readViewMode()).toBe("summary")
  })
  it("keeps working if localStorage is blocked", () => {
    vi.stubGlobal("window", {
      get localStorage() {
        throw new Error("blocked")
      },
    })
    expect(readViewMode()).toBe("summary")
    expect(() => writeViewMode("details")).not.toThrow()
  })
})
