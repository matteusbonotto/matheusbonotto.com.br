// Service Worker para PWA
// Matheus Bonotto - Portfólio Profissional

// Versão do cache - INCREMENTAR SEMPRE QUE FIZER DEPLOY
const CACHE_VERSION = '2.0.2';
const CACHE_NAME = `mabs-portfolio-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `mabs-runtime-v${CACHE_VERSION}`;

// Arquivos estáticos para cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/portfolio.html',
  '/competencias.html',
  '/historia.html',
  '/cv.html',
  '/contato.html',
  '/assets/css/main.css',
  '/assets/css/home.css',
  '/assets/css/portfolio.css',
  '/assets/css/competencias.css',
  '/assets/css/historia.css',
  '/assets/css/cv.css',
  '/assets/css/contato.css',
  '/assets/css/tree.css',
  '/assets/favicon/favicon.ico',
  '/assets/favicon/favicon.svg',
  '/assets/favicon/apple-touch-icon.png',
  '/assets/favicon/web-app-manifest-192x192.png',
  '/assets/favicon/web-app-manifest-512x512.png',
  '/assets/logo-branco.png',
  '/config.js'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cacheando arquivos estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Service Worker instalado');
        return self.skipWaiting(); // Ativa imediatamente
      })
      .catch((error) => {
        console.error('[SW] Erro ao instalar:', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker v' + CACHE_VERSION + '...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Remove TODOS os caches antigos (força limpeza completa)
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] 🗑️ Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] ✅ Service Worker ativado (v' + CACHE_VERSION + ')');
        // Notificar todos os clientes para recarregar
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
          });
        }).then(() => {
          return self.clients.claim(); // Assume controle imediato
        });
      })
  );
});

// Estratégia: Cache First para assets estáticos, Network First para dados dinâmicos
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar requisições para APIs externas (Supabase, EmailJS, etc)
  if (url.origin.includes('supabase.co') || 
      url.origin.includes('emailjs.com') ||
      url.origin.includes('cdn.jsdelivr.net') ||
      url.origin.includes('cdnjs.cloudflare.com')) {
    return; // Deixa passar direto para a rede
  }

  // Network First para assets estáticos (força atualização)
  // Ignorar parâmetros de versão na URL ao buscar no cache
  const cacheKey = request.url.split('?')[0];
  const cacheRequest = new Request(cacheKey, request);
  
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script' ||
      request.destination === 'font' ||
      url.pathname.includes('/assets/')) {
    
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
        .then((response) => {
          // Só cacheia se for resposta válida
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(cacheRequest, responseToCache);
              });
          }
          
          return response;
        })
        .catch(() => {
          // Se falhar, tenta buscar do cache
          return caches.match(cacheRequest)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Fallback para páginas HTML
              if (request.headers.get('accept').includes('text/html')) {
                return caches.match('/index.html');
              }
            });
        })
    );
    return;
  }

  // Network First para páginas HTML (sempre buscar da rede primeiro)
  if (request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          // Só cacheia se for resposta válida
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
          }
          
          return response;
        })
        .catch(() => {
          // Se falhar, tenta buscar do cache
          return caches.match(request)
            .then((cachedResponse) => {
              return cachedResponse || caches.match('/index.html');
            });
        })
    );
    return;
  }

  // Para outros recursos, tenta cache primeiro, depois rede
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        return cachedResponse || fetch(request);
      })
  );
});

