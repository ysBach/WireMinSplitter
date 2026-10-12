const CACHE_NAME = "wire-min-splitter-v-__CACHE_VERSION__";

const PRECACHE_ASSETS = [
  "./",
  "./app.js",
  "./styles.css",
  "./manifest.webmanifest",
  "./solver-worker.js",
  "./solver.js",
  "./vendor/html2canvas.min.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("wire-min-splitter-") && key !== CACHE_NAME
            )
            .map((key) => caches.delete(key))
        )
      )
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      const isNavigate = event.request.mode === "navigate";
      // A navigation to a cached file, such as ./solver.js, shows that file.
      // Any other navigation shows the cached app page.
      const cachedMatch = isNavigate
        ? cache
            .match(event.request, { ignoreSearch: true, ignoreVary: true })
            .then((response) => response || cache.match("./", { ignoreSearch: true }))
        : cache.match(event.request);

      return cachedMatch.then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === "basic"
            ) {
              const toCache = networkResponse.clone();
              cache.put(event.request, toCache);
            }
            return networkResponse;
          })
          .catch(() => {
            if (isNavigate) {
              return cache.match("./", { ignoreSearch: true });
            }
            return undefined;
          });
      });
    })
  );
});

