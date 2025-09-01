// ===== SERVIÇO DE DADOS =====
class DataService {
    constructor() {
        this.skills = [];
        this.achievements = [];
        this.categories = [];
        this.loaded = false;
    }

    async loadData() {
        try {
            console.log('Carregando dados...');

            // Tentar carregar do servidor primeiro
            let skillsData, achievementsData;
            
            try {
                const [skillsResponse, achievementsResponse] = await Promise.all([
                    fetch('http://localhost:3001/api/skills'),
                    fetch('http://localhost:3001/api/achievements')
                ]);

                if (skillsResponse.ok && achievementsResponse.ok) {
                    skillsData = await skillsResponse.json();
                    achievementsData = await achievementsResponse.json();
                    console.log('Dados carregados do servidor');
                } else {
                    throw new Error('Servidor não disponível');
                }
            } catch (serverError) {
                console.log('Servidor não disponível, carregando dados estáticos...');
                // Fallback para arquivos estáticos
                const [skillsResponse, achievementsResponse] = await Promise.all([
                    fetch('data/skills.json'),
                    fetch('data/achievements.json')
                ]);

                if (!skillsResponse.ok || !achievementsResponse.ok) {
                    throw new Error('Erro ao carregar dados estáticos');
                }

                skillsData = await skillsResponse.json();
                achievementsData = await achievementsResponse.json();
                console.log('Dados carregados dos arquivos estáticos');
            }

            this.skills = skillsData.skills || [];
            this.categories = skillsData.categories || [];
            this.achievements = achievementsData || [];
            
            // Sincronizar arrays children após carregar dados
            this.syncChildrenArrays();
            
            this.loaded = true;

            console.log('Dados carregados:', {
                skills: this.skills.length,
                achievements: this.achievements.length,
                categories: this.categories.length
            });

            return true;
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            return false;
        }
    }

    // === GETTER METHODS ===
    getSkillById(id) {
        return this.skills.find(skill => skill.id === id);
    }

    getAchievementById(id) {
        return this.achievements.find(achievement => achievement.id === id);
    }

    getAllSkills() {
        return this.skills;
    }

    getAllAchievements() {
        return this.achievements;
    }

    getSkillsByCategory(category) {
        return this.skills.filter(skill => skill.category === category);
    }

    getAchievementsByCategory(category) {
        return this.achievements.filter(achievement => achievement.category === category);
    }

    // === SAVE DATA METHODS ===
    async saveSkills() {
        try {
            console.log('Salvando habilidades...');
            const response = await fetch('http://localhost:3001/api/skills', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    skills: this.skills,
                    categories: this.categories
                })
            });

            if (!response.ok) {
                throw new Error('Erro ao salvar habilidades');
            }

            console.log('Habilidades salvas com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao salvar habilidades:', error);
            // For demo purposes, save to localStorage
            localStorage.setItem('skills-data', JSON.stringify({
                skills: this.skills,
                categories: this.categories
            }));
            console.log('Dados salvos no localStorage como backup');
            return true;
        }
    }

    async saveAchievements() {
        try {
            console.log('Salvando conquistas...');
            const response = await fetch('http://localhost:3001/api/achievements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.achievements)
            });

            if (!response.ok) {
                throw new Error('Erro ao salvar conquistas');
            }

            console.log('Conquistas salvas com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao salvar conquistas:', error);
            // For demo purposes, save to localStorage
            localStorage.setItem('achievements-data', JSON.stringify(this.achievements));
            console.log('Dados salvos no localStorage como backup');
            return true;
        }
    }

    // === SKILL CRUD METHODS ===
    addSkill(skillData) {
        const newSkill = {
            ...skillData
        };
        // Se não tiver ID, gerar um
        if (!newSkill.id) {
            newSkill.id = 'skill-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        }
        this.skills.push(newSkill);
        this.syncChildrenArrays(); // Sincronizar arrays children
        this.saveSkills();
        return newSkill;
    }

    updateSkill(id, skillData) {
        const index = this.skills.findIndex(skill => skill.id === id);
        if (index !== -1) {
            this.skills[index] = {
                ...this.skills[index],
                ...skillData
            };
            this.syncChildrenArrays(); // Sincronizar arrays children
            this.saveSkills();
            return this.skills[index];
        }
        return null;
    }

    deleteSkill(id) {
        const index = this.skills.findIndex(skill => skill.id === id);
        if (index !== -1) {
            const deletedSkill = this.skills.splice(index, 1)[0];
            this.syncChildrenArrays(); // Sincronizar arrays children
            this.saveSkills();
            return deletedSkill;
        }
        return null;
    }

    // === SYNC UTILITY ===
    syncChildrenArrays() {
        // Limpar todos os arrays children
        this.skills.forEach(skill => {
            skill.children = [];
        });

        // Reconstruir arrays children baseado nas relações parent
        this.skills.forEach(skill => {
            if (skill.parent) {
                const parent = this.skills.find(s => s.id === skill.parent);
                if (parent) {
                    if (!parent.children) {
                        parent.children = [];
                    }
                    if (!parent.children.includes(skill.id)) {
                        parent.children.push(skill.id);
                    }
                }
            }
        });

        // Garantir que skills sem pai tenham children array vazio se não tiverem
        this.skills.forEach(skill => {
            if (!skill.parent && !skill.children) {
                skill.children = [];
            }
        });
    }

    // === ACHIEVEMENT CRUD METHODS ===
    addAchievement(achievementData) {
        const newAchievement = {
            ...achievementData
        };
        // Se não tiver ID, gerar um
        if (!newAchievement.id) {
            newAchievement.id = 'ach-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        }
        this.achievements.push(newAchievement);
        this.saveAchievements();
        return newAchievement;
    }

    updateAchievement(id, achievementData) {
        const index = this.achievements.findIndex(achievement => achievement.id === id);
        if (index !== -1) {
            this.achievements[index] = {
                ...this.achievements[index],
                ...achievementData
            };
            this.saveAchievements();
            return this.achievements[index];
        }
        return null;
    }

    deleteAchievement(id) {
        const index = this.achievements.findIndex(achievement => achievement.id === id);
        if (index !== -1) {
            const deletedAchievement = this.achievements.splice(index, 1)[0];
            this.saveAchievements();
            return deletedAchievement;
        }
        return null;
    }

    getSkillsByCategory(categoryId) {
        if (categoryId === 'all') {
            return this.skills;
        }
        return this.skills.filter(skill => skill.category === categoryId);
    }

    getRootSkills(categoryId = 'all') {
        const skills = this.getSkillsByCategory(categoryId);
        return skills.filter(skill => !skill.parent);
    }

    getChildSkills(parentId) {
        return this.skills.filter(skill => skill.parent === parentId);
    }

    isSkillUnlocked(skillId) {
        const skill = this.getSkillById(skillId);
        if (!skill) return false;

        // Se não tem pai, está sempre desbloqueado
        if (!skill.parent) return true;

        // Verifica se o pai atingiu o threshold necessário
        const parent = this.getSkillById(skill.parent);
        if (!parent) return false;

        return parent.domain >= (skill.unlock_threshold || 0);
    }

    getSkillStats() {
        if (this.skills.length === 0) return { total: 0, unlocked: 0, avgDomain: 0 };

        const unlockedSkills = this.skills.filter(skill => this.isSkillUnlocked(skill.id));
        // Novo cálculo: média dos 5 critérios de cada skill
        const criteria = ['theoretical', 'technical', 'problem_solving', 'knowledge_transfer', 'trends'];
        let totalScore = 0;
        let maxScore = 0;
        this.skills.forEach(skill => {
            if (skill.scores) {
                criteria.forEach(c => {
                    totalScore += skill.scores[c] || 0;
                    maxScore += 5; // cada critério vai de 0 a 5
                });
            }
        });
        const avgDomain = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

        return {
            total: this.skills.length,
            unlocked: unlockedSkills.length,
            avgDomain: avgDomain
        };
    }

    getAchievementStats() {
        if (this.achievements.length === 0) return { unlocked: 0, locked: 0, total: 0, progress: 0 };

        const unlocked = this.achievements.filter(a => a.status === 'unlocked').length;
        const locked = this.achievements.filter(a => a.status === 'locked').length;
        const total = this.achievements.length;
        const progress = total > 0 ? Math.round((unlocked / total) * 100) : 0;

        return { unlocked, locked, total, progress };
    }

    getTopSkill() {
        if (this.skills.length === 0) return { name: 'Nenhuma habilidade', progress: 0 };

        // Filtrar apenas skills pai (sem parent) para o destaque
        const parentSkills = this.skills.filter(skill => !skill.parent);
        
        if (parentSkills.length === 0) return { name: 'Nenhuma habilidade pai', progress: 0 };

        const criteria = ['theoretical', 'technical', 'problem_solving', 'knowledge_transfer', 'trends'];
        // Encontrar a skill pai com maior média dos critérios
        const topSkill = parentSkills.reduce((max, skill) => {
            if (!skill.scores) return max;
            const sum = criteria.reduce((acc, c) => acc + (skill.scores[c] || 0), 0);
            const avg = sum / criteria.length;
            if (avg > max.avg) {
                return { ...skill, avg };
            }
            return max;
        }, { avg: 0, title: 'Nenhuma habilidade encontrada' });

        return {
            name: topSkill.title || 'Nenhuma habilidade',
            progress: Math.round((topSkill.avg / 5) * 100) || 0
        };
    }

    getRelatedAchievements(skillId) {
        return this.achievements.filter(achievement =>
            achievement.relatedSkills && achievement.relatedSkills.includes(skillId)
        );
    }

    // Método para simular dados de exemplo se os arquivos não existirem
    loadExampleData() {
        console.log('Carregando dados de exemplo...');

        this.categories = [
            { id: 'qa', name: 'Quality Assurance' },
            { id: 'dev', name: 'Development' },
            { id: 'ux', name: 'User Experience' }
        ];

        this.skills = [
            {
                id: 'qa-root',
                title: 'Quality Assurance',
                description: 'Garantia de qualidade de software e processos de teste',
                category: 'qa',
                icon: 'bi-shield-check',
                domain: 5,
                unlock_threshold: 0,
                scores: {
                    theoretical: 5,
                    technical: 4,
                    problem_solving: 5,
                    knowledge_transfer: 4,
                    trends: 3
                },
                children: ['qa-testing', 'qa-automation'],
                relatedAchievements: ['istqb-cert']
            },
            {
                id: 'qa-testing',
                title: 'Manual Testing',
                description: 'Técnicas e práticas de teste manual',
                category: 'qa',
                icon: 'bi-bug',
                domain: 4,
                unlock_threshold: 3,
                parent: 'qa-root',
                scores: {
                    theoretical: 4,
                    technical: 4,
                    problem_solving: 4,
                    knowledge_transfer: 3,
                    trends: 3
                },
                children: ['qa-functional', 'qa-exploratory'],
                relatedAchievements: []
            },
            {
                id: 'qa-automation',
                title: 'Test Automation',
                description: 'Automação de testes e frameworks',
                category: 'qa',
                icon: 'bi-robot',
                domain: 3,
                unlock_threshold: 4,
                parent: 'qa-root',
                scores: {
                    theoretical: 3,
                    technical: 4,
                    problem_solving: 3,
                    knowledge_transfer: 2,
                    trends: 4
                },
                children: [],
                relatedAchievements: ['selenium-cert']
            },
            {
                id: 'qa-functional',
                title: 'Functional Testing',
                description: 'Testes funcionais e de regressão',
                category: 'qa',
                icon: 'bi-check2-square',
                domain: 2,
                unlock_threshold: 3,
                parent: 'qa-testing',
                scores: {
                    theoretical: 3,
                    technical: 2,
                    problem_solving: 3,
                    knowledge_transfer: 2,
                    trends: 2
                },
                children: [],
                relatedAchievements: []
            },
            {
                id: 'qa-exploratory',
                title: 'Exploratory Testing',
                description: 'Testes exploratórios e descoberta de bugs',
                category: 'qa',
                icon: 'bi-search',
                domain: 1,
                unlock_threshold: 3,
                parent: 'qa-testing',
                scores: {
                    theoretical: 2,
                    technical: 1,
                    problem_solving: 2,
                    knowledge_transfer: 1,
                    trends: 1
                },
                children: [],
                relatedAchievements: []
            },
            // Skills de DEV
            {
                id: 'dev-root',
                title: 'Development',
                description: 'Desenvolvimento de software e programação',
                category: 'dev',
                icon: 'bi-code-slash',
                domain: 4,
                unlock_threshold: 0,
                scores: {
                    theoretical: 4,
                    technical: 4,
                    problem_solving: 4,
                    knowledge_transfer: 3,
                    trends: 4
                },
                children: ['dev-frontend', 'dev-backend'],
                relatedAchievements: []
            },
            {
                id: 'dev-frontend',
                title: 'Frontend',
                description: 'Desenvolvimento de interfaces e experiência do usuário',
                category: 'dev',
                icon: 'bi-window',
                domain: 3,
                unlock_threshold: 3,
                parent: 'dev-root',
                scores: {
                    theoretical: 3,
                    technical: 4,
                    problem_solving: 3,
                    knowledge_transfer: 3,
                    trends: 4
                },
                children: [],
                relatedAchievements: []
            },
            {
                id: 'dev-backend',
                title: 'Backend',
                description: 'Desenvolvimento de APIs e sistemas server-side',
                category: 'dev',
                icon: 'bi-server',
                domain: 2,
                unlock_threshold: 3,
                parent: 'dev-root',
                scores: {
                    theoretical: 3,
                    technical: 2,
                    problem_solving: 3,
                    knowledge_transfer: 2,
                    trends: 3
                },
                children: [],
                relatedAchievements: []
            }
        ];

        this.achievements = [
            {
                id: 'istqb-cert',
                title: 'ISTQB Foundation',
                description: 'Certificação internacional em fundamentos de teste de software',
                image: 'assets/istqb.png',
                status: 'unlocked',
                evidence: 'https://example.com/istqb-cert.pdf',
                relatedSkills: ['qa-root'],
                subcategories: {
                    'Fundamentos': 'Conceitos básicos de teste',
                    'Técnicas': 'Técnicas de design de teste',
                    'Gestão': 'Gestão de atividades de teste'
                }
            },
            {
                id: 'selenium-cert',
                title: 'Selenium WebDriver',
                description: 'Certificação em automação de testes web com Selenium',
                image: 'assets/selenium.png',
                status: 'locked',
                evidence: null,
                relatedSkills: ['qa-automation'],
                subcategories: {
                    'WebDriver': 'API do Selenium WebDriver',
                    'Locators': 'Estratégias de localização de elementos',
                    'Framework': 'Criação de frameworks de teste'
                }
            },
            {
                id: 'agile-cert',
                title: 'Agile Testing',
                description: 'Práticas de teste em metodologias ágeis',
                image: 'assets/agile.png',
                status: 'unlocked',
                evidence: 'https://example.com/agile-cert.pdf',
                relatedSkills: ['qa-root', 'qa-testing'],
                subcategories: {
                    'Scrum': 'Teste em sprints e incrementos',
                    'Kanban': 'Fluxo contínuo de teste',
                    'BDD': 'Behavior Driven Development'
                }
            },
            {
                id: 'performance-cert',
                title: 'Performance Testing',
                description: 'Testes de performance e carga',
                image: 'assets/performance.png',
                status: 'locked',
                evidence: null,
                relatedSkills: ['qa-automation'],
                subcategories: {
                    'Load Testing': 'Testes de carga',
                    'Stress Testing': 'Testes de estresse',
                    'JMeter': 'Ferramenta Apache JMeter'
                }
            }
        ];

        this.loaded = true;
        console.log('Dados de exemplo carregados');
    }
}

// Instância global do serviço
window.dataService = new DataService();
