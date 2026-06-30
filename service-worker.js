// Service Worker do Orçamento Pro
// Permite que o app seja instalado (PWA) e funcione mesmo sem internet,
// já que os dados ficam salvos no localStorage do navegador, não num servidor.

const CACHE_NAME = 'orcamento-pro-v1';
const ARQUIVOS_PARA_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Ao instalar o service worker, guarda os arquivos principais em cache local
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ARQUIVOS_PARA_CACHE);
    })
  );
  self.skipWaiting();
});

// Remove caches antigos quando uma nova versão do service worker assume
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(nomes) {
      return Promise.all(
        nomes.filter(function(nome) { return nome !== CACHE_NAME; })
             .map(function(nome) { return caches.delete(nome); })
      );
    })
  );
  self.clients.claim();
});

// Estratégia: tenta buscar da rede primeiro (pra sempre pegar a versão mais nova
// quando há internet); se não conseguir (offline), usa o que está em cache.
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Atualiza o cache com a versão mais recente sempre que consegue baixar
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(function() {
        // Sem internet: serve do cache
        return caches.match(event.request).then(function(cached) {
          return cached || caches.match('./index.html');
        });
      })
  );
});
