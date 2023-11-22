const CACHE_NAME = "stripe-card-reader-pwa-v1";
const urlsToCache = [
  "/assets/logo192.png",
  "/assets/logo512.png",
  "/assets/favicon.png",
  "/constants/stripe-connection-details.js",
  "/constants/observer-topics.js",
  "/constants/devices.js",
  "/controllers/stripe-controller.js",
  "/controllers/main-controller.js",
  "/models/stripe-readers-model.js",
  "/styles/shared-style.css",
  "/views/stripe-view.js",
  "/views/main-view.js",
  "/index.html",
  "/manifest.json",
  "/service-worker.js",
  "/observer.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
