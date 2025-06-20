/* eslint-disable no-restricted-globals */
// Cache version and files
const CACHE_NAME = 'attendance-cache-v1';
const urlsToCache = [
 '/',
 '/index.html',
 '/manifest.json',
];

// Install event
// eslint-disable-next-line no-restricted-globals
self.addEventListener('install', (event) => {
 console.log('[Service Worker] Installing...');
 event.waitUntil(
  caches.open(CACHE_NAME).then((cache) => {
   console.log('[Service Worker] Caching app shell');
   return cache.addAll(urlsToCache);
  })
 );
});

// Activate event
self.addEventListener('activate', (event) => {
 console.log('[Service Worker] Activated!');
 event.waitUntil(
  caches.keys().then((keyList) =>
   Promise.all(
    keyList.map((key) => {
     if (key !== CACHE_NAME) {
      console.log('[Service Worker] Removing old cache', key);
      return caches.delete(key);
     }
    })
   )
  )
 );
 self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
 event.respondWith(
  caches.match(event.request).then((response) => {
   return response || fetch(event.request);
  })
 );
});