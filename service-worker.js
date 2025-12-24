// Vision Screening Pro - Service Worker
// Version 1.0.0

const CACHE_NAME = 'vision-screening-v1.0.0';
const RUNTIME_CACHE = 'runtime-cache-v1';

// Files to cache immediately on install
const PRECACHE_URLS = [
  '/vision-screening-pro/',
  '/vision-screening-pro/index.html',
  '/vision-screening-pro/styles.css',
  '/vision-screening-pro/script.js',
  '/vision-screening-pro/brightness-control.js',
  '/vision-screening-pro/adaptation.js',
  '/vision-screening-pro/device-test.js',
  '/vision-screening-pro/speech-recognition.js',
  '/vision-screening-pro/manifest.json',
  // Add icons
  '/vision-screening-pro/icon-192.png',
  '/vision-screening-pro/icon-512.png'
];

// Install event - cache all static assets
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Pre-caching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            // Delete old caches
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map(cacheName => {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached version
          console.log('[ServiceWorker] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(event.request)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Add to runtime cache
            caches.open(RUNTIME_CACHE)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.error('[ServiceWorker] Fetch error:', error);
            
            // Return offline page if available
            return caches.match('/vision-screening-pro/offline.html');
          });
      })
  );
});

// Background sync (for future data sync features)
self.addEventListener('sync', event => {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  if (event.tag === 'sync-results') {
    event.waitUntil(syncResults());
  }
});

async function syncResults() {
  // Future: sync test results to server
  console.log('[ServiceWorker] Syncing results...');
}

// Push notifications (for future reminder features)
self.addEventListener('push', event => {
  console.log('[ServiceWorker] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Vision Screening Pro';
  const options = {
    body: data.body || 'Reminder: Complete your vision screening',
    icon: '/vision-screening-pro/icon-192.png',
    badge: '/vision-screening-pro/icon-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/vision-screening-pro/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click
self.addEventListener('notificationclick', event => {
  console.log('[ServiceWorker] Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

