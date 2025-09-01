// ===== GERENCIADOR DA ÁRVORE DE HABILIDADES =====
class SkillTree {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentCategory = 'all';
        this.expandedNodes = new Set();
        this.selectedNode = null;
    }

    // Renderiza a árvore completa
    async render(categoryId = 'all') {
        if (!window.dataService.loaded) {
            this.showLoading();
            return;
        }

        this.currentCategory = categoryId;
        this.container.innerHTML = '';

        const rootSkills = window.dataService.getRootSkills(categoryId);
        
        if (rootSkills.length === 0) {
            this.showEmpty();
            return;
        }

        const treeWrapper = document.createElement('div');
        treeWrapper.className = 'tree-wrapper';
        treeWrapper.style.display = 'flex';
        treeWrapper.style.flexDirection = 'row';
        treeWrapper.style.justifyContent = 'center';
        treeWrapper.style.gap = '60px';
        treeWrapper.style.flexWrap = 'wrap';

        // Renderiza cada skill raiz e seus filhos
        rootSkills.forEach(skill => {
            const nodeElement = this.createNode(skill);
            treeWrapper.appendChild(nodeElement);
        });

        this.container.appendChild(treeWrapper);
        this.attachEventListeners();
    }

    // Cria um nó da árvore
    createNode(skill, level = 0) {
        const isUnlocked = window.dataService.isSkillUnlocked(skill.id);
        const hasChildren = skill.children && skill.children.length > 0;
        const isExpanded = this.expandedNodes.has(skill.id);

        // Container principal do nó
        const nodeContainer = document.createElement('div');
        nodeContainer.className = 'tree-branch';
        nodeContainer.setAttribute('data-skill-id', skill.id);

        // Nó principal
        const node = document.createElement('div');
        node.className = `tree-node ${isUnlocked ? 'unlocked' : 'locked'}`;
        node.setAttribute('data-category', skill.category || 'default');
        node.setAttribute('data-tooltip', `Domínio: ${skill.domain || 0}/5`);

        // Conteúdo do nó
        const nodeContent = document.createElement('div');
        nodeContent.className = 'node-content';

        // Ícone
        const icon = document.createElement('i');
        icon.className = `${skill.icon || 'bi-star'} node-icon`;
        nodeContent.appendChild(icon);

        // Título
        const title = document.createElement('div');
        title.className = 'node-title';
        title.textContent = skill.title;
        nodeContent.appendChild(title);

        // Domínio
        const domain = document.createElement('div');
        domain.className = 'node-domain';
        domain.textContent = `${skill.domain || 0}/5`;
        nodeContent.appendChild(domain);

        node.appendChild(nodeContent);

        // Ícone de cadeado para nós bloqueados
        if (!isUnlocked) {
            const lockIcon = document.createElement('div');
            lockIcon.className = 'lock-icon';
            lockIcon.innerHTML = '<i class="bi bi-lock"></i>';
            node.appendChild(lockIcon);
        }

        // Botão de expansão se tiver filhos
        if (hasChildren) {
            const expandBtn = document.createElement('button');
            expandBtn.className = `expand-btn ${isExpanded ? 'expanded' : ''}`;
            // Usar texto simples em vez de ícones para melhor controle
            expandBtn.innerHTML = `<span style="line-height: 1; font-family: monospace;">${isExpanded ? '−' : '+'}</span>`;
            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNode(skill.id);
            });
            node.appendChild(expandBtn);
        }

        nodeContainer.appendChild(node);

        // Container para filhos
        if (hasChildren) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = `children-container ${isExpanded ? 'expanded' : ''}`;
            
            if (isExpanded) {
                skill.children.forEach(childId => {
                    const childSkill = window.dataService.getSkillById(childId);
                    if (childSkill) {
                        const childNode = this.createNode(childSkill, level + 1);
                        childrenContainer.appendChild(childNode);
                    }
                });
            }

            nodeContainer.appendChild(childrenContainer);
        }

        // Event listener para clique no nó
        node.addEventListener('click', () => {
            this.selectNode(skill.id);
        });

        return nodeContainer;
    }

    // Alterna expansão de um nó
    toggleNode(skillId) {
        const skill = window.dataService.getSkillById(skillId);
        if (!skill || !skill.children || skill.children.length === 0) return;

        const nodeElement = this.container.querySelector(`[data-skill-id="${skillId}"]`);
        if (!nodeElement) return;

        const childrenContainer = nodeElement.querySelector('.children-container');
        const expandBtn = nodeElement.querySelector('.expand-btn');
        const expandContent = expandBtn.querySelector('span');

        if (this.expandedNodes.has(skillId)) {
            // Fechar nó - volta para verde com "+"
            this.expandedNodes.delete(skillId);
            childrenContainer.classList.remove('expanded');
            expandBtn.classList.remove('expanded');
            expandContent.textContent = '+';
            
            // Limpar filhos do DOM
            setTimeout(() => {
                if (!this.expandedNodes.has(skillId)) {
                    childrenContainer.innerHTML = '';
                }
            }, 300);
        } else {
            // Abrir nó - muda para vermelho com "−"
            this.expandedNodes.add(skillId);
            childrenContainer.classList.add('expanded');
            expandBtn.classList.add('expanded');
            expandContent.textContent = '−';

            // Adicionar filhos ao DOM
            skill.children.forEach(childId => {
                const childSkill = window.dataService.getSkillById(childId);
                if (childSkill) {
                    const childNode = this.createNode(childSkill, 1);
                    childrenContainer.appendChild(childNode);
                }
            });

            // Reattach event listeners nos novos nós
            this.attachEventListeners();
        }
    }

    // Seleciona um nó e mostra detalhes
    selectNode(skillId) {
        const skill = window.dataService.getSkillById(skillId);
        if (!skill) return;

        this.selectedNode = skillId;
        
        // Remove seleção anterior
        this.container.querySelectorAll('.tree-node.selected').forEach(node => {
            node.classList.remove('selected');
        });

        // Adiciona seleção atual
        const nodeElement = this.container.querySelector(`[data-skill-id="${skillId}"] .tree-node`);
        if (nodeElement) {
            nodeElement.classList.add('selected');
        }

        // Mostra detalhes
        this.showSkillDetails(skill);
    }

    // Mostra detalhes da habilidade
    showSkillDetails(skill) {
        const isMobile = window.innerWidth <= 768;
        const container = isMobile ? 
            document.getElementById('skill-modal') : 
            document.getElementById('skill-drawer');
        
        const content = isMobile ? 
            container.querySelector('.modal-body') : 
            container.querySelector('.drawer-content');

        content.innerHTML = this.generateSkillDetailsHTML(skill);

        // Mostra o container
        if (isMobile) {
            document.getElementById('overlay').classList.add('active');
            container.classList.add('open');
        } else {
            container.classList.add('open');
        }
    }

    // Gera HTML dos detalhes da habilidade
    generateSkillDetailsHTML(skill) {
        const relatedAchievements = window.dataService.getRelatedAchievements(skill.id);
        const isUnlocked = window.dataService.isSkillUnlocked(skill.id);

        let html = `
            <div class="skill-details">
                <div class="skill-header">
                    <i class="${skill.icon || 'bi-star'}"></i>
                    <h3>${skill.title}</h3>
                    <div class="domain">Domínio: ${skill.domain || 0}/5</div>
                </div>
        `;

        if (skill.description) {
            html += `<div class="skill-description">${skill.description}</div>`;
        }

        if (skill.scores) {
            html += `
                <div class="skill-metrics">
                    <h4>PONTUAÇÕES</h4>
            `;

            const scoreLabels = {
                theoretical: 'Fundamentos Teóricos',
                technical: 'Fundamentos Técnicos',
                problem_solving: 'Resolução de Problemas',
                knowledge_transfer: 'Transferência de Conhecimento',
                trends: 'Tendências e Inovação'
            };

            Object.entries(skill.scores).forEach(([key, value]) => {
                const stars = '★'.repeat(value) + '☆'.repeat(5 - value);
                html += `
                    <div class="metric">
                        <span>${scoreLabels[key] || key}</span>
                        <div class="stars">${stars}</div>
                    </div>
                `;
            });

            html += `</div>`;
        }

        if (relatedAchievements.length > 0) {
            html += `
                <div class="related-achievements">
                    <h4>CONQUISTAS RELACIONADAS</h4>
            `;

            relatedAchievements.forEach(achievement => {
                const achievementUnlocked = achievement.status === 'unlocked';
                html += `
                    <div class="mini-achievement ${achievementUnlocked ? 'unlocked' : 'locked'}">
                        <img src="${achievement.image || 'assets/default-achievement.png'}" alt="${achievement.title}">
                        <div class="info">
                            <div class="title">${achievement.title}</div>
                            <div class="status">${achievementUnlocked ? 'Desbloqueado' : 'Bloqueado'}</div>
                        </div>
                        ${achievementUnlocked && achievement.evidence ? 
                            `<button class="evidence-btn" onclick="window.open('${achievement.evidence}', '_blank')">
                                Ver <i class="bi bi-box-arrow-up-right"></i>
                            </button>` : ''
                        }
                    </div>
                `;
            });

            html += `</div>`;
        }

        html += `</div>`;
        return html;
    }

    // Anexa event listeners
    attachEventListeners() {
        // Event listeners já são anexados durante a criação dos nós
        // Este método pode ser usado para listeners globais se necessário
    }

    // Mostra estado de carregamento
    showLoading() {
        this.container.innerHTML = `
            <div class="tree-loading">
                Carregando árvore de habilidades...
            </div>
        `;
    }

    // Mostra estado vazio
    showEmpty() {
        this.container.innerHTML = `
            <div class="tree-empty">
                <i class="bi bi-exclamation-triangle" style="font-size: 3rem; opacity: 0.5;"></i>
                <p>Nenhuma habilidade encontrada para esta categoria.</p>
            </div>
        `;
    }

    // Fecha detalhes
    closeDetails() {
        document.getElementById('skill-drawer').classList.remove('open');
        document.getElementById('skill-modal').classList.remove('open');
        document.getElementById('overlay').classList.remove('active');
        
        // Remove seleção
        this.container.querySelectorAll('.tree-node.selected').forEach(node => {
            node.classList.remove('selected');
        });
        
        this.selectedNode = null;
    }

    // Atualiza a árvore quando os dados mudam
    update() {
        this.render(this.currentCategory);
    }

    // Destaca um caminho na árvore (útil para navegação)
    highlightPath(skillId) {
        // Remove destaques anteriores
        this.container.querySelectorAll('.tree-node.highlighted').forEach(node => {
            node.classList.remove('highlighted');
        });

        // Encontra o caminho até a raiz
        const path = this.getPathToRoot(skillId);
        
        // Destaca cada nó no caminho
        path.forEach(nodeId => {
            const nodeElement = this.container.querySelector(`[data-skill-id="${nodeId}"] .tree-node`);
            if (nodeElement) {
                nodeElement.classList.add('highlighted');
            }
        });
    }

    // Obtém o caminho de um nó até a raiz
    getPathToRoot(skillId) {
        const path = [];
        let currentId = skillId;

        while (currentId) {
            path.unshift(currentId);
            const skill = window.dataService.getSkillById(currentId);
            currentId = skill ? skill.parent : null;
        }

        return path;
    }

    // Expande automaticamente um caminho
    expandPath(skillId) {
        const path = this.getPathToRoot(skillId);
        
        // Expande cada nó no caminho (exceto o último)
        path.slice(0, -1).forEach(nodeId => {
            if (!this.expandedNodes.has(nodeId)) {
                this.toggleNode(nodeId);
            }
        });
    }
}

// Instância global da árvore
window.skillTree = null;
