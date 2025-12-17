// assets/js/admin-historico.js
// CRUD de Histórico

import { protectAdminRoute, logout } from '../auth.js';
import { supabase } from '../supabase.js';

export function historyCRUD() {
  return {
    sidebarOpen: false,
    activeTab: 'academico',
    academicHistory: [],
    professionalHistory: [],
    filteredHistory: [],
    showModal: false,
    loading: false,
    error: null,
    searchQuery: '',
    form: {
      id: null,
      instituicao: '',
      curso: '',
      titulo: '',
      data_inicio: '',
      data_fim: '',
      atual: false,
      descricao: '',
      categoria_profissional: 'TODOS',
      logo_url: '',
      imagens_urls: [],
      ordem: 0
    },
    newImageUrl: '',
    
    async initAdmin() {
      const hasAccess = await protectAdminRoute();
      if (!hasAccess) return;
      await this.loadHistory();
    },
    
    async loadHistory() {
      try {
        const [academicResult, professionalResult] = await Promise.all([
          supabase.from('academic_history').select('*').order('data_inicio', { ascending: false }),
          supabase.from('professional_history').select('*').order('data_inicio', { ascending: false })
        ]);
        
        this.academicHistory = academicResult.data || [];
        this.professionalHistory = professionalResult.data || [];
        this.updateFilteredHistory();
      } catch (error) {
        
        alert('Erro ao carregar histórico.');
      }
    },
    
    updateFilteredHistory() {
      const history = this.activeTab === 'academico' ? this.academicHistory : this.professionalHistory;
      if (!this.searchQuery) {
        this.filteredHistory = [...history];
        return;
      }
      const query = this.searchQuery.toLowerCase();
      this.filteredHistory = history.filter(h => 
        h.instituicao?.toLowerCase().includes(query) ||
        (h.titulo || h.curso)?.toLowerCase().includes(query)
      );
    },
    
    filterHistory() {
      this.updateFilteredHistory();
    },
    
    openModal(mode, itemId = null) {
      if (mode === 'create') {
        this.form = {
          id: null,
          instituicao: '',
          curso: '',
          titulo: '',
          data_inicio: '',
          data_fim: '',
          atual: false,
          descricao: '',
          categoria_profissional: 'TODOS',
          logo_url: '',
          imagens_urls: [],
          ordem: 0
        };
        this.newImageUrl = '';
      }
      this.showModal = true;
      const modal = new bootstrap.Modal(document.getElementById('historyModal'));
      modal.show();
    },
    
    async editItem(itemId) {
      const history = this.activeTab === 'academico' ? this.academicHistory : this.professionalHistory;
      const item = history.find(h => h.id === itemId);
      if (!item) return;
      this.form = { ...item };
      this.openModal('edit');
    },
    
    async saveItem() {
      try {
        this.loading = true;
        this.error = null;
        
        const table = this.activeTab === 'academico' ? 'academic_history' : 'professional_history';
        const data = { ...this.form };
        
        if (this.activeTab === 'academico') {
          delete data.titulo;
        } else {
          delete data.curso;
        }
        
        if (data.id) {
          const { error } = await supabase
            .from(table)
            .update(data)
            .eq('id', data.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from(table)
            .insert([data]);
          if (error) throw error;
        }
        
        await this.loadHistory();
        this.closeModal();
      } catch (error) {
        
        this.error = error.message || 'Erro ao salvar.';
      } finally {
        this.loading = false;
      }
    },
    
    async deleteItem(itemId) {
      if (!confirm('Tem certeza que deseja excluir?')) return;
      try {
        const table = this.activeTab === 'academico' ? 'academic_history' : 'professional_history';
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', itemId);
        if (error) throw error;
        await this.loadHistory();
      } catch (error) {
        
        alert('Erro ao excluir.');
      }
    },
    
    formatDateRange(dataInicio, dataFim, atual) {
      if (!dataInicio) return '-';
      const inicio = new Date(dataInicio).toLocaleDateString('pt-BR');
      if (atual) return `${inicio} - Atual`;
      if (dataFim) {
        const fim = new Date(dataFim).toLocaleDateString('pt-BR');
        return `${inicio} - ${fim}`;
      }
      return inicio;
    },
    
    addImage() {
      if (!this.newImageUrl || !this.newImageUrl.trim()) return;
      if (!this.form.imagens_urls) {
        this.form.imagens_urls = [];
      }
      this.form.imagens_urls.push(this.newImageUrl.trim());
      this.newImageUrl = '';
    },
    
    removeImage(index) {
      if (this.form.imagens_urls && this.form.imagens_urls.length > index) {
        this.form.imagens_urls.splice(index, 1);
      }
    },
    
    closeModal() {
      this.showModal = false;
      this.error = null;
      const modal = bootstrap.Modal.getInstance(document.getElementById('historyModal'));
      if (modal) modal.hide();
    },
    
    async handleLogout() {
      if (confirm('Tem certeza que deseja sair?')) {
        await logout();
      }
    }
  };
}

