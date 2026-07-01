// Minimal offline-capable service worker for Eat Ticker.
// - Navigations: network-first, falling back to the cached app shell when offline.
// - Static assets (/_next/static, icons): cache-first.
// - Everything else (server actions, RSC payloads, non-GET): passthrough to network.

const CACHE = "eat-ticker-v1";
const APP_SHELL = ["/", "/manifest.webmanifest", "/icon.svg", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Don't intercept React Server Component payloads — always hit the network.
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/x-component") || url.pathname.startsWith("/_next/data")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/")));
    return;
  }

  const isStatic = url.pathname.startsWith("/_next/static") || APP_SHELL.includes(url.pathname);
  if (isStatic) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
  }
});
