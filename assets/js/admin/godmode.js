// assets/js/admin/godmode.js
// Painel Administrativo - God Mode

// Aguardar carregamento do Supabase e Config
(function() {
  function initSupabase() {
    if (typeof window.supabase === 'undefined' || !window.CONFIG) {
      setTimeout(initSupabase, 100);
      return;
    }
    
    if (window.CONFIG.SUPABASE_URL && window.CONFIG.SUPABASE_ANON_KEY) {
      window.__supabaseClient = window.supabase.createClient(
        window.CONFIG.SUPABASE_URL,
        window.CONFIG.SUPABASE_ANON_KEY
      );
      
    } else {
      
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
  } else {
    initSupabase();
  }
})();

// Tabelas e suas configurações
const TABLES_CONFIG = {
  profiles: {
    title: 'Perfis',
    icon: 'bi-person',
    fields: [
      { name: 'nome_completo', label: 'Nome Completo', type: 'text', required: true },
      { name: 'primeiro_nome', label: 'Primeiro Nome', type: 'text', required: true },
      { name: 'sobrenome', label: 'Sobrenome', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'telefone', label: 'Telefone', type: 'text' },
      { name: 'data_nascimento', label: 'Data de Nascimento', type: 'date' },
      { name: 'local', label: 'Local', type: 'text' },
      { name: 'pais', label: 'País', type: 'text', default: 'Brasil' },
      { name: 'ocupacao', label: 'Ocupação', type: 'text' },
      { name: 'descricao', label: 'Descrição', type: 'textarea' },
      { name: 'keywords', label: 'Keywords', type: 'text' },
      { name: 'github_url', label: 'GitHub URL', type: 'url' },
      { name: 'linkedin_url', label: 'LinkedIn URL', type: 'url' },
      { name: 'apresentacao_url', label: 'Apresentação URL', type: 'url' },
      { name: 'avatar_url', label: 'Avatar URL', type: 'url' }
    ],
    getTitle: (item) => item.nome_completo || item.email,
    getBadges: (item) => [
      { text: item.ocupacao || 'Sem ocupação', color: 'primary' }
    ]
  },
  professional_history: {
    title: 'Histórico Profissional',
    icon: 'bi-briefcase',
    fields: [
      { name: 'instituicao', label: 'Instituição', type: 'text', required: true },
      { name: 'titulo', label: 'Título/Cargo', type: 'text', required: true },
      { name: 'regime', label: 'Regime', type: 'select', options: ['CLT', 'PJ', 'Estágio'], required: true },
      { name: 'categoria_profissional', label: 'Categoria', type: 'select', options: ['QA', 'DEV', 'INFRA', 'DEVOPS'], required: true },
      { name: 'local', label: 'Local', type: 'text' },
      { name: 'tipo_local', label: 'Modalidade', type: 'select', options: ['Presencial', 'Remoto', 'Híbrido'] },
      { name: 'data_inicio', label: 'Data Início', type: 'date', required: true },
      { name: 'data_fim', label: 'Data Fim', type: 'date' },
      { name: 'atual', label: 'Trabalho Atual', type: 'checkbox' },
      { name: 'descricao', label: 'Descrição', type: 'textarea' },
      { name: 'logo_url', label: 'Logo URL', type: 'url' },
      { name: 'imagens_urls', label: 'Imagens (URLs separadas por vírgula)', type: 'text' },
      { name: 'ordem', label: 'Ordem', type: 'number', default: 0 }
    ],
    getTitle: (item) => `${item.titulo} - ${item.instituicao}`,
    getBadges: (item) => [
      { text: item.regime || 'N/A', color: 'primary' },
      { text: item.categoria_profissional || 'N/A', color: 'success' },
      { text: item.tipo_local || 'N/A', color: 'info' }
    ]
  },
  academic_history: {
    title: 'Histórico Acadêmico',
    icon: 'bi-mortarboard',
    fields: [
      { name: 'instituicao', label: 'Instituição', type: 'text', required: true },
      { name: 'curso', label: 'Curso', type: 'text', required: true },
      { name: 'tipo_academico', label: 'Tipo Acadêmico', type: 'select', options: ['Técnico', 'Bacharel', 'Lato Sensu'], required: true },
      { name: 'tipo_local', label: 'Modalidade', type: 'select', options: ['Presencial', 'Remoto', 'Híbrido'] },
      { name: 'data_inicio', label: 'Data Início', type: 'date', required: true },
      { name: 'data_fim', label: 'Data Fim', type: 'date' },
      { name: 'atual', label: 'Cursando', type: 'checkbox' },
      { name: 'descricao', label: 'Descrição', type: 'textarea' },
      { name: 'logo_url', label: 'Logo URL', type: 'url' },
      { name: 'imagens_urls', label: 'Imagens (URLs separadas por vírgula)', type: 'text' },
      { name: 'ordem', label: 'Ordem', type: 'number', default: 0 }
    ],
    getTitle: (item) => `${item.curso} - ${item.instituicao}`,
    getBadges: (item) => [
      { text: item.tipo_academico || 'N/A', color: 'warning' },
      { text: item.tipo_local || 'N/A', color: 'info' }
    ]
  },
  projects: {
    title: 'Projetos',
    icon: 'bi-folder',
    fields: [
      { name: 'titulo', label: 'Título', type: 'text', required: true },
      { name: 'descricao_curta', label: 'Descrição Curta', type: 'textarea' },
      { name: 'descricao_completa', label: 'Descrição Completa', type: 'textarea' },
      { name: 'categoria', label: 'Categoria', type: 'select', options: ['cv', 'qa', 'dev', 'design', 'data', 'devops', 'infra'], required: true },
      { name: 'imagem_url', label: 'Imagem URL', type: 'url' },
      { name: 'tecnologias', label: 'Tecnologias (separadas por vírgula)', type: 'text' },
      { name: 'tags', label: 'Tags (separadas por vírgula)', type: 'text' },
      { name: 'link_projeto', label: 'Link do Projeto', type: 'url' },
      { name: 'link_github', label: 'Link GitHub', type: 'url' },
      { name: 'data_projeto', label: 'Data do Projeto', type: 'date' },
      { name: 'data_inicio', label: 'Data Início', type: 'date' },
      { name: 'data_fim', label: 'Data Fim', type: 'date' },
      { name: 'ativo', label: 'Ativo', type: 'checkbox', default: true },
      { name: 'ordem', label: 'Ordem', type: 'number', default: 0 }
    ],
    getTitle: (item) => item.titulo,
    getBadges: (item) => [
      { text: item.categoria?.toUpperCase() || 'N/A', color: 'primary' },
      { text: item.ativo ? 'Ativo' : 'Inativo', color: item.ativo ? 'success' : 'secondary' }
    ]
  },
  certifications: {
    title: 'Certificações',
    icon: 'bi-award',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'instituicao', label: 'Instituição', type: 'text', required: true },
      { name: 'data_certificacao', label: 'Data de Certificação', type: 'date' },
      { name: 'validade', label: 'Validade', type: 'text' },
      { name: 'certificado_url', label: 'URL do Certificado', type: 'url' },
      { name: 'ordem', label: 'Ordem', type: 'number', default: 0 }
    ],
    getTitle: (item) => `${item.nome} - ${item.instituicao}`,
    getBadges: (item) => [
      { text: item.validade || 'Sem validade', color: 'success' }
    ]
  },
  languages: {
    title: 'Idiomas',
    icon: 'bi-translate',
    fields: [
      { name: 'idioma', label: 'Idioma', type: 'text', required: true },
      { name: 'nivel', label: 'Nível', type: 'select', options: ['Básico', 'Intermediário', 'Avançado', 'Fluente', 'Nativo'], required: true },
      { name: 'cursando', label: 'Cursando', type: 'checkbox' },
      { name: 'instituicao', label: 'Instituição', type: 'text' },
      { name: 'ordem', label: 'Ordem', type: 'number', default: 0 }
    ],
    getTitle: (item) => `${item.idioma} - ${item.nivel}`,
    getBadges: (item) => [
      { text: item.nivel || 'N/A', color: 'info' },
      { text: item.cursando ? 'Cursando' : 'Concluído', color: item.cursando ? 'warning' : 'success' }
    ]
  },
  hard_skills: {
    title: 'Hard Skills',
    icon: 'bi-code-square',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'categoria', label: 'Categoria', type: 'text' },
      { name: 'nivel', label: 'Nível (0-100)', type: 'number', min: 0, max: 100, default: 0 },
      { name: 'ordem', label: 'Ordem', type: 'number', default: 0 }
    ],
    getTitle: (item) => item.nome,
    getBadges: (item) => [
      { text: item.categoria || 'Sem categoria', color: 'primary' },
      { text: `${item.nivel || 0}%`, color: 'success' }
    ]
  },
  soft_skills: {
    title: 'Soft Skills',
    icon: 'bi-heart',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'ordem', label: 'Ordem', type: 'number', default: 0 }
    ],
    getTitle: (item) => item.nome,
    getBadges: (item) => []
  },
  contact_messages: {
    title: 'Mensagens de Contato',
    icon: 'bi-envelope',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true, readonly: true },
      { name: 'email', label: 'Email', type: 'email', required: true, readonly: true },
      { name: 'assunto', label: 'Assunto', type: 'text', readonly: true },
      { name: 'mensagem', label: 'Mensagem', type: 'textarea', required: true, readonly: true },
      { name: 'lida', label: 'Lida', type: 'checkbox' }
    ],
    getTitle: (item) => `${item.nome} - ${item.assunto || 'Sem assunto'}`,
    getBadges: (item) => [
      { text: item.lida ? 'Lida' : 'Não lida', color: item.lida ? 'success' : 'warning' }
    ]
  },
  feedbacks: {
    title: 'Feedbacks',
    icon: 'bi-star',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'cargo', label: 'Cargo', type: 'text' },
      { name: 'empresa', label: 'Empresa', type: 'text' },
      { name: 'mensagem', label: 'Mensagem', type: 'textarea', required: true },
      { name: 'imagem_url', label: 'URL da Foto', type: 'url' },
      { name: 'professional_history_id', label: 'Histórico Profissional', type: 'select', options: [], foreignTable: 'professional_history', foreignLabel: 'instituicao' },
      { name: 'fonte', label: 'Fonte', type: 'select', options: ['LinkedIn', 'Site'], default: 'LinkedIn' },
      { name: 'aprovado', label: 'Aprovado', type: 'checkbox', default: false },
      { name: 'data_feedback', label: 'Data do Feedback', type: 'date' },
      { name: 'ordem', label: 'Ordem', type: 'number', default: 0 }
    ],
    getTitle: (item) => `${item.nome} - ${item.empresa || 'Sem empresa'}`,
    getBadges: (item) => [
      { text: item.fonte || 'LinkedIn', color: item.fonte === 'LinkedIn' ? 'primary' : 'info' },
      { text: item.aprovado ? 'Aprovado' : 'Pendente', color: item.aprovado ? 'success' : 'warning' }
    ]
  }
};

function adminPanel() {
  return {
    // Auth
    isAuthenticated: false,
    currentUser: null,
    loading: false,
    
    // Navigation
    activeSection: 'dashboard',
    sidebarCollapsed: false,
    
    // Data
    currentData: [],
    allData: [],
    stats: {},
    
    // Filters & Pagination
    filters: {
      search: '',
      status: '',
      limit: 10
    },
    currentPage: 1,
    totalPages: 1,
    
    // Modal
    modalTitle: '',
    modalContent: '',
    currentItem: null,
    saving: false,
    deleting: false,
    deleteItemTitle: '',
    
    async init() {
      // Aguardar Supabase estar pronto
      let attempts = 0;
      while (!window.__supabaseClient && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!window.__supabaseClient) {
        
        return;
      }
      
      // Verificar autenticação
      const { data: { session } } = await window.__supabaseClient.auth.getSession();
      
      if (!session) {
        // Redirecionar para login se não estiver autenticado
        window.location.href = 'login.html';
        return;
      }
      
      // VALIDAÇÃO DE SEGURANÇA: Verificar timeout de sessão (1 hora)
      const sessionAge = Date.now() - (session.expires_at * 1000);
      const maxSessionAge = 60 * 60 * 1000; // 1 hora
      
      if (sessionAge > maxSessionAge) {
        
        await window.__supabaseClient.auth.signOut();
        alert('Sua sessão expirou por segurança. Faça login novamente.');
        window.location.href = 'login.html';
        return;
      }
      
      // VALIDAÇÃO DE SEGURANÇA: Verificar se o email está autorizado
      const authorizedEmail = window.CONFIG?.ADMIN_EMAIL || 'matteusbonotto@gmail.com';
      if (session.user.email?.toLowerCase() !== authorizedEmail.toLowerCase()) {
        
        // Fazer logout e redirecionar
        await window.__supabaseClient.auth.signOut();
        alert('Acesso negado. Este email não está autorizado para acessar o painel admin.');
        window.location.href = 'login.html';
        return;
      }
      
      this.isAuthenticated = true;
      this.currentUser = session.user;
      this.loadDashboard();
      
      // Verificação periódica de sessão (a cada 5 minutos)
      setInterval(async () => {
        const { data: { session: currentSession } } = await window.__supabaseClient.auth.getSession();
        
        if (!currentSession) {
          
          window.location.href = 'login.html';
          return;
        }
        
        // Verificar timeout novamente
        const currentSessionAge = Date.now() - (currentSession.expires_at * 1000);
        if (currentSessionAge > maxSessionAge) {
          
          await window.__supabaseClient.auth.signOut();
          alert('Sua sessão expirou por segurança. Faça login novamente.');
          window.location.href = 'login.html';
          return;
        }
        
        // Verificar email autorizado novamente
        if (currentSession.user.email?.toLowerCase() !== authorizedEmail.toLowerCase()) {
          
          await window.__supabaseClient.auth.signOut();
          alert('Acesso negado. Este email não está autorizado.');
          window.location.href = 'login.html';
          return;
        }
      }, 5 * 60 * 1000); // Verificar a cada 5 minutos
      
      // Escutar mudanças de autenticação
      window.__supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (!session) {
          if (event === 'SIGNED_OUT') {
            
          }
          window.location.href = 'login.html';
          return;
        }
        
        // VALIDAÇÃO DE SEGURANÇA: Verificar timeout de sessão
        const sessionAge = Date.now() - (session.expires_at * 1000);
        const maxSessionAge = 60 * 60 * 1000; // 1 hora
        
        if (sessionAge > maxSessionAge) {
          
          await window.__supabaseClient.auth.signOut();
          alert('Sua sessão expirou por segurança.');
          window.location.href = 'login.html';
          return;
        }
        
        // VALIDAÇÃO DE SEGURANÇA: Verificar email autorizado
        const authorizedEmail = window.CONFIG?.ADMIN_EMAIL || 'matteusbonotto@gmail.com';
        if (session.user.email?.toLowerCase() !== authorizedEmail.toLowerCase()) {
          
          await window.__supabaseClient.auth.signOut();
          alert('Acesso negado. Este email não está autorizado.');
          window.location.href = 'login.html';
          return;
        }
        
        this.isAuthenticated = !!session;
        this.currentUser = session?.user || null;
        
        if (this.isAuthenticated) {
          this.loadDashboard();
        }
      });
      
      // Proteção contra navegação para trás após logout
      window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
          // Página foi carregada do cache, verificar sessão novamente
          window.__supabaseClient.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
              window.location.href = 'login.html';
            }
          });
        }
      });
    },
    
    async logout() {
      try {
        if (!window.__supabaseClient) return;
        
        const { error } = await window.__supabaseClient.auth.signOut();
        
        if (error) throw error;
        
        this.isAuthenticated = false;
        this.currentUser = null;
      } catch (error) {
        
        alert('Erro ao fazer logout: ' + error.message);
      }
    },
    
    async loadDashboard() {
      try {
        if (!window.__supabaseClient) return;
        
        // Carregar estatísticas
        const [profiles, professional, academic, projects] = await Promise.all([
          window.__supabaseClient.from('profiles').select('id', { count: 'exact', head: true }),
          window.__supabaseClient.from('professional_history').select('id', { count: 'exact', head: true }),
          window.__supabaseClient.from('academic_history').select('id', { count: 'exact', head: true }),
          window.__supabaseClient.from('projects').select('id', { count: 'exact', head: true }).eq('ativo', true)
        ]);
        
        this.stats = {
          profiles: profiles.count || 0,
          professional: professional.count || 0,
          academic: academic.count || 0,
          projects: projects.count || 0
        };
      } catch (error) {
        
      }
    },
    
    async loadData() {
      if (this.activeSection === 'dashboard') return;
      
      try {
        this.loading = true;
        const tableName = this.getTableName();
        const config = TABLES_CONFIG[tableName];
        
        if (!config) {
          
          this.loading = false;
          return;
        }
        
        // Aguardar Supabase inicializar
        let attempts = 0;
        while (!window.__supabaseClient && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!window.__supabaseClient) {
          
          alert('Erro: Supabase não foi inicializado. Verifique o console.');
          this.loading = false;
          return;
        }
        
        
        let query = window.__supabaseClient.from(tableName).select('*');
        
        // Aplicar filtros
        if (this.filters.search) {
          // Busca genérica baseada nos campos principais da tabela
          const searchTerm = `%${this.filters.search}%`;
          if (tableName === 'profiles') {
            query = query.or(`nome_completo.ilike.${searchTerm},email.ilike.${searchTerm}`);
          } else if (tableName === 'professional_history' || tableName === 'academic_history') {
            query = query.or(`instituicao.ilike.${searchTerm},titulo.ilike.${searchTerm},curso.ilike.${searchTerm}`);
          } else if (tableName === 'projects') {
            query = query.or(`titulo.ilike.${searchTerm},descricao_curta.ilike.${searchTerm}`);
          } else if (tableName === 'feedbacks') {
            query = query.or(`nome.ilike.${searchTerm},empresa.ilike.${searchTerm},mensagem.ilike.${searchTerm}`);
          } else {
            query = query.or(`nome.ilike.${searchTerm},titulo.ilike.${searchTerm}`);
          }
        }
        
        if (this.filters.status === 'active' && tableName === 'projects') {
          query = query.eq('ativo', true);
        } else if (this.filters.status === 'inactive' && tableName === 'projects') {
          query = query.eq('ativo', false);
        } else if (this.filters.status === 'approved' && tableName === 'feedbacks') {
          query = query.eq('aprovado', true);
        } else if (this.filters.status === 'pending' && tableName === 'feedbacks') {
          query = query.eq('aprovado', false);
        }
        
        // Ordenar (ordem específica para feedbacks)
        if (tableName === 'feedbacks') {
          query = query.order('ordem', { ascending: true }).order('data_feedback', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }
        
        const { data, error } = await query;
        
        if (error) {
          
          throw error;
        }
        
        
        this.allData = data || [];
        this.updatePagination();
        this.updateCurrentData();
      } catch (error) {
        
        alert('Erro ao carregar dados: ' + (error.message || error));
      } finally {
        this.loading = false;
      }
    },
    
    updatePagination() {
      this.totalPages = Math.ceil(this.allData.length / this.filters.limit);
      if (this.currentPage > this.totalPages) {
        this.currentPage = 1;
      }
    },
    
    updateCurrentData() {
      const start = (this.currentPage - 1) * this.filters.limit;
      const end = start + parseInt(this.filters.limit);
      this.currentData = this.allData.slice(start, end);
    },
    
    goToPage(page) {
      this.currentPage = page;
      this.updateCurrentData();
    },
    
    previousPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.updateCurrentData();
      }
    },
    
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.updateCurrentData();
      }
    },
    
    clearFilters() {
      this.filters = { search: '', status: '', limit: 10 };
      this.currentPage = 1;
      this.loadData();
    },
    
    getTableName() {
      const mapping = {
        'profiles': 'profiles',
        'professional': 'professional_history',
        'academic': 'academic_history',
        'projects': 'projects',
        'certifications': 'certifications',
        'languages': 'languages',
        'hard-skills': 'hard_skills',
        'soft-skills': 'soft_skills',
        'messages': 'contact_messages',
        'feedbacks': 'feedbacks'
      };
      return mapping[this.activeSection] || 'profiles';
    },
    
    getSectionTitle() {
      const titles = {
        'dashboard': 'Dashboard',
        'profiles': 'Perfis',
        'professional': 'Histórico Profissional',
        'academic': 'Histórico Acadêmico',
        'projects': 'Projetos',
        'certifications': 'Certificações',
        'languages': 'Idiomas',
        'hard-skills': 'Hard Skills',
        'soft-skills': 'Soft Skills',
        'messages': 'Mensagens de Contato',
        'feedbacks': 'Feedbacks'
      };
      return titles[this.activeSection] || 'Dashboard';
    },
    
    getItemTitle(item) {
      const tableName = this.getTableName();
      const config = TABLES_CONFIG[tableName];
      return config?.getTitle(item) || item.nome || item.titulo || item.id;
    },
    
    getItemDescription(item) {
      return item.descricao || item.descricao_curta || item.mensagem || 'Sem descrição';
    },
    
    getItemBadges(item) {
      const tableName = this.getTableName();
      const config = TABLES_CONFIG[tableName];
      return config?.getBadges(item) || [];
    },
    
    formatDate(date) {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('pt-BR');
    },
    
    openCreateModal() {
      this.currentItem = null;
      this.modalTitle = `Adicionar ${this.getSectionTitle()}`;
      this.modalContent = this.generateForm();
      const modal = new bootstrap.Modal(document.getElementById('crudModal'));
      modal.show();
    },
    
    openEditModal(item) {
      this.currentItem = item;
      this.modalTitle = `Editar ${this.getSectionTitle()}`;
      this.modalContent = this.generateForm(item);
      const modal = new bootstrap.Modal(document.getElementById('crudModal'));
      modal.show();
    },
    
    // Função helper para detectar se um campo é de imagem
    isImageField(fieldName) {
      const imageFields = ['avatar_url', 'logo_url', 'imagem_url', 'certificado_url', 'imagens_urls'];
      return imageFields.some(imgField => fieldName.includes(imgField) || fieldName === imgField);
    },
    
    generateForm(item = null) {
      const tableName = this.getTableName();
      const config = TABLES_CONFIG[tableName];
      
      if (!config) return '<p>Configuração não encontrada</p>';
      
      let html = '<form id="crudForm" enctype="multipart/form-data">';
      
      config.fields.forEach(field => {
        const value = item ? (item[field.name] || '') : (field.default || '');
        const readonly = field.readonly ? 'readonly' : '';
        const required = field.required ? 'required' : '';
        const isImage = this.isImageField(field.name);
        const fieldId = `field_${field.name}`;
        const checkboxId = `use_text_${field.name}`;
        
        html += `<div class="mb-3">`;
        html += `<label class="form-label">${field.label}${field.required ? ' <span class="text-danger">*</span>' : ''}</label>`;
        
        // Campos de imagem: file select com checkbox para alternar
        if (isImage && !readonly) {
          html += `<div class="mb-2">`;
          html += `<div class="form-check form-switch">`;
          html += `<input class="form-check-input" type="checkbox" id="${checkboxId}" onchange="toggleImageField('${fieldId}', '${checkboxId}')">`;
          html += `<label class="form-check-label" for="${checkboxId}">Usar URL de texto</label>`;
          html += `</div>`;
          html += `</div>`;
          
          // File input (padrão)
          html += `<div id="${fieldId}_file" class="image-field-file">`;
          
          // Se for imagens_urls (array), permitir múltiplos arquivos
          if (field.name === 'imagens_urls') {
            html += `<input type="file" class="form-control" name="${field.name}_file" accept="image/*" id="${fieldId}" multiple>`;
            html += `<small class="text-muted d-block mt-1">Você pode selecionar múltiplas imagens</small>`;
          } else {
            html += `<input type="file" class="form-control" name="${field.name}_file" accept="image/*" id="${fieldId}">`;
          }
          
          // Mostrar URLs existentes
          if (value) {
            const urls = Array.isArray(value) ? value : (typeof value === 'string' ? value.split(',').map(u => u.trim()) : [value]);
            if (urls.length > 0) {
              html += `<div class="mt-2">`;
              html += `<small class="text-muted d-block mb-1">URL(s) atual(is):</small>`;
              urls.forEach(url => {
                if (url) {
                  html += `<small class="d-block"><a href="${url}" target="_blank">${url}</a></small>`;
                }
              });
              html += `</div>`;
            }
          }
          html += `</div>`;
          
          // Text input (alternativo)
          html += `<div id="${fieldId}_text" class="image-field-text" style="display: none;">`;
          if (field.name === 'imagens_urls') {
            html += `<textarea class="form-control" name="${field.name}" ${required} placeholder="URLs separadas por vírgula">${Array.isArray(value) ? value.join(', ') : value}</textarea>`;
            html += `<small class="text-muted d-block mt-1">Digite as URLs separadas por vírgula</small>`;
          } else {
            html += `<input type="url" class="form-control" name="${field.name}" value="${value}" ${required}>`;
          }
          html += `</div>`;
        } else {
          // Campos normais
          switch (field.type) {
            case 'textarea':
              html += `<textarea class="form-control" name="${field.name}" ${required} ${readonly}>${value}</textarea>`;
              break;
            case 'select':
              html += `<select class="form-select" name="${field.name}" ${required} ${readonly}>`;
              html += `<option value="">Selecione...</option>`;
              field.options.forEach(opt => {
                const selected = value === opt ? 'selected' : '';
                html += `<option value="${opt}" ${selected}>${opt}</option>`;
              });
              html += `</select>`;
              break;
            case 'checkbox':
              const checked = value ? 'checked' : '';
              html += `<div class="form-check">`;
              html += `<input class="form-check-input" type="checkbox" name="${field.name}" ${checked} ${readonly}>`;
              html += `<label class="form-check-label">${field.label}</label>`;
              html += `</div>`;
              break;
            case 'number':
              html += `<input type="number" class="form-control" name="${field.name}" value="${value}" ${field.min ? `min="${field.min}"` : ''} ${field.max ? `max="${field.max}"` : ''} ${required} ${readonly}>`;
              break;
            case 'date':
              const dateValue = value ? new Date(value).toISOString().split('T')[0] : '';
              html += `<input type="date" class="form-control" name="${field.name}" value="${dateValue}" ${required} ${readonly}>`;
              break;
            case 'url':
            case 'email':
              html += `<input type="${field.type}" class="form-control" name="${field.name}" value="${value}" ${required} ${readonly}>`;
              break;
            default:
              html += `<input type="text" class="form-control" name="${field.name}" value="${value}" ${required} ${readonly}>`;
          }
        }
        
        html += `</div>`;
      });
      
      html += '</form>';
      
      // Adicionar script para toggle de campos de imagem
      html += `<script>
        window.toggleImageField = function(fieldId, checkboxId) {
          const checkbox = document.getElementById(checkboxId);
          const fileDiv = document.getElementById(fieldId + '_file');
          const textDiv = document.getElementById(fieldId + '_text');
          if (checkbox.checked) {
            fileDiv.style.display = 'none';
            textDiv.style.display = 'block';
          } else {
            fileDiv.style.display = 'block';
            textDiv.style.display = 'none';
          }
        };
      </script>`;
      
      return html;
    },
    
    // Função para fazer upload de imagem para Supabase Storage
    async uploadImage(file, folder = 'images') {
      if (!file) return null;
      
      if (!window.__supabaseClient) {
        throw new Error('Supabase não inicializado');
      }
      
      // Tentar diferentes buckets comuns
      const buckets = ['public', 'images', 'uploads', 'assets'];
      let lastError = null;
      
      for (const bucket of buckets) {
        try {
          // Gerar nome único para o arquivo
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${folder}/${fileName}`;
          
          // Fazer upload
          const { data: uploadData, error: uploadError } = await window.__supabaseClient.storage
            .from(bucket)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (uploadError) {
            lastError = uploadError;
            continue; // Tentar próximo bucket
          }
          
          // Obter URL pública
          const { data: urlData } = window.__supabaseClient.storage
            .from(bucket)
            .getPublicUrl(filePath);
          
          
          return urlData.publicUrl;
        } catch (error) {
          lastError = error;
          continue;
        }
      }
      
      // Se nenhum bucket funcionou, retornar erro
      
      throw new Error('Erro ao fazer upload da imagem. Verifique se o bucket do Storage está configurado no Supabase.');
    },
    
    async saveData() {
      try {
        this.saving = true;
        const form = document.getElementById('crudForm');
        const formData = new FormData(form);
        const data = {};
        const imageFields = [];
        
        // Processar dados do formulário
        for (const [key, value] of formData.entries()) {
          const field = form.querySelector(`[name="${key}"]`);
          
          // Ignorar campos de arquivo por enquanto (processaremos depois)
          if (key.endsWith('_file')) {
            const originalFieldName = key.replace('_file', '');
            if (field && field.files && field.files.length > 0) {
              // Se for múltiplos arquivos (imagens_urls), adicionar todos
              if (field.multiple && field.files.length > 1) {
                for (let i = 0; i < field.files.length; i++) {
                  imageFields.push({ fieldName: originalFieldName, file: field.files[i] });
                }
              } else {
                imageFields.push({ fieldName: originalFieldName, file: field.files[0] });
              }
            }
            continue;
          }
          
          if (field && field.type === 'checkbox') {
            data[key] = field.checked;
          } else {
            data[key] = value || null;
          }
        }
        
        // Processar uploads de imagens
        const uploadedUrls = {};
        for (const imageField of imageFields) {
          try {
            const imageUrl = await this.uploadImage(imageField.file);
            if (imageUrl) {
              // Se for imagens_urls (array), acumular URLs
              if (imageField.fieldName === 'imagens_urls') {
                if (!uploadedUrls[imageField.fieldName]) {
                  uploadedUrls[imageField.fieldName] = [];
                }
                uploadedUrls[imageField.fieldName].push(imageUrl);
              } else {
                // Para campos únicos, sobrescrever (último arquivo vence)
                uploadedUrls[imageField.fieldName] = imageUrl;
              }
            }
          } catch (error) {
            
            // Continuar mesmo se o upload falhar, mas avisar o usuário
            alert(`Aviso: Erro ao fazer upload da imagem ${imageField.fieldName}. O restante dos dados será salvo.`);
          }
        }
        
        // Aplicar URLs enviadas aos dados
        for (const [fieldName, urlValue] of Object.entries(uploadedUrls)) {
          if (fieldName === 'imagens_urls') {
            // Combinar com URLs existentes do formulário
            const existingUrls = data.imagens_urls || [];
            const urlsArray = Array.isArray(existingUrls) ? existingUrls : 
                            (typeof existingUrls === 'string' ? existingUrls.split(',').map(u => u.trim()).filter(u => u) : []);
            data.imagens_urls = [...urlsArray, ...urlValue];
          } else {
            data[fieldName] = urlValue;
          }
        }
        
        // Processar arrays (tecnologias, tags, imagens_urls)
        if (data.tecnologias && typeof data.tecnologias === 'string') {
          data.tecnologias = data.tecnologias.split(',').map(t => t.trim()).filter(t => t);
        }
        if (data.tags && typeof data.tags === 'string') {
          data.tags = data.tags.split(',').map(t => t.trim()).filter(t => t);
        }
        if (data.imagens_urls && typeof data.imagens_urls === 'string') {
          data.imagens_urls = data.imagens_urls.split(',').map(t => t.trim()).filter(t => t);
        }
        
        const tableName = this.getTableName();
        
        if (!window.__supabaseClient) {
          throw new Error('Supabase não inicializado');
        }
        
        // Remover campos vazios
        Object.keys(data).forEach(key => {
          if (data[key] === '' || data[key] === null) {
            delete data[key];
          }
        });
        
        if (this.currentItem) {
          // Update
          const { error } = await window.__supabaseClient
            .from(tableName)
            .update(data)
            .eq('id', this.currentItem.id);
          
          if (error) throw error;
        } else {
          // Insert
          const { error } = await window.__supabaseClient
            .from(tableName)
            .insert([data]);
          
          if (error) throw error;
        }
        
        // Fechar modal e recarregar dados
        bootstrap.Modal.getInstance(document.getElementById('crudModal')).hide();
        await this.loadData();
        
      } catch (error) {
        
        alert('Erro ao salvar: ' + error.message);
      } finally {
        this.saving = false;
      }
    },
    
    confirmDelete(item) {
      this.currentItem = item;
      this.deleteItemTitle = this.getItemTitle(item);
      const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
      modal.show();
    },
    
    async deleteItem() {
      try {
        this.deleting = true;
        
        if (!window.__supabaseClient) {
          throw new Error('Supabase não inicializado');
        }
        
        const tableName = this.getTableName();
        
        const { error } = await window.__supabaseClient
          .from(tableName)
          .delete()
          .eq('id', this.currentItem.id);
        
        if (error) throw error;
        
        // Fechar modal e recarregar dados
        bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
        await this.loadData();
        
      } catch (error) {
        
        alert('Erro ao excluir: ' + error.message);
      } finally {
        this.deleting = false;
      }
    },
    
    // Método para mudar seção (chamado pelo click no menu)
    changeSection(section) {
      this.activeSection = section;
      if (this.isAuthenticated && section !== 'dashboard') {
        this.currentPage = 1;
        this.loadData();
      } else if (section === 'dashboard') {
        this.loadDashboard();
      }
    }
  };
}

// Registrar globalmente
window.adminPanel = adminPanel;

// Auto-inicializar quando Alpine estiver pronto
document.addEventListener('alpine:init', () => {
  Alpine.data('adminPanel', adminPanel);
});

