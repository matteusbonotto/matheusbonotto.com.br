// assets/js/historia.js
// Componente Alpine.js para História/Timeline

// Helper para obter cliente Supabase
function getSupabase() {
  // Prioridade 1: Cliente global já inicializado
  if (window.__supabaseClient && typeof window.__supabaseClient.from === 'function') {
    return window.__supabaseClient;
  }
  
  // Prioridade 2: Criar cliente do Supabase UMD
  if (window.supabase && window.CONFIG) {
    try {
      const createClient = window.supabase.createClient || window.supabase;
      if (typeof createClient === 'function') {
        window.__supabaseClient = createClient(
          window.CONFIG.SUPABASE_URL,
          window.CONFIG.SUPABASE_ANON_KEY
        );
        console.log('✅ Supabase cliente criado via getSupabase()');
        return window.__supabaseClient;
      }
    } catch (error) {
      console.error('❌ Erro ao criar cliente Supabase:', error);
    }
  }
  
  // Fallback: retornar null (será tratado no código)
  console.warn('⚠️ Supabase não disponível. Verificando:', {
    hasWindowSupabase: !!window.supabase,
    hasConfig: !!window.CONFIG,
    hasGlobalClient: !!window.__supabaseClient
  });
  return null;
}

function historiaTimeline() {
  return {
    events: [],
    filteredEvents: [],
    groupedRows: [],
    axisYears: [],
    loading: true,
    selectedEvent: null,
    selectedEventProjects: [],
    selectedEventFeedbacks: [],
    profile: null,
    summary: null,
    approvedFeedbacks: [],
    currentFeedbackIndex: 0,
    feedbackAutoPlayInterval: null,
    newFeedback: {
      nome: '',
      cargo: '',
      empresa: '',
      mensagem: '',
      imagem_url: '',
      fonte: 'Site'
    },
    submittingFeedback: false,
    filters: {
      categoria: 'TODOS',
      periodo: 'all',
      tipo: 'all',
      // Novos filtros interativos das legendas
      natureza: [], // ['profissional', 'academico']
      vinculo: [], // ['CLT', 'PJ', 'Estágio', 'Técnico', 'Bacharel', 'Lato Sensu']
      modalidade: [] // ['Presencial', 'Remoto', 'Hibrido', 'Híbrido']
    },
    
    async loadData() {
      try {
        this.loading = true;
        
        // Aguardar um pouco para garantir que Supabase está inicializado
        let supabase = getSupabase();
        let attempts = 0;
        while (!supabase && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          supabase = getSupabase();
          attempts++;
        }
        
        if (!supabase) {
          console.error('❌ Supabase não está disponível após tentativas');
          console.error('Estado:', {
            windowSupabase: !!window.supabase,
            windowConfig: !!window.CONFIG,
            windowClient: !!window.__supabaseClient
          });
          this.loading = false;
          return;
        }
        
        console.log('✅ Supabase disponível, carregando dados...');
        
        // Carregar perfil + histórico acadêmico e profissional + feedbacks
        const [profileResult, academicResult, professionalResult, feedbacksResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('email', window.CONFIG?.ADMIN_EMAIL || 'contato@matheusbonotto.com.br')
            .maybeSingle(),
          supabase
            .from('academic_history')
            .select('*')
            .order('data_inicio', { ascending: false }),
          supabase
            .from('professional_history')
            .select('*')
            .order('data_inicio', { ascending: false }),
          supabase
            .from('feedbacks')
            .select('*')
            .eq('aprovado', true)
            .order('ordem', { ascending: true })
            .order('data_feedback', { ascending: false })
        ]);
        
        if (profileResult.error) {
          
        } else {
          this.profile = profileResult.data || null;
        }
        
        // Verificar erros
        if (academicResult.error) {
          console.error('❌ Erro ao carregar histórico acadêmico:', academicResult.error);
        }
        if (professionalResult.error) {
          console.error('❌ Erro ao carregar histórico profissional:', professionalResult.error);
        }
        
        // Combinar e formatar eventos
        const academicEvents = (academicResult.data || []).map(item => ({
          ...item,
          tipo: 'academico',
          titulo: item.curso
        }));
        
        const professionalEvents = (professionalResult.data || []).map(item => ({
          ...item,
          tipo: 'profissional'
        }));
        
        // Combinar todos os eventos
        this.events = [...academicEvents, ...professionalEvents]
          .sort((a, b) => new Date(b.data_inicio) - new Date(a.data_inicio));
        
        console.log('✅ Eventos carregados:', {
          academicos: academicEvents.length,
          profissionais: professionalEvents.length,
          total: this.events.length
        });
        
        // Carregar feedbacks aprovados
        if (feedbacksResult.error) {
          console.error('❌ Erro ao carregar feedbacks:', feedbacksResult.error);
        } else {
          this.approvedFeedbacks = feedbacksResult.data || [];
          console.log('✅ Feedbacks carregados:', this.approvedFeedbacks.length);
          
          // Iniciar auto-play se houver mais de 1 feedback
          if (this.approvedFeedbacks.length > 1) {
            this.startFeedbackAutoPlay();
          }
        }
        
        this.applyFilters();
        this.computeSummary();
      } catch (error) {
        
        
        alert('Erro ao carregar histórico. Verifique o console do navegador (F12).');
      } finally {
        this.loading = false;
      }
    },
    
    computeSummary(eventsToUse = null) {
      // Usa eventos filtrados se fornecido, senão usa todos os eventos
      const events = eventsToUse || this.events;
      
      const summary = {
        totalProfissional: 0,
        totalAcademico: 0,
        clt: 0,
        pj: 0,
        estagio: 0,
        tecnico: 0,
        bacharel: 0,
        latoSensu: 0,
        presencial: 0,
        homeOffice: 0,
        hibrido: 0
      };

      events.forEach((e) => {
        if (e.tipo === 'profissional') {
          summary.totalProfissional += 1;
          const regime = (e.regime || '').toLowerCase();
          if (regime.includes('clt')) summary.clt += 1;
          if (regime.includes('pj')) summary.pj += 1;
          if (regime.includes('estágio') || regime.includes('estagio')) summary.estagio += 1;
        } else if (e.tipo === 'academico') {
          summary.totalAcademico += 1;
          // Usa tipo_academico diretamente do banco (já vem normalizado)
          let tipoAcademico = e.tipo_academico || '';
          
          // Se não tiver, tenta inferir da instituição
          if (!tipoAcademico) {
            const instituicaoLower = (e.instituicao || '').toLowerCase();
            if (instituicaoLower.includes('senac')) {
              tipoAcademico = 'Técnico';
            } else if (instituicaoLower.includes('unasp')) {
              tipoAcademico = 'Bacharel';
            } else if (instituicaoLower.includes('vincit')) {
              tipoAcademico = 'Lato Sensu';
            }
          }
          
          // Se ainda não tiver, tenta inferir do curso
          if (!tipoAcademico) {
            const tipo = (e.tipo_curso || e.curso || e.titulo || '').toLowerCase();
            if (tipo.includes('técnico') || tipo.includes('tecnico')) {
              tipoAcademico = 'Técnico';
            } else if (tipo.includes('bacharel') || tipo.includes('sistemas de informação')) {
              tipoAcademico = 'Bacharel';
            } else if (tipo.includes('lato') || tipo.includes('sensu') || tipo.includes('pós') || tipo.includes('pos')) {
              tipoAcademico = 'Lato Sensu';
            }
          }
          
          
          
          if (tipoAcademico === 'Técnico' || tipoAcademico.toLowerCase().includes('técnico') || tipoAcademico.toLowerCase().includes('tecnico')) {
            summary.tecnico += 1;
            
          } else if (tipoAcademico === 'Bacharel' || tipoAcademico.toLowerCase().includes('bacharel')) {
            summary.bacharel += 1;
            
          } else if (tipoAcademico === 'Lato Sensu' || tipoAcademico.toLowerCase().includes('lato') || tipoAcademico.toLowerCase().includes('sensu')) {
            summary.latoSensu += 1;
            
          }
        }

        const modelo = (e.tipo_local || '').toLowerCase().trim();
        // Contagem exclusiva - cada evento só conta uma modalidade
        if (modelo.includes('presencial')) {
          summary.presencial += 1;
        } else if (modelo.includes('híbrido') || modelo.includes('hibrido')) {
          summary.hibrido += 1;
        } else if (modelo.includes('home') || modelo.includes('remoto')) {
          // Normaliza "home office" e "remoto" para "Remoto"
          summary.homeOffice += 1;
        }
      });

      this.summary = summary;
      console.log('✅ Resumo calculado:', summary);
      // Aguarda um pouco para garantir que o DOM esteja pronto
      setTimeout(() => {
        this.renderPieCharts();
      }, 100);
      
      // Só prepara timeline se não foram passados eventos filtrados (para evitar duplicação)
      if (!eventsToUse) {
        this.prepareTimelineGrid();
      }
    },
    
    renderPieCharts() {
      if (typeof d3 === 'undefined') {
        
        return;
      }
      if (!this.summary) {
        
        return;
      }
      
      
      
      // Cores para os gráficos
      const colorsProfessional = {
        'CLT': '#007bff',
        'PJ': '#28a745',
        'Estágio': '#17a2b8'
      };
      
      const colorsAcademic = {
        'Técnico': '#00bcd4',
        'Bacharel': '#9c27b0',
        'Lato Sensu': '#e91e63'
      };
      
      const colorsModality = {
        'Presencial': '#4caf50',
        'Remoto': '#3f51b5',
        'Híbrido': '#ffc107'
      };
      
      // Função helper para criar gráfico de pizza
      const createPieChart = (containerId, data, colors) => {
        const container = document.getElementById(containerId);
        if (!container) {
          
          return;
        }
        
        
        
        // Limpar container
        container.innerHTML = '';
        
        // Filtrar dados com valor > 0
        const filteredData = Object.entries(data)
          .filter(([_, value]) => value > 0)
          .map(([label, value]) => ({ label, value }));
        
        
        
        if (filteredData.length === 0) {
          container.innerHTML = '<p class="text-muted">Sem dados</p>';
          
          return;
        }
        
        const width = 200;
        const height = 200;
        const radius = Math.min(width, height) / 2 - 10;
        
        const svg = d3.select(container)
          .append('svg')
          .attr('width', width)
          .attr('height', height)
          .append('g')
          .attr('transform', `translate(${width / 2}, ${height / 2})`);
        
        const pie = d3.pie()
          .value(d => d.value)
          .sort(null);
        
        const arc = d3.arc()
          .innerRadius(0)
          .outerRadius(radius);
        
        const arcs = svg.selectAll('arc')
          .data(pie(filteredData))
          .enter()
          .append('g')
          .attr('class', 'arc');
        
        arcs.append('path')
          .attr('d', arc)
          .attr('fill', d => colors[d.data.label] || '#6c757d')
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)
          .style('cursor', 'pointer')
          .on('mouseover', function() {
            d3.select(this).attr('opacity', 0.8);
          })
          .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
          });
        
        // Labels no centro com formato "valor; label"
        arcs.append('text')
          .attr('transform', d => {
            const [x, y] = arc.centroid(d);
            return `translate(${x}, ${y})`;
          })
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', '#fff')
          .style('font-size', '9px')
          .style('font-weight', '600')
          .style('pointer-events', 'none')
          .text(d => d.data.value > 0 ? `${d.data.value}; ${d.data.label}` : '');
      };
      
      // Renderizar gráficos
      createPieChart('chart-professional', {
        'CLT': this.summary.clt,
        'PJ': this.summary.pj,
        'Estágio': this.summary.estagio
      }, colorsProfessional);
      
      createPieChart('chart-academic', {
        'Técnico': this.summary.tecnico,
        'Bacharel': this.summary.bacharel,
        'Lato Sensu': this.summary.latoSensu
      }, colorsAcademic);
      
      createPieChart('chart-modality', {
        'Presencial': this.summary.presencial,
        'Remoto': this.summary.homeOffice,
        'Híbrido': this.summary.hibrido
      }, colorsModality);
    },

    prepareTimelineGrid() {
      // Monta estrutura em linhas por instituição + eixo de anos
      const list = this.filteredEvents && this.filteredEvents.length
        ? this.filteredEvents
        : this.events;

      if (!list.length) {
        this.groupedRows = [];
        this.axisYears = [];
        this.renderD3Timeline();
        return;
      }

      const years = list
        .map((e) => (e.data_inicio ? new Date(e.data_inicio).getFullYear() : null))
        .filter((y) => Number.isFinite(y));

      // Define limites globais do eixo de tempo (SEMPRE inicia em 2016)
      const dataMin = years.length > 0 ? Math.min(...years) : 2016;
      const dataMax = years.length > 0 ? Math.max(...years) : new Date().getFullYear();
      const minYear = 2016; // SEMPRE inicia em 2016
      const maxYear = Math.max(2026, dataMax || new Date().getFullYear());
      const span = Math.max(1, maxYear - minYear);

      this.axisYears = [];
      for (let y = minYear; y <= maxYear; y++) {
        this.axisYears.push(y);
      }

      // Função helper para encontrar logo por nome (case-insensitive e normalizado)
      const findLogoUrl = (instituicao) => {
        if (!instituicao || !window.INSTITUTION_LOGOS) return null;
        
        // Normaliza o nome: remove espaços extras, converte para lowercase, remove acentos e pontuação
        const normalize = (str) => {
          return str.trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .replace(/[^\w\s]/g, '') // Remove pontuação
            .replace(/\s+/g, ' '); // Normaliza espaços
        };
        
        const normalized = normalize(instituicao);
        
        // Tenta match exato primeiro
        if (window.INSTITUTION_LOGOS[instituicao]) {
          console.log(`✅ Logo encontrado (match exato): "${instituicao}"`);
          return window.INSTITUTION_LOGOS[instituicao];
        }
        
        // Tenta match case-insensitive
        for (const [key, url] of Object.entries(window.INSTITUTION_LOGOS)) {
          if (normalize(key) === normalized) {
            console.log(`✅ Logo encontrado (match case-insensitive): "${instituicao}" → "${key}"`);
            return url;
          }
        }
        
        // Tenta match parcial - verifica se alguma palavra chave coincide
        for (const [key, url] of Object.entries(window.INSTITUTION_LOGOS)) {
          const keyNormalized = normalize(key);
          
          // Extrai palavras significativas (mais de 2 caracteres para pegar "senac", "realiza", etc)
          const keyWords = keyNormalized.split(' ').filter(w => w.length > 2);
          const instWords = normalized.split(' ').filter(w => w.length > 2);
          
          // Verifica se há palavras em comum
          const hasCommonWord = keyWords.some(kw => instWords.includes(kw)) || 
                                instWords.some(iw => keyWords.includes(iw));
          
          // Verifica se uma string contém a outra (para casos como "Realiza Software" vs "Realiza")
          const containsMatch = keyNormalized.includes(normalized) || normalized.includes(keyNormalized);
          
          // Match especial para palavras-chave específicas
          const isSenacMatch = (normalized.includes('senac') && keyNormalized.includes('senac')) ||
                              (normalized.includes('servico nacional') && keyNormalized.includes('senac'));
          const isRealizaMatch = (normalized.includes('realiza') && keyNormalized.includes('realiza'));
          const isAmericanasMatch = (normalized.includes('americanas') && keyNormalized.includes('americanas'));
          const isSquidevMatch = (normalized.includes('squidev') && keyNormalized.includes('squidev'));
          
          if (hasCommonWord || containsMatch || isSenacMatch || isRealizaMatch || isAmericanasMatch || isSquidevMatch) {
            console.log(`✅ Logo encontrado (match parcial): "${instituicao}" → "${key}"`);
            return url;
          }
        }
        
        // Fallback final: força match para palavras-chave específicas
        if (normalized.includes('senac')) {
          console.log(`✅ Logo encontrado (fallback Senac): "${instituicao}"`);
          return window.INSTITUTION_LOGOS['Senac'] || window.INSTITUTION_LOGOS['SENAC'] || null;
        }
        if (normalized.includes('realiza')) {
          console.log(`✅ Logo encontrado (fallback Realiza): "${instituicao}"`);
          return window.INSTITUTION_LOGOS['Realiza Software'] || window.INSTITUTION_LOGOS['Realiza'] || null;
        }
        if (normalized.includes('americanas')) {
          console.log(`✅ Logo encontrado (fallback Americanas): "${instituicao}"`);
          return window.INSTITUTION_LOGOS['Americanas'] || window.INSTITUTION_LOGOS['Americanas S.A.'] || null;
        }
        if (normalized.includes('squidev')) {
          console.log(`✅ Logo encontrado (fallback Squidev): "${instituicao}"`);
          return window.INSTITUTION_LOGOS['Squidev'] || window.INSTITUTION_LOGOS['SQUIDEV'] || null;
        }
        
        console.log(`⚠️ Logo não encontrado para: "${instituicao}". Chaves disponíveis:`, Object.keys(window.INSTITUTION_LOGOS || {}).map(k => `"${k}" (${normalize(k)})`));
        return null;
      };

      const rowsMap = new Map();
      
      // Debug: mostra todas as instituições que estão vindo do banco
      const instituicoesUnicas = [...new Set(list.map(e => e.instituicao).filter(Boolean))];
      console.log('📋 Instituições únicas encontradas:', instituicoesUnicas);
      console.log('📋 Logos disponíveis no mapa:', Object.keys(window.INSTITUTION_LOGOS || {}));

      list.forEach((e) => {
        const key = e.instituicao || "Outros";
        if (!rowsMap.has(key)) {
          const logoUrl = e.logo_url || findLogoUrl(key);
          if (!logoUrl && key && key !== "Outros") {
            console.warn('⚠️ Logo não encontrado para instituição:', key);
          }
          
          rowsMap.set(key, {
            instituicao: key,
            logo_url: logoUrl,
            events: [],
          });
        }

        const year = e.data_inicio
          ? new Date(e.data_inicio).getFullYear()
          : minYear;
        let position = ((year - minYear) / span) * 100;
        position = Math.min(96, Math.max(0, position)); // mantem dentro da trilha

        rowsMap.get(key).events.push({
          ...e,
          _position: position,
        });
      });

      // Ordenar eventos de cada instituição do mais antigo para o mais recente
      rowsMap.forEach((row) => {
        row.events.sort((a, b) => new Date(a.data_inicio) - new Date(b.data_inicio));
      });

      // Ordenar instituições pela data do primeiro evento (do mais antigo para o mais novo)
      this.groupedRows = Array.from(rowsMap.values()).sort((a, b) => {
        // Pega a data de início do primeiro evento de cada instituição
        const dateA = a.events.length > 0 && a.events[0].data_inicio 
          ? new Date(a.events[0].data_inicio) 
          : new Date(9999, 0, 1); // Se não tiver data, vai para o final
        const dateB = b.events.length > 0 && b.events[0].data_inicio 
          ? new Date(b.events[0].data_inicio) 
          : new Date(9999, 0, 1);
        
        return dateA - dateB; // Ordem crescente (mais antigo primeiro)
      });
      this.minYear = minYear;
      this.maxYear = maxYear;
      this.renderD3Timeline();
    },

    renderD3Timeline() {
      // Verificar se é mobile
      const isMobile = window.innerWidth <= 768;
      
      if (isMobile) {
        this.renderMobileTimeline();
        return;
      }
      
      // Renderização usando D3.js, semelhante ao gráfico de referência
      if (typeof d3 === 'undefined') {
        
        return;
      }

      const container = document.getElementById('d3-timeline');
      if (!container) return;

      // Limpar render anterior
      container.innerHTML = '';

      if (!this.groupedRows || !this.groupedRows.length || !this.axisYears || !this.axisYears.length) {
        return;
      }

      const margin = { top: 40, right: 40, bottom: 60, left: 140 };
      const rowHeight = 110; // Aumentado para acomodar barras maiores (85px de altura + espaçamento)
      const width = container.clientWidth || 1100;
      const height = margin.top + margin.bottom + this.groupedRows.length * rowHeight;

      const svg = d3
        .select(container)
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      const minYear = this.minYear;
      const maxYear = this.maxYear;

      const xScale = d3
        .scaleTime()
        .domain([new Date(minYear, 0, 1), new Date(maxYear + 1, 0, 1)])
        .range([margin.left, width - margin.right]);

      const yForRow = (index) => margin.top + index * rowHeight;

      const allEvents = [];
      this.groupedRows.forEach((row, rowIndex) => {
        row.events.forEach((e) => {
          allEvents.push({ rowIndex, row, event: e });
        });
      });

      const getColorForEvent = (e) => {
        const tipo = e.tipo;
        if (tipo === 'profissional') return '#7b1fa2';
        if (tipo === 'academico') return '#ff9800';
        return '#607d8b';
      };

      // Retorna o SVG path do ícone Bootstrap baseado na modalidade
      // Função para obter classe do ícone Bootstrap baseado na modalidade
      const getModalityIconClass = (tipoLocal) => {
        if (!tipoLocal) return null;
        
        const tipoNormalizado = tipoLocal.trim().toLowerCase();
        
        // Mapeamento de modalidades para ícones Bootstrap
        if (tipoNormalizado === 'presencial') {
          return 'bi-building'; // Ícone de prédio/escritório
        } else if (tipoNormalizado === 'home office' || tipoNormalizado === 'homeoffice' || tipoNormalizado === 'remoto') {
          return 'bi-house'; // Ícone de casa
        } else if (tipoNormalizado === 'hibrido' || tipoNormalizado === 'híbrido') {
          return 'bi-arrow-left-right'; // Ícone de setas bidirecionais
        }
        
        return null;
      };

      // Funções para obter cores dos badges baseadas nas legendas
      const getBadgeColor = (tipo, valor) => {
        if (tipo === 'regime') {
          if (valor === 'CLT') return '#007bff';
          if (valor === 'PJ') return '#28a745';
          if (valor === 'Estágio') return '#17a2b8';
        }
        if (tipo === 'academico') {
          if (valor === 'Técnico') return '#00bcd4';
          if (valor === 'Bacharelado' || valor === 'Bacharel') return '#9c27b0';
          if (valor === 'Lato Sensu') return '#e91e63';
        }
        if (tipo === 'modalidade') {
          if (valor === 'Presencial') return '#4caf50';
          if (valor === 'Remoto' || valor === 'Home office') return '#3f51b5'; // Aceita ambos para compatibilidade
          if (valor === 'Hibrido' || valor === 'Híbrido') return '#ffc107';
        }
        return '#6c757d'; // fallback
      };

      const ellipsize = (str, max) => {
        if (!str) return '';
        return str.length > max ? str.slice(0, max - 1) + '…' : str;
      };

      // Linhas por instituição
      svg
        .selectAll('row-line')
        .data(this.groupedRows)
        .enter()
        .append('line')
        .attr('x1', margin.left)
        .attr('x2', width - margin.right)
        .attr('y1', (_, i) => yForRow(i))
        .attr('y2', (_, i) => yForRow(i))
        .attr('stroke', '#e0e0e0')
        .attr('stroke-width', 2);

      // Logos / círculos de instituição
      svg
        .selectAll('row-logo')
        .data(this.groupedRows)
        .enter()
        .append('g')
        .attr('transform', (_, i) => `translate(${margin.left - 70}, ${yForRow(i)})`)
        .each(function (d) {
          const g = d3.select(this);
          const initial = (d.instituicao || '?')[0].toUpperCase();
          
          // Função para criar fallback (círculo com inicial)
          const createFallback = () => {
            g.selectAll('*').remove(); // Remove imagem se existir
            g.append('circle').attr('r', 22).attr('fill', '#ffffff').attr('stroke', '#cccccc');
            g.append('text')
              .text(initial)
              .attr('text-anchor', 'middle')
              .attr('dy', '0.35em')
              .attr('fill', '#333')
              .style('font-weight', '600');
          };
          
          if (d.logo_url) {
            
            
            // Tenta carregar a imagem primeiro sem CORS, depois com CORS se necessário
            const tryLoadImage = (useCORS = false) => {
              const imgElement = new Image();
              
              if (useCORS) {
                imgElement.crossOrigin = 'anonymous';
              }
              
              imgElement.onload = () => {
                console.log(`✅ Logo carregado: ${d.logo_url}`);
                // Se carregou, atualiza o SVG image
                g.select('image').attr('href', d.logo_url);
              };
              
              imgElement.onerror = () => {
                if (!useCORS) {
                  // Tenta novamente com CORS
                  
                  tryLoadImage(true);
                } else {
                  console.error(`❌ Erro ao carregar logo: ${d.logo_url} (instituição: ${d.instituicao})`);
                  createFallback();
                }
              };
              
              imgElement.src = d.logo_url;
            };
            
            // Cria o elemento image no SVG primeiro
            g.append('image')
              .attr('href', d.logo_url)
              .attr('x', -24)
              .attr('y', -24)
              .attr('width', 48)
              .attr('height', 48)
              .attr('clip-path', 'circle(24px at 24px 24px)');
            
            // Tenta carregar sem CORS primeiro
            tryLoadImage(false);
          } else {
            
            createFallback();
          }
        });

      // Barras de eventos
      const self = this;
      svg
        .selectAll('event-bar')
        .data(allEvents)
        .enter()
        .append('g')
        .each(function (d) {
          const e = d.event;
          const rowIndex = d.rowIndex;
          const group = d3.select(this);

          const start = e.data_inicio ? new Date(e.data_inicio) : new Date(minYear, 0, 1);
          const end = e.data_fim
            ? new Date(e.data_fim)
            : e.atual
            ? new Date()
            : new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());

          let x1 = xScale(start);
          let x2 = xScale(end);
          const minWidth = 80;
          if (x2 - x1 < minWidth) x2 = x1 + minWidth;

          const yCenter = yForRow(rowIndex);
          const barHeight = 85; // Aumentado para acomodar mais conteúdo (badges + empresa + título + período + cidade)
          const barY = yCenter - barHeight / 2;

          // Preparar textos
          const empresaText = e.tipo === 'profissional' ? e.instituicao : '';
          const tituloText = e.titulo || e.curso || '';
          const periodoText = self.formatDateRange(e.data_inicio, e.data_fim, e.atual);
          const cidadeText = e.local || '';

          // Badges a serem exibidos
          const badges = [];
          
          // Badge de regime (CLT/PJ/Estágio) para profissionais
          if (e.tipo === 'profissional' && e.regime) {
            badges.push({ texto: e.regime, cor: getBadgeColor('regime', e.regime) });
          }
          
          // Badge de tipo acadêmico (Técnico/Bacharel/Lato Sensu) - SEMPRE para acadêmicos
          if (e.tipo === 'academico') {
            // Usa tipo_academico diretamente do banco (já vem normalizado do SQL)
            let tipoNormalizado = e.tipo_academico || '';
            
            // Se não tiver tipo_academico, tenta inferir da instituição (baseado no SQL)
            if (!tipoNormalizado) {
              const instituicaoLower = (e.instituicao || '').toLowerCase();
              if (instituicaoLower.includes('senac')) {
                tipoNormalizado = 'Técnico';
              } else if (instituicaoLower.includes('unasp')) {
                tipoNormalizado = 'Bacharel';
              } else if (instituicaoLower.includes('vincit')) {
                tipoNormalizado = 'Lato Sensu';
              }
            }
            
            // Se ainda não encontrou, tenta inferir do curso
            if (!tipoNormalizado && e.curso) {
              const cursoLower = e.curso.toLowerCase();
              if (cursoLower.includes('técnico') || cursoLower.includes('tecnico')) {
                tipoNormalizado = 'Técnico';
              } else if (cursoLower.includes('bacharel') || cursoLower.includes('sistemas de informação')) {
                tipoNormalizado = 'Bacharel';
              } else if (cursoLower.includes('lato') || cursoLower.includes('sensu') || cursoLower.includes('pós') || cursoLower.includes('pos')) {
                tipoNormalizado = 'Lato Sensu';
              }
            }
            
            // SEMPRE adiciona badge acadêmico
            if (tipoNormalizado) {
              const badgeColor = getBadgeColor('academico', tipoNormalizado);
              
              badges.push({ texto: tipoNormalizado, cor: badgeColor || '#6c757d' });
            } else {
              // Fallback: adiciona badge genérico "Acadêmico" se não conseguir detectar
              
              badges.push({ texto: 'Acadêmico', cor: '#1976d2' });
            }
          }
          
          // Badge de modalidade REMOVIDO - apenas o ícone é exibido nas barras
          // O ícone de modalidade já é renderizado acima, não precisa de badge adicional

          // Desenhar retângulo da barra
          group
            .append('rect')
            .attr('x', x1)
            .attr('y', barY)
            .attr('rx', 8)
            .attr('ry', 8)
            .attr('width', x2 - x1)
            .attr('height', barHeight)
            .attr('fill', getColorForEvent(e))
            .attr('fill-opacity', 0.95)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 1.5)
            .style('cursor', 'pointer')
            .on('click', () => self.openDetails(e));

          // Container para conteúdo da barra
          const contentGroup = group.append('g').attr('transform', `translate(${x1 + 8}, ${barY + 8})`);
          
          let currentY = 0;
          const lineHeight = 12;
          const iconSize = 10;

          // Linha 1: Ícone de modalidade (se houver) + Badges
          const badgeY = currentY + 7; // Centro vertical dos badges (altura 14 / 2 = 7)
          let badgeX = 0;
          
          // Ícone de modalidade à esquerda (SEMPRE que houver tipo_local - para profissionais E acadêmicos)
          if (e.tipo_local) {
            const iconClass = getModalityIconClass(e.tipo_local);
            
            
            const iconGroup = contentGroup.append('g')
              .attr('transform', `translate(0, ${badgeY - 7})`);
            
            // Usar foreignObject para inserir HTML com Bootstrap Icons
            const foreignObject = iconGroup
              .append('foreignObject')
              .attr('width', 16)
              .attr('height', 16)
              .attr('x', 0)
              .attr('y', 0);
            
            // Se encontrou ícone, usa ele; senão usa ícone genérico
            const finalIconClass = iconClass || 'bi-circle-fill';
            
            // Criar div e adicionar ícone Bootstrap
            const div = foreignObject
              .append('xhtml:div')
              .style('width', '16px')
              .style('height', '16px')
              .style('display', 'flex')
              .style('align-items', 'center')
              .style('justify-content', 'center')
              .style('line-height', '1');
            
            // Usar html() do D3 para inserir o ícone
            div.html(`<i class="bi ${finalIconClass}" style="font-size: 14px; color: #ffffff;"></i>`);
            
            badgeX = 20; // Espaço após o ícone
          }
          
          // Badges SEMPRE (regime para profissionais, tipo_academico para acadêmicos, modalidade quando houver)
          if (badges.length > 0) {
            badges.forEach((badge) => {
              // Garantir que a cor existe, senão usa fallback baseado no tipo
              let badgeColor = badge.cor;
              if (!badgeColor || badgeColor === '#6c757d') {
                // Tenta obter cor novamente
                if (badge.texto === 'CLT' || badge.texto === 'PJ' || badge.texto === 'Estágio') {
                  badgeColor = getBadgeColor('regime', badge.texto);
                } else if (badge.texto === 'Técnico' || badge.texto === 'Bacharel' || badge.texto === 'Lato Sensu') {
                  badgeColor = getBadgeColor('academico', badge.texto);
                } else if (badge.texto === 'Presencial' || badge.texto === 'Remoto' || badge.texto === 'Home office' || badge.texto === 'Híbrido') {
                  badgeColor = getBadgeColor('modalidade', badge.texto);
                }
                badgeColor = badgeColor || '#6c757d'; // Fallback final
              }
              
              
              
              // Largura mais compacta: 4px por caractere + padding lateral de 6px
              const badgeWidth = Math.max(badge.texto.length * 4 + 12, 30);
              const badgeGroup = contentGroup.append('g').attr('transform', `translate(${badgeX}, ${currentY + 1})`);
              
              badgeGroup
                .append('rect')
                .attr('width', badgeWidth)
                .attr('height', 16)
                .attr('rx', 4)
                .attr('fill', badgeColor)
                .attr('fill-opacity', 1)
                .attr('stroke', '#ffffff')
                .attr('stroke-width', 0.5);
              
              badgeGroup
                .append('text')
                .attr('x', badgeWidth / 2)
                .attr('y', 8)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .attr('fill', '#ffffff')
                .style('font-size', '8px')
                .style('font-weight', '700')
                .style('letter-spacing', '0.2px')
                .text(badge.texto);
              
              badgeX += badgeWidth + 4;
            });
            
            currentY += 18; // Espaço para linha de badges
          }

          // Linha 2: Nome da empresa (para profissionais) ou Título (para acadêmicos)
          if (e.tipo === 'profissional' && empresaText) {
            contentGroup
              .append('text')
              .attr('x', 0)
              .attr('y', currentY + lineHeight)
              .attr('fill', '#ffffff')
              .style('font-size', '10px')
              .style('font-weight', '700')
              .text(ellipsize(empresaText, Math.floor((x2 - x1 - 16) / 6)));
            currentY += lineHeight;
          }

          // Linha 3: Título/Profissão
          if (tituloText) {
            contentGroup
              .append('text')
              .attr('x', 0)
              .attr('y', currentY + lineHeight)
              .attr('fill', '#ffffff')
              .style('font-size', '10px')
              .style('font-weight', '600')
              .text(ellipsize(tituloText, Math.floor((x2 - x1 - 16) / 6)));
            currentY += lineHeight;
          }

          // Linha 4: Período
          contentGroup
            .append('text')
            .attr('x', 0)
            .attr('y', currentY + lineHeight)
            .attr('fill', '#f5f5f5')
            .style('font-size', '9px')
            .text(ellipsize(periodoText, Math.floor((x2 - x1 - 16) / 6)));

          // Linha 5: Cidade (se houver espaço)
          if (cidadeText && (x2 - x1) > 120) {
            contentGroup
              .append('text')
              .attr('x', 0)
              .attr('y', currentY + lineHeight * 2)
              .attr('fill', '#f0f0f0')
              .style('font-size', '8px')
              .text(ellipsize(cidadeText, Math.floor((x2 - x1 - 16) / 7)));
          }
        });

      // Eixo X de anos
      const xAxis = d3.axisBottom(xScale).ticks(this.axisYears.length).tickFormat(d3.timeFormat('%Y'));

      svg
        .append('g')
        .attr('transform', `translate(0, ${height - margin.bottom + 10})`)
        .call(xAxis)
        .selectAll('text')
        .style('font-size', '10px');
    },
    
    applyFilters() {
      let filtered = [...this.events];
      
      // Filtrar por categoria (apenas para eventos profissionais)
      if (this.filters.categoria !== 'TODOS') {
        filtered = filtered.filter(e => {
          // Se for acadêmico, mantém (não filtra por categoria)
          if (e.tipo === 'academico') return true;
          // Se for profissional, filtra por categoria
          if (e.tipo === 'profissional') {
            return e.categoria_profissional === this.filters.categoria || 
                   e.categoria_profissional === 'TODOS' ||
                   !e.categoria_profissional; // Se não tiver categoria, mantém
          }
          return true;
        });
      }
      
      // Filtrar por período
      if (this.filters.periodo !== 'all') {
        const now = new Date();
        const cutoffDate = new Date();
        
        switch(this.filters.periodo) {
          case '1year':
            cutoffDate.setFullYear(now.getFullYear() - 1);
            break;
          case '3years':
            cutoffDate.setFullYear(now.getFullYear() - 3);
            break;
          case '5years':
            cutoffDate.setFullYear(now.getFullYear() - 5);
            break;
        }
        
        filtered = filtered.filter(e => {
          const eventDate = new Date(e.data_inicio);
          return eventDate >= cutoffDate;
        });
      }
      
      // Filtrar por tipo (legado - mantido para compatibilidade)
      if (this.filters.tipo !== 'all') {
        filtered = filtered.filter(e => e.tipo === this.filters.tipo);
      }
      
      // Filtrar por natureza (Profissional/Acadêmico)
      if (this.filters.natureza && this.filters.natureza.length > 0) {
        filtered = filtered.filter(e => this.filters.natureza.includes(e.tipo));
      }
      
      // Filtrar por vínculo/nível
      if (this.filters.vinculo && this.filters.vinculo.length > 0) {
        filtered = filtered.filter(e => {
          // Para profissionais: verifica regime (CLT, PJ, Estágio)
          if (e.tipo === 'profissional' && e.regime) {
            return this.filters.vinculo.includes(e.regime);
          }
          // Para acadêmicos: verifica tipo_academico (Técnico, Bacharel, Lato Sensu)
          if (e.tipo === 'academico' && e.tipo_academico) {
            // Normaliza o nome para matching
            const tipoNormalizado = e.tipo_academico.toLowerCase().includes('técnico') || e.tipo_academico.toLowerCase().includes('tecnico') ? 'Técnico' :
                                   e.tipo_academico.toLowerCase().includes('bacharel') ? 'Bacharel' :
                                   (e.tipo_academico.toLowerCase().includes('lato') || e.tipo_academico.toLowerCase().includes('sensu')) ? 'Lato Sensu' :
                                   e.tipo_academico;
            return this.filters.vinculo.includes(tipoNormalizado);
          }
          // Se não tiver vínculo/tipo, não inclui (filtro ativo)
          return false;
        });
      }
      
      // Filtrar por modalidade
      if (this.filters.modalidade && this.filters.modalidade.length > 0) {
        filtered = filtered.filter(e => {
          if (!e.tipo_local) return false;
          // Normaliza variações
          let modalidadeNormalizada = e.tipo_local;
          if (modalidadeNormalizada === 'Hibrido' || modalidadeNormalizada === 'Híbrido') {
            modalidadeNormalizada = 'Híbrido';
          } else if (modalidadeNormalizada.toLowerCase() === 'home office' || modalidadeNormalizada.toLowerCase() === 'remoto') {
            modalidadeNormalizada = 'Remoto';
          }
          return this.filters.modalidade.includes(modalidadeNormalizada) || 
                 this.filters.modalidade.includes(e.tipo_local);
        });
      }
      
      this.filteredEvents = filtered;
      
      console.log('🔍 Filtros aplicados:', {
        filtros: this.filters,
        eventosAntes: this.events.length,
        eventosDepois: filtered.length
      });
      
      // Recalcular resumo com eventos filtrados para manter consistência com o gráfico
      this.computeSummary(filtered);
      
      // Aguardar um pouco antes de renderizar timeline para evitar quebra no mobile
      setTimeout(() => {
        this.prepareTimelineGrid();
      }, 100);
    },
    
    // Funções para toggle dos filtros das legendas
    toggleFilterNatureza(valor) {
      const index = this.filters.natureza.indexOf(valor);
      if (index > -1) {
        this.filters.natureza.splice(index, 1);
      } else {
        this.filters.natureza.push(valor);
      }
      this.applyFilters();
    },
    
    toggleFilterVinculo(valor) {
      const index = this.filters.vinculo.indexOf(valor);
      if (index > -1) {
        this.filters.vinculo.splice(index, 1);
      } else {
        this.filters.vinculo.push(valor);
      }
      this.applyFilters();
    },
    
    toggleFilterModalidade(valor) {
      // Normaliza "Hibrido" para "Híbrido"
      const valorNormalizado = (valor === 'Hibrido' || valor === 'Híbrido') ? 'Híbrido' : valor;
      const index = this.filters.modalidade.indexOf(valorNormalizado);
      if (index > -1) {
        this.filters.modalidade.splice(index, 1);
      } else {
        this.filters.modalidade.push(valorNormalizado);
      }
      this.applyFilters();
    },
    
    isFilterActive(categoria, valor) {
      if (categoria === 'natureza') {
        return this.filters.natureza.includes(valor);
      }
      if (categoria === 'vinculo') {
        return this.filters.vinculo.includes(valor);
      }
      if (categoria === 'modalidade') {
        const valorNormalizado = (valor === 'Hibrido' || valor === 'Híbrido') ? 'Híbrido' : valor;
        return this.filters.modalidade.includes(valorNormalizado);
      }
      return false;
    },
    
    async openDetails(evento) {
      this.selectedEvent = evento;
      this.selectedEventProjects = [];
      this.selectedEventFeedbacks = [];
      
      // Buscar feedbacks relacionados (apenas para histórico profissional)
      if (evento.tipo === 'profissional') {
        try {
          const supabase = getSupabase();
          if (supabase) {
            console.log('🔍 Buscando feedbacks para:', evento.instituicao, 'ID:', evento.id);
            
            // Buscar por professional_history_id
            const { data: dataById, error: errorById } = await supabase
              .from('feedbacks')
              .select('*')
              .eq('professional_history_id', evento.id)
              .eq('aprovado', true)
              .order('data_feedback', { ascending: false });
            
            let allFeedbacks = dataById || [];
            console.log('✅ Feedbacks por ID:', allFeedbacks.length, allFeedbacks);
            
            // SEMPRE buscar também por nome da empresa (para garantir que pegue todos)
            if (evento.instituicao) {
              const { data: dataByEmpresa, error: errorByEmpresa } = await supabase
                .from('feedbacks')
                .select('*')
                .ilike('empresa', `%${evento.instituicao}%`)
                .eq('aprovado', true)
                .order('data_feedback', { ascending: false });
              
              if (!errorByEmpresa && dataByEmpresa && dataByEmpresa.length > 0) {
                console.log('✅ Feedbacks por empresa:', dataByEmpresa.length, dataByEmpresa);
                
                // Combinar e remover duplicatas por ID
                const existingIds = new Set(allFeedbacks.map(f => f.id));
                const uniqueFeedbacks = dataByEmpresa.filter(f => !existingIds.has(f.id));
                allFeedbacks = [...allFeedbacks, ...uniqueFeedbacks];
                console.log('✅ Total único de feedbacks:', allFeedbacks.length);
              }
            }
            
            // Ordenar por data (mais recente primeiro)
            this.selectedEventFeedbacks = allFeedbacks.sort((a, b) => {
              const dateA = new Date(a.data_feedback || 0);
              const dateB = new Date(b.data_feedback || 0);
              return dateB - dateA;
            });
            
            console.log('✅ Feedbacks finais no modal:', this.selectedEventFeedbacks.length);
          }
        } catch (error) {
          console.error('❌ Erro ao carregar feedbacks:', error);
          this.selectedEventFeedbacks = [];
        }
      } else {
        this.selectedEventFeedbacks = [];
      }
      
      // Buscar projetos relacionados com esta instituição
      try {
        const supabase = getSupabase();
        if (!supabase) {
          console.error('❌ Supabase não está disponível para buscar projetos');
          const modal = new bootstrap.Modal(document.getElementById('eventModal'));
          modal.show();
          return;
        }
        
        const institutionId = evento.id;
        const institutionType = evento.tipo; // 'academico' ou 'profissional'
        
        // Buscar diretamente na tabela projects usando foreign keys
        let query = supabase
          .from('projects')
          .select('*')
          .eq('ativo', true);
        
        if (institutionType === 'profissional') {
          query = query.eq('professional_history_id', institutionId);
        } else if (institutionType === 'academico') {
          query = query.eq('academic_history_id', institutionId);
        }
        
        const { data, error } = await query.order('ordem', { ascending: true }).order('data_projeto', { ascending: false });
        
        if (error) {
          console.error('❌ Erro ao buscar projetos:', error);
          
          // Tentar usar RPC como fallback (se existir)
          try {
            const rpcResult = await supabase.rpc('get_projects_by_institution', {
              p_institution_type: institutionType,
              p_institution_id: institutionId
            });
            
            if (rpcResult.error) {
              console.error('❌ Erro ao buscar projetos via RPC:', rpcResult.error);
              this.selectedEventProjects = [];
            } else {
              console.log('✅ Projetos encontrados via RPC:', rpcResult.data?.length || 0);
              this.selectedEventProjects = (rpcResult.data || []).map(p => ({
                project_id: p.project_id,
                project_nome: p.project_nome,
                project_descricao: p.project_descricao,
                project_data: p.project_data,
                project_tecnologias: p.project_tecnologias,
                project_link: p.project_link,
                project_url: p.project_url,
                project_github: p.project_github,
                project_imagem_url: p.project_imagem_url,
                project_imagem: p.project_imagem,
                link_projeto: p.link_projeto,
                link_github: p.link_github
              }));
            }
          } catch (rpcError) {
            console.error('❌ Erro ao tentar RPC:', rpcError);
            this.selectedEventProjects = [];
          }
        } else {
          console.log('✅ Projetos encontrados:', data?.length || 0);
          // Mapear dados para o formato esperado
          this.selectedEventProjects = (data || []).map(p => ({
            project_id: p.id,
            project_nome: p.titulo,
            project_descricao: p.descricao_curta || p.descricao_completa || '',
            project_data: p.data_projeto ? new Date(p.data_projeto).toLocaleDateString('pt-BR') : '',
            project_tecnologias: p.tecnologias || [],
            project_link: p.link_projeto || p.link_github || null,
            project_url: p.link_projeto,
            project_github: p.link_github,
            project_imagem_url: p.imagem_url,
            project_imagem: p.imagem_url,
            link_projeto: p.link_projeto,
            link_github: p.link_github
          }));
        }
      } catch (error) {
        
      }
      
      const modal = new bootstrap.Modal(document.getElementById('eventModal'));
      modal.show();
    },
    
    // Funções helper para verificar se deve mostrar botões
    hasProjects() {
      const has = this.selectedEventProjects && Array.isArray(this.selectedEventProjects) && this.selectedEventProjects.length > 0;
      
      return has;
    },
    
    hasCertificates() {
      const has = this.selectedEvent && 
             this.selectedEvent.tipo === 'academico' && 
             this.selectedEvent.imagens_urls && 
             Array.isArray(this.selectedEvent.imagens_urls) && 
             this.selectedEvent.imagens_urls.length > 0;
      
      return has;
    },
    
    hasImages() {
      const has = this.selectedEvent && 
             this.selectedEvent.tipo === 'profissional' && 
             this.selectedEvent.imagens_urls && 
             Array.isArray(this.selectedEvent.imagens_urls) && 
             this.selectedEvent.imagens_urls.length > 0;
      
      return has;
    },
    
    scrollToSection(sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    },
    
    // Função para detectar se é PDF
    isPDF(url) {
      if (!url) return false;
      const urlLower = url.toLowerCase();
      return urlLower.endsWith('.pdf') || urlLower.includes('.pdf?') || urlLower.includes('application/pdf');
    },
    
    // Função para obter o tipo de arquivo
    getFileType(url) {
      if (!url) return 'image';
      const urlLower = url.toLowerCase();
      if (urlLower.endsWith('.pdf') || urlLower.includes('.pdf?') || urlLower.includes('application/pdf')) {
        return 'pdf';
      }
      if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/)) {
        return 'image';
      }
      return 'unknown';
    },
    
    // Função para obter o nome do arquivo da URL
    getFileName(url) {
      if (!url) return 'Arquivo';
      try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const fileName = pathname.split('/').pop() || 'Arquivo';
        return decodeURIComponent(fileName);
      } catch {
        const fileName = url.split('/').pop() || 'Arquivo';
        return decodeURIComponent(fileName);
      }
    },
    
    renderMobileTimeline() {
      const container = document.getElementById('d3-timeline');
      if (!container) return;
      
      container.innerHTML = '';
      
      const list = this.filteredEvents && this.filteredEvents.length
        ? this.filteredEvents
        : this.events;
      
      if (!list.length) {
        container.innerHTML = '<p class="text-center text-muted py-4">Nenhum evento encontrado.</p>';
        return;
      }
      
      // Criar container de cards mobile
      const mobileContainer = document.createElement('div');
      mobileContainer.className = 'timeline-mobile-cards';
      
      // Ordenar por data (mais recente primeiro)
      const sortedList = [...list].sort((a, b) => 
        new Date(b.data_inicio) - new Date(a.data_inicio)
      );
      
      const self = this;
      
      sortedList.forEach(event => {
        const card = document.createElement('div');
        card.className = `timeline-mobile-card ${event.tipo}`;
        card.onclick = () => self.openDetails(event);
        
        // Logo
        const logoDiv = document.createElement('div');
        logoDiv.className = 'timeline-mobile-card-logo';
        
        if (event.logo_url) {
          const img = document.createElement('img');
          img.src = event.logo_url;
          img.alt = event.instituicao;
          img.onerror = function() {
            this.parentElement.innerHTML = `<div class="timeline-mobile-card-logo-fallback">${(event.instituicao || '?')[0].toUpperCase()}</div>`;
          };
          logoDiv.appendChild(img);
        } else {
          logoDiv.innerHTML = `<div class="timeline-mobile-card-logo-fallback">${(event.instituicao || '?')[0].toUpperCase()}</div>`;
        }
        
        // Conteúdo
        const contentDiv = document.createElement('div');
        contentDiv.className = 'timeline-mobile-card-content';
        
        // Badges
        const badgesDiv = document.createElement('div');
        badgesDiv.className = 'timeline-mobile-card-badges';
        
        // Badge de tipo (Profissional/Acadêmico)
        const tipoBadge = document.createElement('span');
        tipoBadge.className = 'timeline-mobile-card-badge';
        tipoBadge.style.background = event.tipo === 'profissional' ? '#7b1fa2' : '#ff9800';
        tipoBadge.textContent = event.tipo === 'profissional' ? 'Profissional' : 'Acadêmico';
        badgesDiv.appendChild(tipoBadge);
        
        // Badge de regime/tipo acadêmico
        if (event.tipo === 'profissional' && event.regime) {
          const regimeBadge = document.createElement('span');
          regimeBadge.className = 'timeline-mobile-card-badge';
          regimeBadge.style.background = event.regime === 'CLT' ? '#007bff' : event.regime === 'PJ' ? '#28a745' : '#17a2b8';
          regimeBadge.textContent = event.regime;
          badgesDiv.appendChild(regimeBadge);
        } else if (event.tipo === 'academico' && event.tipo_academico) {
          const acadBadge = document.createElement('span');
          acadBadge.className = 'timeline-mobile-card-badge';
          acadBadge.style.background = event.tipo_academico.includes('Técnico') ? '#00bcd4' : 
                                       event.tipo_academico.includes('Bacharel') ? '#9c27b0' : '#e91e63';
          acadBadge.textContent = event.tipo_academico;
          badgesDiv.appendChild(acadBadge);
        }
        
        contentDiv.appendChild(badgesDiv);
        
        // Título
        const titleDiv = document.createElement('div');
        titleDiv.className = 'timeline-mobile-card-title';
        titleDiv.textContent = event.titulo || event.curso || event.instituicao;
        contentDiv.appendChild(titleDiv);
        
        // Subtítulo (instituição para profissionais, curso para acadêmicos)
        const subtitleDiv = document.createElement('div');
        subtitleDiv.className = 'timeline-mobile-card-subtitle';
        subtitleDiv.textContent = event.tipo === 'profissional' ? event.instituicao : (event.instituicao || '');
        contentDiv.appendChild(subtitleDiv);
        
        // Meta (período e local)
        const metaDiv = document.createElement('div');
        metaDiv.className = 'timeline-mobile-card-meta';
        
        const periodoSpan = document.createElement('span');
        periodoSpan.innerHTML = `<i class="bi bi-calendar3"></i> ${this.formatDateRange(event.data_inicio, event.data_fim, event.atual)}`;
        metaDiv.appendChild(periodoSpan);
        
        if (event.local) {
          const localSpan = document.createElement('span');
          localSpan.innerHTML = `<i class="bi bi-geo-alt"></i> ${event.local}`;
          metaDiv.appendChild(localSpan);
        }
        
        if (event.tipo_local) {
          const modalidadeSpan = document.createElement('span');
          const iconClass = event.tipo_local.toLowerCase().includes('presencial') ? 'bi-building' :
                           event.tipo_local.toLowerCase().includes('remoto') || event.tipo_local.toLowerCase().includes('home') ? 'bi-house' : 'bi-arrow-left-right';
          modalidadeSpan.innerHTML = `<i class="bi ${iconClass}"></i> ${event.tipo_local}`;
          metaDiv.appendChild(modalidadeSpan);
        }
        
        contentDiv.appendChild(metaDiv);
        
        // Seta
        const arrowDiv = document.createElement('div');
        arrowDiv.className = 'timeline-mobile-card-arrow';
        arrowDiv.innerHTML = '<i class="bi bi-chevron-right"></i>';
        
        card.appendChild(logoDiv);
        card.appendChild(contentDiv);
        card.appendChild(arrowDiv);
        
        mobileContainer.appendChild(card);
      });
      
      container.appendChild(mobileContainer);
    },
    
    formatDateRange(dataInicio, dataFim, atual) {
      if (!dataInicio) return 'Data não informada';
      
      const inicio = new Date(dataInicio).toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (atual) {
        return `${inicio} - Atual`;
      }
      
      if (dataFim) {
        const fim = new Date(dataFim).toLocaleDateString('pt-BR', { 
          year: 'numeric', 
          month: 'short' 
        });
        return `${inicio} - ${fim}`;
      }
      
      return inicio;
    },
    
    getCategoryColor(categoria) {
      const colors = {
        'QA': 'primary',
        'DEV': 'success',
        'INFRA': 'warning',
        'DEVOPS': 'info',
        'TODOS': 'secondary'
      };
      return colors[categoria] || 'secondary';
    },
    
    // Funções do Slider de Feedbacks
    nextFeedback() {
      if (this.approvedFeedbacks.length === 0) return;
      if (this.currentFeedbackIndex < this.approvedFeedbacks.length - 1) {
        this.currentFeedbackIndex++;
      } else {
        // Volta ao início quando chega no final
        this.currentFeedbackIndex = 0;
      }
      this.resetFeedbackAutoPlay();
    },
    
    prevFeedback() {
      if (this.approvedFeedbacks.length === 0) return;
      if (this.currentFeedbackIndex > 0) {
        this.currentFeedbackIndex--;
      } else {
        // Vai para o final quando está no início
        this.currentFeedbackIndex = this.approvedFeedbacks.length - 1;
      }
      this.resetFeedbackAutoPlay();
    },
    
    startFeedbackAutoPlay() {
      // Limpar intervalo anterior se existir
      if (this.feedbackAutoPlayInterval) {
        clearInterval(this.feedbackAutoPlayInterval);
      }
      
      // Iniciar novo intervalo de 10 segundos
      this.feedbackAutoPlayInterval = setInterval(() => {
        if (this.approvedFeedbacks.length > 1) {
          if (this.currentFeedbackIndex < this.approvedFeedbacks.length - 1) {
            this.currentFeedbackIndex++;
          } else {
            this.currentFeedbackIndex = 0; // Volta ao início
          }
        }
      }, 10000); // 10 segundos
    },
    
    stopFeedbackAutoPlay() {
      if (this.feedbackAutoPlayInterval) {
        clearInterval(this.feedbackAutoPlayInterval);
        this.feedbackAutoPlayInterval = null;
      }
    },
    
    resetFeedbackAutoPlay() {
      // Reinicia o auto-play após interação manual
      this.stopFeedbackAutoPlay();
      if (this.approvedFeedbacks.length > 1) {
        this.startFeedbackAutoPlay();
      }
    },
    
    // Funções do Modal de Novo Feedback
    openFeedbackModal() {
      // Resetar formulário
      this.newFeedback = {
        nome: '',
        cargo: '',
        empresa: '',
        mensagem: '',
        imagem_url: '',
        fonte: 'Site'
      };
      
      // Verificar se Bootstrap está disponível
      const modalElement = document.getElementById('feedbackModal');
      if (!modalElement) {
        console.error('❌ Modal feedbackModal não encontrado no DOM');
        alert('Erro: Modal não encontrado. Verifique o console.');
        return;
      }
      
      // Verificar se Bootstrap.Modal está disponível
      if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
        console.error('❌ Bootstrap não está disponível');
        alert('Erro: Bootstrap não está carregado. Verifique o console.');
        return;
      }
      
      try {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        console.log('✅ Modal de feedback aberto');
      } catch (error) {
        console.error('❌ Erro ao abrir modal:', error);
        alert('Erro ao abrir modal. Verifique o console.');
      }
    },
    
    async submitFeedback() {
      if (!this.newFeedback.nome || !this.newFeedback.mensagem) {
        alert('Por favor, preencha nome e mensagem.');
        return;
      }
      
      this.submittingFeedback = true;
      
      try {
        const supabase = getSupabase();
        if (!supabase) {
          throw new Error('Supabase não está disponível');
        }
        
        const { data, error } = await supabase
          .from('feedbacks')
          .insert({
            nome: this.newFeedback.nome,
            cargo: this.newFeedback.cargo || null,
            empresa: this.newFeedback.empresa || null,
            mensagem: this.newFeedback.mensagem,
            imagem_url: this.newFeedback.imagem_url || null,
            fonte: 'Site',
            aprovado: false, // Requer aprovação
            data_feedback: new Date().toISOString().split('T')[0]
          });
        
        if (error) throw error;
        
        alert('Obrigado pelo seu feedback! Ele será revisado antes de ser publicado.');
        
        // Fechar modal
        const modalElement = document.getElementById('feedbackModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
        
        // Resetar formulário
        this.newFeedback = {
          nome: '',
          cargo: '',
          empresa: '',
          mensagem: '',
          imagem_url: '',
          fonte: 'Site'
        };
      } catch (error) {
        console.error('Erro ao enviar feedback:', error);
        alert('Erro ao enviar feedback. Tente novamente.');
      } finally {
        this.submittingFeedback = false;
      }
    },
    
    // Helpers para Feedbacks
    getInitials(nome) {
      if (!nome) return '?';
      const parts = nome.trim().split(' ');
      if (parts.length === 1) return parts[0][0].toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    },
    
    getAvatarColor(nome) {
      // Gera uma cor baseada no nome (hash simples)
      let hash = 0;
      for (let i = 0; i < nome.length; i++) {
        hash = nome.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      const colors = [
        '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
        '#1abc9c', '#34495e', '#e67e22', '#16a085', '#c0392b'
      ];
      
      return colors[Math.abs(hash) % colors.length];
    },
    
    formatFeedbackDate(dateString) {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { 
          month: 'long', 
          year: 'numeric' 
        });
      } catch {
        return dateString;
      }
    }
  };
}

// Registrar globalmente para o Alpine.js
window.historiaTimeline = historiaTimeline;
