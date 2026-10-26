// Registro das páginas e montagem dos documentos HTML por idioma.
import { SITE } from '../config.js';
import { rota, tradutor } from '../i18n/ui.js';
import { idadeEm, textoSite, variaveis } from '../lib/dados.js';
import { esc, head, icone, paragrafos, periodo } from './comum.js';
import { documento } from './layout.js';
import { canais, competencias, contato, inicio, itensTrajetoria, jsonLd, projetos, sobre, trajetoria } from './paginas.js';

// Assinatura do conteúdo: o navegador só redesenha a página se os dados do banco mudaram desde o build.
// Inclui os números calculados pela data (anos, idade): quando viram, a página se redesenha sozinha.
export function assinatura(d) {
  const s = JSON.stringify(d) + JSON.stringify(variaveis(d));
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// id da página = caminho (sem idioma); "" é o início. "dados" = o que o navegador precisa para modais.
export const PAGINAS = {
  '': { corpo: inicio, seo: (d, t) => textoSite(d.site, 'seo', d.lang), dados: d => ({ projetos: d.projetos.filter(p => p.destaque), recomendacoes: d.recomendacoes, experiencias: d.experiencias.map(e => ({ id: e.id, instituicao: e.instituicao })) }),
    preload: '<link rel="preload" as="image" href="/media/intro-poster.webp" fetchpriority="high">' },
  sobre: { corpo: sobre, seo: (d, t) => ({ titulo: t('seo.sobre.titulo'), descricao: t('seo.sobre.descricao') }), dados: () => ({}) },
  projetos: { corpo: projetos, seo: (d, t) => ({ titulo: t('seo.projetos.titulo'), descricao: t('seo.projetos.descricao') }), dados: d => ({ projetos: d.projetos, experiencias: d.experiencias.map(e => ({ id: e.id, instituicao: e.instituicao })) }) },
  trajetoria: { corpo: trajetoria, seo: (d, t) => ({ titulo: t('seo.trajetoria.titulo'), descricao: t('seo.trajetoria.descricao') }), dados: (d, t) => ({ trajetoria: itensTrajetoria(d, t), recomendacoes: d.recomendacoes, projetos: d.projetos, experiencias: d.experiencias.map(e => ({ id: e.id, instituicao: e.instituicao })) }) },
  competencias: { corpo: competencias, seo: (d, t) => ({ titulo: t('seo.competencias.titulo'), descricao: t('seo.competencias.descricao') }), dados: d => ({ conquistas: d.conquistas, arvore: d.arvore }) },
  contato: { corpo: contato, seo: (d, t) => ({ titulo: t('seo.contato.titulo'), descricao: t('seo.contato.descricao') }), dados: () => ({}) },
};

export function paginaHTML(pagina, d, bruto) {
  const t = tradutor(d.lang);
  const def = PAGINAS[pagina];
  const seo = def.seo(d, t);
  return documento({ lang: d.lang, pagina, titulo: seo.titulo, descricao: seo.descricao, jsonld: jsonLd(d, t, pagina, seo.titulo),
    corpo: def.corpo(d, t), dadosJson: def.dados(d, t), assinaturaDados: assinatura(bruto), preload: def.preload || '' });
}

// Currículo: cada bloco "cv-atomo" é indivisível; o paginador (src/cv.js) distribui os blocos em folhas A4.
// data-junto = manter com o próximo bloco (título de seção, cabeçalho de cargo).
export const VARIANTES_CV = ['qa', 'dev', 'freela', 'basico'];

// Currículo por versão (qa | dev | freela | basico): muda título, resumo, ordem e o quanto cada experiência é detalhada.
export function conteudoCV(d, t, qr = '', variante = 'qa') {
  const v = VARIANTES_CV.includes(variante) ? variante : 'qa';
  const vt = textoSite({ x: d.site.cv_variantes?.[v] }, 'x', d.lang);
  const s = textoSite(d.site, 'sobre', d.lang);
  const c = d.site.contato || {};
  const grupos = {};
  for (const x of d.competencias) (grupos[x.categoria] ||= []).push(x.nome);
  const secao = titulo => `<h2 class="cv-atomo cv-secao" data-junto>${titulo}</h2>`;
  const paras = (txt, max = Infinity) => String(txt || '').replace(/\r/g, '').split(/\n+/).map(l => l.trim()).filter(Boolean).slice(0, max)
    .map(l => (l.startsWith('- ') ? `<p class="cv-atomo cv-sub" data-junto>${esc(l.slice(2))}</p>` : `<p class="cv-atomo">${esc(l)}</p>`)).join('');
  const tel = c.whatsapp ? `+${c.whatsapp.replace(/^(\d{2})(\d{2})(\d{5})(\d{4})$/, '$1 ($2) $3-$4')}` : '';
  const local = `${d.perfil.local || 'Campinas-SP'}, ${d.perfil.pais || 'Brasil'}`;
  const sem = u => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  const linhas = [
    c.email && ['email', `mailto:${c.email}`, c.email], tel && ['whatsapp', `https://wa.me/${c.whatsapp}`, tel],
    c.github && ['github', c.github, sem(c.github)], c.linkedin && ['linkedin', c.linkedin, sem(c.linkedin)],
    ['externo', SITE.url + rota(d.lang), 'matheusbonotto.com.br'], ['local', null, local],
  ].filter(Boolean);
  // experiências: DEV primeiro na versão dev; descrições completas só onde fazem sentido
  let exps = [...d.experiencias];
  if (v === 'dev') exps.sort((a, b) => (b.categoria_profissional === 'DEV') - (a.categoria_profissional === 'DEV'));
  const detalhe = e => (v === 'basico' ? 0 : v === 'qa' ? (e.categoria_profissional === 'QA' ? Infinity : 1) : v === 'dev' ? (e.categoria_profissional === 'DEV' ? Infinity : 1) : 2);
  const catsProj = { qa: ['qa'], dev: ['dev', 'vibe'], freela: ['dev', 'qa'], basico: [] }[v];
  const projetos = d.projetos.filter(p => p.destaque || v === 'freela').filter(p => (p.categorias || [p.categoria]).some(x => catsProj.includes(x))).slice(0, v === 'freela' ? 8 : 6);
  const servicos = textoSite(d.site, 'servicos', d.lang);
  return `<header class="cv-atomo cv-cabeca">
  <div class="cv-cabeca-nome">
    <h1>${SITE.nome}</h1>
    <p class="cv-cargo">${esc(vt.titulo || 'QA Engineer')}</p>
    ${d.perfil.data_nascimento ? `<p class="cv-idade" data-nascimento="${esc(d.perfil.data_nascimento)}" data-modelo="${esc(t('cv.anos', { n: '{n}' }))}">(${t('cv.anos', { n: idadeEm(d.perfil.data_nascimento) })})</p>` : ''}
  </div>
  <div class="cv-cabeca-contato">
    <a class="cv-qr" href="${SITE.url + rota(d.lang, 'cv')}" aria-label="QR code">${qr}</a>
    <ul>${linhas.map(([ic, href, txt]) => `<li>${icone(ic)}${href ? `<a href="${esc(href)}">${esc(txt)}</a>` : esc(txt)}</li>`).join('')}</ul>
  </div>
</header>
${secao(t('cv.resumo'))}<p class="cv-atomo">${esc(vt.resumo || s.texto)}</p>
${v === 'freela' && Array.isArray(servicos) ? `${secao(t('cv.servicos'))}${servicos.map(x => `<p class="cv-atomo"><strong>${esc(x.titulo)}:</strong> ${esc(x.texto)}</p>`).join('')}` : ''}
${secao(t('trajetoria.experiencia'))}
${exps.map(e => `<div class="cv-atomo cv-item-topo" ${detalhe(e) ? 'data-junto' : ''}><h3>${esc(e.titulo)} · ${esc(e.instituicao)}</h3><span>${esc(periodo(e.data_inicio, e.data_fim, e.atual, t))}</span><p class="cv-meta">${esc([e.regime, e.tipo_local, e.local].filter(Boolean).join(' · '))}</p></div>${paras(e.descricao, detalhe(e))}`).join('')}
${projetos.length ? `${secao(t('cv.projetos'))}${projetos.map(x => `<p class="cv-atomo cv-projeto"><strong>${esc(x.titulo)}</strong>: ${esc(x.descricao_curta)}${x.link_projeto ? ` <a href="${esc(x.link_projeto)}">${esc(sem(x.link_projeto))}</a>` : ''}</p>`).join('')}` : ''}
${secao(t('sobre.competencias'))}
${Object.entries(grupos).map(([g, i]) => `<p class="cv-atomo"><strong>${esc(g)}:</strong> ${i.map(esc).join(', ')}</p>`).join('')}
<p class="cv-atomo"><strong>${t('sobre.comportamentais')}:</strong> ${d.comportamentais.map(x => esc(x.nome)).join(', ')}</p>
${secao(t('trajetoria.formacao'))}
${d.formacoes.map(f => `<div class="cv-atomo cv-item-topo"><h3>${esc(f.curso)} · ${esc(f.instituicao)}</h3><span>${esc(periodo(f.data_inicio, f.data_fim, f.atual, t))}</span></div>`).join('')}
${d.certificacoes.map(x => `<p class="cv-atomo">${esc(x.nome)} · ${esc(x.instituicao)}${x.validade ? ` (${esc(x.validade)})` : ''}</p>`).join('')}
${secao(t('sobre.idiomas'))}
<p class="cv-atomo">${d.idiomas.map(i => `<strong>${esc(i.idioma)}</strong>: ${esc(i.nivel)}`).join(' · ')}</p>
${(d.site.palavras_chave || []).length ? `<p class="cv-atomo cv-palavras">${(d.site.palavras_chave || []).map(esc).join(', ')}</p>` : ''}`;
}

export function paginaCV(d, bruto, qr = '') {
  const t = tradutor(d.lang);
  return `<!doctype html>
<html lang="${t('meta.lang')}" data-lang="${d.lang}">
<head>
${head({ lang: d.lang, t, titulo: t('cv.titulo'), descricao: t('cv.descricao'), pagina: 'cv', jsonld: jsonLd(d, t, 'cv', t('cv.titulo')) })}
</head>
<body class="pagina-cv">
<header class="cv-barra nao-imprimir" role="toolbar" aria-label="${t('cv.ferramentas')}">
  <a class="cv-voltar" href="${rota(d.lang)}" aria-label="${t('cv.voltar')}"><img src="/media/logo-64.webp" alt="" width="28" height="28">${icone('esquerda')}</a>
  <p class="cv-arquivo" title="${t('cv.arquivo')}">${t('cv.arquivo')}</p>
  <div class="cv-versoes" role="group" aria-label="${t('cv.versao')}">${VARIANTES_CV.map((v, n) => `<button type="button" data-variante="${v}" aria-pressed="${n === 0}">${t(`cv.v.${v}`)}</button>`).join('')}</div>
  <div class="cv-zoom" role="group" aria-label="Zoom">
    <button type="button" data-zoom="-1" aria-label="${t('cv.zoomMenos')}">−</button>
    <button type="button" data-zoom="0" class="mono" aria-label="${t('cv.ajustar')}" data-zoom-valor>100%</button>
    <button type="button" data-zoom="1" aria-label="${t('cv.zoomMais')}">+</button>
  </div>
  <nav class="nav-idiomas" aria-label="${t('nav.idioma')}">${SITE.idiomas.map(l => `<a href="${rota(l, 'cv')}" hreflang="${l}" ${l === d.lang ? 'aria-current="true"' : ''}>${l.toUpperCase()}</a>`).join('')}</nav>
  <button class="btn btn-acento btn-pequeno" type="button" data-imprimir>${icone('download')}<span>${t('cv.imprimir')}</span></button>
</header>
<main id="conteudo" class="cv-mesa" data-main data-assinatura="${assinatura(bruto)}">
  <div class="cv-paginas" data-paginas data-rotulo-pagina="${t('cv.pagina')}" data-cabeca="${esc([SITE.nome, (d.site.contato || {}).email, `${d.perfil.local || 'Campinas-SP'}, ${d.perfil.pais || 'Brasil'}`].filter(Boolean).join(' | '))}">
    <article class="folha" data-fluxo>${conteudoCV(d, t, qr)}</article>
  </div>
</main>
<script type="module" src="/src/cv.js"></script>
</body>
</html>`;
}
