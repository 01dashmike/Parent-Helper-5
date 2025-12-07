// Service Worker for Parent Helper PWA
// Enhanced with static asset caching and offline image fallbacks

const CACHE_VERSION = 'parent-helper-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Critical static assets to pre-cache
const STATIC_ASSETS = [
  '/',
  '/search',
  '/account',
  '/manifest.json',
  // Icons
  '/images/categories/logo.png',
  '/images/categories/logo.webp',
  '/images/categories/logo.avif',
  '/images/logo.png',
  // Fonts
  '/fonts/inter/inter-regular.woff2',
  '/fonts/inter/inter-bold.woff2',
  '/fonts/poppins/poppins-regular.woff2',
  '/fonts/poppins/poppins-semibold.woff2',
  // Critical images
  '/images/categories/family-hero.png',
  '/images/categories/messy-play.webp',
];

// Image fallback map - maps failed image requests to cached fallbacks
const IMAGE_FALLBACKS = {
  // Provider logos fallback to default logo
  '/images/providers/': '/images/categories/logo.png',
  // Category images fallback to default
  '/images/categories/': '/images/categories/logo.png',
  // Class images fallback
  '/images/classes/': '/images/categories/logo.png',
};

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker, version:', CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      }),
      // Pre-cache critical images
      caches.open(IMAGE_CACHE).then((cache) => {
        console.log('[SW] Pre-caching critical images');
        const criticalImages = STATIC_ASSETS.filter(url => 
          url.includes('/images/') || url.includes('/fonts/')
        );
        return cache.addAll(criticalImages.map(url => new Request(url, { cache: 'reload' })));
      }),
    ]).then(() => {
      console.log('[SW] Static assets cached');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('[SW] Error caching static assets:', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches that don't match current version
          if (!cacheName.startsWith(CACHE_VERSION)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Old caches cleaned up');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except images)
  if (url.origin !== location.origin && !request.destination === 'image') {
    return;
  }

  // Handle image requests with fallback
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/i)) {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Handle static assets (JS, CSS, fonts)
  if (url.pathname.startsWith('/_next/static/') || 
      url.pathname.startsWith('/fonts/') ||
      url.pathname.startsWith('/images/categories/logo')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          // Cache successful responses
          if (response.ok) {
            const cacheToUse = url.pathname.startsWith('/images/') ? IMAGE_CACHE : STATIC_CACHE;
            caches.open(cacheToUse).then((cache) => {
              cache.put(request, response.clone());
            });
          }
          return response;
        }).catch(() => {
          // Return fallback for failed requests
          return getFallbackResponse(request);
        });
      })
    );
    return;
  }

  // Handle HTML pages - network first, cache fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback to home page if available
            return caches.match('/');
          });
        })
    );
    return;
  }

  // Default: cache first, network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((response) => {
        if (response.ok) {
          const cacheToUse = RUNTIME_CACHE;
          caches.open(cacheToUse).then((cache) => {
            cache.put(request, response.clone());
          });
        }
        return response;
      });
    })
  );
});

// Handle image requests with fallback support
async function handleImageRequest(request) {
  const url = new URL(request.url);
  
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Try network
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Cache successful image responses
      const clone = response.clone();
      caches.open(IMAGE_CACHE).then((cache) => {
        cache.put(request, clone);
      });
      return response;
    }
  } catch (error) {
    console.log('[SW] Image fetch failed, trying fallback:', url.pathname);
  }

  // Try fallback image
  const fallbackUrl = getImageFallback(url.pathname);
  if (fallbackUrl) {
    const fallbackResponse = await caches.match(fallbackUrl);
    if (fallbackResponse) {
      return fallbackResponse;
    }
    // Try to fetch fallback from network
    try {
      const response = await fetch(fallbackUrl);
      if (response.ok) {
        const clone = response.clone();
        caches.open(IMAGE_CACHE).then((cache) => {
          cache.put(fallbackUrl, clone);
        });
        return response;
      }
    } catch (error) {
      console.error('[SW] Fallback image fetch failed:', error);
    }
  }

  // Ultimate fallback: return a placeholder or default logo
  return getDefaultImageResponse();
}

// Get fallback image URL based on path
function getImageFallback(imagePath) {
  for (const [pattern, fallback] of Object.entries(IMAGE_FALLBACKS)) {
    if (imagePath.startsWith(pattern)) {
      return fallback;
    }
  }
  // Default fallback to logo
  return '/images/categories/logo.png';
}

// Get default image response (logo)
async function getDefaultImageResponse() {
  const defaultImage = '/images/categories/logo.png';
  const cached = await caches.match(defaultImage);
  if (cached) {
    return cached;
  }
  // Return a simple placeholder if logo not available
  return new Response(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#9CAF88"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="16">Parent Helper</text></svg>',
    {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000',
      },
    }
  );
}

// Get fallback response for failed requests
async function getFallbackResponse(request) {
  const url = new URL(request.url);
  
  // For static assets, try to return a basic response
  if (url.pathname.startsWith('/_next/static/')) {
    return new Response('', {
      status: 404,
      statusText: 'Not Found (Offline)',
    });
  }
  
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Parent Helper';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/images/categories/logo.png',
    badge: '/images/categories/logo.png',
    tag: data.tag || 'default',
    data: data.data || {},
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event - handle user clicking on notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;
  const urlToOpen = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
