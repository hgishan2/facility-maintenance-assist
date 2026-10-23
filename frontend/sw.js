const CACHE = "facility-assist-shell-v1";
const SHELL = ["./", "./index.html", "./app.js", "./manifest.webmanifest"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const response = await fetch(req);
      if (response.ok) {
        const cache = await caches.open(CACHE);
        cache.put(req, response.clone());
      }
      return response;
    } catch {
      return cached || new Response("Offline and this resource is not cached.", {
        status: 503, headers: {"Content-Type":"text/plain; charset=utf-8"}
      });
    }
  })());
});
