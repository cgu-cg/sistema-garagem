const CACHE_VERSION = "garagem-v8";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => client.postMessage({ type: "SW_UPDATED" }));
  });
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  const isAsset = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)(\?.*)?$/.test(url.pathname);

  // JS/CSS/images: cache-first, network fallback
  if (isAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Abastecimentos & Controle Operacional APIs: network-first, cache fallback
  if (
    url.pathname === "/api/abastecimentos" || url.pathname.startsWith("/api/abastecimentos?") ||
    url.pathname === "/api/controle-operacional" || url.pathname.startsWith("/api/controle-operacional?")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Auth: network only
  if (url.pathname.includes("/auth/")) return;

  // Everything else (navigation, SPA routes, etc): network-first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          return caches.match("/index.html").then((cachedIndex) => {
            if (cachedIndex) return cachedIndex;
            return new Response("<h1>Sem conexão</h1><p>Recarregue quando tiver internet.</p>", {
              headers: { "Content-Type": "text/html; charset=utf-8" },
              status: 503,
            });
          });
        });
      })
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SYNC_COMPLETE") {
    caches.open(CACHE_VERSION).then((cache) => {
      cache.keys().then((keys) => {
        keys.forEach((req) => {
          const reqUrl = new URL(req.url);
          if (
            reqUrl.pathname.startsWith("/api/abastecimentos") ||
            reqUrl.pathname.startsWith("/api/controle-operacional")
          ) {
            cache.delete(req);
          }
        });
      });
    });
  }
});
