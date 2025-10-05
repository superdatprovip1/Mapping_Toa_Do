// 🔁 ĐỔI số version mỗi lần deploy để ép client cập nhật SW
const CACHE_NAME = "map-viewer-v52";  // <— tăng số lên
const PRECACHE_URLS = [
  "./",
  "index.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  // ❌ KHÔNG cache CSV cũ hay API
];

// 🔗 Prefix API Worker (đổi theo subdomain của bạn)
const API_PREFIX = "https://mapping-api.superdatprovip1.workers.dev/"; // <- chỉnh nếu bạn đổi tên

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
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

  // 🚫 Không cache API Worker (luôn lấy online, tránh stale & tránh lưu dữ liệu nhạy cảm)
  if (event.request.url.startsWith(API_PREFIX)) {
    event.respondWith(fetch(
      new Request(event.request, { cache: "no-store" })
    ));
    return;
  }

  // 🗑️ CSV cũ (nếu ai còn gọi nhầm) => luôn online
  if (url.pathname.endsWith("/data/toado.csv")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 🚪 Điều hướng trang: network-first, fallback cache khi offline
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("index.html"))
    );
    return;
  }

  // 📦 Tài nguyên cùng origin: cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((c) => c || fetch(event.request))
    );
  }
});
