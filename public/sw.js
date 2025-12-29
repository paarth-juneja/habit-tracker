/**
 * Service Worker for Habit Tracker
 * 
 * Caching Strategy:
 * - Cache ONLY static assets (CSS, JS, images, fonts)
 * - NEVER cache auth endpoints or API calls
 * - Support manual cache invalidation on logout
 */

const CACHE_NAME = 'habit-tracker-v1';

// Static assets to cache
const STATIC_ASSETS = [
    // Add specific static assets here if needed
    // The main approach is to cache on-the-fly
];

// Patterns to NEVER cache
const NEVER_CACHE_PATTERNS = [
    // Firebase Auth
    /__\/auth/,
    /identitytoolkit\.googleapis\.com/,
    /securetoken\.googleapis\.com/,
    /accounts\.google\.com/,

    // Firebase Firestore/Database
    /firestore\.googleapis\.com/,
    /firebaseio\.com/,

    // API endpoints
    /\/api\//,

    // Firebase SDK
    /firebase.*\.js/,

    // Dynamic data
    /\.json$/,

    // Next.js Development / HMR
    /\/_next\/webpack-hmr/,
    /\/_next\/static\/webpack\//,
    /\.hot-update\./,
];

// Patterns to cache with stale-while-revalidate
const CACHE_PATTERNS = [
    // Static assets
    /\/_next\/static\//,
    /\.woff2?$/,
    /\.ttf$/,
    /\.css$/,
    /\.js$/,
    /\.png$/,
    /\.jpg$/,
    /\.jpeg$/,
    /\.gif$/,
    /\.svg$/,
    /\.ico$/,
    /\.webp$/,
];

/**
 * Check if a URL should never be cached
 */
function shouldNeverCache(url) {
    return NEVER_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Check if a URL should be cached
 */
function shouldCache(url) {
    return CACHE_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Install event - cache initial static assets
 */
self.addEventListener('install', event => {
    console.log('[SW] Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching initial assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Installed, skipping waiting');
                return self.skipWaiting();
            })
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', event => {
    console.log('[SW] Activating...');

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Claiming clients');
                return self.clients.claim();
            })
    );
});

/**
 * Fetch event - handle caching strategy
 */
self.addEventListener('fetch', event => {
    const url = event.request.url;

    // Never cache auth or API requests - always go to network
    if (shouldNeverCache(url)) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Only cache GET requests
    if (event.request.method !== 'GET') {
        event.respondWith(fetch(event.request));
        return;
    }

    // Skip non-http(s) requests
    if (!url.startsWith('http')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // For cacheable assets: stale-while-revalidate
    if (shouldCache(url)) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(event.request).then(cachedResponse => {
                    const fetchPromise = fetch(event.request)
                        .then(networkResponse => {
                            // Update cache with fresh response
                            if (networkResponse && networkResponse.status === 200) {
                                cache.put(event.request, networkResponse.clone());
                            }
                            return networkResponse;
                        })
                        .catch(() => cachedResponse); // Fallback to cache on network error

                    // Return cached response immediately, update in background
                    return cachedResponse || fetchPromise;
                });
            }).catch(error => {
                console.error('[SW] Cache error, falling back to network:', error);
                return fetch(event.request);
            })
        );
        return;
    }

    // For everything else, default to network first without SW interference
    return;
});

/**
 * Message event - handle cache invalidation requests
 */
self.addEventListener('message', event => {
    console.log('[SW] Received message:', event.data);

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        console.log('[SW] Clearing all caches...');

        event.waitUntil(
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        console.log('[SW] Deleting cache:', cacheName);
                        return caches.delete(cacheName);
                    })
                );
            }).then(() => {
                console.log('[SW] All caches cleared');
                // Notify all clients that caches are cleared
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({ type: 'CACHE_CLEARED' });
                    });
                });
            })
        );
    }

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
