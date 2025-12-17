// assets/js/admin-conquistas.js
// CRUD de Conquistas

import { protectAdminRoute, logout } from '../auth.js';
import { supabase } from '../supabase.js';

export function achievementsCRUD() {
  return {
    sidebarOpen: false,
    achievements: [],
    filteredAchievements: [],
    showModal: false,
    loading: false,
    error: null,
    searchQuery: '',
    form: {
      id: null,
      titulo: '',
      descricao: '',
      categoria: '',
      imagem_url: '',
      desbloqueado: false,
      data_conquista: '',
      ordem: 0,
      evidencias_urls_text: ''
    },
    
    async initAdmin() {
      const hasAccess = await protectAdminRoute();
      if (!hasAccess) return;
      await this.loadAchievements();
    },
    
    async loadAchievements() {
      try {
        const { data, error } = await supabase
          .from('achievements')
          .select('*')
          .order('ordem', { ascending: true });
        if (error) throw error;
        this.achievements = data || [];
        this.filteredAchievements = [...this.achievements];
      } catch (error) {
        
        alert('Erro ao carregar conquistas.');
      }
    },
    
    filterAchievements() {
      if (!this.searchQuery) {
        this.filteredAchievements = [...this.achievements];
        return;
      }
      const query = this.searchQuery.toLowerCase();
      this.filteredAchievements = this.achievements.filter(a => 
        a.titulo?.toLowerCase().includes(query) ||
        a.categoria?.toLowerCase().includes(query)
      );
    },
    
    openModal(mode) {
      if (mode === 'create') {
        this.form = {
          id: null,
          titulo: '',
          descricao: '',
          categoria: '',
          imagem_url: '',
          desbloqueado: false,
          data_conquista: '',
          ordem: 0,
          evidencias_urls_text: ''
        };
      }
      this.showModal = true;
      const modal = new bootstrap.Modal(document.getElementById('achievementModal'));
      modal.show();
    },
    
    async editAchievement(achievementId) {
      const achievement = this.achievements.find(a => a.id === achievementId);
      if (!achievement) return;
      this.form = { ...achievement };
      // Converter array de evidencias_urls para texto
      if (Array.isArray(achievement.evidencias_urls)) {
        this.form.evidencias_urls_text = achievement.evidencias_urls.join(', ');
      } else {
        this.form.evidencias_urls_text = '';
      }
      this.openModal('edit');
    },
    
    async saveAchievement() {
      try {
        this.loading = true;
        this.error = null;
        
        // Preparar dados para salvar
        const dataToSave = { ...this.form };
        
        // Converter evidencias_urls_text para array
        if (dataToSave.evidencias_urls_text) {
          dataToSave.evidencias_urls = dataToSave.evidencias_urls_text
            .split(',')
            .map(url => url.trim())
            .filter(url => url.length > 0);
        } else {
          dataToSave.evidencias_urls = [];
        }
        
        // Remover campo temporário
        delete dataToSave.evidencias_urls_text;
        
        if (this.form.id) {
          const { error } = await supabase
            .from('achievements')
            .update(dataToSave)
            .eq('id', this.form.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('achievements')
            .insert([dataToSave]);
          if (error) throw error;
        }
        
        await this.loadAchievements();
        this.closeModal();
      } catch (error) {
        
        this.error = error.message || 'Erro ao salvar.';
      } finally {
        this.loading = false;
      }
    },
    
    async deleteAchievement(achievementId) {
      if (!confirm('Tem certeza que deseja excluir?')) return;
      try {
        const { error } = await supabase
          .from('achievements')
          .delete()
          .eq('id', achievementId);
        if (error) throw error;
        await this.loadAchievements();
      } catch (error) {
        
        alert('Erro ao excluir.');
      }
    },
    
    closeModal() {
      this.showModal = false;
      this.error = null;
      const modal = bootstrap.Modal.getInstance(document.getElementById('achievementModal'));
      if (modal) modal.hide();
    },
    
    async handleLogout() {
      if (confirm('Tem certeza que deseja sair?')) {
        await logout();
      }
    }
  };
}

// Registrar globalmente para Alpine.js
window.achievementsCRUD = achievementsCRUD;

