// assets/js/cache-buster.js
// Sistema automático de limpeza de cache e cookies
// Força atualização quando necessário, especialmente no mobile

(function() {
  'use strict';

  // Versão do app - INCREMENTAR SEMPRE QUE FIZER DEPLOY
  const APP_VERSION = '2.0.0';
  const VERSION_KEY = 'mabs_app_version';
  const LAST_CLEAR_KEY = 'mabs_last_cache_clear';
  
  // Limpar cache a cada X dias (7 dias por padrão)
  const CACHE_CLEAR_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms

  function initCacheBuster() {
    
    
    // Verificar versão armazenada
    const storedVersion = localStorage.getItem(VERSION_KEY);
    const lastClear = localStorage.getItem(LAST_CLEAR_KEY);
    const now = Date.now();
    
    // Se não tem versão armazenada ou versão mudou, limpar tudo
    if (!storedVersion || storedVersion !== APP_VERSION) {
      
      clearAllCache();
      localStorage.setItem(VERSION_KEY, APP_VERSION);
      localStorage.setItem(LAST_CLEAR_KEY, now.toString());
      return;
    }
    
    // Se passou o intervalo, limpar cache
    if (lastClear && (now - parseInt(lastClear)) > CACHE_CLEAR_INTERVAL) {
      
      clearAllCache();
      localStorage.setItem(LAST_CLEAR_KEY, now.toString());
      return;
    }
    
    // Limpar cookies antigos (manter apenas os essenciais)
    clearOldCookies();
    
    
  }

  function clearAllCache() {
    
    
    // 1. Limpar localStorage (exceto versão e última limpeza)
    const version = localStorage.getItem(VERSION_KEY);
    const lastClear = localStorage.getItem(LAST_CLEAR_KEY);
    localStorage.clear();
    if (version) localStorage.setItem(VERSION_KEY, version);
    if (lastClear) localStorage.setItem(LAST_CLEAR_KEY, lastClear);
    
    // 2. Limpar sessionStorage
    sessionStorage.clear();
    
    // 3. Limpar cookies (exceto os essenciais)
    clearOldCookies();
    
    // 4. Limpar cache do Service Worker
    if ('serviceWorker' in navigator && 'caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          
          caches.delete(cacheName);
        });
      });
    }
    
    // 5. Limpar cache do navegador (forçar reload sem cache)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().then(() => {
            
            // Recarregar página sem cache
            window.location.reload(true);
          });
        });
      });
    }
  }

  function clearOldCookies() {
    // Lista de cookies essenciais a manter (se houver)
    const essentialCookies = [];
    
    // Limpar todos os cookies do domínio atual
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      // Se não for essencial, remover
      if (!essentialCookies.includes(name)) {
        // Remover cookie definindo expiração no passado
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${window.location.hostname};`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=.${window.location.hostname};`;
      }
    });
  }

  // Adicionar parâmetro de versão aos recursos estáticos
  function addVersionToResources() {
    // Adicionar versão aos links CSS
    document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      if (link.href && !link.href.includes('cdn.jsdelivr.net') && !link.href.includes('cdnjs.cloudflare.com')) {
        const url = new URL(link.href, window.location.origin);
        url.searchParams.set('v', APP_VERSION);
        link.href = url.toString();
      }
    });
    
    // Adicionar versão aos scripts (exceto externos)
    document.querySelectorAll('script[src]').forEach((script) => {
      if (script.src && !script.src.includes('cdn.jsdelivr.net') && 
          !script.src.includes('cdnjs.cloudflare.com') &&
          !script.src.includes('supabase.co') &&
          !script.src.includes('emailjs.com')) {
        const url = new URL(script.src, window.location.origin);
        url.searchParams.set('v', APP_VERSION);
        script.src = url.toString();
      }
    });
  }

  // Forçar reload sem cache quando necessário
  function forceReload() {
    // Adicionar timestamp para forçar reload
    const timestamp = Date.now();
    const url = new URL(window.location.href);
    url.searchParams.set('_t', timestamp);
    
    // Usar replace para não adicionar ao histórico
    window.location.replace(url.toString());
  }

  // Detectar mudanças no Service Worker e forçar atualização
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      
      setTimeout(() => {
        window.location.reload(true);
      }, 100);
    });
  }

  // Inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initCacheBuster();
      addVersionToResources();
    });
  } else {
    initCacheBuster();
    addVersionToResources();
  }

  // Exportar funções globais para uso manual se necessário
  window.clearAppCache = clearAllCache;
  window.forceAppReload = forceReload;
  
  ');
})();


