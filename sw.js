const CACHE_NAME = "lunette-crystal-v36";
const LOCAL_ASSETS = [
  "./",
  "./index.html",
  "./personal.html",
  "./basic.html",
  "./recent.html",
  "./style.html",
  "./loading.html",
  "./result.html",
  "./report.html",
  "./styles.css",
  "./styles.css?v=36",
  "./app.js",
  "./app.js?v=36",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/hero-crystal-bg.png",
  "./assets/card-personal-crystal.png",
  "./assets/card-emotion-crystal.png",
  "./assets/card-love-crystal.png",
  "./assets/card-career-crystal.png",
  "./assets/personal-flow-bg.png",
  "./assets/personal-reference.jpg",
  "./assets/recent-calm.jpg",
  "./assets/recent-lost.jpg",
  "./assets/recent-change.jpg",
  "./assets/recent-emotional.jpg",
  "./assets/recent-energy.jpg",
  "./assets/recent-healing.jpg",
  "./assets/recent-calm-selected.jpg",
  "./assets/recent-lost-selected.jpg",
  "./assets/recent-change-selected.jpg",
  "./assets/recent-emotional-selected.jpg",
  "./assets/recent-energy-selected.jpg",
  "./assets/recent-healing-selected.jpg",
  "./assets/style-milk-tea.jpg",
  "./assets/style-cool-luxury.jpg",
  "./assets/style-rose.jpg",
  "./assets/style-mist-blue.jpg",
  "./assets/style-dark.jpg",
  "./assets/style-minimal.jpg",
  "./assets/loading-crystal-bg.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(LOCAL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match("./index.html"))
      )
  );
});
