// S26 — Abonnement Web Push côté client.
// La clé publique VAPID n'est pas secrète : on la lit dans l'env, avec repli sur la clé du projet.
// La clé PRIVÉE reste côté serveur (Render) et ne doit jamais apparaître ici.
import { savePushSubscription, removePushSubscription } from "@/lib/api"

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BEGhiEhGLWKlnjvrGsUHIZ-MEMyUFiR8PQHnaZtGfvCA2TjcC2PPAQhj1P_mzbA8T6z1jg_hcv9Pf5SAJs0LKd8"

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  )
}

// Demande la permission, s'abonne au push via le SW déjà enregistré (/sw.js),
// puis enregistre l'abonnement côté serveur. Retourne true si activé.
export async function enablePush(): Promise<boolean> {
  if (!pushSupported()) return false
  const permission = await Notification.requestPermission()
  if (permission !== "granted") return false
  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  const sub =
    existing ||
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }))
  await savePushSubscription(sub.toJSON())
  return true
}

// Désabonne le device et retire l'abonnement côté serveur.
export async function disablePush(): Promise<void> {
  if (!pushSupported()) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) await sub.unsubscribe()
  await removePushSubscription()
}
