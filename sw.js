// MealMutt Service Worker — caches static assets only.
// External API calls (USDA FoodData Central, EmailJS, Stripe) are never
// intercepted and always go directly to the network.

const CACHE_NAME = 'mealmutt-static-v4';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/recipes.js',
  '/aafco.js',
  '/supplements.js',
  '/usda.js',
  '/manifest.json',
  '/logo.svg',
  '/icon-low.webp',
  '/icon-moderate.webp',
  '/icon-high.webp',
  '/icon-working.webp',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Domains that must always hit the network — never cache.
const PASSTHROUGH_ORIGINS = [
  'api.nal.usda.gov',       // USDA FoodData Central
  'api.emailjs.com',        // EmailJS
  'cdn.jsdelivr.net',       // EmailJS SDK CDN
  'buy.stripe.com',         // Stripe checkout
  'js.stripe.com',          // Stripe.js
];

// ---- Install: pre-cache static assets ----
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ---- Activate: remove old caches ----
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ---- Fetch: cache-first for static assets, network-only for everything else ----
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always pass through external/API origins untouched
  if (PASSTHROUGH_ORIGINS.some(origin => url.hostname.includes(origin))) {
    return; // let browser handle it natively
  }

  // Only handle GET requests for our own origin
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      // Not in cache — fetch from network (handles navigation to sub-pages etc.)
      return fetch(event.request).catch(() => caches.match('/index.html'));
    })
  );
});
