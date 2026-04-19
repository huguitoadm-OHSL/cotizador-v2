self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  // Con esto Chrome nos reconoce como App Nativa
});
