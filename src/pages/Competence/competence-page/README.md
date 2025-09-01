# 🎯 Sistema de Mapeamento de Competências RPG

## 📋 Visão Geral

Aplicação web moderna e interativa para mapeamento de competências profissionais em formato RPG. Sistema gamificado com árvore de habilidades, conquistas/achievements e interface totalmente responsiva.

## ✨ Principais Funcionalidades

### 🌳 **Árvore de Habilidades Interativa**
- **4 categorias principais**: QA (Quality Assurance), DEV (Development), UX (User Experience), DATA (Data Science)
- **Nós circulares conectados** com sistema genealógico CSS
- **Estados visuais**: Desbloqueado, Bloqueado, Parcialmente desbloqueado
- **Expansão/Colapso** com animações suaves
- **Filtros por categoria** com indicadores visuais

### 🏆 **Sistema de Conquistas**
- **15+ achievements** por categoria profissional
- **Certificações técnicas**: ISTQB, Selenium, Agile, Performance Testing
- **Projetos e experiências** documentados com evidências
- **Estados visuais distintos**: Desbloqueado vs Bloqueado
- **Drawer mobile** para detalhes completos

### 📊 **Dashboard de Estatísticas**
- **Nível de domínio médio** calculado dinamicamente
- **Contador de conquistas** (desbloqueadas/bloqueadas)
- **Top skill identification** com barra de progresso animada
- **Métricas em tempo real** atualizadas automaticamente

### 📱 **Design Responsivo Avançado**
- **Mobile-first approach** com layout otimizado
- **Drawer bottom-up** no mobile com gestos touch
- **Navegação por swipe** e controles nativos
- **Desktop hover effects** e transições suaves

## 🛠️ Tecnologias Utilizadas

- **HTML5** semântico e acessível
- **CSS3** moderno (Grid, Flexbox, Custom Properties)
- **JavaScript ES6+** vanilla (sem dependências)
- **Bootstrap Icons** para iconografia consistente
- **JSON** estruturado para dados

## 📁 Estrutura do Projeto

```
projeto/
├── index.html                 # Estrutura principal
├── README.md                  # Documentação
├── PROMPT_COMPLETO_REPLICACAO.md  # Guia completo de replicação
├── assets/                    # Imagens e recursos
├── data/
│   ├── skills.json           # Dados das habilidades
│   └── achievements.json     # Dados das conquistas
├── scripts/
│   ├── main.js              # Aplicação principal
│   ├── dataService.js       # Gerenciamento de dados
│   └── tree.js              # Controle da árvore
└── styles/
    ├── styles.css           # Estilos globais e variáveis
    ├── mobile.css           # Estilos específicos mobile
    ├── desktop.css          # Estilos específicos desktop
    └── tree.css             # Estilos da árvore de habilidades
```

## 🚀 Como Executar

1. **Clone o projeto** ou baixe os arquivos
2. **Abra o index.html** em um navegador moderno
3. **Explore as funcionalidades**:
   - Use os filtros para navegar pelas categorias
   - Clique nos nós da árvore para expandir/colapsar
   - No mobile, toque em "Ver" nos cards de conquistas
   - Use ESC para fechar modals/drawers

## 🎨 Design System

### **Paleta de Cores**
- **Base Dark**: `#0f172a` (slate-900)
- **Secundário**: `#1e293b` (slate-800)  
- **Terciário**: `#334155` (slate-700)
- **Primary**: `#3498db` (azul)
- **Success**: `#27ae60` (verde)
- **Warning**: `#f39c12` (laranja)
- **Danger**: `#e74c3c` (vermelho)

### **Categorias de Habilidades**
- **QA**: Azul `#3498db` - Testing, Automation, Performance
- **DEV**: Vermelho `#e74c3c` - Frontend, Backend, DevOps
- **UX**: Roxo `#9b59b6` - Research, Design, Prototyping
- **DATA**: Laranja `#f39c12` - Excel, Power BI, SQL

## 📱 Experiência Mobile

### **Layout Otimizado**
- Cards de conquista simplificados (imagem + título + ação)
- Status badge compacto no canto superior esquerdo
- Scroll horizontal para filtros e estatísticas

### **Gestos Nativos**
- **Drawer bottom-up** para detalhes de conquistas
- **Swipe down** para fechar drawer
- **Touch feedback** em todos os elementos interativos
- **Navegação intuitiva** sem necessidade de instruções

## 🔧 Funcionalidades Técnicas

### **Performance**
- **Lazy loading** de componentes
- **Event delegation** para eficiência
- **Debounced resize** handlers
- **CSS optimizations** com variáveis nativas

### **Acessibilidade**
- **Navegação por teclado** (ESC, números 1-4)
- **Semântica HTML5** adequada
- **Contraste de cores** otimizado
- **Focus indicators** visíveis

### **Dados Estruturados**
- **skills.json**: Hierarquia completa de habilidades com scores
- **achievements.json**: Conquistas com evidências e relacionamentos
- **Cálculos automáticos** de estatísticas e progressos

## 🎯 Casos de Uso

### **Para Profissionais**
- **Mapeamento de competências** atuais
- **Identificação de gaps** de conhecimento
- **Planejamento de carreira** estruturado
- **Portfolio visual** interativo

### **Para Recrutadores**
- **Visualização rápida** de competências
- **Validação de certificações** via evidências
- **Comparação de candidatos** eficiente
- **Interface profissional** impressionante

### **Para Mentores/Gestores**
- **Acompanhamento de evolução** da equipe
- **Identificação de necessidades** de treinamento
- **Planejamento de desenvolvimento** individual
- **Dashboard visual** para apresentações

## 🔥 Diferenciais

### **Visual e UX**
- **Design moderno** inspirado em jogos RPG
- **Animações fluidas** e feedback visual
- **Responsividade perfeita** mobile/desktop
- **Tema dark** profissional

### **Técnico**
- **Zero dependências** externas
- **Código limpo** e bem estruturado
- **Performance otimizada** para mobile
- **Cross-browser compatibility**

### **Funcional**
- **Sistema gamificado** engajante
- **Dados estruturados** e expansíveis
- **Múltiplas categorias** profissionais
- **Evidências documentadas** para validação

## 📈 Roadmap Futuro

- [ ] Sistema de login e perfis múltiplos
- [ ] Export para PDF/LinkedIn
- [ ] Integração com APIs de certificação
- [ ] Modo de comparação entre perfis
- [ ] Sistema de recomendações de cursos
- [ ] Analytics de progresso temporal

## 🤝 Contribuição

Para replicar este projeto, consulte o arquivo `PROMPT_COMPLETO_REPLICACAO.md` que contém todas as especificações técnicas detalhadas.

## 📄 Licença

Projeto educacional e demonstrativo de competências técnicas.

---

**Desenvolvido com foco em demonstrar competências em Frontend, UX/UI Design e Arquitetura de Software** 🚀
