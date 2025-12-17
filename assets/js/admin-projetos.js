// assets/js/admin-projetos.js
// CRUD de Projetos

import { protectAdminRoute, logout } from '../auth.js';
import { supabase } from '../supabase.js';

export function projectsCRUD() {
  return {
    sidebarOpen: false,
    projects: [],
    filteredProjects: [],
    showModal: false,
    loading: false,
    error: null,
    searchQuery: '',
    institutions: {
      professional: [],
      academic: []
    },
    form: {
      id: null,
      titulo: '',
      descricao_curta: '',
      descricao_completa: '',
      categoria: '',
      imagem_url: '',
      tags: [],
      tecnologias: [],
      funcionalidades: [],
      conquistas: [],
      link_projeto: '',
      link_github: '',
      data_projeto: '',
      data_inicio: '',
      data_fim: '',
      professional_history_id: null,
      academic_history_id: null,
      ativo: true,
      ordem: 0
    },
    
    async initAdmin() {
      const hasAccess = await protectAdminRoute();
      if (!hasAccess) return;
      await Promise.all([
        this.loadProjects(),
        this.loadInstitutions()
      ]);
    },
    
    async loadInstitutions() {
      try {
        const [professionalResult, academicResult] = await Promise.all([
          supabase.from('professional_history').select('id, instituicao').order('instituicao'),
          supabase.from('academic_history').select('id, instituicao').order('instituicao')
        ]);
        
        if (professionalResult.error) 
        if (academicResult.error) 
        
        this.institutions.professional = professionalResult.data || [];
        this.institutions.academic = academicResult.data || [];
      } catch (error) {
        
      }
    },
    
    async loadProjects() {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        this.projects = data || [];
        this.filteredProjects = [...this.projects];
      } catch (error) {
        
        alert('Erro ao carregar projetos. Verifique o console.');
      }
    },
    
    filterProjects() {
      if (!this.searchQuery) {
        this.filteredProjects = [...this.projects];
        return;
      }
      
      const query = this.searchQuery.toLowerCase();
      this.filteredProjects = this.projects.filter(p => 
        p.titulo?.toLowerCase().includes(query) ||
        p.descricao_curta?.toLowerCase().includes(query)
      );
    },
    
    openModal(mode, projectId = null) {
      if (mode === 'create') {
        this.form = {
          id: null,
          titulo: '',
          descricao_curta: '',
          descricao_completa: '',
          categoria: '',
          imagem_url: '',
          tags: [],
          tecnologias: [],
          funcionalidades: [],
          conquistas: [],
          link_projeto: '',
          link_github: '',
          data_projeto: '',
          data_inicio: '',
          data_fim: '',
          professional_history_id: null,
          academic_history_id: null,
          ativo: true,
          ordem: 0
        };
      }
      this.showModal = true;
      const modal = new bootstrap.Modal(document.getElementById('projectModal'));
      modal.show();
    },
    
    async editProject(projectId) {
      const project = this.projects.find(p => p.id === projectId);
      if (!project) return;
      
      this.form = { 
        ...project,
        professional_history_id: project.professional_history_id || null,
        academic_history_id: project.academic_history_id || null
      };
      this.openModal('edit', projectId);
    },
    
    async saveProject() {
      try {
        this.loading = true;
        this.error = null;
        
        if (this.form.id) {
          // Update
          const { error } = await supabase
            .from('projects')
            .update(this.form)
            .eq('id', this.form.id);
          
          if (error) throw error;
        } else {
          // Create
          const { error } = await supabase
            .from('projects')
            .insert([this.form]);
          
          if (error) throw error;
        }
        
        await this.loadProjects();
        this.closeModal();
      } catch (error) {
        
        this.error = error.message || 'Erro ao salvar projeto.';
      } finally {
        this.loading = false;
      }
    },
    
    async deleteProject(projectId) {
      if (!confirm('Tem certeza que deseja excluir este projeto?')) return;
      
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectId);
        
        if (error) throw error;
        
        await this.loadProjects();
      } catch (error) {
        
        alert('Erro ao excluir projeto. Verifique o console.');
      }
    },
    
    closeModal() {
      this.showModal = false;
      this.error = null;
      const modal = bootstrap.Modal.getInstance(document.getElementById('projectModal'));
      if (modal) modal.hide();
    },
    
    formatDate(dateString) {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('pt-BR');
    },
    
    getCategoryColor(categoria) {
      const colors = {
        'qa': 'primary',
        'dev': 'success',
        'design': 'danger',
        'data': 'info',
        'devops': 'warning',
        'infra': 'secondary'
      };
      return colors[categoria?.toLowerCase()] || 'secondary';
    },
    
    async handleLogout() {
      if (confirm('Tem certeza que deseja sair?')) {
        await logout();
      }
    }
  };
}

