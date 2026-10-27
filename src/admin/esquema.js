// Descrição de cada seção do admin: tabela, campos e quais campos são traduzíveis (EN/ES vão para a coluna i18n).
// Tipos: texto, area, numero, data, bool, url, email, select, multi, lista (uma linha por item), tags (separadas
// por vírgula), imagem, galeria, nivel (0 a 100), pai (outro item da mesma tabela).
export const SECOES = {
  projects: {
    icone: 'grid', ordem: 'ordem', titulo: r => r.titulo, sub: r => (r.categorias || []).join(' · '), imagem: r => r.imagem_url,
    chaves: ['ativo', 'destaque', 'bloqueado'], busca: ['titulo', 'descricao_curta', 'tecnologias'],
    campos: [
      { nome: 'titulo', tipo: 'texto', obrigatorio: true, i18n: true },
      { nome: 'slug', tipo: 'texto', obrigatorio: true, ajuda: 'slug' },
      { nome: 'categorias', tipo: 'multi', opcoes: ['qa', 'dev', 'vibe', 'data'] },
      { nome: 'destaque', tipo: 'bool' }, { nome: 'ativo', tipo: 'bool', padrao: true },
      { nome: 'papel', tipo: 'texto', i18n: true },
      { nome: 'descricao_curta', tipo: 'area', obrigatorio: true, i18n: true, max: 220 },
      { nome: 'descricao_completa', tipo: 'area', i18n: true, linhas: 8 },
      { nome: 'funcionalidades', tipo: 'lista', i18n: true }, { nome: 'conquistas', tipo: 'lista', i18n: true },
      { nome: 'tecnologias', tipo: 'tags' },
      { nome: 'link_projeto', tipo: 'url' }, { nome: 'link_github', tipo: 'url' },
      { nome: 'imagem_url', tipo: 'imagem', pasta: 'projetos' }, { nome: 'galeria', tipo: 'galeria', pasta: 'galerias' },
      { nome: 'data_projeto', tipo: 'data' }, { nome: 'ordem', tipo: 'numero' },
      { nome: 'bloqueado', tipo: 'bool' },
    ],
  },
  professional_history: {
    icone: 'maleta', ordem: 'data_inicio', desc: true, titulo: r => `${r.titulo} · ${r.instituicao}`, sub: r => `${r.data_inicio || ''} → ${r.atual ? '…' : r.data_fim || ''}`, imagem: r => r.logo_url,
    chaves: ['visivel', 'bloqueado'], busca: ['titulo', 'instituicao'],
    campos: [
      { nome: 'titulo', tipo: 'texto', obrigatorio: true, i18n: true }, { nome: 'instituicao', tipo: 'texto', obrigatorio: true },
      { nome: 'categoria_profissional', tipo: 'select', opcoes: ['QA', 'DEV', 'INFRA', 'DEVOPS'] },
      { nome: 'regime', tipo: 'select', opcoes: ['CLT', 'PJ', 'Estágio', 'Freelance'] },
      { nome: 'tipo_local', tipo: 'select', opcoes: ['Remoto', 'Híbrido', 'Presencial'] }, { nome: 'local', tipo: 'texto' },
      { nome: 'data_inicio', tipo: 'data', obrigatorio: true }, { nome: 'data_fim', tipo: 'data' }, { nome: 'atual', tipo: 'bool' },
      { nome: 'descricao', tipo: 'area', i18n: true, linhas: 10 }, { nome: 'logo_url', tipo: 'imagem', pasta: 'logos', largura: 256 },
      { nome: 'visivel', tipo: 'bool', padrao: true },
      { nome: 'bloqueado', tipo: 'bool' },
    ],
  },
  academic_history: {
    icone: 'chapeu', ordem: 'data_inicio', desc: true, titulo: r => `${r.curso} · ${r.instituicao}`, sub: r => r.tipo_academico, imagem: r => r.logo_url,
    chaves: ['visivel', 'bloqueado'], busca: ['curso', 'instituicao'],
    campos: [
      { nome: 'curso', tipo: 'texto', obrigatorio: true, i18n: true }, { nome: 'instituicao', tipo: 'texto', obrigatorio: true },
      { nome: 'tipo_academico', tipo: 'select', opcoes: ['Técnico', 'Bacharel', 'Tecnólogo', 'Lato Sensu', 'Mestrado', 'Curso livre'] },
      { nome: 'tipo_local', tipo: 'select', opcoes: ['Presencial', 'EAD', 'Híbrido', 'Remoto'] },
      { nome: 'data_inicio', tipo: 'data' }, { nome: 'data_fim', tipo: 'data' }, { nome: 'atual', tipo: 'bool' },
      { nome: 'descricao', tipo: 'area', i18n: true }, { nome: 'logo_url', tipo: 'imagem', pasta: 'logos', largura: 256 },
      { nome: 'visivel', tipo: 'bool', padrao: true },
      { nome: 'bloqueado', tipo: 'bool' },
    ],
  },
  certifications: {
    icone: 'selo', ordem: 'ordem', titulo: r => r.nome, sub: r => r.instituicao, chaves: ['visivel', 'bloqueado'], busca: ['nome', 'instituicao'],
    campos: [
      { nome: 'nome', tipo: 'texto', obrigatorio: true, i18n: true }, { nome: 'instituicao', tipo: 'texto' },
      { nome: 'data_certificacao', tipo: 'data' }, { nome: 'validade', tipo: 'texto', i18n: true },
      { nome: 'certificado_url', tipo: 'url' }, { nome: 'ordem', tipo: 'numero' }, { nome: 'visivel', tipo: 'bool', padrao: true },
      { nome: 'bloqueado', tipo: 'bool' },
    ],
  },
  feedbacks: {
    icone: 'aspas', ordem: 'ordem', titulo: r => r.nome, sub: r => [r.cargo, r.empresa].filter(Boolean).join(' · '), imagem: r => r.imagem_url,
    chaves: ['aprovado'], busca: ['nome', 'empresa', 'mensagem'], pendente: r => !r.aprovado,
    campos: [
      { nome: 'nome', tipo: 'texto', obrigatorio: true }, { nome: 'cargo', tipo: 'texto' }, { nome: 'empresa', tipo: 'texto' },
      { nome: 'mensagem', tipo: 'area', obrigatorio: true, i18n: true, linhas: 8 },
      { nome: 'fonte', tipo: 'select', opcoes: ['LinkedIn', 'Feedz', 'E-mail', 'Site'] },
      { nome: 'imagem_url', tipo: 'imagem', pasta: 'pessoas', largura: 256 },
      { nome: 'data_feedback', tipo: 'data' }, { nome: 'aprovado', tipo: 'bool' }, { nome: 'ordem', tipo: 'numero' },
    ],
  },
  skills_tree: {
    icone: 'arvore', ordem: 'ordem', titulo: r => r.nome, sub: r => `${r.categoria} · ${r.nivel ?? 0}%`, chaves: ['visivel', 'bloqueado'], busca: ['nome', 'categoria'], arvore: true,
    campos: [
      { nome: 'nome', tipo: 'texto', obrigatorio: true, i18n: true },
      { nome: 'categoria', tipo: 'select', opcoes: ['qa', 'dev', 'data', 'devops', 'infra', 'idiomas', 'ux', 'vibe'] }, { nome: 'icon', tipo: 'texto' },
      { nome: 'parent_id', tipo: 'pai' }, { nome: 'nivel', tipo: 'nivel' },
      { nome: 'descricao', tipo: 'area', i18n: true }, { nome: 'ordem', tipo: 'numero' }, { nome: 'visivel', tipo: 'bool', padrao: true },
      { nome: 'bloqueado', tipo: 'bool' },
    ],
  },
  hard_skills: {
    icone: 'chave', ordem: 'ordem', titulo: r => r.nome, sub: r => r.categoria, chaves: ['visivel'], busca: ['nome', 'categoria'],
    campos: [{ nome: 'nome', tipo: 'texto', obrigatorio: true, i18n: true }, { nome: 'categoria', tipo: 'texto', i18n: true }, { nome: 'ordem', tipo: 'numero' }, { nome: 'visivel', tipo: 'bool', padrao: true }],
  },
  soft_skills: {
    icone: 'pessoas', ordem: 'ordem', titulo: r => r.nome, chaves: ['visivel'], busca: ['nome'],
    campos: [{ nome: 'nome', tipo: 'texto', obrigatorio: true, i18n: true }, { nome: 'ordem', tipo: 'numero' }, { nome: 'visivel', tipo: 'bool', padrao: true }],
  },
  languages: {
    icone: 'traduzir', ordem: 'ordem', titulo: r => r.idioma, sub: r => r.nivel, chaves: ['visivel'], busca: ['idioma'],
    campos: [
      { nome: 'idioma', tipo: 'texto', obrigatorio: true, i18n: true }, { nome: 'nivel', tipo: 'texto', i18n: true },
      { nome: 'cursando', tipo: 'bool' }, { nome: 'instituicao', tipo: 'texto' }, { nome: 'ordem', tipo: 'numero' }, { nome: 'visivel', tipo: 'bool', padrao: true },
    ],
  },
  cv_versions: {
    icone: 'arquivo', ordem: 'ordem', titulo: r => r.nome, sub: r => `${r.titulo || ''} · base ${String(r.base || '').toUpperCase()}`, chaves: ['visivel'], busca: ['nome', 'titulo', 'slug'],
    campos: [
      { nome: 'nome', tipo: 'texto', obrigatorio: true, i18n: true, ajuda: 'cvNome' }, { nome: 'slug', tipo: 'texto', obrigatorio: true, ajuda: 'cvSlug' },
      { nome: 'base', tipo: 'select', opcoes: ['qa', 'dev', 'freela', 'basico'], obrigatorio: true, ajuda: 'cvBase' },
      { nome: 'titulo', tipo: 'texto', i18n: true, ajuda: 'cvTitulo' }, { nome: 'resumo', tipo: 'area', i18n: true, linhas: 6, ajuda: 'cvResumo' },
      { nome: 'secoes', tipo: 'multi', opcoes: ['resumo', 'servicos', 'experiencia', 'projetos', 'competencias', 'formacao', 'idiomas', 'palavras'], ajuda: 'cvSecoes' },
      { nome: 'detalhe', tipo: 'select', opcoes: ['auto', 'completo', 'resumido', 'minimo'], ajuda: 'cvDetalhe' },
      { nome: 'projetos', tipo: 'tags', ajuda: 'cvProjetos' }, { nome: 'palavras_chave', tipo: 'tags', ajuda: 'cvPalavras' },
      { nome: 'mostrar_idade', tipo: 'bool', padrao: true }, { nome: 'ordem', tipo: 'numero' }, { nome: 'visivel', tipo: 'bool', padrao: true },
    ],
  },
  achievements: {
    icone: 'trofeu', ordem: 'ordem', titulo: r => r.titulo, sub: r => r.categoria, imagem: r => r.imagem_url, chaves: ['desbloqueado', 'visivel', 'bloqueado'], busca: ['titulo', 'categoria'],
    campos: [
      { nome: 'titulo', tipo: 'texto', obrigatorio: true, i18n: true }, { nome: 'descricao', tipo: 'area', i18n: true },
      { nome: 'categoria', tipo: 'texto', ajuda: 'categoriasConquista' }, { nome: 'imagem_url', tipo: 'imagem', pasta: 'conquistas', largura: 384 },
      { nome: 'desbloqueado', tipo: 'bool' }, { nome: 'data_conquista', tipo: 'data' }, { nome: 'evidence', tipo: 'url' },
      { nome: 'ordem', tipo: 'numero' }, { nome: 'visivel', tipo: 'bool', padrao: true },
      { nome: 'bloqueado', tipo: 'bool' },
    ],
  },
};

// Conteúdo do site (tabela site_content). "i18n" = o campo existe em pt/en/es.
export const CONTEUDO = {
  hero: [{ nome: 'eyebrow', i18n: true }, { nome: 'titulo', i18n: true }, { nome: 'subtitulo', tipo: 'area', i18n: true }, { nome: 'cta_primario', i18n: true }, { nome: 'cta_secundario', i18n: true }],
  disponibilidade: [{ nome: 'ativo', tipo: 'bool' }, { nome: 'texto', i18n: true }],
  valor_hora: [{ nome: 'visivel', tipo: 'bool' }, { nome: 'a_partir', tipo: 'bool' }, { nome: 'brl', tipo: 'numero' }, { nome: 'usd', tipo: 'numero' }, { nome: 'eur', tipo: 'numero' }, { nome: 'clt_brl', tipo: 'numero' }, { nome: 'horas_dia', tipo: 'numero' }, { nome: 'dias_mes', tipo: 'numero' }, { nome: 'nota', tipo: 'area', i18n: true }],
  contato: [{ nome: 'email', tipo: 'email' }, { nome: 'whatsapp', tipo: 'texto', ajuda: 'whatsapp' }, { nome: 'linkedin', tipo: 'url' }, { nome: 'github', tipo: 'url' }],
  sobre: [{ nome: 'texto', tipo: 'area', i18n: true, linhas: 7 }],
  manifesto: [{ nome: 'frases', tipo: 'lista', i18n: true }],
  servicos: [{ nome: 'itens', tipo: 'servicos', i18n: true }],
  seo: [{ nome: 'titulo', i18n: true, max: 70 }, { nome: 'descricao', tipo: 'area', i18n: true, max: 160 }],
  clientes: [{ nome: 'itens', tipo: 'clientes' }],
  sobre_mim: [{ nome: 'carreira', tipo: 'area', i18n: true, linhas: 6 }, { nome: 'pessoal', tipo: 'area', i18n: true, linhas: 5 }, { nome: 'missao', tipo: 'area', i18n: true }, { nome: 'visao', tipo: 'area', i18n: true }, { nome: 'valores', tipo: 'lista', i18n: true }],
  patrocinio: [{ nome: 'projetos', tipo: 'tags', ajuda: 'slugs' }, { nome: 'titulo', i18n: true }, { nome: 'texto', tipo: 'area', i18n: true }],
  palavras_chave: [{ nome: 'itens', tipo: 'palavras' }],
};
