/**
 * S20 — Observabilité frontend (Sentry / Next.js).
 * Tracé : EB (observabilité, threads/04-OBSERVABILITE.md) → REG-05 / Art. 9 RGPD.
 *
 * Vérifie les garde-fous impératifs :
 *  - `scrubEvent` retire TOUTE donnée de santé (glycémie) et PII avant envoi,
 *    même logique que le backend (`observability/sentry.js`).
 *  - Init désactivée proprement sans DSN (no-op, pas de crash).
 *  - Région UE : un DSN US par défaut est refusé ; un DSN EU est accepté.
 *  - `captureException` n'envoie rien si Sentry est désactivé.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import {
  scrubEvent,
  parseDsn,
  isEuDsn,
  buildEvent,
  initSentry,
  isEnabled,
  captureException,
  _resetForTests,
  type SentryEvent,
} from "../observability/sentry"

const EU_DSN = "https://abc123@o42.ingest.de.sentry.io/99"
const US_DSN = "https://abc123@o42.ingest.us.sentry.io/99"
const US_LEGACY_DSN = "https://abc123@o42.ingest.sentry.io/99"

const originalDsn = process.env.NEXT_PUBLIC_SENTRY_DSN

beforeEach(() => {
  _resetForTests()
  delete process.env.NEXT_PUBLIC_SENTRY_DSN
})

afterEach(() => {
  vi.restoreAllMocks()
  _resetForTests()
  if (originalDsn === undefined) delete process.env.NEXT_PUBLIC_SENTRY_DSN
  else process.env.NEXT_PUBLIC_SENTRY_DSN = originalDsn
})

describe("TU-S20-front · scrubEvent — exclusion glycémie & PII", () => {
  it("redacte récursivement la glycémie dans request.data", () => {
    const event: SentryEvent = {
      request: {
        data: {
          meal: "déjeuner",
          glucose_mg_dl: 142,
          nested: { reading: 6.2, value: 110, ok: "garde" },
          list: [{ glycemie: 1.4 }, { plain: "ok" }],
        },
      },
    }
    const out = scrubEvent(event) as SentryEvent
    const data = out.request!.data as Record<string, any>
    expect(data.glucose_mg_dl).toBe("[Filtered]")
    expect(data.nested.reading).toBe("[Filtered]")
    expect(data.nested.value).toBe("[Filtered]")
    expect(data.nested.ok).toBe("garde")
    expect(data.list[0].glycemie).toBe("[Filtered]")
    expect(data.list[1].plain).toBe("ok")
    expect(data.meal).toBe("déjeuner")
  })

  it("redacte les headers sensibles, cookies et query string", () => {
    const event: SentryEvent = {
      request: {
        headers: { Authorization: "Bearer x", "X-CSRF-Token": "y", Accept: "json" },
        cookies: "session=abc",
        query_string: "email=a%40b.com&glucose=140&page=2",
      },
    }
    const out = scrubEvent(event) as SentryEvent
    const h = out.request!.headers as Record<string, unknown>
    expect(h.Authorization).toBe("[Filtered]")
    expect(h["X-CSRF-Token"]).toBe("[Filtered]")
    expect(h.Accept).toBe("json")
    expect(out.request!.cookies).toBe("[Filtered]")
    expect(out.request!.query_string).toBe("email=[Filtered]&glucose=[Filtered]&page=2")
  })

  it("réduit user à son id interne (retire email/PII)", () => {
    const event: SentryEvent = {
      user: { id: "u1", email: "a@b.com", username: "ahmed", ip_address: "1.2.3.4" },
    }
    const out = scrubEvent(event) as SentryEvent
    expect(out.user).toEqual({ id: "u1" })
  })

  it("scrubbe extra et contexts", () => {
    const event: SentryEvent = {
      extra: { glucose: 99, note: "ok" },
      contexts: { state: { token: "secret", count: 3 } },
    }
    const out = scrubEvent(event) as SentryEvent
    expect((out.extra as any).glucose).toBe("[Filtered]")
    expect((out.extra as any).note).toBe("ok")
    expect((out.contexts as any).state.token).toBe("[Filtered]")
    expect((out.contexts as any).state.count).toBe(3)
  })

  it("ne boucle pas sur une structure cyclique", () => {
    const cyclic: any = { glucose: 5 }
    cyclic.self = cyclic
    const event: SentryEvent = { extra: cyclic }
    const out = scrubEvent(event) as SentryEvent
    expect((out.extra as any).glucose).toBe("[Filtered]")
  })

  it("tolère null/undefined", () => {
    expect(scrubEvent(null)).toBeNull()
    expect(scrubEvent(undefined)).toBeUndefined()
  })

  it("redacte glycémie/email/JWT dans le message ET la stacktrace de l'exception", () => {
    const event: SentryEvent = {
      message: "Erreur pour a@b.com",
      exception: {
        values: [
          {
            type: "Error",
            value: "Glycémie hors limites : 142 mg/dl pour a@b.com",
            stacktrace: { raw: "Error: glucose 142 mg/dl\n  at f (app.js:1)" },
          },
        ],
      },
    }
    const out = scrubEvent(event) as SentryEvent
    const ex = (out.exception as any).values[0]
    expect(ex.value).not.toContain("142 mg/dl")
    expect(ex.value).not.toContain("a@b.com")
    expect(ex.value).toContain("[Filtered]")
    expect(ex.stacktrace.raw).not.toContain("142 mg/dl")
    expect(ex.stacktrace.raw).toContain("at f (app.js:1)") // chemin de code conservé
    expect(out.message).not.toContain("a@b.com")
  })

  it("retire la query string et le fragment de request.url (token OAuth)", () => {
    const event: SentryEvent = {
      request: { url: "https://app.exemple.fr/reglages?code=secret_oauth&glucose=140#tok=xyz" },
    }
    const out = scrubEvent(event) as SentryEvent
    expect(out.request!.url).toBe("https://app.exemple.fr/reglages")
    expect(String(out.request!.url)).not.toContain("secret_oauth")
    expect(String(out.request!.url)).not.toContain("glucose")
  })
})

describe("TU-S20-front · parseDsn / isEuDsn — région UE", () => {
  it("parse un DSN valide en endpoint d'enveloppe", () => {
    const p = parseDsn(EU_DSN)
    expect(p).not.toBeNull()
    expect(p!.publicKey).toBe("abc123")
    expect(p!.projectId).toBe("99")
    expect(p!.host).toBe("o42.ingest.de.sentry.io")
    expect(p!.envelopeUrl).toContain("/api/99/envelope/")
    expect(p!.envelopeUrl).toContain("sentry_key=abc123")
  })

  it("renvoie null sur DSN vide ou malformé", () => {
    expect(parseDsn(undefined)).toBeNull()
    expect(parseDsn("")).toBeNull()
    expect(parseDsn("pas-une-url")).toBeNull()
  })

  it("accepte un hôte EU et un hôte self-hosted, refuse les hôtes US", () => {
    expect(isEuDsn("o42.ingest.de.sentry.io")).toBe(true)
    expect(isEuDsn("sentry.mondomaine.fr")).toBe(true)
    expect(isEuDsn("o42.ingest.us.sentry.io")).toBe(false)
    expect(isEuDsn("o42.ingest.sentry.io")).toBe(false)
  })
})

describe("TU-S20-front · initSentry — activation conditionnelle", () => {
  it("désactivé proprement sans DSN (no-op, false)", () => {
    expect(initSentry()).toBe(false)
    expect(isEnabled()).toBe(false)
  })

  it("activé avec un DSN EU présent", () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = EU_DSN
    expect(initSentry()).toBe(true)
    expect(isEnabled()).toBe(true)
  })

  it("refuse un DSN US (résidence des données hors UE)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    process.env.NEXT_PUBLIC_SENTRY_DSN = US_DSN
    expect(initSentry()).toBe(false)
    expect(isEnabled()).toBe(false)
    process.env.NEXT_PUBLIC_SENTRY_DSN = US_LEGACY_DSN
    _resetForTests()
    expect(initSentry()).toBe(false)
    warn.mockRestore()
  })
})

describe("TU-S20-front · buildEvent — event scrubbé", () => {
  it("construit un event d'exception et scrubbe l'extra sensible", () => {
    const ev = buildEvent(new Error("boom"), { glucose: 7, ctx: "home" })
    expect(ev.level).toBe("error")
    expect(ev.platform).toBe("javascript")
    const values = (ev.exception as any).values
    expect(values[0].value).toBe("boom")
    expect((ev.extra as any).glucose).toBe("[Filtered]")
    expect((ev.extra as any).ctx).toBe("home")
    expect(ev.event_id).toMatch(/^[0-9a-f]{32}$/)
  })
})

describe("TU-S20-front · captureException — désactivation propre", () => {
  it("n'appelle pas fetch quand Sentry est désactivé (pas de DSN)", () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    expect(() => captureException(new Error("x"))).not.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it("envoie une enveloppe scrubbée à l'endpoint EU quand activé", () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = EU_DSN
    const fetchMock = vi.fn((_url: unknown, _opts?: RequestInit) =>
      Promise.resolve({} as Response),
    )
    vi.stubGlobal("fetch", fetchMock)
    initSentry()
    captureException(new Error("boom"), { glucose: 5 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, opts] = fetchMock.mock.calls[0]
    expect(String(url)).toContain("ingest.de.sentry.io")
    expect(String(url)).toContain("/envelope/")
    const body = String((opts as RequestInit).body)
    expect(body).toContain('"type":"event"')
    expect(body).toContain("[Filtered]")
    expect(body).not.toContain('"glucose":5')
    vi.unstubAllGlobals()
  })
})
