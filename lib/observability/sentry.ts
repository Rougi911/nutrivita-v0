/**
 * S20 — Observabilité frontend (Sentry / Next.js).
 *
 * Garde-fous (impératifs, voir threads/04-OBSERVABILITE.md), alignés sur le
 * module backend `observability/sentry.js` :
 *  - Activé **uniquement** si `NEXT_PUBLIC_SENTRY_DSN` est présent. Sinon : no-op
 *    total, aucun crash (init renvoie false, capture ne fait rien).
 *  - Région **UE** : la résidence des données dépend du DSN. On **refuse** un DSN
 *    pointant vers la région US par défaut de Sentry (`ingest.us.sentry.io` ou
 *    `ingest.sentry.io`) → seul un DSN EU (`ingest.de.sentry.io`) ou self-hosted
 *    EU active l'envoi. Aucune donnée ne part vers les US.
 *  - **Jamais** de donnée de santé (glycémie) ni de PII brute (email, tokens,
 *    cookies, Authorization) envoyée à Sentry → `scrubEvent` filtre tout champ
 *    sensible AVANT envoi. Reprend la logique du backend (clés sensibles,
 *    redaction récursive anti-cycle) et la **durcit** côté client : redaction
 *    aussi du texte libre (message/stacktrace d'exception) et de `request.url`
 *    (query string + fragment retirés) — vecteurs de fuite propres au front.
 *  - Intégration **sans SDK** (aucune dépendance ajoutée) : on n'envoie QUE les
 *    erreurs explicitement capturées, scrubbées. Pas de breadcrumbs/console/réseau
 *    auto-captés qui pourraient fuiter une valeur de glycémie.
 *
 * `scrubEvent`, `parseDsn` et `isEuDsn` sont exportés (fonctions pures, testables
 * sans réseau).
 */

// Clés considérées sensibles (comparaison insensible à la casse, en sous-chaîne).
// On préfère sur-redacter (sécurité > confort de debug) : aucune valeur de
// glycémie ni PII ne doit jamais transiter par Sentry. Liste alignée backend.
const SENSITIVE_KEY_PATTERNS = [
  // PII / secrets
  "password", "passwd", "pwd", "secret", "token", "authorization", "auth",
  "cookie", "csrf", "jwt", "bearer", "session", "apikey", "api_key", "vapid",
  "email", "mail", "username", "phone", "ip_address",
  // Données de santé (glycémie) — Art. 9 RGPD
  "glucose", "glycemi", "glycaemi", "bloodsugar", "blood_sugar",
  "mgdl", "mg/dl", "mmol", "reading", "value",
] as const

const REDACTED = "[Filtered]"

export interface SentryEvent {
  event_id?: string
  timestamp?: number
  platform?: string
  level?: string
  environment?: string
  request?: {
    url?: string
    headers?: Record<string, unknown>
    cookies?: unknown
    query_string?: unknown
    data?: unknown
  }
  user?: { id?: unknown; [k: string]: unknown }
  extra?: unknown
  contexts?: unknown
  exception?: unknown
  [k: string]: unknown
}

function isSensitiveKey(key: string): boolean {
  const k = String(key).toLowerCase()
  return SENSITIVE_KEY_PATTERNS.some((p) => k.includes(p))
}

// Redacte récursivement les valeurs des clés sensibles d'un objet/tableau.
// Gère les structures cycliques via un WeakSet.
function redactDeep(node: unknown, seen: WeakSet<object>): unknown {
  if (node === null || typeof node !== "object") return node
  if (seen.has(node as object)) return node
  seen.add(node as object)

  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      node[i] = redactDeep(node[i], seen)
    }
    return node
  }

  const obj = node as Record<string, unknown>
  for (const key of Object.keys(obj)) {
    if (isSensitiveKey(key)) {
      obj[key] = REDACTED
    } else {
      obj[key] = redactDeep(obj[key], seen)
    }
  }
  return obj
}

// Redacte les sous-chaînes sensibles d'un texte libre (message d'exception,
// stacktrace). Indispensable : un `throw new Error("glycémie 142 mg/dl pour
// a@b.com")` ne doit JAMAIS partir tel quel. On neutralise emails, jetons (JWT)
// et toute valeur ressemblant à une glycémie (avec unité ou précédée d'un mot clé).
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
const JWT_RE = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g
const GLUCOSE_UNIT_RE = /\d+(?:[.,]\d+)?\s?(?:mg\s?\/?\s?dl|mmol\s?\/?\s?l|g\s?\/?\s?l)\b/gi
const GLUCOSE_KEYWORD_RE =
  /\b(?:gluc\w*|glyc\w*|glyca\w*|sucre|sugar|reading)\b[^\dA-Za-z]{0,4}\d+(?:[.,]\d+)?/gi

export function redactText(input: unknown): unknown {
  if (typeof input !== "string" || input.length === 0) return input
  return input
    .replace(EMAIL_RE, REDACTED)
    .replace(JWT_RE, REDACTED)
    .replace(GLUCOSE_UNIT_RE, REDACTED)
    .replace(GLUCOSE_KEYWORD_RE, REDACTED)
}

// Retire la query string et le fragment d'une URL (peuvent porter un token OAuth,
// un magic-link, ou un paramètre de valeur). On ne garde que origin + chemin.
function sanitizeUrl(url: unknown): unknown {
  if (typeof url !== "string" || url.length === 0) return url
  try {
    const u = new URL(url)
    // Chemin conservé mais redacté (une PII pourrait s'y glisser : /reset/a@b.com).
    return `${u.origin}${redactText(u.pathname)}`
  } catch {
    // URL relative/malformée → on redacte une éventuelle query/fragment à la main.
    return redactText(url.split(/[?#]/)[0])
  }
}

// Redacte les paramètres sensibles d'une query string `a=1&b=2`.
function redactQueryString(qs: unknown): unknown {
  if (typeof qs !== "string" || qs.length === 0) return qs
  return qs
    .split("&")
    .map((pair) => {
      const eq = pair.indexOf("=")
      const name = eq === -1 ? pair : pair.slice(0, eq)
      let decoded = name
      try {
        decoded = decodeURIComponent(name)
      } catch {
        // valeur mal encodée → on teste le nom brut
      }
      if (isSensitiveKey(decoded)) {
        return `${name}=${REDACTED}`
      }
      return pair
    })
    .join("&")
}

/**
 * Retire toute donnée sensible de l'event avant envoi. Mutation en place puis
 * retour de l'event. Même logique que le `beforeSend` backend.
 */
export function scrubEvent(event: SentryEvent | null | undefined): SentryEvent | null | undefined {
  if (event === null || typeof event !== "object") return event
  const seen = new WeakSet<object>()

  if (event.request && typeof event.request === "object") {
    const req = event.request
    if (req.headers && typeof req.headers === "object") {
      for (const h of Object.keys(req.headers)) {
        if (isSensitiveKey(h)) req.headers[h] = REDACTED
      }
    }
    if (req.url !== undefined) req.url = sanitizeUrl(req.url) as string | undefined
    if (req.cookies !== undefined) req.cookies = REDACTED
    if (req.query_string !== undefined) {
      req.query_string = redactQueryString(req.query_string)
    }
    if (req.data !== undefined) req.data = redactDeep(req.data, seen)
  }

  // Message d'exception + stacktrace = texte libre → redaction par motifs.
  if (typeof event.message === "string") event.message = redactText(event.message) as string
  if (event.exception && typeof event.exception === "object") {
    const values = (event.exception as { values?: unknown }).values
    if (Array.isArray(values)) {
      for (const v of values) {
        if (v && typeof v === "object") {
          const ex = v as { value?: unknown; stacktrace?: { raw?: unknown } }
          if (typeof ex.value === "string") ex.value = redactText(ex.value)
          if (ex.stacktrace && typeof ex.stacktrace === "object" && typeof ex.stacktrace.raw === "string") {
            ex.stacktrace.raw = redactText(ex.stacktrace.raw)
          }
        }
      }
    }
  }

  if (event.user && typeof event.user === "object") {
    // On conserve l'id interne (utile au debug, non-PII) ; on retire le reste.
    const id = event.user.id
    event.user = id === undefined ? {} : { id }
  }

  if (event.extra !== undefined) event.extra = redactDeep(event.extra, seen)
  if (event.contexts !== undefined) event.contexts = redactDeep(event.contexts, seen)

  return event
}

export interface ParsedDsn {
  publicKey: string
  host: string
  projectId: string
  /** Endpoint d'ingestion (enveloppe) Sentry. */
  envelopeUrl: string
}

/**
 * Parse un DSN Sentry `https://<publicKey>@<host>/<projectId>`.
 * Renvoie null si le DSN est vide ou malformé (→ Sentry restera désactivé).
 */
export function parseDsn(dsn: string | undefined | null): ParsedDsn | null {
  if (!dsn || typeof dsn !== "string") return null
  try {
    const url = new URL(dsn)
    const publicKey = url.username
    const host = url.host
    const projectId = url.pathname.replace(/^\/+/, "").split("/").pop() || ""
    if (!publicKey || !host || !projectId) return null
    const envelopeUrl = `${url.protocol}//${host}/api/${projectId}/envelope/?sentry_key=${publicKey}&sentry_version=7`
    return { publicKey, host, projectId, envelopeUrl }
  } catch {
    return null
  }
}

/**
 * Garde « résidence des données en UE » par liste d'autorisation.
 * - SaaS Sentry (`*.sentry.io`) : SEULE la région UE `*.ingest.de.sentry.io`
 *   est autorisée → toute autre région (US par défaut, `ingest.us…`) est refusée.
 * - Hôte self-hosted (domaine custom) : autorisé, mais la résidence UE relève
 *   alors du proprio (à confirmer au registre des traitements).
 */
export function isEuDsn(host: string): boolean {
  const h = host.toLowerCase()
  if (h === "sentry.io" || h.endsWith(".sentry.io")) {
    return /(^|\.)ingest\.de\.sentry\.io$/.test(h)
  }
  return true
}

let parsed: ParsedDsn | null = null
let enabled = false
let initialized = false

/**
 * Initialise (idempotent) la config Sentry depuis `NEXT_PUBLIC_SENTRY_DSN`.
 * Renvoie true si l'envoi est activé. No-op + false si DSN absent ou non-UE.
 */
export function initSentry(): boolean {
  if (initialized) return enabled
  initialized = true

  const dsn =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SENTRY_DSN : undefined
  const p = parseDsn(dsn)
  if (!p) {
    enabled = false
    return false
  }
  if (!isEuDsn(p.host)) {
    // DSN US → on refuse l'envoi (résidence des données hors UE).
    if (typeof console !== "undefined") {
      console.warn(
        "[sentry] DSN non-UE détecté → observabilité désactivée (résidence des données hors UE).",
      )
    }
    enabled = false
    return false
  }
  parsed = p
  enabled = true
  return true
}

export function isEnabled(): boolean {
  return enabled
}

// Réinitialise l'état interne (tests uniquement).
export function _resetForTests(): void {
  parsed = null
  enabled = false
  initialized = false
}

function randomEventId(): string {
  // 32 hex chars (format event_id Sentry), sans dépendance crypto stricte.
  const c =
    typeof globalThis !== "undefined" &&
    (globalThis.crypto as Crypto | undefined)?.getRandomValues
      ? globalThis.crypto
      : undefined
  if (c) {
    const bytes = new Uint8Array(16)
    c.getRandomValues(bytes)
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
  }
  let s = ""
  for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16)
  return s
}

/**
 * Construit un event Sentry minimal à partir d'une erreur, puis le scrubbe.
 * Pur/testable.
 */
export function buildEvent(error: unknown, extra?: Record<string, unknown>): SentryEvent {
  const err = error instanceof Error ? error : new Error(String(error))
  const event: SentryEvent = {
    event_id: randomEventId(),
    timestamp: Date.now() / 1000,
    platform: "javascript",
    level: "error",
    environment:
      (typeof process !== "undefined" && process.env.NODE_ENV) || "production",
    exception: {
      values: [
        {
          type: err.name || "Error",
          value: err.message || String(error),
          // Stacktrace brute (chemins de code, non sensible) — pas de frames parsés.
          stacktrace: err.stack ? { raw: err.stack } : undefined,
        },
      ],
    },
    request:
      typeof window !== "undefined"
        ? { url: window.location?.href }
        : undefined,
    extra,
  }
  return scrubEvent(event) as SentryEvent
}

/**
 * Capture une erreur et l'envoie (scrubbée) à Sentry. No-op si désactivé.
 * Ne lève jamais : l'observabilité ne doit pas casser l'app.
 */
export function captureException(error: unknown, extra?: Record<string, unknown>): void {
  try {
    if (!initialized) initSentry()
    if (!enabled || !parsed) return

    const event = buildEvent(error, extra)
    const envelopeHeader = JSON.stringify({
      event_id: event.event_id,
      sent_at: new Date().toISOString(),
    })
    const itemHeader = JSON.stringify({ type: "event" })
    const body = `${envelopeHeader}\n${itemHeader}\n${JSON.stringify(event)}`

    if (typeof fetch === "function") {
      void fetch(parsed.envelopeUrl, {
        method: "POST",
        body,
        keepalive: true,
        headers: { "Content-Type": "application/x-sentry-envelope" },
      }).catch(() => {
        // Échec réseau d'observabilité → silencieux, ne casse pas l'app.
      })
    }
  } catch {
    // Toute erreur interne d'observabilité est avalée.
  }
}
