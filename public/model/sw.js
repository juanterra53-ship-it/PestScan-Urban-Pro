const CACHE_NAME = 'pestscan-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Cache das bibliotecas essenciais para IA Offline
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.21.0/dist/tf.min.js',
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.9/dist/tf-tflite.min.js',
  // Cache do seu modelo treinado
  '/model/modelo_barata.tflite'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});