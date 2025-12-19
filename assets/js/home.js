// assets/js/home.js
// Componente Alpine.js para Home

import { getSupabaseClient } from './supabase.js';

function homeMenu() {
  return {
    hoveredIndex: null,
    stats: null,
    menuOptions: [
      {
        id: 1,
        title: 'História',
        description: 'Conheça minha trajetória acadêmica e profissional',
        icon: 'bi bi-clock-history',
        route: 'historia.html'
      },
      {
        id: 2,
        title: 'Portfólio',
        description: 'Explore meus projetos e trabalhos realizados',
        icon: 'bi bi-folder',
        route: 'portfolio.html'
      },
      {
        id: 3,
        title: 'Competências',
        description: 'Veja minhas habilidades técnicas e comportamentais',
        icon: 'bi bi-star',
        route: 'competencias.html'
      },
      {
        id: 4,
        title: 'Currículo',
        description: 'Baixe ou visualize meu currículo completo',
        icon: 'bi bi-file-earmark-person',
        route: 'cv.html'
      },
      {
        id: 5,
        title: 'Contato',
        description: 'Entre em contato comigo',
        icon: 'bi bi-envelope',
        route: 'contato.html'
      }
    ],
    
    async init() {
      await this.loadStats();
    },
    
    navigate(route) {
      window.location.href = route;
    },
    
    async loadStats() {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          throw new Error('Supabase não está disponível');
        }
        
        // Carregar estatísticas do Supabase
        const [projectsResult, skillsResult, achievementsResult] = await Promise.all([
          supabase.from('projects').select('id', { count: 'exact' }).eq('ativo', true).limit(0),
          supabase.from('skills_tree').select('id', { count: 'exact' }).limit(0),
          supabase.from('achievements').select('id', { count: 'exact' }).limit(0)
        ]);
        
        // Verificar erros
        if (projectsResult.error) {
          
        }
        if (skillsResult.error) {
          
        }
        if (achievementsResult.error) {
          
        }
        
        // Calcular anos de experiência (buscar primeira data profissional)
        const { data: firstJob, error: firstJobError } = await supabase
          .from('professional_history')
          .select('data_inicio')
          .order('data_inicio', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (firstJobError) {
          
        }
        
        let anosExperiencia = 0;
        if (firstJob?.data_inicio) {
          const startDate = new Date(firstJob.data_inicio);
          const now = new Date();
          anosExperiencia = Math.floor((now - startDate) / (1000 * 60 * 60 * 24 * 365));
        }
        
        this.stats = {
          totalProjetos: projectsResult.count || 0,
          totalSkills: skillsResult.count || 0,
          totalConquistas: achievementsResult.count || 0,
          anosExperiencia: anosExperiencia
        };
        
        
      } catch (error) {
        
        
        // Valores padrão em caso de erro
        this.stats = {
          totalProjetos: 0,
          totalSkills: 0,
          totalConquistas: 0,
          anosExperiencia: 0
        };
      }
    }
  };
}

// Registrar globalmente para o Alpine.js
window.homeMenu = homeMenu;

