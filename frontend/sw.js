// Path: frontend/sw.js
// Service Worker for PWA functionality
const CACHE_NAME = "zerotouch-v1"
const urlsToCache = [
  "/",
  "/index.html",
  "/login.html",
  "/signup.html",
  "/admin-login.html",
  "/admin-signup.html",
  "/dashboard.html",
  "/admin-dashboard.html",
  "/policies.html",
  "/onboarding.html",
  "/user-settings.html",
  "/styles/base.css",
  "/styles/layout.css",
  "/styles/components.css",
  "/js/admin.js",
  "/js/app.js",
  "/js/auth.js",
  "/js/config.js",
  "/js/onboarding.js",
  "/js/policies.js",
  "/js/supabaseClient.js",
  "/js/user-settings.js",
  "/js/utils.js",
  "/manifest.json",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css",
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
  // Add any other static assets like images, videos if they are used directly
  "https://www.w3schools.com/html/mov_bbb.mp4" // Example video for onboarding
]
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    }),
  )
})
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    }),
  )
})
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})