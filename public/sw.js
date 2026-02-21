// Basic Service Worker for PWA installation
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // We leave this mostly empty/pass-through for now. 
    // Add caching logic here later if offline support is required.
});
