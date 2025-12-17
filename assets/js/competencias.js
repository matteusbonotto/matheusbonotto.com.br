// assets/js/competencias.js
// Componente Alpine.js para Competências - Baseado no projeto de referência

import { supabase } from './supabase.js';

function competenciasPage() {
  return {
    skills: [],
    filteredSkills: [],
    achievements: [],
    filteredAchievements: [],
    loading: true,
    loadingAchievements: true,
    selectedSkill: null,
    selectedAchievement: null,
    activeCategory: '',
    achievementFilter: 'all',
    viewMode: 'list',
    sortOrder: 'unlocked-first',
    achievementsPerPage: 10,
    currentAchievementPage: 1,
    stats: null,
    topSkill: null,
    expandedNodes: {},
    _showingCount: 0,
    _totalAchievements: 0,
    _hasMoreAchievements: false,
    
    async loadData() {
      await Promise.all([
        this.loadSkills(),
        this.loadAchievements(),
        this.loadStats()
      ]);
      this.renderSkillTree();
      this.renderAchievements();
    },
    
    async loadSkills() {
      try {
        this.loading = true;
        
        const { data, error } = await supabase
          .from('skills_tree')
          .select('*')
          .order('categoria', { ascending: true })
          .order('ordem', { ascending: true });
        
        if (error) throw error;
        
        this.skills = data || [];
        this.filteredSkills = [...this.skills];
      } catch (error) {
        
        alert('Erro ao carregar habilidades. Verifique o console.');
      } finally {
        this.loading = false;
      }
    },
    
    async loadAchievements() {
      try {
        this.loadingAchievements = true;
        
        const { data, error } = await supabase
          .from('achievements')
          .select('*')
          .order('ordem', { ascending: true });
        
        if (error) throw error;
        
        this.achievements = data || [];
        this.filteredAchievements = [...this.achievements];
      } catch (error) {
        
      } finally {
        this.loadingAchievements = false;
      }
    },
    
    async loadStats() {
      try {
        const [skillsResult, achievementsResult] = await Promise.all([
          supabase.from('skills_tree').select('*'),
          supabase.from('achievements').select('*')
        ]);
        
        const allSkills = skillsResult.data || [];
        
        // Contar apenas skills raiz (sem parent_id) para estatísticas mais úteis
        const rootSkills = allSkills.filter(s => !s.parent_id);
        const totalRootSkills = rootSkills.length;
        const unlockedRootSkills = rootSkills.filter(s => s.desbloqueado).length;
        
        // Encontrar habilidade em destaque (a com maior nível ou a primeira desbloqueada)
        const topSkill = rootSkills
          .filter(s => s.desbloqueado)
          .sort((a, b) => (b.nivel || 0) - (a.nivel || 0))[0] || 
          rootSkills.find(s => s.categoria === 'qa') || 
          rootSkills[0];
        
        // Calcular nível médio apenas das skills raiz
        const avgLevel = rootSkills.length > 0
          ? Math.round(rootSkills.reduce((sum, s) => sum + (s.nivel || 0), 0) / rootSkills.length)
          : 0;
        
        // Calcular porcentagem de desbloqueio
        const unlockPercentage = totalRootSkills > 0
          ? Math.round((unlockedRootSkills / totalRootSkills) * 100)
          : 0;
        
        const totalAchievements = (achievementsResult.data || []).length;
        const unlockedAchievements = (achievementsResult.data || []).filter(a => a.desbloqueado).length;
        
        // Top skill (maior nível entre skills raiz desbloqueadas, ou QA se disponível)
        const sortedRootSkills = [...rootSkills]
          .filter(s => s.desbloqueado)
          .sort((a, b) => (b.nivel || 0) - (a.nivel || 0));
        this.topSkill = sortedRootSkills.length > 0 
          ? sortedRootSkills[0] 
          : rootSkills.find(s => s.categoria === 'qa') || rootSkills[0] || null;
        
        this.stats = {
          totalSkills: totalRootSkills,
          unlockedCount: unlockedRootSkills,
          unlockPercentage,
          avgLevel,
          totalAchievements,
          unlockedAchievements,
          topSkillName: this.topSkill ? this.topSkill.nome : 'Quality Assurance'
        };
      } catch (error) {
        
      }
    },
    
    changeCategory(category) {
      this.activeCategory = category;
      this.renderSkillTree();
    },
    
    changeAchievementFilter(status) {
      this.achievementFilter = status;
      this.currentAchievementPage = 1;
      this.renderAchievements();
    },
    
    changeViewMode(view) {
      this.viewMode = view;
      this.renderAchievements();
    },
    
    toggleSortOrder() {
      this.sortOrder = this.sortOrder === 'unlocked-first' ? 'locked-first' : 'unlocked-first';
      this.currentAchievementPage = 1;
      this.renderAchievements();
    },
    
    renderSkillTree() {
      const container = document.getElementById('skill-tree');
      if (!container) return;
      
      // Limpar container
      const loadingEl = container.querySelector('.tree-loading');
      const emptyEl = container.querySelector('.tree-empty');
      if (loadingEl) loadingEl.remove();
      if (emptyEl) emptyEl.remove();
      
      // Filtrar skills por categoria
      let filtered = [...this.skills];
      if (this.activeCategory) {
        filtered = filtered.filter(s => 
          s.categoria?.toLowerCase() === this.activeCategory.toLowerCase()
        );
      }
      
      // Filtrar apenas skills raiz (sem parent_id)
      const rootSkills = filtered.filter(s => !s.parent_id);
      
      if (rootSkills.length === 0) {
        container.innerHTML = `
          <div class="tree-empty">
            <i class="bi bi-exclamation-triangle" style="font-size: 3rem; opacity: 0.5;"></i>
            <p>Nenhuma habilidade encontrada para esta categoria.</p>
          </div>
        `;
        return;
      }
      
      // Criar wrapper com estrutura vertical para garantir ordem correta
      const wrapper = document.createElement('div');
      wrapper.className = 'tree-wrapper';
      wrapper.style.cssText = 'display: flex; flex-direction: row; justify-content: center; align-items: flex-start; gap: 60px; flex-wrap: wrap;';
      
      // Renderizar cada skill raiz
      rootSkills.forEach(skill => {
        const branch = this.createSkillNode(skill, filtered);
        wrapper.appendChild(branch);
      });
      
      container.innerHTML = '';
      container.appendChild(wrapper);
    },
    
    // Mapear ícones por categoria e nome (baseado no JSON de referência)
    getSkillIcon(skill) {
      // Se tiver ícone no banco, usa ele
      if (skill.icon) {
        return skill.icon.startsWith('bi-') ? `bi ${skill.icon}` : `bi bi-${skill.icon}`;
      }
      
      // Mapeamento baseado no JSON de referência
      const iconMap = {
        'qa-root': 'bi-shield-check',
        'qa-testing': 'bi-bug-fill',
        'qa-automation': 'bi-robot',
        'qa-methodologies': 'bi-diagram-3',
        'qa-functional': 'bi-check2-square',
        'qa-exploratory': 'bi-search',
        'qa-regression': 'bi-arrow-repeat',
        'qa-robot-framework': 'bi-browser-chrome',
        'qa-gherkin': 'bi-file-text',
        'qa-cypress': 'bi-browser-edge',
        'qa-shift-left': 'bi-arrow-left',
        'qa-prisma': 'bi-clipboard2-pulse',
        'qa-iso-29119': 'bi-file-earmark-check',
        'dev-root': 'bi-code-slash',
        'dev-frontend': 'bi-window',
        'dev-backend': 'bi-server',
        'dev-html': 'bi-filetype-html',
        'dev-css': 'bi-filetype-css',
        'dev-bootstrap': 'bi-bootstrap',
        'dev-tailwind': 'bi-wind',
        'dev-typescript': 'bi-filetype-ts',
        'dev-javascript': 'bi-filetype-js',
        'dev-node': 'bi-node-plus',
        'dev-python': 'bi-filetype-py',
        'data-root': 'bi-graph-up',
        'data-excel': 'bi-table',
        'data-dashboards': 'bi-bar-chart',
        'data-powerbi': 'bi-graph-up-arrow',
        'devops-root': 'bi-gear-fill',
        'devops-agile': 'bi-arrow-repeat',
        'devops-tools': 'bi-tools',
        'devops-scrum': 'bi-kanban',
        'devops-kanban': 'bi-columns',
        'devops-azure': 'bi-microsoft',
        'devops-jira': 'bi-jira',
        'idiomas-root': 'bi-translate',
        'idiomas-ingles': 'bi-flag',
        'idiomas-ingles-reading': 'bi-book',
        'idiomas-ingles-listening': 'bi-ear',
        'idiomas-ingles-conversation': 'bi-chat-dots',
        'idiomas-ingles-writing': 'bi-pencil',
        'ux-root': 'bi-palette'
      };
      
      // Tentar encontrar por ID primeiro
      if (iconMap[skill.id]) {
        return `bi ${iconMap[skill.id]}`;
      }
      
      // Tentar por nome (case insensitive)
      const skillName = (skill.nome || '').toLowerCase().replace(/\s+/g, '-');
      for (const [key, icon] of Object.entries(iconMap)) {
        if (key.includes(skillName) || skillName.includes(key.replace(/-/g, ' '))) {
          return `bi ${icon}`;
        }
      }
      
      // Fallback por categoria
      const categoryIcons = {
        'qa': 'bi-shield-check',
        'dev': 'bi-code-slash',
        'data': 'bi-graph-up',
        'devops': 'bi-gear-fill',
        'infra': 'bi-server',
        'idiomas': 'bi-translate',
        'ux': 'bi-palette'
      };
      
      return `bi ${categoryIcons[skill.categoria?.toLowerCase()] || 'bi-star'}`;
    },
    
    createSkillNode(skill, allSkills) {
      const branch = document.createElement('div');
      branch.className = 'tree-branch';
      branch.setAttribute('data-skill-id', skill.id);
      
      const node = document.createElement('div');
      node.className = `tree-node ${skill.desbloqueado ? 'unlocked' : 'locked'}`;
      node.setAttribute('data-category', skill.categoria || 'default');
      
      const content = document.createElement('div');
      content.className = 'node-content';
      
      // Ícone
      const icon = document.createElement('i');
      icon.className = `${this.getSkillIcon(skill)} node-icon`;
      content.appendChild(icon);
      
      // Título
      const title = document.createElement('div');
      title.className = 'node-title';
      title.textContent = skill.nome || 'Skill';
      content.appendChild(title);
      
      // Domínio/Nível
      const domain = document.createElement('div');
      domain.className = 'node-domain';
      domain.textContent = `${skill.nivel || 0}%`;
      content.appendChild(domain);
      
      node.appendChild(content);
      
      // Ícone de cadeado se bloqueado
      if (!skill.desbloqueado) {
        const lockIcon = document.createElement('div');
        lockIcon.className = 'lock-icon';
        lockIcon.innerHTML = '<i class="bi bi-lock"></i>';
        node.appendChild(lockIcon);
      }
      
      // Event listener para clique no nó
      node.addEventListener('click', () => {
        this.selectSkill(skill);
      });
      
      // Adicionar nó ao branch PRIMEIRO
      branch.appendChild(node);
      
      // Buscar filhos
      const children = allSkills.filter(s => s.parent_id === skill.id);
      
      // Botão de expansão se tiver filhos
      if (children.length > 0) {
        const isExpanded = !!this.expandedNodes[skill.id];
        const expandBtn = document.createElement('button');
        expandBtn.className = `expand-btn ${isExpanded ? 'expanded' : ''}`;
        const span = document.createElement('span');
        span.style.cssText = 'line-height: 1; font-family: monospace; color: var(--white);';
        span.textContent = isExpanded ? '−' : '+';
        expandBtn.appendChild(span);
        expandBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleNode(skill.id, allSkills, branch);
        });
        node.appendChild(expandBtn);
        
        // Container para filhos (sempre abaixo do nó pai)
        const childrenContainer = document.createElement('div');
        childrenContainer.className = `children-container ${isExpanded ? 'expanded' : ''}`;
        
        if (isExpanded) {
          children.forEach(child => {
            const childBranch = this.createSkillNode(child, allSkills);
            childrenContainer.appendChild(childBranch);
          });
        }
        
        // Adicionar container de filhos DEPOIS do nó (garantindo ordem visual)
        branch.appendChild(childrenContainer);
      }
      
      return branch;
    },
    
    toggleNode(skillId, allSkills, branchElement) {
      const skill = allSkills.find(s => s.id === skillId);
      if (!skill) return;
      
      const children = allSkills.filter(s => s.parent_id === skillId);
      if (children.length === 0) return;
      
      const childrenContainer = branchElement.querySelector('.children-container');
      const expandBtn = branchElement.querySelector('.expand-btn');
      if (!expandBtn || !childrenContainer) return;
      
      const expandContent = expandBtn.querySelector('span');
      
      const isCurrentlyExpanded = !!this.expandedNodes[skillId];
      
      if (isCurrentlyExpanded) {
        // Fechar - voltar ao estado inicial (verde com +)
        delete this.expandedNodes[skillId];
        childrenContainer.classList.remove('expanded');
        expandBtn.classList.remove('expanded');
        if (expandContent) {
          expandContent.textContent = '+';
        }
        // Forçar reset do background para aplicar CSS
        expandBtn.style.background = '';
        expandBtn.style.color = '';
        
        setTimeout(() => {
          if (!this.expandedNodes[skillId]) {
            childrenContainer.innerHTML = '';
          }
        }, 300);
      } else {
        // Abrir - mudar para vermelho com -
        this.expandedNodes[skillId] = true;
        childrenContainer.classList.add('expanded');
        expandBtn.classList.add('expanded');
        if (expandContent) {
          expandContent.textContent = '−';
        }
        // Forçar reset do background para aplicar CSS
        expandBtn.style.background = '';
        expandBtn.style.color = '';
        
        // Adicionar filhos
        children.forEach(child => {
          const childBranch = this.createSkillNode(child, allSkills);
          childrenContainer.appendChild(childBranch);
        });
      }
    },
    
    selectSkill(skill) {
      this.selectedSkill = skill;
      this.showSkillDetails(skill);
    },
    
    showSkillDetails(skill) {
      const isMobile = window.innerWidth <= 768;
      const container = isMobile ? 
        document.getElementById('skill-modal') : 
        document.getElementById('skill-drawer');
      
      const content = isMobile ? 
        container.querySelector('.modal-body') : 
        container.querySelector('.drawer-content');
      
      if (!content) return;
      
      content.innerHTML = this.generateSkillDetailsHTML(skill);
      
      if (isMobile) {
        document.getElementById('overlay').classList.add('active');
        container.classList.add('open');
        document.body.classList.add('modal-open');
      } else {
        container.classList.add('open');
      }
    },
    
    generateSkillDetailsHTML(skill) {
      const iconClass = this.getSkillIcon(skill);
      
      // Buscar filhos
      const children = this.skills.filter(s => s.parent_id === skill.id);
      
      // Buscar conquistas relacionadas (por categoria)
      const relatedAchievements = this.achievements.filter(a => 
        a.categoria?.toLowerCase() === skill.categoria?.toLowerCase() && a.desbloqueado
      ).slice(0, 5); // Limitar a 5
      
      let childrenHTML = '';
      if (children.length > 0) {
        childrenHTML = `
          <div class="skill-children">
            <h4>Habilidades Relacionadas</h4>
            <ul>
              ${children.map(child => `
                <li>
                  <i class="${this.getSkillIcon(child)}"></i>
                  ${child.nome} (${child.nivel || 0}%)
                  ${child.desbloqueado ? '<span class="badge-unlocked">Desbloqueado</span>' : '<span class="badge-locked">Bloqueado</span>'}
                </li>
              `).join('')}
            </ul>
          </div>
        `;
      }
      
      let achievementsHTML = '';
      if (relatedAchievements.length > 0) {
        achievementsHTML = `
          <div class="skill-achievements">
            <h4>Conquistas Relacionadas</h4>
            <ul>
              ${relatedAchievements.map(ach => `
                <li>
                  <i class="bi bi-trophy"></i>
                  ${ach.titulo}
                </li>
              `).join('')}
            </ul>
          </div>
        `;
      }
      
      return `
        <div class="skill-details">
          <div class="skill-header">
            <i class="${iconClass}"></i>
            <h3>${skill.nome || 'Skill'}</h3>
            <div class="domain">Domínio: ${skill.nivel || 0}%</div>
          </div>
          ${skill.descricao ? `<div class="skill-description">${skill.descricao}</div>` : ''}
          <div class="skill-info">
            <div class="info-row">
              <strong>Categoria:</strong>
              <span class="category-badge" data-category="${skill.categoria || ''}">
                ${(skill.categoria || '').toUpperCase()}
              </span>
            </div>
            <div class="info-row">
              <strong>Status:</strong>
              <span class="status-badge ${skill.desbloqueado ? 'unlocked' : 'locked'}">
                ${skill.desbloqueado ? '<i class="bi bi-unlock"></i> Desbloqueado' : '<i class="bi bi-lock"></i> Bloqueado'}
              </span>
            </div>
            ${skill.parent_id ? `
              <div class="info-row">
                <strong>Habilidade Pai:</strong>
                <span>${this.getParentName(skill.parent_id)}</span>
              </div>
            ` : ''}
            ${skill.ordem ? `
              <div class="info-row">
                <strong>Ordem:</strong>
                <span>${skill.ordem}</span>
              </div>
            ` : ''}
          </div>
          ${childrenHTML}
          ${achievementsHTML}
        </div>
      `;
    },
    
    getParentName(parentId) {
      const parent = this.skills.find(s => s.id === parentId);
      return parent ? parent.nome : 'N/A';
    },
    
    renderAchievements() {
      let achievements = [...this.achievements];
      
      // Filtrar por status
      if (this.achievementFilter === 'unlocked') {
        achievements = achievements.filter(a => a.desbloqueado);
      } else if (this.achievementFilter === 'locked') {
        achievements = achievements.filter(a => !a.desbloqueado);
      }
      
      // Ordenar
      achievements.sort((a, b) => {
        if (this.sortOrder === 'unlocked-first') {
          // Desbloqueadas primeiro
          if (a.desbloqueado && !b.desbloqueado) return -1;
          if (!a.desbloqueado && b.desbloqueado) return 1;
          
          // Se ambas desbloqueadas, ordenar por data (mais recente primeiro)
          if (a.desbloqueado && b.desbloqueado) {
            if (a.data_conquista && b.data_conquista) {
              return new Date(b.data_conquista) - new Date(a.data_conquista);
            }
            if (a.data_conquista && !b.data_conquista) return -1;
            if (!a.data_conquista && b.data_conquista) return 1;
          }
          
          // Se ambas bloqueadas ou sem data, ordenar alfabeticamente
          return (a.titulo || '').localeCompare(b.titulo || '');
        } else {
          // Bloqueadas primeiro
          if (!a.desbloqueado && b.desbloqueado) return -1;
          if (a.desbloqueado && !b.desbloqueado) return 1;
          
          // Se ambas desbloqueadas, ordenar por data (mais recente primeiro)
          if (a.desbloqueado && b.desbloqueado) {
            if (a.data_conquista && b.data_conquista) {
              return new Date(b.data_conquista) - new Date(a.data_conquista);
            }
            if (a.data_conquista && !b.data_conquista) return -1;
            if (!a.data_conquista && b.data_conquista) return 1;
          }
          
          // Se ambas bloqueadas ou sem data, ordenar alfabeticamente
          return (a.titulo || '').localeCompare(b.titulo || '');
        }
      });
      
      this.filteredAchievements = achievements;
      
      // Renderizar cards
      const container = document.getElementById('achievements-list');
      if (!container) return;
      
      container.innerHTML = '';
      
      const endIndex = Math.min(this.currentAchievementPage * this.achievementsPerPage, achievements.length);
      const achievementsToShow = achievements.slice(0, endIndex);
      
      achievementsToShow.forEach(achievement => {
        const card = this.createAchievementCard(achievement);
        container.appendChild(card);
      });
      
      this.updatePaginationControls();
    },
    
    createAchievementCard(achievement) {
      const card = document.createElement('div');
      const isUnlocked = achievement.desbloqueado;
      const isGridMode = this.viewMode === 'grid';
      
      card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'} ${isGridMode ? 'grid-mode' : 'list-mode'}`;
      
      if (isGridMode) {
        // Modo grid - circular
        card.innerHTML = `
          <div class="grid-image-container">
            <img src="${achievement.imagem_url || 'https://via.placeholder.com/200x200?text=Conquista'}" 
                 alt="${achievement.titulo}"
                 onerror="this.src='data:image/svg+xml,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 100 100&quot;><rect width=&quot;100&quot; height=&quot;100&quot; fill=&quot;%23333&quot;/></svg>'">
            ${!isUnlocked ? '<span class="image-lock-overlay"><i class="bi bi-lock"></i></span>' : ''}
          </div>
          <div class="content">
            <h4>${achievement.titulo || 'Conquista'}</h4>
          </div>
        `;
      } else {
        // Modo lista
        let unlockedDateHTML = '';
        if (isUnlocked && achievement.data_conquista) {
          // Corrige o problema de D-1 ao exibir datas
          const dateParts = achievement.data_conquista.split('-');
          let date;
          if (dateParts.length === 3 && achievement.data_conquista.length === 10) {
            date = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
          } else {
            date = new Date(achievement.data_conquista);
          }
          const formattedDate = date.toLocaleDateString('pt-BR');
          unlockedDateHTML = `<div class="unlocked-date">CONQUISTA DESBLOQUEADA EM <span style="color: rgb(119, 0, 255);">${formattedDate}</span></div>`;
        }
        
        // Botões de evidência
        let evidenceButtonsHTML = '';
        if (isUnlocked) {
          const evidence = achievement.evidence || (achievement.evidencias_urls && achievement.evidencias_urls.length > 0 ? achievement.evidencias_urls[0] : null);
          const evidenceFile = achievement.evidence_file || achievement.evidenceFile;
          
          if (evidence || evidenceFile) {
            evidenceButtonsHTML = '<div class="evidence-buttons">';
            if (evidence) {
              evidenceButtonsHTML += `
                <button class="evidence-btn" onclick="event.stopPropagation(); window.open('${evidence}', '_blank')">
                  Ver link <i class="bi bi-link-45deg"></i>
                </button>
              `;
            }
            if (evidenceFile) {
              evidenceButtonsHTML += `
                <button class="evidence-btn" onclick="event.stopPropagation(); window.open('${evidenceFile}', '_blank')">
                  Ver arquivo <i class="bi bi-file-earmark-arrow-down"></i>
                </button>
              `;
            }
            evidenceButtonsHTML += '</div>';
          }
        }
        
        // Modo lista
        const imageContainer = document.createElement('div');
        imageContainer.className = 'list-image-container';
        imageContainer.style.position = 'relative';
        imageContainer.setAttribute('data-title', achievement.titulo || 'Conquista');
        
        const img = document.createElement('img');
        img.src = achievement.imagem_url || 'https://via.placeholder.com/200x200?text=Conquista';
        img.alt = achievement.titulo;
        img.onerror = function() {
          this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23333"/></svg>';
        };
        imageContainer.appendChild(img);
        
        if (!isUnlocked) {
          const lockOverlay = document.createElement('span');
          lockOverlay.className = 'image-lock-overlay';
          lockOverlay.innerHTML = '<i class="bi bi-lock"></i>';
          imageContainer.appendChild(lockOverlay);
        }
        
        card.appendChild(imageContainer);
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'content';
        contentDiv.innerHTML = `
          <h4>${achievement.titulo || 'Conquista'}</h4>
          <div class="description">${achievement.descricao || ''}</div>
          ${unlockedDateHTML}
          ${evidenceButtonsHTML}
        `;
        card.appendChild(contentDiv);
        
        const statusBadge = document.createElement('div');
        statusBadge.className = `status-badge ${isUnlocked ? 'unlocked' : 'locked'}`;
        statusBadge.innerHTML = `<i class="bi bi-${isUnlocked ? 'unlock' : 'lock'}"></i>`;
        card.appendChild(statusBadge);
      }
      
      card.addEventListener('click', () => {
        this.openAchievementDetails(achievement);
      });
      
      return card;
    },
    
    openAchievementDetails(achievement) {
      this.selectedAchievement = achievement;
      const isMobile = window.innerWidth <= 768;
      const container = isMobile ? 
        document.getElementById('skill-modal') : 
        document.getElementById('skill-drawer');
      
      const content = isMobile ? 
        container.querySelector('.modal-body') : 
        container.querySelector('.drawer-content');
      
      if (!content) return;
      
      content.innerHTML = this.generateAchievementDetailsHTML(achievement);
      
      if (isMobile) {
        document.getElementById('overlay').classList.add('active');
        container.classList.add('open');
        document.body.classList.add('modal-open');
      } else {
        container.classList.add('open');
      }
    },
    
    generateAchievementDetailsHTML(achievement) {
      const isUnlocked = achievement.desbloqueado;
      
      let statusHTML = '';
      if (isUnlocked) {
        if (achievement.data_conquista) {
          // Corrige o problema de D-1 ao exibir datas (força timezone local)
          const dateParts = achievement.data_conquista.split('-');
          let date;
          if (dateParts.length === 3 && achievement.data_conquista.length === 10) {
            // Se for apenas data (YYYY-MM-DD), cria como local
            date = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
          } else {
            // Se vier com hora/timezone, deixa o JS interpretar
            date = new Date(achievement.data_conquista);
          }
          const formattedDate = date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          statusHTML = `
            <div class="achievement-status unlocked">
              <i class="bi bi-unlock"></i>
              DESBLOQUEADA EM <span style="color:rgb(119, 0, 255);">${formattedDate}</span>
            </div>
          `;
        } else {
          statusHTML = `
            <div class="achievement-status unlocked">
              <i class="bi bi-unlock"></i>
              CONQUISTA DESBLOQUEADA
            </div>
          `;
        }
      } else {
        statusHTML = `
          <div class="achievement-status locked">
            <i class="bi bi-lock"></i>
            CONQUISTA BLOQUEADA
          </div>
        `;
      }
      
      // Evidências
      let evidenceHTML = '';
      if (isUnlocked) {
        // Verificar evidence (URL) e evidenceFile (arquivo)
        const evidence = achievement.evidence || (achievement.evidencias_urls && achievement.evidencias_urls.length > 0 ? achievement.evidencias_urls[0] : null);
        const evidenceFile = achievement.evidence_file || achievement.evidenceFile;
        
        if (evidence || evidenceFile) {
          evidenceHTML = '<div class="achievement-evidence">';
          if (evidence) {
            evidenceHTML += `
              <a href="${evidence}" target="_blank" class="evidence-btn me-2">
                <i class="bi bi-link-45deg"></i>
                Ver Link
              </a>
            `;
          }
          if (evidenceFile) {
            evidenceHTML += `
              <a href="${evidenceFile}" target="_blank" class="evidence-btn">
                <i class="bi bi-file-earmark-arrow-down"></i>
                Ver Arquivo
              </a>
            `;
          }
          evidenceHTML += '</div>';
        }
      }
      
      return `
        <div class="achievement-details">
          <div class="achievement-header">
            <div class="achievement-image">
              <img src="${achievement.imagem_url || 'https://via.placeholder.com/400x300'}" 
                   alt="${achievement.titulo}"
                   ${!isUnlocked ? 'style="filter: grayscale(100%); opacity: 0.6;"' : ''}>
            </div>
            <h3>${achievement.titulo || 'Conquista'}</h3>
            ${statusHTML}
          </div>
          <div class="achievement-description">
            ${achievement.descricao || 'Sem descrição'}
          </div>
          ${evidenceHTML}
        </div>
      `;
    },
    
    closeDetails() {
      const drawer = document.getElementById('skill-drawer');
      const modal = document.getElementById('skill-modal');
      const overlay = document.getElementById('overlay');
      
      if (drawer) drawer.classList.remove('open');
      if (modal) modal.classList.remove('open');
      if (overlay) overlay.classList.remove('active');
      
      document.body.classList.remove('modal-open');
      this.selectedSkill = null;
      this.selectedAchievement = null;
    },
    
    loadMoreAchievements() {
      this.currentAchievementPage++;
      this.renderAchievements();
    },
    
    updatePaginationControls() {
      // Atualiza valores para uso no template
      this._showingCount = Math.min(
        this.currentAchievementPage * this.achievementsPerPage,
        this.filteredAchievements.length
      );
      this._totalAchievements = this.filteredAchievements.length;
      this._hasMoreAchievements = this._showingCount < this.filteredAchievements.length;
    },
    
    get showingCount() {
      return this._showingCount || 0;
    },
    
    get totalAchievements() {
      return this._totalAchievements || 0;
    },
    
    get hasMoreAchievements() {
      return this._hasMoreAchievements || false;
    }
  };
}

// Registrar globalmente para o Alpine.js
window.competenciasPage = competenciasPage;
