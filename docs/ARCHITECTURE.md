# Arquitetura do Projeto

## Visão Geral

Este é um portfólio profissional desenvolvido como **Single Page Application (SPA)** utilizando HTML puro com Alpine.js para reatividade, consumindo dados de um backend Supabase.

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   HTML5     │  │   CSS3      │  │  Alpine.js  │          │
│  │   Pages     │  │   Styles    │  │  Reactivity │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                         │                                    │
│  ┌─────────────────────────────────────────────────┐        │
│  │              JavaScript Modules                  │        │
│  │  supabase.js │ components.js │ [page].js        │        │
│  └─────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  PostgreSQL │  │    Auth     │  │   Storage   │          │
│  │  Database   │  │   (Admin)   │  │   (Files)   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVIÇOS EXTERNOS                         │
│  ┌─────────────┐  ┌─────────────┐                           │
│  │   EmailJS   │  │  Firebase   │                           │
│  │   (Email)   │  │  (Hosting)  │                           │
│  └─────────────┘  └─────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Estrutura de Arquivos

### Páginas Públicas

| Arquivo | Descrição | Componente Alpine |
|---------|-----------|-------------------|
| index.html | Home com menu fullscreen | - |
| historia.html | Timeline profissional | `historiaTimeline()` |
| portfolio.html | Grid de projetos | `portfolioGrid()` |
| competencias.html | Árvore de skills | `competenciasPage()` |
| cv.html | Currículo multilíngue | Script inline |
| contato.html | Formulário de contato | `contactForm()` |

### Painel Administrativo

| Arquivo | Descrição |
|---------|-----------|
| admin/login.html | Autenticação |
| admin/dashboard.html | Visão geral |
| admin/historico.html | Gerenciar experiências |
| admin/projetos.html | Gerenciar projetos |
| admin/competencias.html | Gerenciar skills |
| admin/conquistas.html | Gerenciar achievements |
| admin/mensagens.html | Mensagens recebidas |
| admin/perfil.html | Configurações do perfil |

---

## Módulos JavaScript

### assets/js/supabase.js
Cliente Supabase configurado para conexão com o banco.

```javascript
// Exporta instância do cliente
export const supabase = window.__supabaseClient;
```

### assets/js/components.js
Componentes reutilizáveis (header, footer).

### assets/js/[página].js
Lógica específica de cada página, exportando função Alpine.js.

```javascript
// Padrão de cada módulo
function nomeDaPagina() {
  return {
    // Estado
    dados: [],
    loading: true,
    
    // Lifecycle
    async loadData() { ... },
    
    // Métodos
    filtrar() { ... },
    abrir() { ... }
  };
}

window.nomeDaPagina = nomeDaPagina;
```

---

## Fluxo de Dados

### Carregamento de Página

```
1. HTML carrega
2. config.js carrega (credenciais)
3. Supabase UMD carrega
4. Cliente Supabase inicializa (window.__supabaseClient)
5. Módulo JS da página carrega
6. Alpine.js inicializa
7. x-init="loadData()" dispara
8. Dados são buscados do Supabase
9. UI é atualizada reativamente
```

### Autenticação Admin

```
1. Usuário acessa /admin/login.html
2. Insere email + senha
3. supabase.auth.signInWithPassword()
4. Se sucesso, redireciona para dashboard
5. Cada página admin verifica sessão
6. RLS no banco valida email autorizado
```

---

## Estilização

### Variáveis CSS (main.css)

```css
:root {
  --primary: #0d6efd;
  --success: #198754;
  --danger: #dc3545;
  --warning: #ffc107;
  --dark: #212529;
  --gray: #6c757d;
  --white: #ffffff;
  
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
}
```

### Arquivos CSS por Página

| Arquivo | Escopo |
|---------|--------|
| main.css | Estilos globais, variáveis, hero |
| home.css | Menu fullscreen |
| historia.css | Timeline, cards, filtros |
| portfolio.css | Grid de projetos, modal |
| competencias.css | Conquistas, filtros |
| tree.css | Árvore de habilidades |
| cv.css | Layout do currículo |
| contato.css | Formulário |
| admin.css | Painel administrativo |

---

## Responsividade

### Breakpoints

| Tamanho | Largura | Comportamento |
|---------|---------|---------------|
| Mobile | < 768px | Layout vertical, cards simplificados |
| Tablet | 768px - 1024px | Layout adaptado |
| Desktop | > 1024px | Layout completo |

### Adaptações Mobile

- **Timeline**: Cards verticais ao invés de gráfico D3
- **Conquistas**: Grid 3 colunas com medalhas circulares
- **Árvore**: Scroll horizontal com nós menores
- **Filtros**: Botões compactos com ícones

---

## PWA (Progressive Web App)

### Configuração

- **Manifest**: `assets/favicon/site.webmanifest`
- **Service Worker**: `sw.js`
- **Ícones**: 192x192 e 512x512 (any + maskable)

### Estratégia de Cache

- **HTML**: Network First (sempre busca atualização)
- **Assets**: Cache First (CSS, JS, imagens)
- **API**: Network Only (dados sempre do Supabase)

---

## Segurança

### Frontend

- Credenciais em arquivo separado (`config.js`) no `.gitignore`
- Apenas `anon key` do Supabase exposta (segura por design)
- Validação de formulários

### Backend (Supabase)

- RLS habilitado em todas as tabelas
- Políticas restritivas para escrita
- Email admin configurado nas policies
- Storage com regras de acesso

### Deploy

- HTTPS obrigatório (Firebase)
- Headers de cache configurados
- Service Worker com scope restrito

---

## Performance

### Otimizações Implementadas

- Lazy loading de imagens
- CSS crítico inline (hero)
- JavaScript modular (import dinâmico)
- Compressão de assets (Firebase)
- Cache de assets estáticos

### Métricas Alvo

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3s

