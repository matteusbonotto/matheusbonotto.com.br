// assets/js/pwa.js
// Registro e gerenciamento do Service Worker para PWA

(function() {
  'use strict';

  // Verificar se o navegador suporta Service Workers
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      registerServiceWorker();
    });
  }

  // Flag para evitar múltiplas notificações
  let updateNotificationShown = false;
  let updateCheckInterval = null;
  let updateFoundListenerAdded = false;
  let messageListenerAdded = false;
  let controllerChangeListenerAdded = false;

  function registerServiceWorker() {
    // Registrar sem timestamp para evitar detecção falsa de atualização
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        

        // Verificar atualizações periodicamente (menos frequente para evitar loops)
        if (updateCheckInterval) {
          clearInterval(updateCheckInterval);
        }
        updateCheckInterval = setInterval(() => {
          registration.update().catch(err => {
            
          });
        }, 300000); // A cada 5 minutos (reduzido de 30 segundos)

        // Listener para atualizações do Service Worker (só uma vez)
        if (!updateFoundListenerAdded) {
          updateFoundListenerAdded = true;
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            
            if (!newWorker) return;
            
            newWorker.addEventListener('statechange', () => {
              // Só mostrar notificação se realmente houver uma nova versão instalada
              // e ainda não tiver mostrado a notificação
              if (newWorker.state === 'installed' && 
                  navigator.serviceWorker.controller && 
                  !updateNotificationShown) {
                
                updateNotificationShown = true;
                
                // Aguardar um pouco antes de mostrar notificação
                setTimeout(() => {
                  showUpdateNotification();
                }, 1000);
              }
            });
          });
        }
        
        // Listener para mensagens do Service Worker (só uma vez)
        if (!messageListenerAdded) {
          messageListenerAdded = true;
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SW_UPDATED') {
              
              // Recarregar página imediatamente (só uma vez)
              if (!updateNotificationShown) {
                updateNotificationShown = true;
                setTimeout(() => {
                  window.location.reload(true);
                }, 500);
              }
            }
          });
        }
      })
      .catch((error) => {
        
      });

    // Listener para mudanças de controle do Service Worker (só uma vez)
    if (!controllerChangeListenerAdded) {
      controllerChangeListenerAdded = true;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        
        // Recarregar página para usar nova versão (sem cache) - só uma vez
        if (!updateNotificationShown) {
          updateNotificationShown = true;
          setTimeout(() => {
            window.location.reload(true);
          }, 500);
        }
      });
    }
  }

  function showUpdateNotification() {
    // Evitar múltiplas notificações
    if (updateNotificationShown) {
      return;
    }
    
    // Marcar como mostrado antes de exibir
    updateNotificationShown = true;
    
    // Criar notificação simples (pode ser melhorada com UI customizada)
    if (confirm('Uma nova versão do site está disponível. Deseja atualizar agora?')) {
      // Forçar atualização
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
      }
      // Recarregar após um pequeno delay
      setTimeout(() => {
        window.location.reload(true);
      }, 500);
    } else {
      // Se o usuário cancelar, resetar a flag após um tempo
      setTimeout(() => {
        updateNotificationShown = false;
      }, 60000); // Resetar após 1 minuto
    }
  }

  // Função para solicitar instalação do PWA
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir o prompt padrão
    e.preventDefault();
    // Guardar o evento para usar depois
    deferredPrompt = e;
    
    // Mostrar botão de instalação customizado (opcional)
    showInstallButton();
  });

  function showInstallButton() {
    // Verificar se já existe um botão
    if (document.getElementById('pwa-install-btn')) {
      return;
    }

    // Criar botão de instalação (pode ser customizado)
    const installBtn = document.createElement('button');
    installBtn.id = 'pwa-install-btn';
    installBtn.className = 'btn btn-primary position-fixed';
    installBtn.style.cssText = 'bottom: 20px; right: 20px; z-index: 1000; display: none;';
    installBtn.innerHTML = '<i class="bi bi-download"></i> Instalar App';
    installBtn.addEventListener('click', installPWA);
    
    document.body.appendChild(installBtn);
    
    // Mostrar após um delay
    setTimeout(() => {
      installBtn.style.display = 'block';
    }, 3000);
  }

  function installPWA() {
    if (!deferredPrompt) {
      return;
    }

    // Mostrar o prompt de instalação
    deferredPrompt.prompt();

    // Aguardar resposta do usuário
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        
      } else {
        
      }
      
      // Limpar o prompt
      deferredPrompt = null;
      
      // Esconder botão
      const installBtn = document.getElementById('pwa-install-btn');
      if (installBtn) {
        installBtn.style.display = 'none';
      }
    });
  }

  // Listener para quando o app é instalado
  window.addEventListener('appinstalled', () => {
    
    deferredPrompt = null;
    
    // Esconder botão de instalação
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.style.display = 'none';
    }
  });

  // Verificar se já está instalado
  if (window.matchMedia('(display-mode: standalone)').matches) {
    ');
  }

})();

