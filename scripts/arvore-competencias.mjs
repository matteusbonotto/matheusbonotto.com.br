// Reescreve a árvore de competências (skills_tree) a partir do perfil real: experiências, projetos e formação.
// Faz backup da árvore atual em backups/ antes de trocar. Uso: node scripts/arvore-competencias.mjs
import fs from 'node:fs';
import { adminClient } from './supabase-admin.mjs';

// [categoria, [pt, en, es], nível, ícone, [descrição pt, en, es], filhos]
const no = (nomes, nivel, icon, desc, filhos = []) => ({ nomes, nivel, icon, desc, filhos });
const ARVORE = [
  ['qa', no(['Qualidade de Software', 'Software Quality', 'Calidad de Software'], 88, 'escudo', [
    'Minha base: garantir que o produto faça o que promete antes de chegar ao usuário. Atuo em times ágeis de varejo, banco, investimentos e entretenimento, do requisito ao aceite.',
    'My foundation: making sure the product does what it promises before it reaches users. I work in agile teams across retail, banking, investments and entertainment, from requirement to sign-off.',
    'Mi base: asegurar que el producto haga lo que promete antes de llegar al usuario. Trabajo en equipos ágiles de retail, banca, inversiones y entretenimiento, del requisito a la aceptación.'], [
    no(['Testes manuais', 'Manual testing', 'Pruebas manuales'], 90, 'check', [
      'Execução cuidadosa de cenários com evidências claras, pensando como o usuário e como quem quer quebrar o sistema.',
      'Careful scenario execution with clear evidence, thinking both like the user and like someone trying to break the system.',
      'Ejecución cuidadosa de escenarios con evidencias claras, pensando como el usuario y como quien quiere romper el sistema.'], [
      no(['Testes funcionais', 'Functional testing', 'Pruebas funcionales'], 90, 'check', [
        'Valido regras de negócio ponta a ponta: cadastros, pagamentos, integrações e fluxos críticos de produtos em produção.',
        'I validate business rules end to end: sign-ups, payments, integrations and critical flows of live products.',
        'Valido reglas de negocio de punta a punta: registros, pagos, integraciones y flujos críticos de productos en producción.']),
      no(['Testes exploratórios', 'Exploratory testing', 'Pruebas exploratorias'], 88, 'busca', [
        'Sessões guiadas por hipóteses de risco que encontram o que o roteiro não prevê, com registro do caminho para reproduzir.',
        'Risk-driven sessions that find what scripts miss, logging the path so anyone can reproduce it.',
        'Sesiones guiadas por hipótesis de riesgo que encuentran lo que el guion no prevé, registrando el camino para reproducirlo.']),
      no(['Testes de regressão', 'Regression testing', 'Pruebas de regresión'], 88, 'repetir', [
        'Suítes de regressão priorizadas por impacto para cada entrega, garantindo que o que funcionava continue funcionando.',
        'Regression suites prioritized by impact for every release, so what worked keeps working.',
        'Suites de regresión priorizadas por impacto en cada entrega, para que lo que funcionaba siga funcionando.']),
      no(['Testes de API', 'API testing', 'Pruebas de API'], 70, 'api', [
        'Validação de contratos REST, códigos de resposta e dados retornados, cruzando com o que a interface mostra.',
        'Validating REST contracts, status codes and payloads, cross-checking them with what the UI shows.',
        'Validación de contratos REST, códigos de respuesta y datos devueltos, cruzándolos con lo que muestra la interfaz.']),
    ]),
    no(['Estratégia e planejamento', 'Strategy and planning', 'Estrategia y planificación'], 85, 'alvo', [
      'Decidir o que testar, quando e com que profundidade, para o time gastar esforço onde o risco é maior.',
      'Deciding what to test, when and how deeply, so the team spends effort where the risk is highest.',
      'Decidir qué probar, cuándo y con qué profundidad, para que el equipo invierta esfuerzo donde el riesgo es mayor.'], [
      no(['Análise de requisitos', 'Requirements analysis', 'Análisis de requisitos'], 88, 'arquivo', [
        'Leitura crítica de histórias e regras de negócio para achar lacunas e ambiguidades antes da primeira linha de código.',
        'Critical reading of stories and business rules to find gaps and ambiguities before the first line of code.',
        'Lectura crítica de historias y reglas de negocio para encontrar vacíos y ambigüedades antes de la primera línea de código.']),
      no(['Plano e casos de teste', 'Test plans and cases', 'Plan y casos de prueba'], 85, 'quadro', [
        'Planos objetivos e casos rastreáveis até o requisito, prontos para execução manual ou automação.',
        'Lean plans and cases traceable to requirements, ready for manual execution or automation.',
        'Planes objetivos y casos trazables hasta el requisito, listos para ejecución manual o automatización.']),
      no(['Testes baseados em risco', 'Risk-based testing', 'Pruebas basadas en riesgo'], 78, 'alvo', [
        'Priorização com PRISMA: probabilidade e impacto definem a ordem e a profundidade dos testes.',
        'Prioritization with PRISMA: likelihood and impact define test order and depth.',
        'Priorización con PRISMA: probabilidad e impacto definen el orden y la profundidad de las pruebas.']),
      no(['Shift-left', 'Shift-left', 'Shift-left'], 85, 'esquerda', [
        'Qualidade desde o refinamento: critérios de aceite, cenários em Gherkin e dúvidas resolvidas antes do desenvolvimento.',
        'Quality from refinement onward: acceptance criteria, Gherkin scenarios and open questions settled before development.',
        'Calidad desde el refinamiento: criterios de aceptación, escenarios en Gherkin y dudas resueltas antes del desarrollo.']),
    ]),
    no(['Automação de testes', 'Test automation', 'Automatización de pruebas'], 78, 'robo', [
      'Automatizo o que se repete para o time testar mais rápido e com confiança a cada deploy.',
      'I automate what repeats so the team can test faster and with confidence on every deploy.',
      'Automatizo lo que se repite para que el equipo pruebe más rápido y con confianza en cada deploy.'], [
      no(['Playwright', 'Playwright', 'Playwright'], 82, 'play', [
        'Testes de ponta a ponta em desktop e celular, com dados simulados, incluindo a suíte deste portfólio.',
        'End-to-end tests on desktop and mobile with mocked data, including this portfolio\'s own suite.',
        'Pruebas de punta a punta en escritorio y móvil con datos simulados, incluida la suite de este portafolio.']),
      no(['Robot Framework', 'Robot Framework', 'Robot Framework'], 75, 'robo', [
        'Automação legível com palavras-chave reutilizáveis, usada na Americanas e no desafio técnico da KaBuM.',
        'Readable keyword-driven automation, used at Americanas and in the KaBuM technical challenge.',
        'Automatización legible con palabras clave reutilizables, usada en Americanas y en el desafío técnico de KaBuM.']),
      no(['Cypress', 'Cypress', 'Cypress'], 65, 'play', [
        'Testes web de ponta a ponta em iniciativas de automação de times de e-commerce.',
        'Web end-to-end tests in automation initiatives for e-commerce teams.',
        'Pruebas web de punta a punta en iniciativas de automatización de equipos de e-commerce.']),
      no(['Gherkin (BDD)', 'Gherkin (BDD)', 'Gherkin (BDD)'], 80, 'arquivo', [
        'Cenários em Dado/Quando/Então que negócio, desenvolvimento e QA leem do mesmo jeito.',
        'Given/When/Then scenarios that business, developers and QA read the same way.',
        'Escenarios Dado/Cuando/Entonces que negocio, desarrollo y QA leen de la misma forma.']),
      no(['Integração contínua', 'Continuous integration', 'Integración continua'], 60, 'git', [
        'Testes rodando no GitHub Actions a cada mudança, barrando regressões antes do deploy.',
        'Tests running on GitHub Actions on every change, blocking regressions before deploy.',
        'Pruebas ejecutándose en GitHub Actions en cada cambio, frenando regresiones antes del deploy.']),
    ]),
    no(['Normas e certificação', 'Standards and certification', 'Normas y certificación'], 82, 'medalha', [
      'Vocabulário e processos reconhecidos no mercado, aplicados no dia a dia sem burocracia.',
      'Industry-recognized vocabulary and processes, applied day to day without red tape.',
      'Vocabulario y procesos reconocidos en el mercado, aplicados en el día a día sin burocracia.'], [
      no(['ISTQB CTFL 4.0', 'ISTQB CTFL 4.0', 'ISTQB CTFL 4.0'], 85, 'medalha', [
        'Fundamentos de teste no padrão ISTQB; criei um simulador do exame para estudar e ajudar outros QAs.',
        'Testing fundamentals per ISTQB; I built an exam simulator to study and help other QAs.',
        'Fundamentos de pruebas según ISTQB; creé un simulador del examen para estudiar y ayudar a otros QAs.']),
      no(['Especialização em Teste de Software', 'Postgraduate in Software Testing', 'Especialización en Pruebas de Software'], 85, 'livro', [
        'Pós-graduação pela VINCIT com foco em técnicas, gestão e automação de testes.',
        'Postgraduate program at VINCIT focused on testing techniques, management and automation.',
        'Posgrado en VINCIT con foco en técnicas, gestión y automatización de pruebas.']),
      no(['ISO/IEC/IEEE 29119', 'ISO/IEC/IEEE 29119', 'ISO/IEC/IEEE 29119'], 70, 'arquivo', [
        'Referência para processos e documentação de teste quando o projeto pede formalidade.',
        'Reference for test processes and documentation when a project calls for formality.',
        'Referencia para procesos y documentación de pruebas cuando el proyecto pide formalidad.']),
    ]),
    no(['Gestão de bugs e evidências', 'Bug and evidence management', 'Gestión de bugs y evidencias'], 90, 'bug', [
      'Bugs bem escritos economizam horas do time: passos, ambiente, evidência e impacto em um só lugar.',
      'Well-written bugs save the team hours: steps, environment, evidence and impact in one place.',
      'Bugs bien escritos ahorran horas al equipo: pasos, entorno, evidencia e impacto en un solo lugar.'], [
      no(['Jira', 'Jira', 'Jira'], 90, 'quadro', [
        'Bugs, histórias e fluxos de entrega; criei o MB Copiloto para agilizar a gestão de cards.',
        'Bugs, stories and delivery flows; I built MB Copiloto to speed up card management.',
        'Bugs, historias y flujos de entrega; creé MB Copiloto para agilizar la gestión de tarjetas.']),
      no(['Azure DevOps', 'Azure DevOps', 'Azure DevOps'], 82, 'infinito', [
        'Boards e work items em projetos corporativos; o Stark Hub nasceu desse fluxo real.',
        'Boards and work items in enterprise projects; Stark Hub was born from that real flow.',
        'Boards y work items en proyectos corporativos; Stark Hub nació de ese flujo real.']),
      no(['Zephyr', 'Zephyr', 'Zephyr'], 75, 'check', [
        'Casos e ciclos de teste integrados ao Jira, com rastreabilidade até a história.',
        'Test cases and cycles integrated with Jira, traceable back to the story.',
        'Casos y ciclos de prueba integrados a Jira, con trazabilidad hasta la historia.']),
    ]),
  ])],
  ['dev', no(['Desenvolvimento', 'Development', 'Desarrollo'], 74, 'codigo', [
    'Construo as ferramentas que eu e outros QAs precisamos, e produtos completos para clientes: do layout ao deploy.',
    'I build the tools QAs like me need, and complete products for clients: from layout to deploy.',
    'Construyo las herramientas que yo y otros QAs necesitamos, y productos completos para clientes: del diseño al deploy.'], [
    no(['Frontend', 'Frontend', 'Frontend'], 78, 'codigo', [
      'Interfaces rápidas, acessíveis e mobile-first, com cuidado de quem testa cada detalhe.',
      'Fast, accessible, mobile-first interfaces, built with a tester\'s eye for detail.',
      'Interfaces rápidas, accesibles y mobile-first, con el cuidado de quien prueba cada detalle.'], [
      no(['HTML e CSS', 'HTML and CSS', 'HTML y CSS'], 85, 'codigo', [
        'Base de mais de dez sites e apps publicados, com layout responsivo e semântica correta.',
        'The foundation of more than ten published sites and apps, with responsive layout and proper semantics.',
        'Base de más de diez sitios y apps publicados, con diseño responsivo y semántica correcta.']),
      no(['JavaScript', 'JavaScript', 'JavaScript'], 80, 'codigo', [
        'Linguagem do dia a dia: extensões, userscripts, sites e a maior parte dos meus projetos.',
        'My everyday language: extensions, userscripts, sites and most of my projects.',
        'Mi lenguaje del día a día: extensiones, userscripts, sitios y la mayoría de mis proyectos.']),
      no(['TypeScript', 'TypeScript', 'TypeScript'], 65, 'codigo', [
        'Tipagem para produtos maiores, como o Condonotto.',
        'Typing for larger products such as Condonotto.',
        'Tipado para productos más grandes, como Condonotto.']),
      no(['React', 'React', 'React'], 68, 'codigo', [
        'Interfaces do Stark Hub, do EvangeliGO e do Condonotto.',
        'Interfaces for Stark Hub, EvangeliGO and Condonotto.',
        'Interfaces de Stark Hub, EvangeliGO y Condonotto.']),
      no(['PWA', 'PWA', 'PWA'], 72, 'celular', [
        'Apps que abrem no navegador e ficam na tela inicial, com notificações e uso offline.',
        'Apps that open in the browser and live on the home screen, with notifications and offline use.',
        'Apps que se abren en el navegador y quedan en la pantalla de inicio, con notificaciones y uso offline.']),
      no(['Tailwind e Bootstrap', 'Tailwind and Bootstrap', 'Tailwind y Bootstrap'], 70, 'pincel', [
        'Frameworks de CSS para entregar layouts consistentes com rapidez.',
        'CSS frameworks to ship consistent layouts quickly.',
        'Frameworks de CSS para entregar diseños consistentes con rapidez.']),
    ]),
    no(['Backend e nuvem', 'Backend and cloud', 'Backend y nube'], 68, 'servidor', [
      'Dados, autenticação e regras no servidor para os produtos que publico.',
      'Data, authentication and server-side rules for the products I ship.',
      'Datos, autenticación y reglas en el servidor para los productos que publico.'], [
      no(['Supabase', 'Supabase', 'Supabase'], 76, 'servidor', [
        'Postgres, autenticação, RLS e Edge Functions em produção no Condonotto, no QA Toolbar e neste site.',
        'Postgres, auth, RLS and Edge Functions in production on Condonotto, QA Toolbar and this site.',
        'Postgres, autenticación, RLS y Edge Functions en producción en Condonotto, QA Toolbar y este sitio.']),
      no(['Firebase', 'Firebase', 'Firebase'], 70, 'nuvem', [
        'Hospedagem e deploy dos meus sites, com domínio próprio.',
        'Hosting and deploys for my sites, with custom domains.',
        'Hosting y deploy de mis sitios, con dominio propio.']),
      no(['Node.js', 'Node.js', 'Node.js'], 62, 'servidor', [
        'Scripts de build, automações e ferramentas de linha de comando.',
        'Build scripts, automations and command-line tools.',
        'Scripts de build, automatizaciones y herramientas de línea de comandos.']),
      no(['Python', 'Python', 'Python'], 55, 'codigo', [
        'Automações e importação de dados, como no ImportProducts da Americanas.',
        'Automations and data imports, as in Americanas\' ImportProducts.',
        'Automatizaciones e importación de datos, como en ImportProducts de Americanas.']),
      no(['Pagamentos e notificações', 'Payments and notifications', 'Pagos y notificaciones'], 62, 'api', [
        'Stripe para assinaturas, e-mail transacional com Brevo e Web Push.',
        'Stripe subscriptions, transactional e-mail with Brevo and Web Push.',
        'Stripe para suscripciones, e-mail transaccional con Brevo y Web Push.']),
    ]),
    no(['Extensões e userscripts', 'Extensions and userscripts', 'Extensiones y userscripts'], 82, 'peca', [
      'Ferramentas que entram no navegador do time e cortam trabalho repetitivo.',
      'Tools that live in the team\'s browser and cut repetitive work.',
      'Herramientas que viven en el navegador del equipo y eliminan trabajo repetitivo.'], [
      no(['Chrome Extension (MV3)', 'Chrome Extension (MV3)', 'Chrome Extension (MV3)'], 82, 'peca', [
        'QA Toolbar Sandbox publicada na Chrome Web Store.',
        'QA Toolbar Sandbox, published on the Chrome Web Store.',
        'QA Toolbar Sandbox, publicada en la Chrome Web Store.']),
      no(['Tampermonkey', 'Tampermonkey', 'Tampermonkey'], 80, 'peca', [
        'Userscripts como o MB Copiloto para Jira e geradores de issues padronizadas.',
        'Userscripts such as MB Copiloto for Jira and standardized issue generators.',
        'Userscripts como MB Copiloto para Jira y generadores de issues estandarizadas.']),
    ]),
  ])],
  ['vibe', no(['IA aplicada', 'Applied AI', 'IA aplicada'], 82, 'brilho', [
    'Uso IA como parceira de trabalho: para testar melhor, documentar mais rápido e tirar produtos do papel.',
    'I use AI as a work partner: to test better, document faster and turn ideas into products.',
    'Uso la IA como compañera de trabajo: para probar mejor, documentar más rápido y llevar productos del papel a la realidad.'], [
    no(['Desenvolvimento com IA', 'AI-assisted development', 'Desarrollo con IA'], 85, 'brilho', [
      'Produtos completos construídos com Claude Code: extensão, SaaS e PWAs, sempre com testes.',
      'Complete products built with Claude Code: an extension, a SaaS and PWAs, always with tests.',
      'Productos completos construidos con Claude Code: extensión, SaaS y PWAs, siempre con pruebas.']),
    no(['IA aplicada a QA', 'AI for QA', 'IA aplicada a QA'], 84, 'escudo', [
      'Geração de cenários, revisão de requisitos e rascunho de bugs com IA, sempre com revisão humana.',
      'AI for scenario generation, requirement reviews and bug drafts, always human-reviewed.',
      'Generación de escenarios, revisión de requisitos y borradores de bugs con IA, siempre con revisión humana.']),
    no(['Engenharia de prompt', 'Prompt engineering', 'Ingeniería de prompts'], 80, 'lapis', [
      'Prompts estruturados e reutilizáveis para análise, documentação e testes.',
      'Structured, reusable prompts for analysis, documentation and testing.',
      'Prompts estructurados y reutilizables para análisis, documentación y pruebas.']),
  ])],
  ['data', no(['Dados', 'Data', 'Datos'], 76, 'grafico', [
    'Transformo números de qualidade e de negócio em painéis que ajudam a decidir.',
    'I turn quality and business numbers into dashboards that help people decide.',
    'Transformo números de calidad y de negocio en paneles que ayudan a decidir.'], [
    no(['Planilhas avançadas', 'Advanced spreadsheets', 'Hojas de cálculo avanzadas'], 86, 'quadro', [
      'Excel e Google Sheets com fórmulas, tabelas dinâmicas e controles para acompanhar testes e entregas.',
      'Excel and Google Sheets with formulas, pivot tables and trackers for tests and deliveries.',
      'Excel y Google Sheets con fórmulas, tablas dinámicas y controles para seguir pruebas y entregas.']),
    no(['Power BI', 'Power BI', 'Power BI'], 76, 'grafico', [
      'Painéis de vendas, produtos, SAC e perfil de clientes publicados no portfólio.',
      'Sales, product, customer service and customer profile dashboards in the portfolio.',
      'Paneles de ventas, productos, SAC y perfil de clientes publicados en el portafolio.']),
    no(['Power Query', 'Power Query', 'Power Query'], 70, 'repetir', [
      'Limpeza e modelagem de dados antes da análise.',
      'Data cleaning and modeling before analysis.',
      'Limpieza y modelado de datos antes del análisis.']),
  ])],
  ['devops', no(['Agilidade e entrega', 'Agile and delivery', 'Agilidad y entrega'], 82, 'infinito', [
    'Trabalho dentro do ritmo do time: cerimônias, quadros e entregas frequentes com qualidade.',
    'I work within the team\'s rhythm: ceremonies, boards and frequent, high-quality releases.',
    'Trabajo dentro del ritmo del equipo: ceremonias, tableros y entregas frecuentes con calidad.'], [
    no(['Scrum', 'Scrum', 'Scrum'], 86, 'repetir', [
      'Refinamento, planejamento, daily e retrospectiva com o QA participando desde o início.',
      'Refinement, planning, daily and retro with QA involved from the start.',
      'Refinamiento, planificación, daily y retrospectiva con QA participando desde el inicio.']),
    no(['Kanban', 'Kanban', 'Kanban'], 78, 'quadro', [
      'Fluxo visual e limite de trabalho em andamento para entregar sem gargalo no teste.',
      'Visual flow and WIP limits to deliver without a testing bottleneck.',
      'Flujo visual y límite de trabajo en curso para entregar sin cuello de botella en las pruebas.']),
    no(['Git e GitHub', 'Git and GitHub', 'Git y GitHub'], 75, 'git', [
      'Versionamento, branches e revisão de código em todos os meus projetos.',
      'Versioning, branches and code review across all my projects.',
      'Versionado, ramas y revisión de código en todos mis proyectos.']),
  ])],
  ['infra', no(['Suporte e infraestrutura', 'Support and infrastructure', 'Soporte e infraestructura'], 72, 'ferramenta', [
    'Comecei no suporte técnico: dali vem o olhar para o ambiente, a paciência com o usuário e a mania de documentar.',
    'I started in tech support: that is where my eye for environments, patience with users and habit of documenting come from.',
    'Empecé en soporte técnico: de ahí vienen la mirada al entorno, la paciencia con el usuario y la costumbre de documentar.'], [
    no(['Suporte ao usuário', 'User support', 'Soporte al usuario'], 85, 'conversa', [
      'Atendimento presencial resolvendo problemas de computadores, impressoras e sistemas.',
      'On-site support solving computer, printer and system issues.',
      'Atención presencial resolviendo problemas de computadoras, impresoras y sistemas.']),
    no(['Hardware e redes', 'Hardware and networks', 'Hardware y redes'], 72, 'rede', [
      'Montagem, formatação e manutenção de máquinas, com apoio à rede do escritório.',
      'Assembling, formatting and maintaining machines, plus office network support.',
      'Montaje, formateo y mantenimiento de equipos, con apoyo a la red de la oficina.']),
    no(['Gestão de ativos de TI', 'IT asset management', 'Gestión de activos de TI'], 70, 'arquivo', [
      'Controle de equipamentos, licenças e estoque de materiais.',
      'Tracking equipment, licenses and supplies.',
      'Control de equipos, licencias y stock de materiales.']),
  ])],
  ['ux', no(['UX e UI', 'UX and UI', 'UX y UI'], 64, 'pincel', [
    'Testar muito me ensinou a desenhar telas que o usuário entende de primeira.',
    'Testing a lot taught me to design screens users understand at first glance.',
    'Probar mucho me enseñó a diseñar pantallas que el usuario entiende a la primera.'], [
    no(['Mobile-first', 'Mobile-first', 'Mobile-first'], 75, 'celular', [
      'Layouts pensados primeiro para o celular e depois ampliados para telas maiores.',
      'Layouts designed for phones first, then expanded to larger screens.',
      'Diseños pensados primero para el móvil y luego ampliados a pantallas más grandes.']),
    no(['Acessibilidade', 'Accessibility', 'Accesibilidad'], 66, 'acessibilidade', [
      'Contraste, navegação por teclado, textos alternativos e respeito ao movimento reduzido.',
      'Contrast, keyboard navigation, alt text and respect for reduced motion.',
      'Contraste, navegación por teclado, textos alternativos y respeto al movimiento reducido.']),
    no(['Revisão de usabilidade', 'Usability review', 'Revisión de usabilidad'], 70, 'busca', [
      'Auditorias de telas com prints e medidas, apontando o que confunde o usuário.',
      'Screen audits with screenshots and measurements, pointing out what confuses users.',
      'Auditorías de pantallas con capturas y medidas, señalando lo que confunde al usuario.']),
  ])],
  ['idiomas', no(['Idiomas', 'Languages', 'Idiomas'], 62, 'traduzir', [
    'Leio documentação e converso com times em inglês; sigo estudando para ganhar fluência.',
    'I read documentation and talk with teams in English, and I keep studying to become fluent.',
    'Leo documentación y converso con equipos en inglés; sigo estudiando para ganar fluidez.'], [
    no(['Português', 'Portuguese', 'Portugués'], 100, 'conversa', ['Língua nativa.', 'Native language.', 'Lengua materna.']),
    no(['Inglês', 'English', 'Inglés'], 62, 'traduzir', [
      'Nível intermediário, em curso: uso no trabalho para documentação, ferramentas e reuniões.',
      'Intermediate and studying: I use it at work for documentation, tools and meetings.',
      'Nivel intermedio, en curso: lo uso en el trabajo para documentación, herramientas y reuniones.'], [
      no(['Leitura', 'Reading', 'Lectura'], 78, 'livro', ['Documentação técnica e artigos sem dificuldade.', 'Technical documentation and articles with ease.', 'Documentación técnica y artículos sin dificultad.']),
      no(['Escuta', 'Listening', 'Comprensión auditiva'], 72, 'ouvir', ['Reuniões, vídeos e cursos em inglês.', 'Meetings, videos and courses in English.', 'Reuniones, videos y cursos en inglés.']),
      no(['Escrita', 'Writing', 'Escritura'], 62, 'lapis', ['Bugs, mensagens e documentação em inglês.', 'Bugs, messages and documentation in English.', 'Bugs, mensajes y documentación en inglés.']),
      no(['Conversação', 'Speaking', 'Conversación'], 52, 'fala', ['Em evolução, com prática semanal.', 'Improving, with weekly practice.', 'En evolución, con práctica semanal.']),
    ]),
    no(['Espanhol', 'Spanish', 'Español'], 38, 'traduzir', [
      'Nível básico: leio e entendo bem o essencial.',
      'Basic level: I read and understand the essentials well.',
      'Nivel básico: leo y entiendo bien lo esencial.'], [
      no(['Leitura', 'Reading', 'Lectura'], 55, 'livro', ['Textos simples e interfaces.', 'Simple texts and interfaces.', 'Textos simples e interfaces.']),
      no(['Conversação', 'Speaking', 'Conversación'], 30, 'fala', ['Frases do dia a dia.', 'Everyday phrases.', 'Frases del día a día.']),
    ]),
  ])],
];

const sb = await adminClient();
const { data: atual, error: e0 } = await sb.from('skills_tree').select('*');
if (e0) throw e0;
fs.mkdirSync('backups', { recursive: true });
fs.writeFileSync(`backups/skills_tree-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(atual, null, 2));

const linhas = [];
const montar = (n, cat, pai, ordem) => {
  const id = crypto.randomUUID();
  linhas.push({ id, nome: n.nomes[0], categoria: cat, nivel: n.nivel, parent_id: pai, descricao: n.desc[0], ordem, icon: n.icon, bloqueado: false,
    i18n: { en: { nome: n.nomes[1], descricao: n.desc[1] }, es: { nome: n.nomes[2], descricao: n.desc[2] } } });
  n.filhos.forEach((f, i) => montar(f, cat, id, i));
};
ARVORE.forEach(([cat, n], i) => montar(n, cat, null, i));
// filhos apontam para os pais: apaga a árvore antiga e insere a nova em ordem (pais antes dos filhos)
const { error: e1 } = await sb.from('skills_tree').delete().not('id', 'is', null);
if (e1) throw e1;
const { error: e2 } = await sb.from('skills_tree').insert(linhas);
if (e2) throw e2;
console.log('árvore nova:', linhas.length, 'nós; backup de', atual.length);
