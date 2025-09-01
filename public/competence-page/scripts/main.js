// ===== APLICAÇÃO PRINCIPAL =====
class SkillMappingApp {
    constructor() {
        this.currentCategory = 'all';
        this.currentAchievementFilter = 'all';
        this.currentViewMode = 'list';
        this.currentSortOrder = 'unlocked-first'; // 'unlocked-first' ou 'locked-first'
        this.achievementsPerPage = 10;
        this.currentAchievementPage = 1;
        this.filteredAchievements = [];
        this.init();
    }

    async init() {
        console.log('Inicializando aplicação...');

        // Mostra loading inicial
        this.showGlobalLoading();

        // Carrega dados
        const dataLoaded = await window.dataService.loadData();

        if (!dataLoaded) {
            console.log('Erro ao carregar dados, usando dados de exemplo...');
            window.dataService.loadExampleData();
        }

        // Inicializa componentes
        this.initializeComponents();
        this.setupEventListeners();
        this.updateUI();

        // Remove loading
        this.hideGlobalLoading();

        console.log('Aplicação inicializada com sucesso');

        // Configurar atualização periódica das métricas (a cada 30 segundos)
        this.setupPeriodicUpdates();
    }

    setupPeriodicUpdates() {
        // Atualizar métricas periodicamente para manter sincronização
        setInterval(() => {
            this.updateSummaryCards();
        }, 30000); // 30 segundos

        // Atualizar quando a janela ganha foco (usuário volta para a aba)
        window.addEventListener('focus', () => {
            this.updateSummaryCards();
        });
    }

    // Método público para forçar atualização das métricas
    refreshMetrics() {
        this.updateSummaryCards();
        console.log('Métricas atualizadas manualmente');
    }

    initializeComponents() {
        // Inicializa a árvore de habilidades
        window.skillTree = new SkillTree('skill-tree');

        // Renderiza a árvore inicial
        window.skillTree.render(this.currentCategory);
    }

    setupEventListeners() {
        // Filtros de categoria
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.getAttribute('data-category');
                this.changeCategory(category);
            });
        });

        // Filtros de status de conquistas
        document.querySelectorAll('.status-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Garante que o clique no ícone também funcione
                let target = e.target;
                // Se clicou no <i>, sobe para o botão
                if (target.tagName === 'I' && target.closest('.status-filter-btn')) {
                    target = target.closest('.status-filter-btn');
                }
                const status = target.getAttribute('data-status');
                if (status) {
                    this.changeAchievementFilter(status);
                }
            });
        });

        // Toggle de visualização (lista/grade)
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.getAttribute('data-view');
                this.changeViewMode(view);
            });
        });

        // Toggle de ordenação
        document.getElementById('sort-btn').addEventListener('click', () => {
            this.toggleSortOrder();
        });

        // Botão "Ver Mais" para paginação
        document.getElementById('load-more-btn').addEventListener('click', () => {
            this.loadMoreAchievements();
        });

        // Botões de fechar drawer/modal
        document.getElementById('close-drawer').addEventListener('click', () => {
            this.closeAchievementDetails();
        });

        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeAchievementDetails();
        });

        // Overlay para fechar modal
        document.getElementById('overlay').addEventListener('click', () => {
            this.closeAchievementDetails();
        });

        // Responsividade
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Navegação por teclado
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });

        // Event listeners para evidências
        this.setupAchievementListeners();
    }

    // Função principal para abrir detalhes das conquistas
    openAchievementDetails(achievementId) {
        const achievement = window.dataService.achievements.find(a => a.id === achievementId);
        if (!achievement) return;

        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            // Mobile: usar modal compartilhado
            this.showAchievementModal(achievement);
        } else {
            // Desktop: usar drawer compartilhado
            this.showAchievementDrawer(achievement);
        }
    }

    showAchievementDrawer(achievement) {
        const container = document.getElementById('skill-drawer');
        const content = container.querySelector('.drawer-content');

        content.innerHTML = this.generateAchievementDetailsHTML(achievement);
        container.classList.add('open');
    }

    showAchievementModal(achievement) {
        const container = document.getElementById('skill-modal');
        const content = container.querySelector('.modal-body');

        content.innerHTML = this.generateAchievementDetailsHTML(achievement);
        container.classList.add('open');

        // Prevenir scroll do body no mobile
        if (window.innerWidth <= 768) {
            document.body.classList.add('modal-open');
        }
    }

    closeAchievementDetails() {
        // Fechar drawer e modal
        const drawer = document.getElementById('skill-drawer');
        const modal = document.getElementById('skill-modal');

        if (drawer) drawer.classList.remove('open');
        if (modal) modal.classList.remove('open');

        // Restaurar scroll do body
        document.body.classList.remove('modal-open');

        // Também chamar o método da árvore se existir
        if (window.skillTree && window.skillTree.closeDetails) {
            window.skillTree.closeDetails();
        }
    }

    generateAchievementDetailsHTML(achievement) {
        const isUnlocked = achievement.status === 'unlocked';

        let subcategoriesHTML = '';
        if (achievement.subcategories) {
            subcategoriesHTML = Object.entries(achievement.subcategories)
                .map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`)
                .join('');
        }

        // Status combinado com data
        let statusHTML = '';
        if (isUnlocked) {
            if (achievement.unlockedDate) {
                // Corrige o problema de D-1 ao exibir datas (força timezone local)
                const dateParts = achievement.unlockedDate.split('-');
                let date;
                if (dateParts.length === 3 && achievement.unlockedDate.length === 10) {
                    // Se for apenas data (YYYY-MM-DD), cria como local
                    date = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
                } else {
                    // Se vier com hora/timezone, deixa o JS interpretar
                    date = new Date(achievement.unlockedDate);
                }
                const formattedDate = date.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                statusHTML = `
                    <div class="achievement-status unlocked">
                        <i class="bi bi-unlock"></i>
                        DESBLOQUEADA EM <span style=" color: #0FD;">${formattedDate}</span>
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

        return `
            <div class="achievement-details">
                <div class="achievement-header">
                    <div class="achievement-image">
                        <img src="${achievement.image || 'assets/default-achievement.png'}" alt="${achievement.title}" 
                             onerror="this.src='data:image/svg+xml,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 100 100&quot;><rect width=&quot;100&quot; height=&quot;100&quot; fill=&quot;%23333&quot;/></svg>'"
                             ${!isUnlocked ? 'style="filter: grayscale(100%); opacity: 0.6;"' : ''}>
                    </div>
                    
                    <h3>${achievement.title}</h3>
                    
                    ${statusHTML}
                </div>
                
                <div class="achievement-description">
                    ${subcategoriesHTML || achievement.description || ''}
                </div>
                
                ${isUnlocked && (achievement.evidence || achievement.evidenceFile) ?
                `<div class="achievement-evidence">
                        ${achievement.evidence ? `
                            <a href="${achievement.evidence}" target="_blank" class="evidence-btn me-2">
                                <i class="bi bi-link-45deg"></i>
                                Ver Link
                            </a>
                        ` : ''}
                        ${achievement.evidenceFile ? `
                            <a href="${achievement.evidenceFile}" target="_blank" class="evidence-btn">
                                <i class="bi bi-file-earmark-arrow-down"></i>
                                Ver Arquivo
                            </a>
                        ` : ''}
                    </div>` : ''
            }
            </div>
        `;
    }

    changeCategory(category) {
        // Atualiza categoria atual
        this.currentCategory = category;

        // Atualiza botões de filtro
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        // Atualiza árvore
        window.skillTree.render(category);

        // Atualiza estatísticas se necessário
        this.updateSummaryCards();
    }

    changeAchievementFilter(status) {
        // Atualiza filtro atual
        this.currentAchievementFilter = status;

        // Atualiza botões de filtro
        document.querySelectorAll('.status-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-status="${status}"]`).classList.add('active');

        // Re-renderiza conquistas (resetará paginação)
        this.renderAchievements();

        // Atualiza métricas para refletir mudanças no filtro
        this.updateSummaryCards();
    }

    changeViewMode(view) {
        // Atualiza modo de visualização atual
        this.currentViewMode = view;

        // Atualiza botões de visualização
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // Atualiza classe do container
        const achievementsList = document.getElementById('achievements-list');
        if (view === 'grid') {
            achievementsList.classList.add('grid-view');
        } else {
            achievementsList.classList.remove('grid-view');
        }

        // Re-renderiza TODAS as conquistas para aplicar o novo formato de estrutura HTML
        this.renderAchievements();
    }

    toggleSortOrder() {
        // Alterna entre ordenações
        this.currentSortOrder = this.currentSortOrder === 'unlocked-first' ? 'locked-first' : 'unlocked-first';

        // Atualiza visual do botão
        const sortBtn = document.getElementById('sort-btn');
        const sortIcon = sortBtn.querySelector('i');
        const sortText = sortBtn.querySelector('.sort-text');

        if (this.currentSortOrder === 'locked-first') {
            sortBtn.classList.add('locked-first');
            sortBtn.setAttribute('data-sort', 'locked-first');
            sortBtn.setAttribute('title', 'Ordenação: Bloqueadas primeiro');
            sortIcon.className = 'bi bi-sort-up';
            if (sortText) sortText.textContent = 'Bloqueadas primeiro';
        } else {
            sortBtn.classList.remove('locked-first');
            sortBtn.setAttribute('data-sort', 'unlocked-first');
            sortBtn.setAttribute('title', 'Ordenação: Desbloqueadas primeiro');
            sortIcon.className = 'bi bi-sort-down';
            if (sortText) sortText.textContent = 'Desbloqueadas primeiro';
        }

        // Re-renderiza conquistas com nova ordenação (resetará paginação)
        this.renderAchievements();
    }

    updateUI() {
        this.updateSummaryCards();
        this.renderAchievements();

        // Aplica modo de visualização inicial (que já re-renderiza as conquistas no formato correto)
        // this.changeViewMode(this.currentViewMode);

        // Apenas atualiza a classe CSS e botões sem re-renderizar
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${this.currentViewMode}"]`)?.classList.add('active');

        const achievementsList = document.getElementById('achievements-list');
        if (this.currentViewMode === 'grid') {
            achievementsList.classList.add('grid-view');
        } else {
            achievementsList.classList.remove('grid-view');
        }
    }

    updateSummaryCards() {
        // Estatísticas de habilidades
        const skillStats = window.dataService.getSkillStats();
        const avgDomainElement = document.getElementById('avg-domain');
        if (avgDomainElement) {
            avgDomainElement.textContent = `${skillStats.avgDomain}%`;
        }

        // Estatísticas de conquistas

        const achievementStats = window.dataService.getAchievementStats();
        const unlockedCountElement = document.getElementById('unlocked-count');
        const lockedCountElement = document.getElementById('locked-count');
        const total = achievementStats.unlocked + achievementStats.locked;

        if (unlockedCountElement) {
            unlockedCountElement.textContent = `${achievementStats.unlocked} / ${total}`;
        }
        if (lockedCountElement) {
            lockedCountElement.textContent = achievementStats.locked.toString().padStart(2, '0');
        }

        // Atualizar progresso de conquistas se existe um elemento para isso
        const achievementProgressElement = document.getElementById('achievement-progress');
        if (achievementProgressElement) {
            achievementProgressElement.style.width = `${achievementStats.progress}%`;
        }

        // Atualizar texto de progresso se existir
        const achievementProgressTextElement = document.getElementById('achievement-progress-text');
        if (achievementProgressTextElement) {
            achievementProgressTextElement.textContent = `${achievementStats.progress}% Concluído`;
        }

        // Top skill
        const topSkill = window.dataService.getTopSkill();
        const topSkillNameElement = document.getElementById('top-skill-name');
        const topSkillDomainElement = document.getElementById('top-skill-domain');

        if (topSkillNameElement) {
            topSkillNameElement.textContent = topSkill.name;
        }
        if (topSkillDomainElement) {
            topSkillDomainElement.textContent = `${topSkill.progress}%`;
        }

        // Log para debug
        console.log('Métricas atualizadas:', {
            skillStats,
            achievementStats,
            topSkill
        });
    }

    renderAchievements() {
        const container = document.getElementById('achievements-list');
        let achievements = [...window.dataService.achievements]; // Cópia para não modificar o original

        // Aplica filtro de status
        if (this.currentAchievementFilter !== 'all') {
            if (this.currentAchievementFilter === 'unlocked') {
                achievements = achievements.filter(a => a.status === 'unlocked');
            } else if (this.currentAchievementFilter === 'locked') {
                achievements = achievements.filter(a => a.status === 'locked');
            }
        }

        // Aplica ordenação
        achievements.sort((a, b) => {
            if (this.currentSortOrder === 'unlocked-first') {
                // Desbloqueadas primeiro
                if (a.status === 'unlocked' && b.status === 'locked') return -1;
                if (a.status === 'locked' && b.status === 'unlocked') return 1;
                return a.title.localeCompare(b.title); // Alfabética como critério secundário
            } else {
                // Bloqueadas primeiro
                if (a.status === 'locked' && b.status === 'unlocked') return -1;
                if (a.status === 'unlocked' && b.status === 'locked') return 1;
                return a.title.localeCompare(b.title); // Alfabética como critério secundário
            }
        });

        // Armazena as conquistas filtradas
        this.filteredAchievements = achievements;

        // Reset da paginação quando muda filtro
        this.currentAchievementPage = 1;

        // Renderiza apenas a primeira página
        this.renderAchievementPage();
    }

    renderAchievementPage() {
        const container = document.getElementById('achievements-list');
        const startIndex = 0; // Sempre do início
        const endIndex = this.currentAchievementPage * this.achievementsPerPage;
        const achievementsToShow = this.filteredAchievements.slice(startIndex, endIndex);

        // Limpa container apenas na primeira página
        if (this.currentAchievementPage === 1) {
            container.innerHTML = '';
        }

        // Se não é a primeira página, adiciona apenas os novos itens
        if (this.currentAchievementPage > 1) {
            const newAchievements = this.filteredAchievements.slice(
                (this.currentAchievementPage - 1) * this.achievementsPerPage,
                endIndex
            );
            newAchievements.forEach(achievement => {
                const card = this.createAchievementCard(achievement);
                container.appendChild(card);
            });
        } else {
            // Primeira página - renderiza tudo
            achievementsToShow.forEach(achievement => {
                const card = this.createAchievementCard(achievement);
                container.appendChild(card);
            });
        }

        // Atualiza controles de paginação
        this.updatePaginationControls();
    }

    loadMoreAchievements() {
        this.currentAchievementPage++;
        this.renderAchievementPage();
    }

    updatePaginationControls() {
        const showingCount = Math.min(
            this.currentAchievementPage * this.achievementsPerPage,
            this.filteredAchievements.length
        );
        const totalCount = this.filteredAchievements.length;
        const hasMore = showingCount < totalCount;

        // Atualiza contador
        this.updateShowingCount(showingCount, totalCount);

        // Mostra/esconde botão "Ver Mais"
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (hasMore) {
            loadMoreBtn.style.display = 'block';
            loadMoreBtn.querySelector('span') && (loadMoreBtn.querySelector('span').textContent = `Ver Mais ${Math.min(this.achievementsPerPage, totalCount - showingCount)} Conquistas`);
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }

    updateShowingCount(showing, total) {
        const showingCountElement = document.getElementById('showing-count');
        if (showingCountElement) {
            showingCountElement.textContent = `Mostrando ${showing} de ${total} conquistas`;
        }
    }

    createAchievementCard(achievement) {
        const isUnlocked = achievement.status === 'unlocked';
        const isGridMode = this.currentViewMode === 'grid';

        const card = document.createElement('div');
        card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'} ${isGridMode ? 'grid-mode' : 'list-mode'}`;

        let subcategoriesHTML = '';
        if (achievement.subcategories) {
            subcategoriesHTML = Object.entries(achievement.subcategories)
                .map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`)
                .join('');
        }

        if (isGridMode) {
            // Modo grid: formato circular
            card.innerHTML = `
                <div class="grid-image-container" style="position:relative;">
                    <img src="${achievement.image || 'assets/default-achievement.png'}" alt="${achievement.title}"
                        onerror="this.src='data:image/svg+xml,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 100 100&quot;><rect width=&quot;100&quot; height=&quot;100&quot; fill=&quot;%23333&quot;/></svg>'">
                    ${!isUnlocked ? '<span class="image-lock-overlay"><i class="bi bi-lock"></i></span>' : ''}
                </div>
                <div class="content">
                    <h4>${achievement.title}</h4>
                </div>
            `;
        } else {
            // Modo lista: layout original com containers corretos
            const imageContainer = `
                <div class="list-image-container" style="position:relative;">
                    <img src="${achievement.image || 'assets/default-achievement.png'}" alt="${achievement.title}"
                        onerror="this.src='data:image/svg+xml,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 100 100&quot;><rect width=&quot;100&quot; height=&quot;100&quot; fill=&quot;%23333&quot;/></svg>'">
                    ${!isUnlocked ? '<span class="image-lock-overlay"><i class="bi bi-lock"></i></span>' : ''}
                </div>
            `;

            // Formatar data de desbloqueio se existir
            let unlockedDateHTML = '';
            if (isUnlocked && achievement.unlockedDate) {
                const date = new Date(achievement.unlockedDate);
                const formattedDate = date.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                unlockedDateHTML = `<div class="unlocked-date">CONQUISTA DESBLOQUEADA EM <span style=" color: #0FD;">${formattedDate}</span></div>`;
            }

            card.innerHTML = `
                ${imageContainer}
                <div class="content">
                    <h4>${achievement.title}</h4>
                    <div class="description">
                        ${subcategoriesHTML || achievement.description || ''}
                    </div>
                    ${unlockedDateHTML}
                    ${isUnlocked && (achievement.evidence || achievement.evidenceFile) ?
                    `<div class="evidence-buttons">
                        ${achievement.evidence ? `
                            <button class="evidence-btn" onclick="window.open('${achievement.evidence}', '_blank')">
                                Ver link <i class="bi bi-link-45deg"></i>
                            </button>
                        ` : ''}
                        ${achievement.evidenceFile ? `
                            <button class="evidence-btn" onclick="window.open('${achievement.evidenceFile}', '_blank')">
                                Ver arquivo <i class="bi bi-file-earmark-arrow-down"></i>
                            </button>
                        ` : ''}
                    </div>` : ''
                }
                </div>
                <div class="status-badge ${isUnlocked ? 'unlocked' : 'locked'}">
                    <i class="bi bi-${isUnlocked ? 'unlock' : 'lock'}"></i>
                </div>
            `;
        }

        // Animação de entrada
        card.classList.add('fade-in');

        // Adiciona evento de clique para abrir drawer
        card.addEventListener('click', (e) => {
            // Só abre drawer se não clicou em um botão
            if (!e.target.closest('.evidence-btn')) {
                this.openAchievementDetails(achievement.id);
            }
        });

        return card;
    }

    setupAchievementListeners() {
        // Event delegation para botões de evidência
        document.addEventListener('click', (e) => {
            if (e.target.closest('.evidence-btn')) {
                const btn = e.target.closest('.evidence-btn');
                const url = btn.getAttribute('data-url') || btn.onclick;

                if (typeof url === 'string') {
                    window.open(url, '_blank');
                }
            }
        });
    }

    handleResize() {
        // Fecha drawer/modal se mudou para mobile/desktop
        const isMobile = window.innerWidth <= 768;
        const drawer = document.getElementById('skill-drawer');
        const modal = document.getElementById('skill-modal');

        if (isMobile && drawer && drawer.classList.contains('open')) {
            drawer.classList.remove('open');
            if (modal) modal.classList.add('open');
            document.body.classList.add('modal-open');
        } else if (!isMobile && modal && modal.classList.contains('open')) {
            modal.classList.remove('open');
            document.body.classList.remove('modal-open');
            if (drawer) drawer.classList.add('open');
        }

        // Fechar detalhes completamente ao redimensionar
        if (!isMobile) {
            document.body.classList.remove('modal-open');
        }

        // Recriar cards de conquistas para layout correto
        this.renderAchievements();
    }

    handleKeyboardNavigation(e) {
        // ESC para fechar detalhes
        if (e.key === 'Escape') {
            this.closeAchievementDetails();
        }

        // Números para filtros rápidos
        if (e.key >= '1' && e.key <= '4') {
            const categories = ['all', 'qa', 'dev', 'ux'];
            const index = parseInt(e.key) - 1;
            if (categories[index]) {
                this.changeCategory(categories[index]);
            }
        }
    }

    showGlobalLoading() {
        const loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(15, 23, 42, 0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                color: white;
                font-size: 1.2rem;
            ">
                <div style="text-align: center;">
                    <div style="
                        width: 50px;
                        height: 50px;
                        border: 4px solid #334155;
                        border-top: 4px solid #3498db;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 20px;
                    "></div>
                    Carregando sistema de competências...
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loader);
    }

    hideGlobalLoading() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 300);
        }
    }

    // Métodos utilitários
    simulateSkillProgress(skillId, newDomain) {
        const skill = window.dataService.getSkillById(skillId);
        if (skill) {
            skill.domain = newDomain;
            this.updateUI();
            window.skillTree.update();
        }
    }

    unlockAchievement(achievementId) {
        const achievement = window.dataService.getAchievementById(achievementId);
        if (achievement) {
            achievement.status = 'unlocked';
            this.updateUI();
        }
    }

    exportProgress() {
        const data = {
            skills: window.dataService.skills,
            achievements: window.dataService.achievements,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `competencias-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }

    // Busca por habilidades
    searchSkills(query) {
        if (!query.trim()) {
            window.skillTree.render(this.currentCategory);
            return;
        }

        const results = window.dataService.skills.filter(skill =>
            skill.title.toLowerCase().includes(query.toLowerCase()) ||
            skill.description.toLowerCase().includes(query.toLowerCase())
        );

        // Implementar visualização dos resultados da busca
        console.log('Resultados da busca:', results);
    }

    // Método para demonstração/debug
    showDebugInfo() {
        console.log('=== DEBUG INFO ===');
        console.log('Data Service:', window.dataService);
        console.log('Skill Tree:', window.skillTree);
        console.log('Current Category:', this.currentCategory);
        console.log('Skills:', window.dataService.skills);
        console.log('Achievements:', window.dataService.achievements);
    }
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.skillMappingApp = new SkillMappingApp();
});

// Funções globais para debug/demonstração
window.debugApp = () => window.skillMappingApp.showDebugInfo();
window.exportProgress = () => window.skillMappingApp.exportProgress();
window.simulateProgress = (skillId, domain) => window.skillMappingApp.simulateSkillProgress(skillId, domain);
window.unlockAchievement = (id) => window.skillMappingApp.unlockAchievement(id);
