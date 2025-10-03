// ĐỔI số version khi bạn deploy để ép cập nhật cache
const CACHE_NAME = "map-viewer-v50";
const PRECACHE_URLS = [
  "./",
  "index.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png"
  // KHÔNG cache data/toado.csv
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // CSV luôn online để có dữ liệu mới
  if (url.pathname.endsWith("/data/toado.csv")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Điều hướng trang: network-first, fallback cache
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("index.html")));
    return;
  }

  // Tài nguyên nội bộ: cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(caches.match(event.request).then((c) => c || fetch(event.request)));
  }
});
