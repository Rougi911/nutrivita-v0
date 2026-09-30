import { afterEach, describe, expect, it, vi } from "vitest"
import { getProfile, getStravaConnectUrl } from "../api"
import { getToken, setToken, removeToken } from "../auth"
import { demoRequest } from "../ui-demo"
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })
describe("TI-UI-03 / SL-UI — preview isolation", () => {
  it("uses fixture data without making any HTTP request", async () => {
    vi.stubEnv("NEXT_PUBLIC_UI_DEMO", "true")
    const network=vi.fn();vi.stubGlobal("fetch",network)
    expect((await getProfile()).user?.email).toBe("demo@example.invalid")
    expect(network).not.toHaveBeenCalled()
  })
  it("never falls back to the real API for unsupported actions", async () => {
    vi.stubEnv("NEXT_PUBLIC_UI_DEMO", "true")
    const network=vi.fn();vi.stubGlobal("fetch",network)
    await expect(getStravaConnectUrl()).rejects.toThrow(/unsupported/)
    expect(network).not.toHaveBeenCalled()
  })
  it("does not read, write or remove a real account token", () => {
    vi.stubEnv("NEXT_PUBLIC_UI_DEMO", "true")
    const storage={getItem:vi.fn(),setItem:vi.fn(),removeItem:vi.fn()}
    vi.stubGlobal("window",{localStorage:storage});vi.stubGlobal("localStorage",storage)
    expect(getToken()).toBe("ui-demo-not-a-real-token")
    setToken("sensitive");removeToken()
    expect(storage.getItem).not.toHaveBeenCalled();expect(storage.setItem).not.toHaveBeenCalled();expect(storage.removeItem).not.toHaveBeenCalled()
  })
  it("reflects a new entry in its in-memory journal", async () => {
    const date="2026-09-01"
    const row=await demoRequest<{id:string}>("/api/journal",{method:"POST",body:JSON.stringify({food_id:"1",amount:123,meal_type:"lunch",date})})
    const items=await demoRequest<{id:string;amount:number}[]>("/api/journal/query",{method:"POST",body:JSON.stringify({date})})
    expect(items.find(m=>m.id===row.id)?.amount).toBe(123)
    await demoRequest(`/api/journal/${row.id}`,{method:"DELETE"})
  })
})
