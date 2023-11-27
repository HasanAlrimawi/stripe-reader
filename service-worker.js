const CACHE_NAME = "payment-gateways-pwa-v1";
const urlsToCache = [
  "/assets/logo192.png",
  "/assets/logo512.png",
  "/assets/favicon.png",
  "/assets/toggle-theme.png",
  "/constants/observer-topics.js",
  "/constants/payment-gateways.js",
  "/constants/stripe-connection-details.js",
  "/constants/TC-connection-details.js",
  "/controllers/base-controller.js",
  "/controllers/main-controller.js",
  "/drivers/base-driver.js",
  "/stripe/stripe-controller.js",
  "/stripe/stripe-driver.js",
  "/stripe/stripe-readers-model.js",
  "/stripe/stripe-view.js",
  "/styles/shared-style.css",
  "/views/main-view.js",
  "/index.html",
  "/manifest.json",
  "/observer.js",
  "/service-worker.js",
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
