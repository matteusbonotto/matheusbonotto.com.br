// assets/js/portfolio.js
// Componente Alpine.js para Portfólio

import { supabase } from './supabase.js';

function portfolioGrid() {
  return {
    projects: [],
    filteredProjects: [],
    loading: true,
    selectedProject: null,
    activeCategory: '',
    searchQuery: '',
    
    async loadProjects() {
      try {
        this.loading = true;
        
        
        // Carregar projetos com informações das instituições relacionadas
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select(`
            *,
            professional_history:professional_history_id(id, instituicao, logo_url, titulo),
            academic_history:academic_history_id(id, instituicao, logo_url, curso)
          `)
          .eq('ativo', true)
          .order('ordem', { ascending: true })
          .order('data_projeto', { ascending: false });
        
        if (projectsError) {
          
          
          throw projectsError;
        }
        
        // Processar dados para incluir informações das instituições
        this.projects = (projectsData || []).map(project => {
          // Determinar qual instituição está relacionada
          // Supabase retorna objeto único, não array quando há foreign key
          let instituicao = null;
          
          // Verificar se é objeto (foreign key) ou array (relacionamento)
          const profHistory = Array.isArray(project.professional_history) 
            ? project.professional_history[0] 
            : project.professional_history;
            
          const acadHistory = Array.isArray(project.academic_history) 
            ? project.academic_history[0] 
            : project.academic_history;
          
          if (profHistory && profHistory.instituicao) {
            instituicao = {
              id: profHistory.id,
              nome: profHistory.instituicao,
              logo_url: profHistory.logo_url,
              tipo: 'professional'
            };
          } else if (acadHistory && acadHistory.instituicao) {
            instituicao = {
              id: acadHistory.id,
              nome: acadHistory.instituicao,
              logo_url: acadHistory.logo_url,
              tipo: 'academic'
            };
          }
          
          
          
          return {
            ...project,
            instituicao: instituicao
          };
        });
        
        this.filteredProjects = [...this.projects];
        
      } catch (error) {
        
        alert('Erro ao carregar projetos. Verifique o console do navegador (F12).');
      } finally {
        this.loading = false;
      }
    },
    
    filterProjects() {
      let filtered = [...this.projects];
      
      // Filtrar por categoria
      if (this.activeCategory) {
        filtered = filtered.filter(p => 
          p.categoria?.toLowerCase() === this.activeCategory.toLowerCase()
        );
      }
      
      // Filtrar por busca
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
          p.titulo?.toLowerCase().includes(query) ||
          p.descricao_curta?.toLowerCase().includes(query) ||
          p.descricao_completa?.toLowerCase().includes(query) ||
          p.tags?.some(tag => tag.toLowerCase().includes(query)) ||
          p.tecnologias?.some(tech => tech.toLowerCase().includes(query))
        );
      }
      
      this.filteredProjects = filtered;
    },
    
    clearFilters() {
      this.activeCategory = '';
      this.searchQuery = '';
      this.filterProjects();
    },
    
    openModal(project) {
      this.selectedProject = project;
      const modal = new bootstrap.Modal(document.getElementById('projectModal'));
      modal.show();
    },
    
    getCategoryColor(categoria) {
      const colors = {
        'qa': 'primary',
        'dev': 'success',
        'design': 'danger',
        'data': 'info',
        'devops': 'warning',
        'infra': 'secondary',
        'cv': 'info', // Mudado de 'danger' (vermelho) para 'info' (azul)
        'curriculo': 'info'
      };
      return colors[categoria?.toLowerCase()] || 'secondary';
    },
    
    getCategoryLabel(categoria) {
      const labels = {
        'qa': 'QA',
        'dev': 'DEV',
        'design': 'DESIGN',
        'data': 'DATA',
        'devops': 'DEVOPS',
        'infra': 'INFRA',
        'cv': 'CURRÍCULO', // Mudado de CV para CURRÍCULO
        'curriculo': 'CURRÍCULO'
      };
      return labels[categoria?.toLowerCase()] || categoria?.toUpperCase() || '';
    },
    
    getCategoryIcon(categoria) {
      const icons = {
        'qa': 'bi-shield-check',
        'dev': 'bi-code-slash',
        'design': 'bi-palette',
        'data': 'bi-graph-up',
        'devops': 'bi-gear',
        'infra': 'bi-server',
        'cv': 'bi-file-earmark-text',
        'curriculo': 'bi-file-earmark-text'
      };
      return icons[categoria?.toLowerCase()] || 'bi-folder';
    },
    
    getUniqueCategories() {
      const categories = [...new Set(this.projects.map(p => p.categoria).filter(Boolean))];
      return categories.sort();
    },
    
    getCategoryCount(categoria) {
      return this.projects.filter(p => p.categoria === categoria).length;
    }
  };
}

// Registrar globalmente para o Alpine.js
window.portfolioGrid = portfolioGrid;

