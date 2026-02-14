const CACHE_NAME = "biohazard-cache-a2.1";
const FILES_TO_CACHE = [
    "./",
    "./error.html",
    "./index.html",
    "./lore.html",
    "./adminstatus.html",
    "./gamestatuses.html",
    "./howtoapply.html",
    "./style.css",
    "./script.js",
    "./manifest.json"
];



self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});


self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});


