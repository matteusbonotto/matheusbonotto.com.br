// assets/js/admin-dashboard.js
// Componente Dashboard Admin

import { protectAdminRoute, logout, getCurrentUser } from '../auth.js';
import { supabase } from '../supabase.js';

export function adminDashboard() {
  return {
    sidebarOpen: false,
    userEmail: '',
    loading: true,
    stats: {
      totalProjetos: 0,
      totalSkills: 0,
      totalConquistas: 0,
      mensagensNaoLidas: 0
    },
    
    async initAdmin() {
      // Verificar acesso antes de carregar dados
      const hasAccess = await protectAdminRoute();
      if (!hasAccess) {
        return;
      }
      
      // Carregar email do usuário
      const user = await getCurrentUser();
      if (user) {
        this.userEmail = user.email;
      }
      
      // Carregar estatísticas
      await this.loadStats();
    },
    
    async loadStats() {
      try {
        this.loading = true;
        
        // Carregar estatísticas em paralelo
        const [projectsResult, skillsResult, achievementsResult, messagesResult] = await Promise.all([
          supabase.from('projects').select('id', { count: 'exact', head: true }),
          supabase.from('skills_tree').select('id', { count: 'exact', head: true }),
          supabase.from('achievements').select('id', { count: 'exact', head: true }),
          supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('lida', false)
        ]);
        
        this.stats = {
          totalProjetos: projectsResult.count || 0,
          totalSkills: skillsResult.count || 0,
          totalConquistas: achievementsResult.count || 0,
          mensagensNaoLidas: messagesResult.count || 0
        };
      } catch (error) {
        
        alert('Erro ao carregar estatísticas. Verifique o console.');
      } finally {
        this.loading = false;
      }
    },
    
    async handleLogout() {
      if (confirm('Tem certeza que deseja sair?')) {
        await logout();
      }
    }
  };
}

