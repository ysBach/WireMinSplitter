import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import vm from "node:vm";

const origin = "https://moneysplit.example";
const source = await readFile(new URL("../web/sw.js", import.meta.url), "utf8");

function serviceWorker(version, stores = new Map(), unavailable = new Set(), cloudflareRedirect = false) {
  const handlers = new Map();
  const calls = { skipWaiting: 0, claim: 0, network: 0 };
  const keyFor = (request) => new URL(typeof request === "string" ? request : request.url, origin + "/").href;
  const fetchAsset = async (request) => {
    calls.network += 1;
    const pathname = new URL(keyFor(request)).pathname;
    if (unavailable.has(pathname)) throw new Error("Network unavailable");
    try {
      const response = new Response(await readFile(resolve("web", "." + (pathname === "/" ? "/index.html" : pathname))));
      // A followed Pages /index.html redirect is unsafe as a navigation fallback.
      if (cloudflareRedirect && pathname === "/index.html") Object.defineProperty(response, "redirected", { value: true });
      return response;
    } catch {
      return new Response("Not found", { status: 404 });
    }
  };
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name);
      return {
        async addAll(assets) {
          // Cache.addAll must not accept a partial shell when any resource fails.
          const responses = await Promise.all(assets.map(fetchAsset));
          if (responses.some((response) => !response.ok)) throw new Error("Precache failed");
          assets.forEach((asset, index) => entries.set(keyFor(asset), responses[index]));
        },
        async put(request, response) { entries.set(keyFor(request), response); },
        async match(request, options = {}) {
          const requested = new URL(keyFor(request));
          if (options.ignoreSearch) requested.search = "";
          let response;
          for (const [key, value] of entries) {
            const stored = new URL(key);
            if (options.ignoreSearch) stored.search = "";
            if (stored.href === requested.href) { response = value; break; }
          }
          if (!response) return undefined;
          const clone = response.clone();
          if (response.redirected) Object.defineProperty(clone, "redirected", { value: true });
          return clone;
        },
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  const self = {
    location: { origin },
    addEventListener(name, handler) { handlers.set(name, handler); },
    skipWaiting() { calls.skipWaiting += 1; },
    clients: { claim() { calls.claim += 1; } },
  };
  vm.runInNewContext(source.replaceAll("__CACHE_VERSION__", version), { self, caches, fetch: fetchAsset, URL, Response });
  return {
    stores,
    calls,
    async dispatch(name, request) {
      let completion;
      let response;
      handlers.get(name)({
        request,
        waitUntil(promise) { completion = promise; },
        respondWith(promise) { response = promise; },
      });
      await completion;
      return response ? await response : undefined;
    },
  };
}

test("offline installation fails rather than accepting a shell without its solver", async () => {
  const worker = serviceWorker("missing", new Map(), new Set(["/solver.js"]));
  await assert.rejects(worker.dispatch("install"), /Network unavailable/);
  assert.equal(worker.calls.skipWaiting, 0);
});

test("offline navigation to the app or a cached file shows that installed file", async () => {
  const worker = serviceWorker("installed");
  await worker.dispatch("install");
  await worker.dispatch("activate");
  const networkAfterInstall = worker.calls.network;
  for (const filename of ["/", "/app.js", "/solver-worker.js", "/solver.js", "/vendor/html2canvas.min.js"]) {
    const response = await worker.dispatch("fetch", { url: origin + filename, method: "GET", mode: "navigate" });
    assert.equal(response?.status, 200, filename);
    const expected = await readFile(resolve("web", "." + (filename === "/" ? "/index.html" : filename)), "utf8");
    assert.ok((await response.text()) === expected, filename + " must show its own content");
  }
  assert.equal(worker.calls.network, networkAfterInstall);
});

test("a waiting update keeps the old shell usable until activation, then removes its cache", async () => {
  const old = serviceWorker("old");
  await old.dispatch("install");
  await old.dispatch("activate");
  const next = serviceWorker("next", old.stores);
  await next.dispatch("install");
  assert.equal(next.calls.skipWaiting, 0);
  assert.equal(next.calls.claim, 0);
  assert.equal(old.stores.size, 2);
  const oldReply = await old.dispatch("fetch", { url: origin + "/solver.js", method: "GET", mode: "cors" });
  assert.equal(oldReply.status, 200);
  await next.dispatch("activate");
  assert.equal(next.stores.size, 1);
  assert.match([...next.stores.keys()][0], /next$/);
});

test("Pages redirects never supply the offline navigation fallback, including query URLs", async () => {
  const unavailable = new Set();
  const worker = serviceWorker("pages", new Map(), unavailable, true);
  await worker.dispatch("install");
  await worker.dispatch("activate");
  unavailable.add("/");
  unavailable.add("/other");
  for (const filename of ["/?shared=1", "/other"]) {
    const response = await worker.dispatch("fetch", { url: origin + filename, method: "GET", mode: "navigate" });
    assert.equal(response?.status, 200);
    assert.equal(response.redirected, false, "A navigation must not receive a cached redirected response.");
    assert.match(await response.text(), /<!doctype html>/i);
  }
});
