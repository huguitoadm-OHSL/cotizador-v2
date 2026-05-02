const CACHE_NAME = 'cotizador-pro-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/lotes.json', // ¡AQUÍ ESTÁ LA MAGIA! Guarda los 20,000 lotes en el celular
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap'
];

// Instalar y guardar en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caché abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar peticiones (Si no hay internet, usa el caché)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devuelve el archivo del caché si existe, si no, lo busca en internet
        return response || fetch(event.request);
      })
  );
});

// Actualizar el caché si hay una nueva versión
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
