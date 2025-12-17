// assets/js/admin-competencias.js
// CRUD de Competências

import { protectAdminRoute, logout } from '../auth.js';
import { supabase } from '../supabase.js';

export function skillsCRUD() {
  return {
    sidebarOpen: false,
    skills: [],
    filteredSkills: [],
    showModal: false,
    loading: false,
    error: null,
    searchQuery: '',
    form: {
      id: null,
      nome: '',
      categoria: '',
      nivel: 0,
      parent_id: null,
      descricao: '',
      ordem: 0,
      desbloqueado: false,
      icon: ''
    },
    
    async initAdmin() {
      const hasAccess = await protectAdminRoute();
      if (!hasAccess) return;
      await this.loadSkills();
    },
    
    async loadSkills() {
      try {
        const { data, error } = await supabase
          .from('skills_tree')
          .select('*')
          .order('categoria', { ascending: true })
          .order('ordem', { ascending: true });
        
        if (error) throw error;
        this.skills = data || [];
        this.filteredSkills = [...this.skills];
      } catch (error) {
        
        alert('Erro ao carregar competências.');
      }
    },
    
    filterSkills() {
      if (!this.searchQuery) {
        this.filteredSkills = [...this.skills];
        return;
      }
      const query = this.searchQuery.toLowerCase();
      this.filteredSkills = this.skills.filter(s => 
        s.nome?.toLowerCase().includes(query) ||
        s.categoria?.toLowerCase().includes(query)
      );
    },
    
    openModal(mode) {
      if (mode === 'create') {
        this.form = {
          id: null,
          nome: '',
          categoria: '',
          nivel: 0,
          parent_id: null,
          descricao: '',
          ordem: 0,
          desbloqueado: false,
          icon: ''
        };
      }
      this.showModal = true;
      const modal = new bootstrap.Modal(document.getElementById('skillModal'));
      modal.show();
    },
    
    async editSkill(skillId) {
      const skill = this.skills.find(s => s.id === skillId);
      if (!skill) return;
      this.form = { ...skill };
      this.openModal('edit');
    },
    
    async saveSkill() {
      try {
        this.loading = true;
        this.error = null;
        
        if (this.form.id) {
          const { error } = await supabase
            .from('skills_tree')
            .update(this.form)
            .eq('id', this.form.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('skills_tree')
            .insert([this.form]);
          if (error) throw error;
        }
        
        await this.loadSkills();
        this.closeModal();
      } catch (error) {
        
        this.error = error.message || 'Erro ao salvar.';
      } finally {
        this.loading = false;
      }
    },
    
    async deleteSkill(skillId) {
      if (!confirm('Tem certeza que deseja excluir?')) return;
      try {
        const { error } = await supabase
          .from('skills_tree')
          .delete()
          .eq('id', skillId);
        if (error) throw error;
        await this.loadSkills();
      } catch (error) {
        
        alert('Erro ao excluir.');
      }
    },
    
    closeModal() {
      this.showModal = false;
      this.error = null;
      const modal = bootstrap.Modal.getInstance(document.getElementById('skillModal'));
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
window.skillsCRUD = skillsCRUD;

