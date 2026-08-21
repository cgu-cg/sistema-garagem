const CACHE_VERSION = "garagem-v10";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      // Pre-cache core files
      const coreUrls = ["/", "/index.html", "/manifest.json"];
      for (const url of coreUrls) {
        try {
          await cache.add(url);
        } catch (e) {
          console.warn(`Failed to cache core URL: ${url}`, e);
        }
      }

      try {
        const response = await fetch("/index.html");
        if (response.ok) {
          const text = await response.text();
          const assetUrls = [];
          const regex = /(src|href)="([^"]+\.(js|css|ts|tsx|jsx))"/g;
          let match;
          while ((match = regex.exec(text)) !== null) {
            assetUrls.push(match[2]);
          }
          for (const url of assetUrls) {
            try {
              await cache.add(url);
            } catch (e) {
              console.warn(`Failed to dynamically cache asset: ${url}`, e);
            }
          }
        }
      } catch (err) {
        console.error("Failed to dynamically pre-cache assets:", err);
      }
    })
  );
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

  // Only handle GET requests and requests to our own origin
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // 1. API Requests
  if (url.pathname.startsWith("/api/")) {
    const isCacheableApi = 
      url.pathname === "/api/abastecimentos" || url.pathname.startsWith("/api/abastecimentos?") ||
      url.pathname === "/api/controle-operacional" || url.pathname.startsWith("/api/controle-operacional?");

    if (isCacheableApi) {
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
    }
    return;
  }

  // 2. Auth requests - bypass SW
  if (url.pathname.includes("/auth/")) return;

  // 3. Navigation requests (HTML pages)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              // Cache the shell as /index.html
              cache.put("/index.html", clone);
            });
          }
          return response;
        })
        .catch(() => {
          // If offline, return the cached index.html shell
          return caches.match("/index.html").then((cachedIndex) => {
            if (cachedIndex) return cachedIndex;
            return new Response("<h1>Sem conexão</h1><p>Recarregue quando tiver internet.</p>", {
              headers: { "Content-Type": "text/html; charset=utf-8" },
              status: 503,
            });
          });
        })
    );
    return;
  }

  // 4. Static Assets (JS, CSS, images, icons, manifest, fonts)
  // We expand the regex to cover dev-mode files (.ts, .tsx, .jsx) and JSON (manifest.json)
  const isAsset = /\.(js|jsx|ts|tsx|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|json)(\?.*)?$/.test(url.pathname);
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
