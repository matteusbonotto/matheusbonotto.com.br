// assets/js/components.js
// Componentes reutilizáveis com Alpine.js

// Componente Header - Navbar
function headerComponent() {
  return {
    activePage: '',
    
    init() {
      // Detectar página ativa baseado na URL
      const currentPath = window.location.pathname;
      const currentPage = currentPath.split('/').pop() || 'index.html';
      
      // Mapear páginas
      const pageMap = {
        'index.html': 'home',
        'historia.html': 'historia',
        'portfolio.html': 'portfolio',
        'competencias.html': 'competencias',
        'cv.html': 'cv',
        'contato.html': 'contato'
      };
      
      this.activePage = pageMap[currentPage] || '';
    },
    
    isActive(page) {
      return this.activePage === page;
    }
  };
}

// Componente Footer
function footerComponent() {
  return {
    currentYear: new Date().getFullYear(),
    clearingCache: false,
    
    async clearCache(event) {
      if (this.clearingCache) return;
      
      this.clearingCache = true;
      
      try {
        // Mostrar feedback visual
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Limpando...';
        btn.disabled = true;
        
        // 1. Limpar localStorage (exceto versão)
        const version = localStorage.getItem('mabs_app_version');
        const lastClear = localStorage.getItem('mabs_last_cache_clear');
        localStorage.clear();
        if (version) localStorage.setItem('mabs_app_version', version);
        if (lastClear) localStorage.setItem('mabs_last_cache_clear', lastClear);
        
        // 2. Limpar sessionStorage
        sessionStorage.clear();
        
        // 3. Limpar cookies
        document.cookie.split(";").forEach((cookie) => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${window.location.hostname};`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=.${window.location.hostname};`;
        });
        
        // 4. Limpar cache do Service Worker
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => {
              
              return caches.delete(cacheName);
            })
          );
        }
        
        // 5. Desregistrar Service Worker
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(
            registrations.map(registration => registration.unregister())
          );
        }
        
        // 6. Forçar reload sem cache
        btn.innerHTML = '<i class="bi bi-check-circle"></i> Limpo! Recarregando...';
        
        setTimeout(() => {
          // Adicionar timestamp para forçar reload
          const url = new URL(window.location.href);
          url.searchParams.set('_nocache', Date.now());
          window.location.href = url.toString();
        }, 500);
        
      } catch (error) {
        
        alert('Erro ao limpar cache. Tente recarregar a página manualmente (Ctrl+Shift+R ou Cmd+Shift+R)');
        this.clearingCache = false;
        const btn = event.target;
        btn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Limpar Cache';
        btn.disabled = false;
      }
    }
  };
}

// Função para renderizar Header HTML
function renderHeader() {
  return `
    <header class="header" x-data="headerComponent()" x-init="init()">
      <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
          <a class="navbar-brand d-flex align-items-center gap-2" href="/">
            <img src="assets/logo-branco.png" alt="Logo Matheus Bonotto" height="32">
            <span>Matheus Bonotto</span>
          </a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto">
              <li class="nav-item">
                <a class="nav-link" :class="{ 'active': isActive('home') }" href="index.html">Home</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" :class="{ 'active': isActive('historia') }" href="historia.html">História</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" :class="{ 'active': isActive('portfolio') }" href="portfolio.html">Portfólio</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" :class="{ 'active': isActive('competencias') }" href="competencias.html">Competências</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" :class="{ 'active': isActive('cv') }" href="cv.html">Currículo</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" :class="{ 'active': isActive('contato') }" href="contato.html">Contato</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  `;
}

// Função para renderizar Footer HTML
function renderFooter() {
  return `
    <footer class="footer bg-dark text-white py-4 mt-5" x-data="footerComponent()">
      <div class="container text-center">
        <p>&copy; <span x-text="currentYear"></span> Matheus Bonotto. Todos os direitos reservados.</p>
        <button 
          @click="clearCache($event)"
          :disabled="clearingCache"
          class="btn btn-link p-0 mt-2"
          style="font-size: 0.75rem; text-decoration: none; color: #6c757d !important; opacity: 0.7; transition: opacity 0.2s;"
          onmouseover="this.style.opacity='1'; this.style.color='#ffffff !important';"
          onmouseout="this.style.opacity='0.7'; this.style.color='#6c757d !important';"
          title="Limpar cache e recarregar página"
        >
          <i class="bi bi-arrow-clockwise"></i> Limpar Cache
        </button>
      </div>
    </footer>
  `;
}

// Função para renderizar PWA Meta Tags HTML
function renderPWAMetaTags() {
  return `
    <!-- PWA Meta Tags -->
    <meta name="description" content="Portfólio profissional de Matheus Bonotto - QA, Automação e Análise de Dados">
    <meta name="theme-color" content="#212529">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black">
    <meta name="apple-mobile-web-app-title" content="Matheus Bonotto">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="msapplication-TileColor" content="#212529">
    
    <!-- Cache Prevention Meta Tags -->
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    
    <!-- Favicons -->
    <link rel="icon" type="image/x-icon" href="/assets/favicon/favicon.ico">
    <link rel="icon" type="image/svg+xml" href="/assets/favicon/favicon.svg">
    <link rel="apple-touch-icon" href="/assets/favicon/apple-touch-icon.png">
    <link rel="manifest" href="/assets/favicon/site.webmanifest">
  `;
}

// Função para renderizar PWA Scripts HTML
function renderPWAScripts() {
  return `
    <!-- Cache Buster (deve ser carregado primeiro) -->
    <script src="assets/js/cache-buster.js"></script>
    <!-- PWA Service Worker -->
    <script src="assets/js/pwa.js"></script>
  `;
}

// Função para inicializar componentes (insere Header e Footer no DOM)
function initComponents() {
  // Inserir Header
  const headerPlaceholder = document.getElementById('header-placeholder');
  if (headerPlaceholder) {
    headerPlaceholder.outerHTML = renderHeader();
    // Re-inicializar Alpine.js para o novo elemento
    if (window.Alpine) {
      window.Alpine.initTree(headerPlaceholder.parentElement);
    }
  }
  
  // Inserir Footer
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (footerPlaceholder) {
    footerPlaceholder.outerHTML = renderFooter();
    // Re-inicializar Alpine.js para o novo elemento
    if (window.Alpine) {
      window.Alpine.initTree(footerPlaceholder.parentElement);
    }
  }
}

// Função para inserir PWA meta tags no head
function insertPWAMetaTags() {
  const head = document.head || document.getElementsByTagName('head')[0];
  if (head && !head.querySelector('meta[name="theme-color"]')) {
    const metaTagsHTML = renderPWAMetaTags();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = metaTagsHTML;
    while (tempDiv.firstChild) {
      head.appendChild(tempDiv.firstChild);
    }
  }
}

// Função para inserir PWA scripts antes do </body>
function insertPWAScripts() {
  const body = document.body;
  if (body && !body.querySelector('script[src*="pwa.js"]')) {
    const scriptsHTML = renderPWAScripts();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = scriptsHTML;
    while (tempDiv.firstChild) {
      body.appendChild(tempDiv.firstChild);
    }
  }
}

// Registrar componentes globalmente
window.headerComponent = headerComponent;
window.footerComponent = footerComponent;
window.renderHeader = renderHeader;
window.renderFooter = renderFooter;
window.renderPWAMetaTags = renderPWAMetaTags;
window.renderPWAScripts = renderPWAScripts;
window.initComponents = initComponents;
window.insertPWAMetaTags = insertPWAMetaTags;
window.insertPWAScripts = insertPWAScripts;

// Auto-inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initComponents();
    insertPWAMetaTags();
  });
} else {
  initComponents();
  insertPWAMetaTags();
}

// Inserir PWA scripts após um pequeno delay para garantir que o body está pronto
setTimeout(() => {
  insertPWAScripts();
}, 100);

