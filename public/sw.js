const CACHE_NAME = 'aegis-kmb-v1.0.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/static/js/bundle.js',
  '/static/css/main.css',
  // Add other static assets as needed
];

// Install event - cache resources and skip waiting
self.addEventListener('install', event => {
  self.skipWaiting(); // Immediately activate new service worker
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event - network first for HTML and CSS, cache first for others
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isHTML = event.request.destination === 'document' || url.pathname.endsWith('.html');
  const isCSS = url.pathname.endsWith('.css') || event.request.destination === 'style';
  
  // Network-first strategy for HTML and CSS to ensure latest changes
  if (isHTML || isCSS) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request).then(response => {
            if (response) {
              return response;
            }
            // For HTML, return index.html as fallback
            if (isHTML) {
              return caches.match('/index.html');
            }
          });
        })
    );
  } else {
    // Cache-first strategy for other assets
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            
            return response;
          })
          .catch(() => {
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
    );
  }
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim() // Take control of all pages immediately
    ])
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Get stored form data from IndexedDB
    const formData = await getStoredFormData();

    if (formData && formData.length > 0) {
      // Process each stored form
      for (const data of formData) {
        await submitFormData(data);
        await removeStoredFormData(data.id);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper functions for IndexedDB operations
async function getStoredFormData() {
  // Implementation for getting stored form data
  return [];
}

async function submitFormData(data) {
  // Implementation for submitting form data
  console.log('Submitting stored form data:', data);
}

async function removeStoredFormData(id) {
  // Implementation for removing stored form data
  console.log('Removing stored form data:', id);
}
