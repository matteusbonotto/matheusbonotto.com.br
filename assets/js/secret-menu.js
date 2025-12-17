// assets/js/secret-menu.js
// Menu secreto ativado por clique direito no logo + código "iddqd"

(function() {
  'use strict';
  
  const SECRET_CODE = 'iddqd';
  let cheatCodeInput = null;
  
  // Detectar clique direito no logo
  document.addEventListener('contextmenu', function(e) {
    const logo = e.target.closest('img[src*="logo"], .navbar-brand img, .logo');
    
    if (logo) {
      e.preventDefault();
      e.stopPropagation();
      showCheatCodeInput(e);
    }
  });
  
  function showCheatCodeInput(e) {
    // Remover input existente se houver
    if (cheatCodeInput) {
      cheatCodeInput.remove();
      cheatCodeInput = null;
    }
    
    // Criar input de cheat code
    const container = document.createElement('div');
    container.id = 'cheat-code-container';
    container.className = 'cheat-code-container';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'cheat-code-input';
    input.className = 'cheat-code-input';
    input.placeholder = 'Digite o cheatcode...';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('data-original-placeholder', 'Digite o cheatcode...');
    
    const label = document.createElement('label');
    label.className = 'cheat-code-label';
    label.setAttribute('for', 'cheat-code-input');
    
    container.appendChild(label);
    container.appendChild(input);
    
    // Posicionar próximo ao logo
    const logoRect = e.target.getBoundingClientRect();
    container.style.position = 'fixed';
    container.style.top = (logoRect.bottom + 10) + 'px';
    container.style.left = logoRect.left + 'px';
    container.style.zIndex = '9999';
    
    document.body.appendChild(container);
    cheatCodeInput = container;
    
    // Focar no input
    setTimeout(() => {
      input.focus();
    }, 100);
    
    // Validar código ao pressionar Enter
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        validateCheatCode(input.value.trim());
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeCheatCodeInput();
      }
    });
    
    // Fechar ao clicar fora
    const closeOnClickOutside = (e) => {
      if (!container.contains(e.target) && e.target !== logo) {
        closeCheatCodeInput();
        document.removeEventListener('click', closeOnClickOutside);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', closeOnClickOutside);
    }, 100);
  }
  
  function validateCheatCode(code) {
    const input = document.getElementById('cheat-code-input');
    const container = document.getElementById('cheat-code-container');
    
    if (code.toLowerCase() === SECRET_CODE) {
      closeCheatCodeInput();
      showSecretMenu();
    } else {
      // Feedback visual de erro com tremor
      input.classList.add('error', 'shake');
      input.value = '';
      
      // Restaurar placeholder original
      const originalPlaceholder = 'Digite o cheatcode...';
      input.placeholder = originalPlaceholder;
      
      // Mostrar mensagem de erro
      let errorMessage = container.querySelector('.error-message');
      if (!errorMessage) {
        errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        container.appendChild(errorMessage);
      }
      errorMessage.textContent = 'Código incorreto! Tente novamente.';
      errorMessage.style.display = 'block';
      
      // Remover classes de erro após 1 segundo
      setTimeout(() => {
        input.classList.remove('error', 'shake');
        errorMessage.style.display = 'none';
        input.placeholder = originalPlaceholder;
      }, 1000);
    }
  }
  
  function closeCheatCodeInput() {
    if (cheatCodeInput) {
      cheatCodeInput.remove();
      cheatCodeInput = null;
    }
  }
  
  function showSecretMenu() {
    // Verificar se o item já existe
    const existingItem = document.getElementById('secret-admin-nav-item');
    if (existingItem) {
      return; // Já está visível
    }
    
    // Verificar se estamos na index.html (estrutura diferente - sem navbar-nav)
    const hasNavbarNav = document.querySelector('.navbar-nav');
    const container = document.querySelector('.navbar .container');
    const navbarBrand = document.querySelector('.navbar-brand');
    
    // Se não tem navbar-nav mas tem container e navbar-brand, é index.html
    if (!hasNavbarNav && container && navbarBrand) {
      // Criar link Admin
      const adminLink = document.createElement('a');
      adminLink.id = 'secret-admin-nav-item';
      adminLink.className = 'nav-link';
      adminLink.href = 'admin/login.html';
      adminLink.innerHTML = '<i class="bi bi-shield-lock-fill me-1"></i>Admin';
      adminLink.style.cssText = `
        color: #667eea !important;
        font-weight: 600;
        text-decoration: none;
        padding: 0.5rem 1rem;
        margin-left: auto;
        animation: fadeInSlide 0.3s ease;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
      `;
      
      // Adicionar hover
      adminLink.addEventListener('mouseenter', () => {
        adminLink.style.color = '#764ba2';
        adminLink.style.transform = 'translateY(-2px)';
      });
      adminLink.addEventListener('mouseleave', () => {
        adminLink.style.color = '#667eea';
        adminLink.style.transform = 'translateY(0)';
      });
      
      // Ajustar container para flexbox
      // Preservar justify-content-center mas adicionar space-between
      const currentJustify = window.getComputedStyle(container).justifyContent;
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      // Se já tem justify-content-center, mudar para space-between
      if (currentJustify === 'center' || container.classList.contains('justify-content-center')) {
        container.style.justifyContent = 'space-between';
        container.classList.remove('justify-content-center');
      }
      
      // Adicionar ao container (ao lado do navbar-brand)
      container.appendChild(adminLink);
      
      
      return;
    }
    
    // Para outras páginas, procurar navbar-nav tradicional
    let navbar = document.querySelector('.navbar-nav');
    if (!navbar) {
      navbar = document.querySelector('#navbarNav ul');
    }
    if (!navbar) {
      navbar = document.querySelector('nav ul');
    }
    if (!navbar) {
      // Se não encontrar, tentar criar a estrutura
      const navCollapse = document.querySelector('#navbarNav, .navbar-collapse');
      if (navCollapse) {
        navbar = navCollapse.querySelector('ul');
        if (!navbar) {
          navbar = document.createElement('ul');
          navbar.className = 'navbar-nav ms-auto';
          navCollapse.appendChild(navbar);
        }
      }
    }
    
    if (!navbar) {
      
      return;
    }
    
    // Encontrar o item "Contato" ou usar o último item
    const contatoItem = Array.from(navbar.querySelectorAll('.nav-item')).find(item => {
      const link = item.querySelector('a');
      return link && (link.textContent.includes('Contato') || link.getAttribute('href')?.includes('contato'));
    });
    
    // Criar item de menu secreto
    const menuItem = document.createElement('li');
    menuItem.id = 'secret-admin-nav-item';
    menuItem.className = 'nav-item';
    menuItem.style.animation = 'fadeInSlide 0.3s ease';
    
    const menuLink = document.createElement('a');
    menuLink.className = 'nav-link';
    // Determinar caminho relativo baseado na localização atual
    const isAdminPage = window.location.pathname.includes('/admin/');
    menuLink.href = isAdminPage ? 'login.html' : 'admin/login.html';
    menuLink.innerHTML = '<i class="bi bi-shield-lock-fill me-1"></i>Admin';
    menuLink.style.color = '#667eea';
    menuLink.style.fontWeight = '600';
    
    menuItem.appendChild(menuLink);
    
    // Inserir após "Contato" ou no final
    if (contatoItem && contatoItem.nextSibling) {
      navbar.insertBefore(menuItem, contatoItem.nextSibling);
    } else if (contatoItem) {
      navbar.appendChild(menuItem);
    } else {
      // Se não encontrar Contato, adicionar no final
      navbar.appendChild(menuItem);
    }
    
    // Adicionar estilos se não existirem
    if (!document.getElementById('secret-menu-styles')) {
      const styles = document.createElement('style');
      styles.id = 'secret-menu-styles';
      styles.textContent = `
        /* Cheat Code Input */
        .cheat-code-container {
          background: rgba(0, 0, 0, 0.9);
          border: 2px solid #667eea;
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
          animation: cheatCodeFadeIn 0.3s ease;
          backdrop-filter: blur(10px);
        }
        
        @keyframes cheatCodeFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .cheat-code-label {
          display: block;
          color: #667eea;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 0.5rem;
          font-family: 'Courier New', monospace;
        }
        
        .cheat-code-input {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #667eea;
          border-radius: 0.25rem;
          color: white;
          padding: 0.5rem 0.75rem;
          font-size: 0.9rem;
          font-family: 'Courier New', monospace;
          width: 200px;
          outline: none;
          transition: all 0.2s ease;
        }
        
        .cheat-code-input:focus {
          background: rgba(255, 255, 255, 0.15);
          border-color: #764ba2;
          box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
        }
        
        .cheat-code-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
        
        .cheat-code-input.error {
          border-color: #dc3545;
          background: rgba(220, 53, 69, 0.1);
        }
        
        .cheat-code-input.shake {
          animation: shake 1s ease;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        
        .error-message {
          color: #dc3545;
          font-size: 0.75rem;
          margin-top: 0.5rem;
          text-align: center;
          font-weight: 600;
          display: none;
          animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Secret Menu Item Animation */
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        #secret-admin-nav-item .nav-link {
          transition: all 0.2s ease;
        }
        
        #secret-admin-nav-item .nav-link:hover {
          color: #764ba2 !important;
          transform: translateY(-2px);
        }
      `;
      document.head.appendChild(styles);
    }
  }
  
  
})();

