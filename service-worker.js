const CACHE_NAME = "payment-gateways-pwa-v1";
const urlsToCache = [
  "/assets/favicon.png",
  "/assets/logo192.png",
  "/assets/logo512.png",
  "/assets/settings-icon.png",
  "/assets/toggle-theme.png",
  "/constants/elements-ids.js",
  "/constants/payment-gateways-registered.js",
  "/constants/ui-components-selection.js",
  "/controllers/default-controller.js",
  "/controllers/main-controller.js",
  "/drivers/base-driver.js",
  "/drivers/stripe-driver.js",
  "/drivers/trust-commerce-driver.js",
  "/styles/shared-style.css",
  "/ui-components/authentication-forms.js",
  "/ui-components/multiple-steps-forms.js",
  "/ui-components/reader-selection-forms.js",
  "/views/main-view.js",
  "/index.html",
  "/manifest.json",
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
