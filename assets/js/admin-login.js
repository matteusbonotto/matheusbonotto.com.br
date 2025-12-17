// assets/js/admin-login.js
// Componente de Login Admin

import { login, checkAuth } from '../auth.js';

export function authLogin() {
  return {
    form: {
      email: '',
      password: ''
    },
    loading: false,
    error: null,
    
    async checkIfAlreadyLoggedIn() {
      const isAuth = await checkAuth();
      if (isAuth) {
        // Verificar se é admin autorizado
        const { verifyAdminAccess } = await import('../auth.js');
        const { authorized } = await verifyAdminAccess();
        if (authorized) {
          window.location.href = 'dashboard.html';
        }
      }
    },
    
    async handleLogin() {
      this.loading = true;
      this.error = null;
      
      try {
        const result = await login(this.form.email, this.form.password);
        
        if (result.success) {
          // Redirecionar para dashboard
          window.location.href = 'dashboard.html';
        } else {
          this.error = result.error || 'Erro ao fazer login. Verifique suas credenciais.';
        }
      } catch (error) {
        this.error = error.message || 'Erro inesperado ao fazer login.';
      } finally {
        this.loading = false;
      }
    }
  };
}

