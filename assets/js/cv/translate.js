// translate.js - Sistema de tradução em tempo real para o currículo

let translatedData = null;
let currentLanguage = 'pt-br';
let originalData = null;

// Configuração de APIs de tradução
const TRANSLATION_APIS = {
    // Google Translate (via proxy público)
    google: {
        url: 'https://translate.googleapis.com/translate_a/single',
        params: (text, from, to) => `?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`,
        parseResponse: (data) => {
            if (data && data[0] && data[0][0] && data[0][0][0]) {
                return data[0].map(item => item[0]).join('');
            }
            return null;
        }
    },
    // Linguee (backup)
    linguee: {
        url: 'https://linguee-api.fly.dev/api/v2/translations',
        params: (text, from, to) => `?query=${encodeURIComponent(text)}&src=${from}&dst=${to}`,
        parseResponse: (data) => {
            if (data && data.translations && data.translations[0] && data.translations[0].text) {
                return data.translations[0].text;
            }
            return null;
        }
    },
    // LibreTranslate (backup)
    libre: {
        url: 'https://libretranslate.de/translate',
        isPost: true,
        parseResponse: (data) => {
            if (data && data.translatedText) {
                return data.translatedText;
            }
            return null;
        }
    }
};

const DELAY_BETWEEN_REQUESTS = 200; // Muito mais rápido - 200ms
const MAX_RETRIES = 1; // Menos tentativas, mais APIs
const RETRY_DELAY = 1000; // 1s de delay para retry

// Cache para evitar retraduções
let translationCache = new Map();

// Controle de quota diário (muito mais generoso)
let dailyRequestCount = 0;
const MAX_DAILY_REQUESTS = 1000; // Google Translate é muito mais generoso
const STORAGE_KEY = 'translation_quota';

// Controle de API atual
let currentApiIndex = 0;
const apiNames = ['google', 'linguee', 'libre'];

/**
 * Verifica se ainda tem quota disponível
 * @returns {boolean} - True se tem quota disponível
 */
function hasQuotaAvailable() {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
        const data = JSON.parse(stored);
        if (data.date === today) {
            dailyRequestCount = data.count;
            return dailyRequestCount < MAX_DAILY_REQUESTS;
        }
    }
    
    // Novo dia, resetar contador
    dailyRequestCount = 0;
    return true;
}

/**
 * Incrementa o contador de requisições
 */
function incrementRequestCount() {
    dailyRequestCount++;
    const today = new Date().toDateString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        date: today,
        count: dailyRequestCount
    }));
}

// Idiomas suportados
const LANGUAGES = {
    'pt-br': 'pt',
    'en': 'en',
    'es': 'es'
};

/**
 * Função para traduzir usando Google Translate
 * @param {string} text - Texto a ser traduzido
 * @param {string} targetLang - Idioma de destino
 * @param {string} sourceLang - Idioma de origem
 * @returns {Promise<string>} - Texto traduzido
 */
async function translateWithGoogle(text, targetLang, sourceLang = 'pt') {
    try {
        const api = TRANSLATION_APIS.google;
        const url = api.url + api.params(text, sourceLang, targetLang);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Google Translate error: ${response.status}`);
        }
        
        const data = await response.json();
        const translated = api.parseResponse(data);
        
        if (translated) {
            return translated;
        }
        
        throw new Error('No translation found');
        
    } catch (error) {
        
        return null;
    }
}

/**
 * Função para traduzir usando LibreTranslate
 * @param {string} text - Texto a ser traduzido
 * @param {string} targetLang - Idioma de destino
 * @param {string} sourceLang - Idioma de origem
 * @returns {Promise<string>} - Texto traduzido
 */
async function translateWithLibre(text, targetLang, sourceLang = 'pt') {
    try {
        const response = await fetch(TRANSLATION_APIS.libre.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text,
                source: sourceLang,
                target: targetLang,
                format: 'text'
            })
        });
        
        if (!response.ok) {
            throw new Error(`LibreTranslate error: ${response.status}`);
        }
        
        const data = await response.json();
        const translated = TRANSLATION_APIS.libre.parseResponse(data);
        
        if (translated) {
            return translated;
        }
        
        throw new Error('No translation found');
        
    } catch (error) {
        
        return null;
    }
}

/**
 * Função para traduzir usando múltiplas APIs com fallback
 * @param {string} text - Texto a ser traduzido
 * @param {string} targetLang - Idioma de destino
 * @param {string} sourceLang - Idioma de origem
 * @returns {Promise<string>} - Texto traduzido
 */
async function translateWithFallback(text, targetLang, sourceLang = 'pt') {
    // Tentar Google Translate primeiro (mais rápido e confiável)
    let result = await translateWithGoogle(text, targetLang, sourceLang);
    if (result) return result;
    
    // Fallback para LibreTranslate
    result = await translateWithLibre(text, targetLang, sourceLang);
    if (result) return result;
    
    // Se tudo falhar, retornar texto original
    return text;
}

/**
 * Função principal de tradução otimizada
 * @param {string} text - Texto a ser traduzido
 * @param {string} targetLang - Idioma de destino
 * @param {string} sourceLang - Idioma de origem
 * @returns {Promise<string>} - Texto traduzido
 */
async function translateText(text, targetLang, sourceLang = 'pt') {
    // Se for o mesmo idioma, retorna o texto original
    if (sourceLang === targetLang) {
        return text;
    }

    // Verificar cache
    const cacheKey = `${sourceLang}-${targetLang}-${text}`;
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey);
    }

    // Verificar quota
    if (!hasQuotaAvailable()) {
        
        return text;
    }

    try {
        // Traduzir usando APIs com fallback
        const translated = await translateWithFallback(text, targetLang, sourceLang);
        
        // Incrementar contador
        incrementRequestCount();
        
        // Salvar no cache
        translationCache.set(cacheKey, translated);
        
        return translated;
        
    } catch (error) {
        
        return text;
    }
}

/**
 * Adiciona delay entre requisições
 * @param {number} ms - Milissegundos para aguardar
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verifica se um texto deve ser traduzido
 * @param {string} text - Texto a ser verificado
 * @param {string} key - Chave do campo (opcional)
 * @returns {boolean} - True se deve traduzir, false caso contrário
 */
function shouldTranslate(text, key = '') {
    // Não traduzir se for string vazia ou muito curta
    if (!text || text.trim().length < 3) return false;
    
    // Campos que não devem ser traduzidos
    const noTranslateFields = [
        'primeiroNome', 'sobrenome', 'nomeCompleto', 'email', 'telefone',
        'github', 'linkedin', 'dataNasc', 'inicio', 'fim', 'local', 'pais',
        'url', 'link', 'id', 'codigo', 'cep', 'endereco'
    ];
    
    if (noTranslateFields.includes(key)) return false;
    
    // Não traduzir se parecer com:
    // - Email
    if (text.includes('@') && text.includes('.')) return false;
    
    // - URL
    if (text.startsWith('http://') || text.startsWith('https://')) return false;
    
    // - Telefone
    if (/^[\+\-\(\)\s\d]+$/.test(text)) return false;
    
    // - Data (DD/MM/YYYY)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) return false;
    
    // - Nomes próprios simples (apenas para nomes curtos)
    if (text.length <= 20 && /^[A-Z][a-z]+(\s[A-Z][a-z]+)*$/.test(text)) {
        // Se for apenas uma palavra e começar com maiúscula, pode ser nome próprio
        const words = text.split(' ');
        if (words.length <= 2) return false;
    }
    
    // - Siglas (ex: QA, CEO, etc.)
    if (/^[A-Z]{2,}$/.test(text)) return false;
    
    return true;
}

/**
 * Traduz recursivamente um objeto de forma otimizada
 * @param {*} obj - Objeto a ser traduzido
 * @param {string} targetLang - Idioma de destino
 * @param {string} sourceLang - Idioma de origem
 * @param {number} depth - Profundidade atual
 * @param {string} parentKey - Chave do objeto pai
 * @returns {Promise<*>} - Objeto traduzido
 */
async function translateObject(obj, targetLang, sourceLang = 'pt', depth = 0, parentKey = '') {
    // Limitar profundidade
    if (depth > 10) {
        
        return obj;
    }

    if (typeof obj === 'string') {
        // Verificar se deve traduzir
        if (!shouldTranslate(obj, parentKey)) {
            return obj;
        }
        
        updateProgressMessage(`Traduzindo: "${obj.substring(0, 50)}${obj.length > 50 ? '...' : ''}"`);

        const translated = await translateText(obj, targetLang, sourceLang);
        
        // Delay menor para maior velocidade
        await delay(DELAY_BETWEEN_REQUESTS);
        return translated;
        
    } else if (Array.isArray(obj)) {
        // Traduzir array em paralelo para maior velocidade
        const promises = obj.map(async (item, i) => {
            updateProgressMessage(`Traduzindo item ${i + 1} de ${obj.length} em ${parentKey}`);
            return await translateObject(item, targetLang, sourceLang, depth + 1, `${parentKey}[${i}]`);
        });
        
        return await Promise.all(promises);
        
    } else if (obj && typeof obj === 'object') {
        // Traduzir propriedades em paralelo
        const translatedObject = {};
        const keys = Object.keys(obj);
        
        // Processar em lotes para evitar sobrecarga
        const batchSize = 3;
        for (let i = 0; i < keys.length; i += batchSize) {
            const batch = keys.slice(i, i + batchSize);
            const promises = batch.map(async (key) => {
                const value = obj[key];
                updateProgressMessage(`Traduzindo propriedade: ${key}`);
                return {
                    key,
                    value: await translateObject(value, targetLang, sourceLang, depth + 1, key)
                };
            });
            
            const results = await Promise.all(promises);
            results.forEach(({ key, value }) => {
                translatedObject[key] = value;
            });
        }
        
        return translatedObject;
    } else {
        // Retornar como está
        return obj;
    }
}

// Traduções dos títulos das seções
const sectionTitles = {
    'pt-br': {
        resumo: 'Resumo',
        experienciaProfissional: 'Experiência Profissional',
        formacaoAcademica: 'Formação Acadêmica',
        idiomas: 'Idiomas',
        certificacoes: 'Certificações',
        projetosRelevantes: 'Projetos Relevantes',
        palavrasChave: 'Palavras-chave',
        principaisAtividades: 'Principais Atividades',
        emAndamento: 'Em andamento',
        atualmente: 'Atualmente',
        cursando: 'CURSANDO',
        atual: 'ATUAL',
        anos: 'anos',
        continuacao: 'Continuação'
    },
    'en': {
        resumo: 'Summary',
        experienciaProfissional: 'Professional Experience',
        formacaoAcademica: 'Education',
        idiomas: 'Languages',
        certificacoes: 'Certifications',
        projetosRelevantes: 'Relevant Projects',
        palavrasChave: 'Keywords',
        principaisAtividades: 'Main Activities',
        emAndamento: 'In progress',
        atualmente: 'Currently',
        cursando: 'STUDYING',
        atual: 'CURRENT',
        anos: 'years old',
        continuacao: 'Continuation'
    },
    'es': {
        resumo: 'Resumen',
        experienciaProfissional: 'Experiencia Profesional',
        formacaoAcademica: 'Formación Académica',
        idiomas: 'Idiomas',
        certificacoes: 'Certificaciones',
        projetosRelevantes: 'Proyectos Relevantes',
        palavrasChave: 'Palabras clave',
        principaisAtividades: 'Principales Actividades',
        emAndamento: 'En progreso',
        atualmente: 'Actualmente',
        cursando: 'ESTUDIANDO',
        atual: 'ACTUAL',
        anos: 'años',
        continuacao: 'Continuación'
    }
};

// Configuração de idiomas
const languageConfig = {
    'pt-br': {
        printText: 'Imprimir',
        flag: 'https://flagcdn.com/16x12/br.png',
        text: 'Português'
    },
    'en': {
        printText: 'Print',
        flag: 'https://flagcdn.com/16x12/us.png',
        text: 'English'
    },
    'es': {
        printText: 'Imprimir',
        flag: 'https://flagcdn.com/16x12/es.png',
        text: 'Español'
    }
};

/**
 * Função para obter tradução dos títulos
 * @param {string} key - Chave do título
 * @returns {string} - Título traduzido
 */
function getSectionTitle(key) {
    return sectionTitles[currentLanguage] && sectionTitles[currentLanguage][key] 
        ? sectionTitles[currentLanguage][key] 
        : sectionTitles['pt-br'][key] || key;
}

/**
 * Função principal para mudar idioma - SUPER OTIMIZADA
 * @param {string} language - Idioma de destino
 */
async function changeLanguage(language) {
    if (language === currentLanguage) return;
    
    
    
    // Mostrar loading
    showLoadingMessage();
    
    try {
        // Salvar dados originais se não existirem
        if (!originalData) {
            originalData = JSON.parse(JSON.stringify(curriculumData));
        }
        
        // Se for português, usar dados originais
        if (language === 'pt-br') {
            translatedData = originalData;
        } else {
            // Traduzir dados de forma otimizada
            
            updateProgressMessage('Traduzindo com Google Translate (rápido)...');
            
            const targetLang = LANGUAGES[language];
            
            // Usar tradução completa otimizada
            translatedData = await translateObject(originalData, targetLang, 'pt');
        }
        
        // Atualizar idioma atual
        currentLanguage = language;
        
        // Atualizar interface
        updateLanguageInterface(language);
        
        // Re-renderizar currículo
        await renderizarCurriculo();
        
        
        
    } catch (error) {
        
        updateProgressMessage('Erro na tradução. Alguns textos podem não ter sido traduzidos.');
        
        // Mesmo com erro, tentar renderizar com o que conseguiu traduzir
        currentLanguage = language;
        updateLanguageInterface(language);
        
        if (translatedData) {
            await renderizarCurriculo();
        }
    }
}

/**
 * Atualiza a interface para o idioma selecionado
 * @param {string} language - Idioma selecionado
 */
function updateLanguageInterface(language) {
    const config = languageConfig[language];
    
    // Atualizar dropdown de idioma
    const flagElement = document.getElementById('currentLanguageFlag');
    const textElement = document.getElementById('currentLanguageText');
    const printTextElement = document.getElementById('printText');
    
    if (flagElement) flagElement.src = config.flag;
    if (textElement) textElement.textContent = config.text;
    if (printTextElement) printTextElement.textContent = config.printText;
}

/**
 * Mostra mensagem de loading
 */
function showLoadingMessage() {
    const container = document.getElementById('curriculum-container');
    if (container) {
        container.innerHTML = `
            <div class="loading-message text-center">
                <div class="spinner-border text-primary pl-3" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div id="progress-message" class="mt-2 text-muted small">
                    Iniciando tradução...
                </div>
            </div>
        `;
    }
}

/**
 * Atualiza mensagem de progresso
 * @param {string} message - Mensagem de progresso
 */
function updateProgressMessage(message) {
    const progressElement = document.getElementById('progress-message');
    if (progressElement) {
        progressElement.textContent = message;
    }
}

/**
 * Inicialização do sistema de tradução
 */
function initTranslationSystem() {
    
    
    // Configurar idioma inicial
    updateLanguageInterface(currentLanguage);
}

// Inicializar sistema quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initTranslationSystem);

// Exportar funções para uso global
window.changeLanguage = changeLanguage;
window.getSectionTitle = getSectionTitle;
window.translateText = translateText;
