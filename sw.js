// sw.js
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("v3").then(c => c.addAll(["/", "/index.html", "/app.js", "/style.css", "/manifest.json"]))
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

