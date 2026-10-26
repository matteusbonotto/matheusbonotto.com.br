// Busca o conteúdo público no Supabase (REST, sem SDK, para manter o site leve) e aplica o idioma.
// Usado no navegador e no pré-render (Node 18+ tem fetch).
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

const CONSULTAS = {
  perfil: 'profiles?select=nome_completo,data_nascimento,local,pais,email,telefone,linkedin_url,github_url&limit=1',
  projetos: 'projects?select=id,slug,titulo,papel,descricao_curta,descricao_completa,categoria,categorias,imagem_url,galeria,tecnologias,funcionalidades,conquistas,link_projeto,link_github,data_projeto,destaque,bloqueado,professional_history_id,ordem,i18n&ativo=eq.true&order=ordem.asc',
  experiencias: 'professional_history?select=id,instituicao,titulo,regime,local,tipo_local,descricao,data_inicio,data_fim,atual,categoria_profissional,logo_url,imagens_urls,bloqueado,i18n&order=data_inicio.desc',
  formacoes: 'academic_history?select=id,instituicao,curso,tipo_academico,tipo_local,descricao,data_inicio,data_fim,atual,logo_url,imagens_urls,bloqueado,i18n&order=data_inicio.desc',
  certificacoes: 'certifications?select=id,nome,instituicao,data_certificacao,validade,certificado_url,i18n&order=ordem.asc',
  competencias: 'hard_skills?select=id,nome,categoria,i18n&order=ordem.asc',
  comportamentais: 'soft_skills?select=id,nome,i18n&order=ordem.asc',
  idiomas: 'languages?select=id,idioma,nivel,cursando,instituicao,i18n&order=ordem.asc',
  recomendacoes: 'feedbacks?select=id,nome,cargo,empresa,mensagem,imagem_url,fonte,data_feedback,professional_history_id,ordem,i18n&order=ordem.asc',
  arvore: 'skills_tree?select=id,nome,categoria,nivel,parent_id,descricao,ordem,icon,bloqueado,i18n&order=ordem.asc',
  conquistas: 'achievements?select=id,titulo,descricao,categoria,imagem_url,desbloqueado,bloqueado,data_conquista,evidence,evidence_file,evidencias_urls,ordem,i18n&order=desbloqueado.desc,data_conquista.desc.nullslast,ordem.asc',
  site: 'site_content?select=key,value',
};

export async function buscarTudo(f = fetch) {
  const pares = await Promise.all(Object.entries(CONSULTAS).map(async ([nome, q]) => {
    const r = await f(`${SUPABASE_URL}/rest/v1/${q}`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
    if (!r.ok) throw new Error(`${nome}: HTTP ${r.status}`);
    return [nome, await r.json()];
  }));
  const d = Object.fromEntries(pares);
  d.perfil = d.perfil[0] || {};
  d.site = Object.fromEntries(d.site.map(l => [l.key, l.value]));
  return d;
}

// Mescla as traduções de "i18n.<lang>" sobre os campos em PT; campo vazio na tradução cai para o PT.
export function localizar(linha, lang) {
  if (!linha || lang === 'pt' || !linha.i18n?.[lang]) return linha;
  const t = linha.i18n[lang];
  const out = { ...linha };
  for (const [k, v] of Object.entries(t)) if (v !== null && v !== '' && !(Array.isArray(v) && !v.length)) out[k] = v;
  out._traduzido = true;
  return out;
}

// Conteúdo do site guardado como { pt: {...}, en: {...}, es: {...}, ...comuns }
export function textoSite(site, chave, lang) {
  const v = site?.[chave];
  if (!v) return {};
  const { pt, en, es, ...comum } = v;
  const loc = { pt, en, es }[lang] ?? pt;
  return Array.isArray(loc) ? loc : { ...comum, ...pt, ...loc };
}

// Números que mudam com o tempo nunca ficam escritos no banco: os textos usam {anos} (anos em QA) e {idade},
// trocados aqui pelo valor do dia.
export function variaveis(d, hoje = new Date()) {
  return { anos: anosEmQA(d.experiencias || [], hoje), idade: d.perfil?.data_nascimento ? idadeEm(d.perfil.data_nascimento, hoje) : '' };
}
const trocar = (v, vars) => (typeof v === 'string' ? v.replace(/\{(anos|idade)\}/g, (_, k) => vars[k])
  : Array.isArray(v) ? v.map(x => trocar(x, vars)) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, trocar(x, vars)])) : v);

export function prepararIdioma(d, lang) {
  const L = arr => arr.map(l => localizar(l, lang));
  return {
    ...d, lang, site: trocar(d.site, variaveis(d)),
    projetos: L(d.projetos), experiencias: L(d.experiencias), formacoes: L(d.formacoes),
    certificacoes: L(d.certificacoes), competencias: L(d.competencias), comportamentais: L(d.comportamentais),
    idiomas: L(d.idiomas), recomendacoes: L(d.recomendacoes), arvore: L(d.arvore), conquistas: L(d.conquistas),
  };
}

export function idadeEm(nasc, hoje = new Date()) {
  const n = new Date(`${nasc}T12:00:00`);
  return hoje.getFullYear() - n.getFullYear() - (hoje < new Date(hoje.getFullYear(), n.getMonth(), n.getDate()) ? 1 : 0);
}

// Anos de experiência em QA contados desde o primeiro cargo de QA
export function anosEmQA(experiencias, hoje = new Date()) {
  const inicios = experiencias.filter(e => e.categoria_profissional === 'QA').map(e => new Date(e.data_inicio));
  if (!inicios.length) return 0;
  return Math.floor((hoje - Math.min(...inicios)) / (365.25 * 24 * 3600 * 1000));
}
