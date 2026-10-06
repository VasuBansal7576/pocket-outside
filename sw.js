// Cache public application assets only. No visitor input is stored.
const BASE = new URL("./", self.location.href);
const PREFIX = "pocket-outside:" + BASE.pathname + ":";
const CACHE = PREFIX + "v5";
const FILES = [
  "index.html",
  "app.mjs",
  "core.mjs",
  "vendor/transformers.js",
  "vendor/onnxruntime-common.js",
  "vendor/onnxruntime-web.js",
  "vendor/ort-wasm-simd-threaded.jsep.mjs",
  "vendor/ort-wasm-simd-threaded.jsep.wasm",
  "models/Xenova/all-MiniLM-L6-v2/resolve/751bff37182d3f1213fa05d7196b954e230abad9/config.json",
  "models/Xenova/all-MiniLM-L6-v2/resolve/751bff37182d3f1213fa05d7196b954e230abad9/tokenizer_config.json",
  "models/Xenova/all-MiniLM-L6-v2/resolve/751bff37182d3f1213fa05d7196b954e230abad9/tokenizer.json",
  "models/Xenova/all-MiniLM-L6-v2/resolve/751bff37182d3f1213fa05d7196b954e230abad9/onnx/model_quantized.onnx"
];
const URLS = FILES.map(file => new URL(file, BASE).href);
const ALLOWED = new Set(URLS);
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(URLS.slice(0, 3));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    await Promise.all((await caches.keys()).filter(key => key.startsWith(PREFIX) && key !== CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const normalized = url.href === BASE.href ? new URL("index.html", BASE).href : url.href;
  if (!ALLOWED.has(normalized)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(normalized);
    if (cached) return cached;
    const response = await fetch(event.request);
    if (response.ok && response.type !== "opaque") {
      // Deliver model streams immediately; caching must not hold up inference.
      event.waitUntil(cache.put(normalized, response.clone()).catch(() => {}));
    }
    return response;
  })());
});
self.addEventListener("message", event => {
  if (event.data?.type !== "ASSET_STATUS" || !event.ports[0]) return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const present = await Promise.all(URLS.map(url => cache.match(url)));
    event.ports[0].postMessage({ ready: present.every(Boolean) });
  })());
});
