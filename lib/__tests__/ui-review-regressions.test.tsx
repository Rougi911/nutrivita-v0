import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"
import { readProfileName, writeProfileName, clearProfileName } from "../profile-name-cache"
const state = vi.hoisted(() => ({ glucoseReadings: [] as {value:number;timestamp:string}[], t:(key:string)=>key }))
vi.mock("@/lib/app-context", () => ({useApp:()=>state}))
import { GlucoseLowAlert } from "@/components/nutrivita/redesign/glucose-low-alert"
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals()})
describe("review regressions",()=>{
  it("does not consult or mutate a prefilled real profile cache in demo",()=>{
    vi.stubEnv("NEXT_PUBLIC_UI_DEMO","true")
    const storage={getItem:vi.fn(()=>"REAL PRIVATE NAME"),setItem:vi.fn(),removeItem:vi.fn()}
    vi.stubGlobal("window",{localStorage:storage})
    expect(readProfileName()).toBeNull();writeProfileName("Demo");clearProfileName()
    expect(storage.getItem).not.toHaveBeenCalled();expect(storage.setItem).not.toHaveBeenCalled();expect(storage.removeItem).not.toHaveBeenCalled()
  })
  it("keeps normal profile caching outside demo",()=>{
    vi.stubEnv("NEXT_PUBLIC_UI_DEMO","")
    const storage={getItem:vi.fn(()=>"Name"),setItem:vi.fn(),removeItem:vi.fn()}
    vi.stubGlobal("window",{localStorage:storage})
    expect(readProfileName()).toBe("Name");writeProfileName("New");clearProfileName()
    expect(storage.setItem).toHaveBeenCalledWith("nutrivita-profile-name","New");expect(storage.removeItem).toHaveBeenCalledWith("nutrivita-profile-name")
  })
  it("renders the existing low warning independently of collapsible charts, respecting period and threshold",()=>{
    state.glucoseReadings=[{value:53,timestamp:new Date().toISOString()},{value:54,timestamp:new Date().toISOString()},{value:50,timestamp:new Date(Date.now()-20*86400000).toISOString()}]
    const short=renderToStaticMarkup(<GlucoseLowAlert period="14d" />)
    expect(short).toContain('role="alert"');expect(short).toContain("1 hypoAlert");expect(short).toContain("periodLabel14d")
    expect(renderToStaticMarkup(<GlucoseLowAlert period="30d" />)).toContain("2 hypoAlert")
    state.glucoseReadings=[{value:54,timestamp:new Date().toISOString()}]
    expect(renderToStaticMarkup(<GlucoseLowAlert period="14d" />)).toBe("")
  })
})
