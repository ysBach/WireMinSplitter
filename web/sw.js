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
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const assets = PRECACHE_ASSETS.map(path =>
      new Request(new URL(path, self.registration.scope), { cache: "reload" })
    );
    await cache.addAll(assets);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith("wire-min-splitter-") && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
  })());
});

async function loadAppFile(request) {
  let response;
  try {
    response = await fetch(request, { cache: "no-cache" });
    if (response.status < 500) return response;
  } catch {
    // The installed bundle supplies the app during a network outage.
  }
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: true, ignoreVary: true });
  if (cached) return cached;
  if (request.mode === "navigate") {
    const page = await cache.match("./");
    if (page) return page;
  }
  return response || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method === "GET" && new URL(request.url).origin === self.location.origin) {
    event.respondWith(loadAppFile(request));
  }
});
