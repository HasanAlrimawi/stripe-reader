const CACHE_NAME = "payment-gateways-pwa-v1";
const urlsToCache = [
  "/assets/logo192.png",
  "/assets/logo512.png",
  "/assets/favicon.png",
  "/assets/settings-icon.png",
  "/assets/toggle-theme.png",
  "/constants/observer-topics.js",
  "/constants/payment-gateways.js",
  "/controllers/main-controller.js",
  "/drivers/base-driver.js",
  "/stripe/driver.js",
  "/stripe/local-storage-keys.js",
  "/trust-commerce/driver.js",
  "/trust-commerce/local-storage-keys.js",
  "/styles/shared-style.css",
  "/ui-components/auth-methods.js",
  "/ui-components/multiple-steps-forms.js",
  "/ui-components/reader-selection-methods.js",
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
