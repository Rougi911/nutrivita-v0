/**
 * NutriVita — Service Worker (S18, PWA installable)
 *
 * Stratégie :
 *  - Navigations (mode "navigate") : network-first → cache → coquille hors-ligne.
 *  - Assets immuables Next.js (/_next/static/, hashés) : cache-first.
 *  - Autres GET same-origin : stale-while-revalidate.
 *  - Tout le cross-origin (API backend, OpenFoodFacts, Strava…) : NON intercepté,
 *    NON mis en cache. Aucune donnée de santé n'est stockée par le SW (REG-05).
 */

const CACHE = "nutrivita-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [
  OFFLINE_URL,
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

function isImmutableAsset(url) {
  return url.pathname.startsWith("/_next/static/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // On ne gère que les GET same-origin. Le reste (API, POST, cross-origin)
  // passe au réseau sans interception ni cache.
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations : network-first, repli cache puis coquille hors-ligne.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Assets immuables hashés : cache-first.
  if (isImmutableAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
            return response;
          })
      )
    );
    return;
  }

  // Autres GET same-origin : stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

// ─── S26 — Notifications push ────────────────────────────────────────────────
// Payload attendu (neutre, sans donnée de santé — REG-05) : { title, body, url, tag }.
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = { body: event.data && event.data.text() }; }
  const title = data.title || "NutriVita";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "nutrivita",
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const focused = clients.find((c) => "focus" in c);
      if (focused) return focused.focus();
      return self.clients.openWindow(target);
    })
  );
});
