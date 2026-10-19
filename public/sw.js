const CACHE_NAME = "moonthread-v2";
const APP_SHELL = [
  "/",
  "/offline",
  "/create",
  "/library",
  "/settings",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/maskable-512.png",
  "/sounds/rain.mp3",
  "/sounds/crickets.mp3",
  "/sounds/ocean.mp3",
  "/sounds/wind.mp3"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL.map(url => new Request(url, { cache: "reload" }))).catch(err => {
        console.warn("Precache failed for some assets", err);
        // Try individually
        return Promise.allSettled(APP_SHELL.map(u => cache.add(u)));
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never cache API route
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request).catch(() => new Response(JSON.stringify({ error: "offline", offlineFallback: true }), { status: 502, headers: { "Content-Type": "application/json" } })));
    return;
  }

  // For navigation requests, network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Cache successful navigations
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(request);
          if (cached) return cached;
          const offline = await cache.match("/offline");
          if (offline) return offline;
          return new Response("Offline", { status: 503 });
        })
    );
    return;
  }

  // For other assets, cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((res) => {
          // Only cache GET and successful
          if (request.method === "GET" && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return res;
        })
        .catch(() => {
          // If it's an image, return placeholder?
          return new Response("", { status: 404 });
        });
    })
  );
});
