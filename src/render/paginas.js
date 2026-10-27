// Conteúdo de cada página (recebe dados já localizados por prepararIdioma).
import { SITE } from '../config.js';
import { rota } from '../i18n/ui.js';
import { anosEmQA, textoSite } from '../lib/dados.js';
import { CAMINHOS, esc, icone, iniciais, paragrafos, periodo } from './comum.js';

export const CATS = ['qa', 'dev', 'vibe', 'data'];
const catsProjeto = p => { const c = (p.categorias?.length ? p.categorias : [p.categoria]).map(x => String(x || '').toLowerCase()).filter(x => CATS.includes(x)); return c.length ? c : ['dev']; };
export const ehCena = url => /\/capa\.webp/.test(url || '');
const imgProjeto = (p, t, cls = '') => p.imagem_url
  ? `<img class="${cls} ${ehCena(p.imagem_url) ? 'capa-cena' : ''}" src="${esc(p.imagem_url)}" alt="${esc(t('projetos.print', { titulo: p.titulo }))}" loading="lazy" decoding="async" width="1600" height="1000">`
  : `<div class="${cls} img-vazia" aria-hidden="true">${esc(iniciais(p.titulo))}</div>`;
const selos = (p, t, max = Infinity) => {
  const cats = catsProjeto(p), extra = cats.length - max;
  const selo = (c, i) => `<span class="selo selo-${c}${i >= max ? ' selo-extra' : ''}" ${i >= max ? 'hidden' : ''}>${t(`projetos.cat.${c}`)}</span>`;
  // span com papel de botão: o cartão inteiro já é um <button>
  return `<span class="selos">${cats.map(selo).join('')}${extra > 0 ? `<span class="selo selo-mais" role="button" tabindex="0" aria-expanded="false" aria-label="${t('projetos.maisTags', { n: extra })}" data-mais-selos>+${extra}</span>` : ''}</span>`;
};

// Alternador de visualização (grade / lista / árvore); o JS guarda a escolha por seção.
function vistas(alvo, t, opcoes = ['grade', 'lista']) {
  return `<div class="vistas" role="group" aria-label="${t('vista.rotulo')}" data-vistas="${alvo}">${opcoes.map((o, i) => `<button type="button" aria-pressed="${i === 0}" data-vista="${o}">${icone(`vista-${o}`)}<span>${t(`vista.${o}`)}</span></button>`).join('')}</div>`;
}

function cabecalhoPagina(t, chave) {
  return `<header class="pag-topo">
  <div class="container">
    <h1 class="pag-titulo" data-dividir>${t(`pag.${chave}.titulo`)}</h1>
    <p class="pag-sub revelar">${t(`pag.${chave}.sub`)}</p>
  </div>
</header>`;
}

// ================= INÍCIO =================
function hero(d, t) {
  const h = textoSite(d.site, 'hero', d.lang);
  const disp = textoSite(d.site, 'disponibilidade', d.lang);
  const status = disp.ativo ? `<p class="status"><span class="status-ponto" aria-hidden="true"></span>${esc(disp.texto)}</p>` : '';
  // Fase 1: a rolagem avança o vídeo de abertura quadro a quadro (moeda → rosto → nome).
  // Fase 2: o quadro encolhe e o texto entra. Sem JS / movimento reduzido: estado final direto.
  return `<section class="hero" id="topo" data-hero>
  <div class="hero-palco">
    <div class="hero-midia" data-hero-midia>
      <img class="hero-poster" src="/media/intro-poster.webp" alt="${t('hero.som')}" width="1120" height="600" fetchpriority="high">
      <canvas class="hero-canvas" data-sequencia="/media/intro/" data-quadros="60" aria-hidden="true"></canvas>
      <div class="sombra-v" aria-hidden="true"></div>
    </div>
    <div class="hero-intro container" data-hero-intro aria-hidden="true">${status}<span class="hero-rolar">${icone('baixo')}${t('hero.rolar')}</span></div>
    <div class="hero-conteudo container" data-hero-conteudo>
      <div class="hero-texto">
        ${status}
        <p class="rotulo">${esc(h.eyebrow)}</p>
        <h1 class="hero-titulo">${esc(h.titulo)}</h1>
        <p class="hero-sub">${esc(h.subtitulo)}</p>
        <p class="rotulo caminhos-titulo">${t('hero.caminhos')}</p>
        <nav class="caminhos" aria-label="${t('hero.caminhos')}">${[['sobre', 'nav.sobre', 'escudo'], ['projetos', 'nav.projetos', 'vista-grade'], ['trajetoria', 'nav.trajetoria', 'grafico'], ['competencias', 'nav.competencias', 'estrela'], ['contato', 'nav.contato', 'email'], ['cv', 'nav.cv', 'download']]
          .map(([pg, k, ic], n) => `<a class="caminho ${n === 0 ? 'caminho-forte' : ''}" href="${rota(d.lang, pg)}" data-magnetico>${icone(ic)}<span>${t(k)}</span></a>`).join('')}</nav>
      </div>
    </div>
  </div>
</section>`;
}

function clientes(d, t) {
  const itens = (Array.isArray(d.site.clientes) ? d.site.clientes : []).map(c => (typeof c === 'string' ? { nome: c } : c))
    .map(c => `<li>${c.logo ? `<img src="${esc(c.logo)}" alt="" width="40" height="40" loading="lazy">` : ''}<span>${esc(c.nome)}</span></li>`).join('');
  return `<section class="clientes" aria-label="${t('clientes.titulo')}">
  <p class="rotulo container">${t('clientes.titulo')}</p>
  <div class="letreiro"><ul class="letreiro-faixa">${itens}</ul><ul class="letreiro-faixa" aria-hidden="true">${itens}</ul></div>
</section>`;
}

function manifesto(d, t) {
  const frases = textoSite(d.site, 'manifesto', d.lang).frases || [];
  return `<section class="manifesto" id="abordagem" aria-labelledby="manifesto-rotulo" data-manifesto style="--passos:${frases.length}">
  <div class="manifesto-palco">
    <img class="manifesto-video manifesto-poster" src="/media/escritorio-poster.webp" alt="" width="1280" height="720" loading="lazy" aria-hidden="true">
    <canvas class="manifesto-video manifesto-canvas" data-sequencia="/media/escritorio/" data-quadros="60" aria-hidden="true"></canvas>
    <div class="manifesto-veu" aria-hidden="true"></div>
    <div class="manifesto-texto container">
      <p class="rotulo rotulo-claro" id="manifesto-rotulo">${t('manifesto.rotulo')}</p>
      <ol class="manifesto-frases">${frases.map((f, i) => `<li data-frase="${i}"><span class="mono">${String(i + 1).padStart(2, '0')} / ${String(frases.length).padStart(2, '0')}</span>${esc(f)}</li>`).join('')}</ol>
      <div class="manifesto-progresso" aria-hidden="true"><span data-progresso></span></div>
    </div>
  </div>
</section>`;
}

function numeros(d, t) {
  const empresas = Array.isArray(d.site.clientes) ? d.site.clientes.length : 0;
  const itens = [[anosEmQA(d.experiencias), 'numeros.anos', '+'], [empresas, 'numeros.empresas', ''], [d.projetos.length, 'numeros.projetos', ''], [d.recomendacoes.length, 'numeros.recomendacoes', '']];
  return `<section class="numeros container" aria-label="${t('numeros.anos')}">
  ${itens.map(([n, k, suf]) => `<div class="numero revelar"><strong data-contar="${n}">${n}</strong><span class="numero-suf">${suf}</span><p>${t(k)}</p></div>`).join('')}
</section>`;
}

function destaques(d, t) {
  const dest = d.projetos.filter(p => p.destaque);
  const cartao = (p, i, copia) => `<article class="destaque" ${copia ? 'aria-hidden="true" inert' : ''}>
      <div class="destaque-midia">${imgProjeto(p, t)}</div>
      <div class="destaque-corpo">
        ${selos(p, t, 1)}
        <h3>${esc(p.titulo)}</h3>
        <p class="destaque-desc">${esc(p.descricao_curta)}</p>
        <button class="btn btn-linha btn-pequeno" type="button" data-abrir-projeto="${esc(p.slug)}">${t('projetos.detalhes')} ${icone('seta')}</button>
      </div>
    </article>`;
  // duas faixas iguais: a animação anda metade do comprimento e recomeça sem emenda
  return `<section class="projetos" id="projetos" aria-labelledby="projetos-titulo">
  <div class="container cabecalho">
    <p class="rotulo">${t('projetos.rotulo')}</p>
    <h2 id="projetos-titulo" data-dividir>${t('projetos.titulo')}</h2>
  </div>
  <div class="vitrine" style="--itens:${dest.length}">
    <div class="vitrine-trilho">
      <div class="vitrine-faixa">${dest.map((p, i) => cartao(p, i, false)).join('')}</div>
      <div class="vitrine-faixa" aria-hidden="true">${dest.map((p, i) => cartao(p, i, true)).join('')}</div>
    </div>
  </div>
  <div class="container vitrine-acoes"><a class="btn btn-escuro" href="${rota(d.lang, 'projetos')}" data-magnetico>${t('projetos.verTodos', { n: d.projetos.length })} ${icone('seta')}</a></div>
</section>`;
}

const FONTES = { linkedin: 'linkedin', feedz: 'feedz', site: 'globo', 'e-mail': 'email' };
const autor = (x, t) => `<header class="autor">${x.imagem_url ? `<img src="${esc(x.imagem_url)}" alt="" width="48" height="48" loading="lazy">` : `<span class="autor-ini" aria-hidden="true">${esc(iniciais(x.nome))}</span>`}
  <span class="autor-info"><strong>${esc(x.nome)}</strong><span>${esc([x.cargo, x.empresa].filter(Boolean).join(' · '))}</span></span>
  ${x.fonte ? `<span class="fonte" title="${esc(t('recs.fonte', { fonte: x.fonte }))}">${icone(FONTES[String(x.fonte).toLowerCase()] || 'globo', t('recs.fonte', { fonte: x.fonte }))}</span>` : ''}</header>`;
const nota = (x, t) => (x._traduzido ? `<p class="mono nota">${t('recs.traduzido')}</p>` : '');

const VISIVEIS_RECS = 5;
function cartaoRec(x, t, destaque = false, extra = false) {
  return `<li class="${destaque ? 'rec-destaque' : ''}" ${extra ? 'data-rec-extra hidden' : ''}><figure class="rec">
  ${autor(x, t)}
  <blockquote class="rec-texto"><p>${esc(x.mensagem.replace(/\s+/g, ' '))}</p></blockquote>
  <footer class="rec-pe">${nota(x, t)}<button type="button" class="ler-mais" data-abrir-rec="${esc(x.id)}">${t('recs.continuar')} ${icone('seta')}</button></footer>
</figure></li>`;
}

export function detalheRecomendacao(x, t) {
  return `<button class="modal-fechar" type="button" data-fechar-modal aria-label="${t('projetos.fechar')}">${icone('fechar')}</button>
<div class="rec-modal">${autor(x, t)}<h2 id="modal-titulo" class="vh">${esc(x.nome)}</h2><blockquote>${paragrafos(x.mensagem)}</blockquote>${nota(x, t)}</div>`;
}

export function formularioRecomendacao(t) {
  return `<button class="modal-fechar" type="button" data-fechar-modal aria-label="${t('projetos.fechar')}">${icone('fechar')}</button>
<form class="form form-rec" data-form-rec novalidate aria-labelledby="modal-titulo">
  <h2 id="modal-titulo" class="titulo-secundario">${t('recs.formTitulo')}</h2><p class="dica-form">${t('recs.formTexto')}</p>
  <div class="campo"><label for="r-nome">${t('contato.nome')}</label><input id="r-nome" name="nome" required maxlength="120" autocomplete="name"></div>
  <div class="campo"><label for="r-cargo">${t('recs.cargo')}</label><input id="r-cargo" name="cargo" maxlength="140"></div>
  <div class="campo"><label for="r-empresa">${t('recs.empresa')}</label><input id="r-empresa" name="empresa" maxlength="140"></div>
  <div class="campo"><label for="r-msg">${t('contato.mensagem')}</label><textarea id="r-msg" name="mensagem" rows="6" required maxlength="3000"></textarea></div>
  <div class="campo-isca" aria-hidden="true"><label for="r-site">Site</label><input id="r-site" name="site" tabindex="-1" autocomplete="off"></div>
  <button class="btn btn-acento" type="submit">${t('recs.enviar')} ${icone('seta')}</button>
  <p class="form-status" role="status" aria-live="polite" data-status data-ok="${esc(t('recs.enviada'))}" data-erro="${esc(t('contato.erro'))}" data-invalido="${esc(t('contato.invalido'))}"></p>
</form>`;
}

function recomendacoes(d, t) {
  const r = d.recomendacoes;
  if (!r.length) return '';
  const principal = r.find(x => /cinemark/i.test(x.mensagem) && x.mensagem.length > 800) || r[0];
  return `<section class="recs" id="recomendacoes" aria-labelledby="recs-titulo">
  <div class="container">
    <div class="secao-topo"><div><p class="rotulo">${t('recs.rotulo')}</p><h2 id="recs-titulo" data-dividir>${t('recs.titulo')}</h2></div>
      <div class="recs-acoes">${vistas('recs', t)}<button type="button" class="btn btn-linha btn-pequeno" data-deixar-rec>${t('recs.deixar')}</button></div></div>
    <ul class="recs-grade" data-vista-alvo="recs" data-vista="grade" data-recs data-deslize>${[principal, ...r.filter(x => x !== principal)].map((x, i) => cartaoRec(x, t, i === 0, i >= VISIVEIS_RECS)).join('')}</ul>
    ${r.length > VISIVEIS_RECS ? `<div class="recs-mais"><button type="button" class="btn btn-linha" data-ver-mais-recs aria-expanded="false" data-menos="${esc(t('recs.verMenos'))}">${t('recs.verMais', { n: r.length - VISIVEIS_RECS })}</button></div>` : ''}
  </div>
</section>`;
}

export function formatarValor(valor, moeda, lang) {
  if (valor === null || valor === undefined || valor === '') return null;
  return new Intl.NumberFormat({ pt: 'pt-BR', en: 'en-US', es: 'es-ES' }[lang], { style: 'currency', currency: moeda, maximumFractionDigits: 0 }).format(Number(valor));
}

// Calculadora de valores: moeda × período × tipo de contratação. PJ e freelancer partem do valor/hora;
// CLT parte da pretensão mensal em BRL (já líquida de impostos) e é convertida pelo câmbio do dia nas outras moedas.
function cartaoValor(d, t) {
  const v = textoSite(d.site, 'valor_hora', d.lang);
  if (!v.visivel) return '';
  const cfg = { brl: v.brl, usd: v.usd, eur: v.eur, clt: v.clt_brl, h: v.horas_dia || 8, d: v.dias_mes || 21, lang: d.lang };
  const grupo = (nome, rotulo, ops) => `<div class="valor-grupo" role="group" aria-label="${rotulo}">${ops.map(([val, txt], n) => `<button type="button" data-valor-${nome}="${val}" aria-pressed="${n === 0}">${txt}</button>`).join('')}</div>`;
  const inicial = formatarValor(v.brl, 'BRL', d.lang);
  return `<aside class="valor revelar" aria-labelledby="valor-titulo" data-valor='${esc(JSON.stringify(cfg))}'>
  <h3 id="valor-titulo" class="rotulo">${t('valor.titulo')}</h3>
  <div class="valor-filtros">
    <div class="valor-campo valor-campo-largo"><span class="mono">${t('valor.regime')}</span>${grupo('regime', t('valor.regime'), [['pj', t('valor.pj')], ['freela', t('valor.freela')], ['clt', t('valor.clt')]])}</div>
    <div class="valor-campo"><span class="mono">${t('valor.moeda')}</span>${grupo('moeda', t('valor.moeda'), [['BRL', 'R$'], ['USD', 'US$'], ['EUR', '€']])}</div>
    <div class="valor-campo"><span class="mono">${t('valor.unidade')}</span>${grupo('unidade', t('valor.unidade'), [['hora', t('valor.hora')], ['dia', t('valor.dia')], ['mes', t('valor.mes')]])}</div>
  </div>
  <p class="valor-numero" aria-live="polite"><span class="mono" data-valor-prefixo>${v.a_partir ? t('valor.aPartir') : ''}</span><strong data-valor-total>${inicial || t('valor.consulta')}</strong><span data-valor-sufixo data-sufixos='${esc(JSON.stringify({ hora: t('valor.porHora'), dia: t('valor.porDia'), mes: t('valor.porMes') }))}'>${t('valor.porHora')}</span></p>
  <p class="valor-nota"><span data-valor-nota data-clt="${esc(t('valor.cltNota'))}">${v.nota ? esc(v.nota) : ''}</span> <span data-valor-cambio hidden>${t('valor.cambio')}</span> <span>${t('valor.base', { h: cfg.h, d: cfg.d })}</span></p>
</aside>`;
}

function servicos(d, t) {
  const lista = textoSite(d.site, 'servicos', d.lang);
  return `<section class="servicos container" id="servicos" aria-labelledby="servicos-titulo">
  <div class="cabecalho"><p class="rotulo">${t('servicos.rotulo')}</p><h2 id="servicos-titulo" data-dividir>${t('servicos.titulo')}</h2></div>
  <div class="servicos-grade">
    <ol class="servicos-lista">${(Array.isArray(lista) ? lista : []).map((s, i) => `<li class="revelar"><span class="mono">${String(i + 1).padStart(2, '0')}</span><div><h3>${esc(s.titulo)}</h3><p>${esc(s.texto)}</p></div></li>`).join('')}</ol>
    <div class="servicos-lado">${cartaoValor(d, t)}<a class="btn btn-acento" href="${rota(d.lang, 'contato')}" data-magnetico>${t('nav.cta')} ${icone('seta')}</a></div>
  </div>
</section>`;
}

export function inicio(d, t) {
  return hero(d, t) + clientes(d, t) + manifesto(d, t) + numeros(d, t) + destaques(d, t) + recomendacoes(d, t) + servicos(d, t);
}

// ================= PROJETOS =================
const origem = (p, d) => d.experiencias?.find(e => e.id === p.professional_history_id)?.instituicao;

export function projetos(d, t) {
  const abas = ['todos', ...CATS].map(c => `<button type="button" role="tab" aria-selected="${c === 'todos'}" data-filtro="${c}">${t(`projetos.cat.${c}`)}<span class="mono">${c === 'todos' ? d.projetos.length : d.projetos.filter(p => catsProjeto(p).includes(c)).length}</span></button>`).join('');
  const grupos = CATS.map(c => {
    const lista = d.projetos.filter(p => catsProjeto(p).includes(c));
    if (!lista.length) return '';
    return `<section class="grupo" id="${c}" data-grupo="${c}" aria-labelledby="grupo-${c}">
    <div class="grupo-topo"><h2 id="grupo-${c}">${t(`projetos.cat.${c}`)}</h2><p>${t(`projetos.cat.${c}.desc`)}</p></div>
    <ul class="cartoes">${lista.map(p => `<li class="cartao revelar" data-secundario="${catsProjeto(p)[0] !== c}" data-texto="${esc([p.titulo, p.descricao_curta, ...(p.tecnologias || [])].join(' ').toLowerCase())}">
      <button type="button" ${p.bloqueado ? `class="trancado" aria-disabled="true" title="${t('projetos.bloqueado')}"` : `data-abrir-projeto="${esc(p.slug)}" data-inclinar`}>
        <span class="cartao-img">${imgProjeto(p, t)}${p.bloqueado ? `<span class="cartao-cadeado">${icone('cadeado')}</span>` : p.destaque ? '<span class="cartao-estrela" aria-hidden="true">★</span>' : ''}</span>
        <span class="cartao-corpo">${selos(p, t, 1)}<strong>${esc(p.titulo)}</strong>${origem(p, d) ? `<span class="origem mono">${t('projetos.origem', { org: origem(p, d) })}</span>` : ''}<span class="cartao-desc">${esc(p.descricao_curta)}</span>
        <span class="tags">${(p.tecnologias || []).slice(0, 3).map(x => `<span>${esc(x)}</span>`).join('')}</span></span>
      </button></li>`).join('')}</ul>
  </section>`;
  }).join('');
  return `${cabecalhoPagina(t, 'projetos')}
<div class="container projetos-pagina" data-projetos data-vista-alvo="projetos" data-vista="grade">
  <div class="barra-filtros">
    <div class="filtros" role="tablist" aria-label="${t('projetos.filtro')}">${abas}</div>
    ${vistas('projetos', t)}
    <label class="busca"><span class="vh">${t('projetos.buscar')}</span>${icone('busca')}<input type="search" data-busca placeholder="${t('projetos.buscar')}" autocomplete="off"></label>
  </div>
  ${grupos}
  <p class="nenhum" data-nenhum hidden>${t('projetos.nenhum')}</p>
</div>`;
}

export function detalheProjeto(p, t, org) {
  const galeria = (p.galeria || []).length ? p.galeria : (p.imagem_url ? [{ url: p.imagem_url, dispositivo: 'desktop' }] : []);
  const temMobile = galeria.some(g => g.dispositivo === 'mobile');
  const lista = (titulo, itens) => itens?.length ? `<div class="modal-bloco"><h3 class="rotulo">${titulo}</h3><ul class="lista-check">${itens.map(i => `<li>${icone('check')}${esc(i)}</li>`).join('')}</ul></div>` : '';
  const disp = g => (g.dispositivo === 'mobile' ? 'mobile' : 'desktop');
  return `<button class="modal-fechar" type="button" data-fechar-modal aria-label="${t('projetos.fechar')}">${icone('fechar')}</button>
<header class="modal-cabeca">${selos(p, t)}<h2 id="modal-titulo">${esc(p.titulo)}</h2>${org ? `<p class="origem mono">${t('projetos.origem', { org })}</p>` : ''}${p.papel ? `<p class="destaque-papel">${t('projetos.papel')}: ${esc(p.papel)}</p>` : ''}</header>
${galeria.length ? `<div class="galeria" data-galeria>
  ${temMobile ? `<div class="galeria-modos" role="tablist" aria-label="${t('projetos.galeria')}">
    <button type="button" role="tab" aria-selected="true" data-modo="desktop">${t('projetos.desktop')}</button>
    <button type="button" role="tab" aria-selected="false" data-modo="mobile">${t('projetos.mobile')}</button></div>` : ''}
  <div class="galeria-palco">
    <ul class="galeria-faixa" data-galeria-faixa aria-label="${t('projetos.galeria')}">${galeria.map((g, i) => `<li class="galeria-item galeria-${disp(g)}" data-dispositivo="${disp(g)}" data-i="${i}">
      <button type="button" class="galeria-ver" data-galeria-ampliar aria-label="${t('projetos.ampliar')}"><figure class="moldura moldura-${disp(g)}${disp(g) === 'mobile' && g.w && g.h / g.w < 1.6 ? ' moldura-tablet' : ''}"><img src="${esc(g.url)}" ${g.w ? `width="${g.w}" height="${g.h}"` : ''} alt="${esc(g.legenda || `${t('projetos.print', { titulo: p.titulo })} (${i + 1})`)}" loading="lazy" decoding="async"></figure>
      <span class="galeria-lupa" aria-hidden="true">${icone('ampliar')}</span></button></li>`).join('')}</ul>
    <button type="button" class="btn-icone galeria-seta galeria-seta-ant" data-galeria-ant aria-label="${t('projetos.anterior')}">${icone('esquerda')}</button>
    <button type="button" class="btn-icone galeria-seta galeria-seta-prox" data-galeria-prox aria-label="${t('projetos.proxima')}">${icone('direita')}</button>
  </div>
  <div class="galeria-controles"><span class="mono" data-galeria-contador aria-live="polite"></span>
    <ul class="galeria-miniaturas">${galeria.map((g, i) => `<li data-dispositivo="${disp(g)}"><button type="button" class="miniatura miniatura-${disp(g)}" data-galeria-ir="${i}" aria-label="${t('projetos.imagem', { n: i + 1 })}"><img src="${esc(g.url)}" alt="" decoding="async"></button></li>`).join('')}</ul>
  </div>
</div>` : ''}
<div class="modal-corpo">
  <div class="modal-texto">${paragrafos(p.descricao_completa || p.descricao_curta)}</div>
  <aside class="modal-lado">
    ${lista(t('projetos.funcionalidades'), p.funcionalidades)}
    ${lista(t('projetos.resultados'), p.conquistas)}
    ${p.tecnologias?.length ? `<div class="modal-bloco"><h3 class="rotulo">${t('projetos.tecnologias')}</h3><ul class="tags">${p.tecnologias.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
    <div class="acoes">
      ${p.link_projeto ? `<a class="btn btn-escuro" href="${esc(p.link_projeto)}" target="_blank" rel="noopener">${t('projetos.visitar')} ${icone('externo')}</a>` : ''}
      ${p.link_github ? `<a class="btn btn-linha" href="${esc(p.link_github)}" target="_blank" rel="noopener">${icone('github')} ${t('projetos.codigo')}</a>` : ''}
    </div>
  </aside>
</div>`;
}

// ================= TRAJETÓRIA =================
const catExp = (c, t) => { try { return c ? t(`trajetoria.cat.${c}`) : ''; } catch { return c; } };

// Gráfico de progresso da carreira (como no projeto original): logos à esquerda e, dentro de cada barra,
// modalidade, vínculo, empresa, cargo, período e local. No celular a linha do tempo rola para o lado.
const ICONE_LOCAL = { remoto: 'casa', hibrido: 'hibrido', presencial: 'predio' };
const iconeLocal = s => ICONE_LOCAL[String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()] || 'predio';
export function graficoCarreira(d, t, hoje = new Date()) {
  const itens = [
    ...d.experiencias.map(e => ({ id: e.id, tipo: 'exp', titulo: e.titulo, org: e.instituicao, ini: e.data_inicio, fim: e.atual ? null : e.data_fim, cat: e.categoria_profissional, logo: e.logo_url, chip: e.regime, onde: e.tipo_local, local: e.local })),
    ...d.formacoes.map(f => ({ id: f.id, tipo: 'form', titulo: f.curso, org: f.instituicao, ini: f.data_inicio, fim: f.atual ? null : f.data_fim, cat: 'FORM', logo: f.logo_url, chip: f.tipo_academico, onde: f.tipo_local, local: '' })),
  ].filter(i => i.ini);
  if (!itens.length) return '';
  const data = s => (s ? new Date(`${s}T00:00:00`) : hoje);
  const a0 = Math.min(...itens.map(i => data(i.ini).getFullYear()));
  const a1 = hoje.getFullYear() + 1;
  const ini = new Date(a0, 0, 1), fim = new Date(a1, 0, 1);
  const pct = dt => (((dt - ini) / (fim - ini)) * 100).toFixed(2);
  const anos = [];
  for (let a = a0; a < a1; a++) anos.push(`<span class="crono-ano" style="--x:${pct(new Date(a, 0, 1))}%"><i>${a}</i></span>`);
  const grupo = (tipo, nome) => {
    const lista = itens.filter(i => i.tipo === tipo).sort((a, b) => data(a.ini) - data(b.ini));
    if (!lista.length) return '';
    return `<p class="crono-grupo mono">${esc(nome)}</p>${lista.map(i => {
      const per = periodo(i.ini, i.fim, !i.fim, t);
      const x0 = pct(data(i.ini)), w = Math.max(+pct(data(i.fim)) - x0, 0.5).toFixed(2);
      return `<div class="crono-linha" data-tipo="${i.tipo}">
        <span class="crono-logo logo-redondo" aria-hidden="true">${i.logo ? `<img src="${esc(i.logo)}" alt="" width="40" height="40" loading="lazy">` : `<span>${esc(iniciais(i.org))}</span>`}</span>
        <div class="crono-trilho"><button type="button" class="crono-barra crono-${esc(i.cat || 'x')} ${i.fim ? '' : 'atual'}" style="--l:${x0}%;--w:${w}%" data-abrir-carreira="${i.tipo}:${esc(i.id)}" aria-label="${esc(`${i.titulo} · ${i.org}, ${per}`)}" title="${esc(`${i.org} · ${i.titulo} (${per})`)}">
          <span class="crono-topo">${icone(iconeLocal(i.onde))}${i.chip ? `<span class="crono-chip">${esc(i.chip)}</span>` : ''}</span>
          <strong>${esc(i.org)}</strong><span>${esc(i.titulo)}</span><span class="crono-per">${esc(per)}</span>${i.local ? `<span class="crono-local">${esc(i.local)}</span>` : ''}
        </button></div>
      </div>`;
    }).join('')}`;
  };
  return `<figure class="carreira revelar" data-carreira>
  <figcaption><h2 class="titulo-secundario">${t('carreira.titulo')}</h2><p>${t('carreira.legenda')}</p>
    <ul class="carreira-legenda">${[['QA', t('trajetoria.cat.QA')], ['DEV', t('trajetoria.cat.DEV')], ['INFRA', t('trajetoria.cat.INFRA')], ['FORM', t('carreira.academico')], ['agora', t('carreira.atual')]]
      .map(([k, n]) => `<li><span class="leg leg-${k}" aria-hidden="true"></span>${esc(n)}</li>`).join('')}</ul></figcaption>
  <div class="carreira-rolagem" tabindex="0" data-deslize data-crono aria-label="${t('carreira.titulo')}">
    <div class="crono" style="--anos:${a1 - a0}">
      <div class="crono-eixo" aria-hidden="true">${anos.join('')}<span class="crono-hoje" style="--x:${pct(hoje)}%"><i>${t('carreira.hoje')}</i></span></div>
      ${grupo('exp', t('carreira.profissional'))}${grupo('form', t('carreira.academico'))}
    </div>
  </div>
</figure>`;
}

// Modal da trajetória (como no projeto original): dados, descrição, projetos feitos ali, recomendações do período
// e a grade de certificados/fotos (miniaturas que abrem o arquivo; PDF aparece como arquivo).
export function detalheCarreira(i, t, extras = {}) {
  const arquivos = i.imagens || [];
  const projetos = (extras.projetos || []).filter(p => i.tipo === 'exp' && p.professional_history_id === i.id);
  const recs = (extras.recomendacoes || []).filter(r => i.tipo === 'exp' && r.professional_history_id === i.id);
  return `<button class="modal-fechar" type="button" data-fechar-modal aria-label="${t('projetos.fechar')}">${icone('fechar')}</button>
<header class="modal-cabeca carreira-cabeca">
  <div class="logo-redondo logo-g">${i.logo ? `<img src="${esc(i.logo)}" alt="" width="64" height="64">` : `<span>${esc(iniciais(i.org))}</span>`}</div>
  <div><p class="mono">${esc(i.per)}</p><h2 id="modal-titulo">${esc(i.titulo)}</h2><p class="linha-org">${esc(i.org)} <span class="selo selo-${i.tipo}">${esc(i.cat)}</span></p>
  ${i.sub ? `<p class="carreira-modo">${icone('local')}${esc(i.sub)}</p>` : ''}</div>
</header>
<div class="modal-texto carreira-texto">${paragrafos(i.desc)}</div>
${projetos.length ? `<section class="modal-bloco"><h3 class="rotulo">${t('carreira.projetos')}</h3><ul class="mini-projetos">${projetos.map(p => `<li><button type="button" data-abrir-projeto="${esc(p.slug)}">${p.imagem_url ? `<img class="${ehCena(p.imagem_url) ? 'capa-cena' : ''}" src="${esc(p.imagem_url)}" alt="" loading="lazy">` : ''}<span><strong>${esc(p.titulo)}</strong><span>${esc(p.descricao_curta)}</span></span></button></li>`).join('')}</ul></section>` : ''}
${recs.length ? `<section class="modal-bloco"><h3 class="rotulo">${t('carreira.recs')}</h3><ul class="mini-recs">${recs.map(r => `<li><button type="button" data-abrir-rec="${esc(r.id)}">${autor(r, t)}<span class="mini-rec-texto">${esc(r.mensagem.trim())}</span></button></li>`).join('')}</ul></section>` : ''}
${arquivos.length ? `<section class="modal-bloco"><h3 class="rotulo">${t('carreira.arquivos')}</h3><ul class="arquivos">${arquivos.map((u, n) => `<li>${/\.pdf($|\?)/i.test(u) ? `<a href="${esc(u)}" target="_blank" rel="noopener"><span class="arquivo-pdf">${icone('arquivo')}PDF</span></a>` : `<a href="${esc(u)}" data-visor aria-label="${t('projetos.ampliar')}"><img src="${esc(u)}" alt="${esc(`${i.org} (${n + 1})`)}" loading="lazy"><span class="galeria-lupa" aria-hidden="true">${icone('ampliar')}</span></a>`}</li>`).join('')}</ul></section>` : ''}`;
}

function itemLinha(i, t) {
  const longo = (i.desc || '').length > 320;
  if (i.bloqueado) return `<li class="linha-item revelar trancado" data-tipo="${i.tipo}" aria-disabled="true"><div class="linha-quando mono">${esc(i.per)}</div><div class="linha-marca logo-redondo">${icone('cadeado')}</div><div class="linha-corpo"><h3>${esc(i.titulo)}</h3><p class="linha-org">${t('projetos.bloqueado')}</p></div></li>`;
  return `<li class="linha-item revelar" data-tipo="${i.tipo}">
  <div class="linha-quando mono">${esc(i.per)}</div>
  <div class="linha-marca logo-redondo">${i.logo ? `<img src="${esc(i.logo)}" alt="" width="48" height="48" loading="lazy">` : `<span>${esc(iniciais(i.org))}</span>`}</div>
  <div class="linha-corpo">
    <h3><button type="button" class="linha-abrir" data-abrir-carreira="${i.tipo}:${esc(i.id)}">${esc(i.titulo)}</button></h3>
    <p class="linha-org">${esc(i.org)}${i.sub ? ` · <span>${esc(i.sub)}</span>` : ''} <span class="selo selo-${i.tipo}">${esc(i.cat)}</span></p>
    ${(i.imagens || []).length ? `<button type="button" class="linha-fotos" data-abrir-carreira="${i.tipo}:${esc(i.id)}" aria-label="${t('carreira.imagens')}: ${esc(i.org)}">${i.imagens.slice(0, 4).map(u => `<img src="${esc(u)}" alt="" loading="lazy" width="56" height="42">`).join('')}</button>` : ''}
    ${i.desc ? (longo ? `<details class="linha-desc"><summary><span class="resumo">${esc(i.desc.replace(/\s+/g, ' ').slice(0, 220))}…</span><span class="mais">${t('trajetoria.mais')}</span></summary><div>${paragrafos(i.desc)}</div></details>` : `<div class="linha-desc">${paragrafos(i.desc)}</div>`) : ''}
  </div>
</li>`;
}

export function itensTrajetoria(d, t) {
  return [
    ...d.experiencias.map(e => ({ id: e.id, bloqueado: e.bloqueado, imagens: e.imagens_urls, tipo: 'exp', titulo: e.titulo, org: e.instituicao, sub: [e.regime, e.tipo_local, e.local].filter(Boolean).join(' · '), per: periodo(e.data_inicio, e.data_fim, e.atual, t), ini: e.data_inicio, desc: e.descricao, logo: e.logo_url, cat: catExp(e.categoria_profissional, t) || t('carreira.profissional') })),
    ...d.formacoes.map(f => ({ id: f.id, bloqueado: f.bloqueado, imagens: f.imagens_urls, tipo: 'form', titulo: f.curso, org: f.instituicao, sub: [f.tipo_academico, f.tipo_local].filter(Boolean).join(' · '), per: periodo(f.data_inicio, f.data_fim, f.atual, t), ini: f.data_inicio, desc: f.descricao, logo: f.logo_url, cat: t('carreira.academico') })),
  ].sort((a, b) => String(b.ini).localeCompare(String(a.ini)));
}

export function trajetoria(d, t) {
  const itens = itensTrajetoria(d, t);
  const cert = d.certificacoes.map(c => `<li class="revelar"><strong>${esc(c.nome)}</strong><span>${esc(c.instituicao)}${c.validade ? ` · ${esc(c.validade)}` : ''}</span></li>`).join('');
  const filtros = [['todos', 'carreira.filtro.todos'], ['exp', 'carreira.filtro.exp'], ['form', 'carreira.filtro.form']];
  return `${cabecalhoPagina(t, 'trajetoria')}
<div class="container trajetoria" data-trajetoria>
  ${graficoCarreira(d, t)}
  <div class="linha-barra"><div class="filtros filtros-linha" role="tablist" aria-label="${t('trajetoria.rotulo')}">${filtros.map(([f, k], i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-filtro-linha="${f}">${t(k)}</button>`).join('')}</div>
  ${vistas('trajetoria', t, ['lista', 'grade'])}</div>
  <ol class="linha" data-vista-alvo="trajetoria" data-vista="lista">${itens.map(i => itemLinha(i, t)).join('')}</ol>
  ${cert ? `<h2 class="titulo-secundario certs-titulo">${t('trajetoria.certificacoes')}</h2><ul class="certs">${cert}</ul>` : ''}
</div>
${recomendacoes(d, t)}`;
}

// ================= COMPETÊNCIAS =================
const nivelTexto = (n, t) => t('comp.niveis')[n >= 85 ? 4 : n >= 70 ? 3 : n >= 55 ? 2 : n >= 35 ? 1 : 0];
const catComp = (c, t) => { try { return t(`comp.cat.${c}`); } catch { return c; } };

// Grade e lista das habilidades: a área vira um cabeçalho e cada ramo um bloco com suas habilidades.
const habNivel = (n, t) => `<span class="hab-nv"><span class="nivel" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${n.nivel || 0}" aria-label="${esc(n.nome)}: ${nivelTexto(n.nivel || 0, t)}" style="--n:${n.nivel || 0}"><i></i></span><span class="mono">${nivelTexto(n.nivel || 0, t)}</span></span>`;
function habArea(r, filhos, t) {
  const ramos = filhos.get(r.id) || [];
  return `<section class="hab-area revelar" style="--cor:${CORES_ARVORE[r.categoria] || 'var(--acento)'}">
  <button type="button" class="hab-area-topo" data-abrir-skill="${esc(r.id)}"><span class="skill-ic">${iconeNo(r, 24)}</span>
    <span class="hab-area-txt"><strong>${esc(r.nome)}</strong></span>${habNivel(r, t)}</button>
  <ul class="hab-ramos">${ramos.map(b => {
    const folhas = (filhos.get(b.id) || []).sort((a, c) => (a.ordem || 0) - (c.ordem || 0));
    return `<li class="hab-ramo">
      <button type="button" class="hab hab-ramo-topo" data-abrir-skill="${esc(b.id)}"><span class="skill-ic skill-ic-p">${iconeNo(b, 18)}</span><strong>${esc(b.nome)}</strong>${habNivel(b, t)}</button>
      ${folhas.length ? `<ul class="hab-folhas">${folhas.map(f => `<li><button type="button" class="hab" data-abrir-skill="${esc(f.id)}"><span class="hab-folha-ic">${iconeNo(f, 16)}</span><span class="hab-nome">${esc(f.nome)}</span>${habNivel(f, t)}</button></li>`).join('')}</ul>` : ''}
    </li>`;
  }).join('')}</ul>
</section>`;
}

// Cor de cada árvore (categoria) e ícone de cada nó, escolhido pelo nome da habilidade.
export const CORES_ARVORE = { qa: '#0E9F8E', dev: '#5B5BD6', data: '#16A34A', devops: '#D08A1E', infra: '#B45309', idiomas: '#D6457A', ux: '#9B51E0', vibe: '#0EA5E9' };
const ICONES_SKILL = [
  [/QUALITY|QA$/, 'escudo'], [/MANUAL|FUNCTIONAL/, 'check'], [/EXPLORATORY/, 'busca'], [/REGRESSION/, 'repetir'], [/AUTOMATION|ROBOT/, 'robo'],
  [/PLAYWRIGHT|CYPRESS/, 'play'], [/GHERKIN|BDD/, 'arquivo'], [/METHODOLOG|ISO|CTFL|PRISMA/, 'medalha'], [/SHIFT/, 'esquerda'],
  [/DEVELOPMENT|FRONTEND|HTML|CSS|JAVASCRIPT|TYPESCRIPT|BOOTSTRAP|TAILWIND|REACT/, 'codigo'], [/BACKEND|NODE|PYTHON|SUPABASE/, 'servidor'],
  [/TAMPERMONKEY/, 'peca'], [/DATA|DASHBOARD|POWER BI|PLANILHA|SPREADSHEET/, 'grafico'], [/DEVOPS|AZURE/, 'infinito'],
  [/AGILE|SCRUM|KANBAN|JIRA|ZEPHYR|TOOLS/, 'quadro'], [/READING|LEITURA|LECTURA/, 'livro'], [/WRITING|ESCRITA|ESCRITURA/, 'lapis'], [/LISTENING|ESCUTA|AUDITIVA/, 'ouvir'],
  [/SPEAKING|CONVERSATION|CONVERSA/, 'fala'], [/IDIOMA|LANGUAGE|INGL|ENGLISH|ESPANHOL|SPANISH/, 'traduzir'],
  [/UX|UI/, 'pincel'], [/AI|IA |PROMPT|VIBE/, 'brilho'],
];
// o ícone escolhido no admin vale mais que o palpite pelo nome
const iconeSkill = (nome, icon) => (icon && CAMINHOS[icon] ? icon : (ICONES_SKILL.find(([re]) => re.test(nome.toUpperCase())) || [, 'estrela'])[1]);
const iconeNo = (n, tam = 24) => `<svg class="ic" viewBox="0 0 24 24" width="${tam}" height="${tam}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CAMINHOS[iconeSkill(n.nome, n.icon)]}</svg>`;
const tierNo = nv => (nv >= 85 ? 4 : nv >= 70 ? 3 : nv >= 55 ? 2 : nv >= 35 ? 1 : 0);
const estrelas = nv => `<span class="estrelas" aria-hidden="true">${'★'.repeat(tierNo(nv) + 1)}${'☆'.repeat(4 - tierNo(nv))}</span>`;

// Árvore estilo RPG: nós circulares com ícone e anel de nível, ligados por galhos; layout "tidy" de cima para baixo.
// Nós com filhos têm um botão +/− para recolher e expandir o ramo.
function arvoreRPG(raiz, filhos, t) {
  const DX = 152, DY = 140, R0 = 40, R = 30, TOPO = 60;
  const nos = [];
  let folha = 0;
  const posicionar = (n, prof) => {
    const sub = filhos.get(n.id) || [];
    let x;
    if (!sub.length) x = folha++ * DX;
    else { const xs = sub.map(f => posicionar(f, prof + 1)); x = (Math.min(...xs) + Math.max(...xs)) / 2; }
    nos.push({ n, x, y: TOPO + prof * DY, prof, pai: n.parent_id, temFilhos: sub.length > 0 });
    return x;
  };
  posicionar(raiz, 0);
  const larg = Math.max(folha, 1) * DX, alt = TOPO + Math.max(...nos.map(o => o.prof)) * DY + 90;
  const pos = new Map(nos.map(o => [o.n.id, o]));
  const off = DX / 2;
  const galhos = nos.filter(o => o.pai && pos.has(o.pai)).map(o => {
    const p = pos.get(o.pai), x1 = p.x + off, y1 = p.y + (p.prof ? R : R0), x2 = o.x + off, y2 = o.y - R, ym = (y1 + y2) / 2;
    return `<path class="rpg-galho ${(o.n.nivel || 0) >= 70 ? 'forte' : ''}" data-filho="${esc(o.n.id)}" d="M${x1} ${y1} C${x1} ${ym} ${x2} ${ym} ${x2} ${y2}"/>`;
  }).join('');
  const circulos = nos.map(o => {
    const r = o.prof ? R : R0, nv = o.n.nivel || 0, circ = 2 * Math.PI * (r + 6);
    const tier = nv >= 85 ? 4 : nv >= 70 ? 3 : nv >= 55 ? 2 : nv >= 35 ? 1 : 0;
    const x = o.x + off, tam = o.prof ? 22 : 28, trancado = o.n.bloqueado;
    return `<g class="rpg-no tier-${tier} ${o.prof ? '' : 'raiz'} ${trancado ? 'trancado' : ''}" transform="translate(${x} ${o.y})" data-no="${esc(o.n.id)}" data-pai="${esc(o.pai || '')}" ${trancado ? `aria-disabled="true" aria-label="${esc(o.n.nome)}: ${t('projetos.bloqueado')}"` : `tabindex="0" role="button" data-abrir-skill="${esc(o.n.id)}" aria-label="${esc(o.n.nome)}: ${nivelTexto(nv, t)} (${nv}%)"`}>
      <title>${esc(o.n.nome)}${trancado ? '' : ` · ${nivelTexto(nv, t)} (${nv}%)`}</title>
      <circle class="rpg-aura" r="${r + 14}"/>
      <circle class="rpg-trilha" r="${r + 6}"/>
      ${trancado ? '' : `<circle class="rpg-nivel" r="${r + 6}" stroke-dasharray="${((circ * nv) / 100).toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90)"/>`}
      <circle class="rpg-miolo" r="${r}"/>
      <svg class="rpg-icone" x="${-tam / 2}" y="${-tam / 2}" width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${CAMINHOS[trancado ? 'cadeado' : iconeSkill(o.n.nome, o.n.icon)]}</svg>
      <text class="rpg-nome" y="${r + 24}">${esc(o.n.nome.length > 19 ? o.n.nome.slice(0, 18) + '…' : o.n.nome)}</text>
      ${trancado ? '' : `<text class="rpg-tier" y="${r + 38}">${'★'.repeat(tier + 1)}${'☆'.repeat(4 - tier)}</text>`}
    </g>${o.temFilhos ? `<g class="rpg-alternar" transform="translate(${x + r * 0.78} ${o.y + r * 0.78})" data-alternar="${esc(o.n.id)}" data-pai-alt="${esc(o.pai || '')}" tabindex="0" role="button" aria-expanded="true" aria-label="${esc(t('comp.alternarNo', { nome: o.n.nome }))}"><circle r="11"/><text dy=".35em">−</text></g>` : ''}`;
  }).join('');
  return `<svg class="rpg-svg" viewBox="-20 0 ${larg + 40} ${alt}" width="${larg + 40}" height="${alt}" role="group" aria-label="${esc(raiz.nome)}" style="--cor:${CORES_ARVORE[raiz.categoria] || 'var(--acento)'}">${galhos}${circulos}</svg>`;
}

const normalizar = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
// projetos em que a habilidade aparece (tecnologias, título ou descrição)
function projetosDaSkill(n, projetos = []) {
  const termos = [n.nome, n.i18n?.en?.nome].filter(Boolean).flatMap(x => normalizar(x).split(/\s+(?:e|and|y)\s+|\s*\/\s*|\s*\(\s*|\)\s*/)).map(x => x.trim()).filter(x => x.length > 2);
  if (!termos.length) return [];
  const casa = p => { const txt = normalizar([p.titulo, p.descricao_curta, ...(p.tecnologias || [])].join(' | ')); return termos.some(x => new RegExp(`(^|[^a-z0-9])${x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`).test(txt)); };
  return projetos.filter(casa).slice(0, 6);
}

export function detalheSkill(n, todos, t, projetos = []) {
  const sub = todos.filter(x => x.parent_id === n.id).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  const caminho = [];
  for (let p = todos.find(x => x.id === n.parent_id); p; p = todos.find(x => x.id === p.parent_id)) caminho.unshift(p);
  const nv = n.nivel || 0, cor = CORES_ARVORE[n.categoria] || 'var(--acento)';
  const usados = projetosDaSkill(n, projetos);
  return `<button class="modal-fechar" type="button" data-fechar-modal aria-label="${t('projetos.fechar')}">${icone('fechar')}</button>
<div class="skill-detalhe" style="--cor:${cor}">
  <header class="skill-cabeca">
    <span class="skill-ic">${iconeNo(n, 30)}</span>
    <div><p class="mono skill-caminho">${[catComp(n.categoria, t), ...caminho.map(c => c.nome)].map(esc).join(' <span aria-hidden="true">›</span> ')}</p>
    <h2 id="modal-titulo">${esc(n.nome)}</h2></div>
  </header>
  <div class="skill-nivel-caixa">
    <div class="skill-nivel-topo"><strong>${nivelTexto(nv, t)}</strong>${estrelas(nv)}<span class="mono">${nv}%</span></div>
    <span class="nivel nivel-g" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${nv}" aria-label="${esc(n.nome)}: ${nivelTexto(nv, t)}" style="--n:${nv}"><i></i></span>
  </div>
  ${n.descricao ? `<p class="skill-desc">${esc(n.descricao)}</p>` : ''}
  ${sub.length ? `<h3 class="rotulo">${t('comp.subHabilidades')}</h3><ul class="skill-subs">${sub.map(s => `<li><button type="button" data-abrir-skill="${esc(s.id)}"><span class="skill-ic skill-ic-p">${iconeNo(s, 18)}</span><span class="skill-sub-nome">${esc(s.nome)}</span><span class="mono">${nivelTexto(s.nivel || 0, t)}</span><span class="nivel" style="--n:${s.nivel || 0}"><i></i></span></button></li>`).join('')}</ul>` : ''}
  ${usados.length ? `<h3 class="rotulo">${t('comp.ondeUsei')}</h3><ul class="mini-projetos">${usados.map(p => `<li><button type="button" data-abrir-projeto="${esc(p.slug)}">${p.imagem_url ? `<img class="${ehCena(p.imagem_url) ? 'capa-cena' : ''}" src="${esc(p.imagem_url)}" alt="" loading="lazy">` : ''}<span><strong>${esc(p.titulo)}</strong><span>${esc(p.descricao_curta)}</span></span></button></li>`).join('')}</ul>` : ''}
</div>`;
}

export function detalheConquista(c, t, lang) {
  const evid = [c.evidence, c.evidence_file, ...(c.evidencias_urls || [])].filter(Boolean);
  const data = c.data_conquista ? new Intl.DateTimeFormat({ pt: 'pt-BR', en: 'en-US', es: 'es-ES' }[lang], { dateStyle: 'long' }).format(new Date(`${c.data_conquista}T12:00:00`)) : '';
  return `<button class="modal-fechar" type="button" data-fechar-modal aria-label="${t('projetos.fechar')}">${icone('fechar')}</button>
<div class="conquista-detalhe ${c.desbloqueado ? '' : 'bloqueada'}">
  <div class="medalha medalha-g">${c.imagem_url ? `<img src="${esc(c.imagem_url)}" alt="" width="160" height="160">` : `<span>${esc(c.titulo.slice(0, 3))}</span>`}</div>
  <div><p class="mono">${esc(catComp(String(c.categoria).split(',')[0].trim(), t))}</p><h2 id="modal-titulo">${esc(c.titulo)}</h2><p>${esc(c.descricao)}</p>
  <p class="mono conquista-status">${c.desbloqueado ? (data ? t('comp.desbloqueada', { data }) : '✓') : `🔒 ${t('comp.bloqueada')}`}</p>
  ${evid.length && c.desbloqueado ? `<ul class="arquivos">${evid.map((u, i) => (/\.(png|jpe?g|webp|gif|avif)($|\?)/i.test(u)
    ? `<li><a href="${esc(u)}" data-visor aria-label="${t('projetos.ampliar')}"><img src="${esc(u)}" alt="${esc(`${c.titulo} (${i + 1})`)}" loading="lazy"><span class="galeria-lupa" aria-hidden="true">${icone('ampliar')}</span></a></li>`
    : `<li><a class="btn btn-linha btn-pequeno" href="${esc(u)}" target="_blank" rel="noopener">${t('comp.evidencia')}${evid.length > 1 ? ` ${i + 1}` : ''} ${icone('externo')}</a></li>`)).join('')}</ul>` : ''}</div>
</div>`;
}

export function competencias(d, t) {
  const filhos = new Map();
  for (const n of d.arvore) if (n.parent_id) (filhos.get(n.parent_id) || filhos.set(n.parent_id, []).get(n.parent_id)).push(n);
  const raizes = d.arvore.filter(n => !n.parent_id);
  const grupos = {};
  for (const c of d.competencias) (grupos[c.categoria] ||= []).push(c.nome);
  const conq = d.conquistas;
  const feitas = conq.filter(c => c.desbloqueado).length;
  const catsConq = [...new Set(conq.flatMap(c => String(c.categoria).split(',').map(x => x.trim())).filter(Boolean))];
  return `${cabecalhoPagina(t, 'competencias')}
<div class="container competencias-pagina">
  <section class="arvore-secao" aria-labelledby="arvore-titulo">
    <div class="secao-topo"><h2 id="arvore-titulo" class="titulo-secundario">${t('comp.arvore')}</h2>${vistas('arvore', t, ['arvore', 'grade', 'lista'])}</div>
    <div data-vista-alvo="arvore" data-vista="arvore">
      <div class="rpg">
        <div class="rpg-topo"><div class="filtros" role="tablist" aria-label="${t('comp.arvore')}">${raizes.map((r, i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-raiz="${esc(r.id)}" style="--rpg-ativa:${CORES_ARVORE[r.categoria] || 'var(--acento)'}">${esc(catComp(r.categoria, t))}</button>`).join('')}</div>
          <div class="rpg-acoes"><button type="button" data-rpg-todos="abrir">${t('comp.expandir')}</button><button type="button" data-rpg-todos="fechar">${t('comp.recolher')}</button>
            <span class="rpg-zoom" role="group" aria-label="Zoom"><button type="button" data-zoom="-1" aria-label="${t('comp.zoomMenos')}" title="${t('comp.zoomMenos')}">−</button><button type="button" data-zoom="0" aria-label="${t('comp.zoomAjustar')}" title="${t('comp.zoomAjustar')}">${icone('vista-arvore')}</button><button type="button" data-zoom="1" aria-label="${t('comp.zoomMais')}" title="${t('comp.zoomMais')}">+</button></span></div></div>
        <p class="dica-rpg mono">${t('comp.dicaZoom')}</p>
        ${raizes.map((r, i) => `<div class="rpg-palco" data-arrastar data-lenis-prevent data-palco="${esc(r.id)}" ${i ? 'hidden' : ''}>${arvoreRPG(r, filhos, t)}</div>`).join('')}
      </div>
      <div class="habs">${raizes.map(r => habArea(r, filhos, t)).join('')}</div>
    </div>
  </section>

  <section class="comp-resumo" aria-label="${t('sobre.competencias')}">
    <div class="revelar"><h2 class="rotulo">${t('sobre.competencias')}</h2>${Object.entries(grupos).map(([g, itens]) => `<div class="comp-grupo"><p>${esc(g)}</p><ul class="tags">${itens.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}</div>
    <div class="revelar"><h2 class="rotulo">${t('sobre.comportamentais')}</h2><ul class="lista-simples">${d.comportamentais.map(c => `<li>${esc(c.nome)}</li>`).join('')}</ul>
      <h2 class="rotulo idiomas-titulo">${t('sobre.idiomas')}</h2><ul class="lista-simples">${d.idiomas.map(i => `<li><strong>${esc(i.idioma)}</strong> · ${esc(i.nivel)}${i.cursando ? ` <span class="mono">(${t('sobre.cursando')})</span>` : ''}</li>`).join('')}</ul></div>
  </section>

  <section class="conquistas" aria-labelledby="conq-titulo" data-conquistas>
    <div class="conq-topo">
      <div><h2 id="conq-titulo" class="titulo-secundario">${t('comp.conquistas')}</h2>
      <p class="mono">${t('comp.desbloqueadas', { n: feitas, total: conq.length })}</p></div>
      <div class="conq-progresso" role="progressbar" aria-valuemin="0" aria-valuemax="${conq.length}" aria-valuenow="${feitas}" aria-label="${t('comp.desbloqueadas', { n: feitas, total: conq.length })}" style="--p:${conq.length ? Math.round((feitas / conq.length) * 100) : 0}"><span>${conq.length ? Math.round((feitas / conq.length) * 100) : 0}%</span></div>
    </div>
    <div class="conq-barra"><div class="filtros" role="tablist" aria-label="${t('comp.conquistas')}">${['todas', ...catsConq].map((c, i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-filtro-conq="${esc(c)}">${c === 'todas' ? t('comp.todas') : esc(catComp(c, t))}</button>`).join('')}</div>
    ${vistas('conquistas', t)}</div>
    <ul class="medalhas" data-vista-alvo="conquistas" data-vista="grade">${conq.map(c => `<li class="revelar" data-cats="${esc(String(c.categoria).split(',').map(x => x.trim()).join(' '))}">
      <button type="button" class="medalha-botao ${c.desbloqueado ? '' : 'bloqueada'} ${c.bloqueado ? 'trancado' : ''}" ${c.bloqueado ? 'aria-disabled="true"' : `data-abrir-conquista="${esc(c.id)}"`}>
        <span class="medalha">${c.imagem_url ? `<img src="${esc(c.imagem_url)}" alt="" width="96" height="96" loading="lazy">` : `<span>${esc(c.titulo.slice(0, 3))}</span>`}</span>
        <span class="medalha-nome">${esc(c.titulo)}</span><span class="medalha-desc">${esc(c.descricao || '')}</span>${c.desbloqueado ? '' : `<span class="vh">${t('comp.bloqueada')}</span>`}
      </button></li>`).join('')}</ul>
  </section>
</div>`;
}

// ================= SOBRE MIM =================
export function sobre(d, t) {
  const s = textoSite(d.site, 'sobre', d.lang), m = textoSite(d.site, 'sobre_mim', d.lang), pat = textoSite(d.site, 'patrocinio', d.lang);
  const apoiados = (d.site.patrocinio?.projetos || []).map(slug => d.projetos.find(p => p.slug === slug)).filter(Boolean);
  return `${cabecalhoPagina(t, 'sobre')}
<div class="container sobre-pagina">
  <section class="sobre-intro">
    <figure class="sobre-foto revelar"><img src="/media/perfil-padrao.webp" alt="${t('sobre.foto')}" width="768" height="1024" loading="lazy"></figure>
    <div class="sobre-blocos">
      <article class="revelar"><h2 class="rotulo">${t('sobre.resumo')}</h2><p class="sobre-lead">${esc(s.texto)}</p></article>
      <article class="revelar"><h2 class="rotulo">${t('sobre.carreira')}</h2><p class="recolhivel">${esc(m.carreira)}</p></article>
      <article class="revelar"><h2 class="rotulo">${t('sobre.pessoal')}</h2><p class="recolhivel">${esc(m.pessoal)}</p></article>
      <div class="acoes"><a class="btn btn-escuro" href="${rota(d.lang, 'cv')}">${icone('download')} ${t('sobre.verCv')}</a><a class="btn btn-linha" href="${rota(d.lang, 'contato')}">${t('nav.contato')} ${icone('seta')}</a></div>
    </div>
  </section>
  <section class="mvv" aria-label="${t('sobre.missao')}, ${t('sobre.visao')}, ${t('sobre.valores')}">
    <article class="revelar"><span class="mvv-ic">${icone('escudo')}</span><h2>${t('sobre.missao')}</h2><p>${esc(m.missao)}</p></article>
    <article class="revelar"><span class="mvv-ic">${icone('brilho')}</span><h2>${t('sobre.visao')}</h2><p>${esc(m.visao)}</p></article>
    <article class="revelar"><span class="mvv-ic">${icone('estrela')}</span><h2>${t('sobre.valores')}</h2><ul class="lista-check">${(m.valores || []).map(v => `<li>${icone('check')}${esc(v)}</li>`).join('')}</ul></article>
  </section>
  ${pat.titulo ? `<section class="patrocinio revelar" aria-labelledby="pat-titulo">
    <div><h2 id="pat-titulo" class="titulo-secundario">${esc(pat.titulo)}</h2><p>${esc(pat.texto)}</p>
      <a class="btn btn-acento" href="${rota(d.lang, 'contato')}?assunto=patrocinio">${t('patrocinio.cta')} ${icone('seta')}</a></div>
    ${apoiados.length ? `<ul class="patrocinio-projetos">${apoiados.map(p => `<li><a href="${esc(p.link_projeto || '#')}" target="_blank" rel="noopener">${p.imagem_url ? `<img class="${ehCena(p.imagem_url) ? 'capa-cena' : ''}" src="${esc(p.imagem_url)}" alt="" loading="lazy">` : ''}<strong>${esc(p.titulo)}</strong><span>${esc(p.descricao_curta)}</span></a></li>`).join('')}</ul>` : ''}
  </section>` : ''}
</div>`;
}

// ================= CONTATO =================
export function canais(d, t) {
  const c = d.site.contato || {};
  return [
    c.email && [`mailto:${c.email}`, 'email', c.email],
    c.whatsapp && [`https://wa.me/${c.whatsapp}`, 'whatsapp', t('contato.whatsapp')],
    c.linkedin && [c.linkedin, 'linkedin', t('contato.linkedin')],
    c.github && [c.github, 'github', t('contato.github')],
  ].filter(Boolean);
}

export function contato(d, t) {
  return `<section class="contato-hero" aria-labelledby="contato-titulo">
  <video class="contato-video" data-video-auto muted loop playsinline preload="metadata" poster="/media/entrevista-poster.webp" aria-hidden="true"><source src="/media/entrevista.mp4" type="video/mp4"></video>
  <div class="contato-veu" aria-hidden="true"></div>
  <div class="container contato-texto">
    <p class="rotulo rotulo-claro">${t('contato.rotulo')}</p>
    <h1 id="contato-titulo" class="pag-titulo" data-dividir>${t('pag.contato.titulo')}</h1>
    <p>${t('pag.contato.sub')}</p>
  </div>
</section>
<div class="container contato-grade">
  <form class="form" data-form novalidate aria-labelledby="form-titulo">
    <h2 id="form-titulo" class="titulo-secundario">${t('contato.formTitulo')}</h2>
    <div class="campo"><label for="f-nome">${t('contato.nome')}</label><input id="f-nome" name="nome" autocomplete="name" required maxlength="120"></div>
    <div class="campo"><label for="f-email">${t('contato.email')}</label><input id="f-email" name="email" type="email" autocomplete="email" required maxlength="200"></div>
    <div class="campo"><label for="f-tipo">${t('contato.tipo')}</label><select id="f-tipo" name="assunto">
      <option value="vaga">${t('contato.tipo.vaga')}</option><option value="freela">${t('contato.tipo.freela')}</option><option value="patrocinio">${t('contato.tipo.patrocinio')}</option><option value="outro">${t('contato.tipo.outro')}</option></select></div>
    <div class="campo"><label for="f-msg">${t('contato.mensagem')}</label><textarea id="f-msg" name="mensagem" rows="6" required maxlength="5000"></textarea></div>
    <div class="campo-isca" aria-hidden="true"><label for="f-site">Site</label><input id="f-site" name="site" tabindex="-1" autocomplete="off"></div>
    <button class="btn btn-acento" type="submit" data-enviar data-texto-enviando="${t('contato.enviando')}">${t('contato.enviar')} ${icone('seta')}</button>
    <p class="form-status" role="status" aria-live="polite" data-status data-ok="${esc(t('contato.ok'))}" data-erro="${esc(t('contato.erro'))}" data-invalido="${esc(t('contato.invalido'))}"></p>
  </form>
  <div class="contato-lado">
    <h2 class="rotulo">${t('contato.canais')}</h2>
    <ul class="canais">${canais(d, t).map(([href, ic, txt]) => `<li><a href="${esc(href)}" ${href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>${icone(ic)}<span>${esc(txt)}</span>${icone('seta')}</a></li>`).join('')}
      <li><a href="${rota(d.lang, 'cv')}">${icone('download')}<span>${t('contato.cv')}</span>${icone('seta')}</a></li></ul>
    <details class="valor-dobra" data-dobra-desktop><summary>${icone('grafico')}<span>${t('valor.titulo')}</span>${icone('baixo')}</summary>${cartaoValor(d, t)}</details>
  </div>
</div>`;
}

// JSON-LD (Person + WebSite + página)
export function jsonLd(d, t, pagina, titulo) {
  const c = d.site.contato || {};
  const seo = textoSite(d.site, 'seo', d.lang);
  const pessoa = { '@type': 'Person', '@id': `${SITE.url}/#pessoa`, name: SITE.nome, jobTitle: 'QA Engineer', url: SITE.url, image: `${SITE.url}/media/perfil-social.webp`,
    email: c.email ? `mailto:${c.email}` : undefined, description: seo.descricao,
    address: { '@type': 'PostalAddress', addressLocality: 'Campinas', addressRegion: 'SP', addressCountry: 'BR' },
    sameAs: [c.linkedin, c.github].filter(Boolean),
    knowsAbout: ['Software Quality Assurance', 'Test Automation', 'Playwright', 'Robot Framework', 'Cypress', 'Gherkin', 'BDD', 'Shift-left Testing', 'ISTQB CTFL', 'Jira', 'Azure DevOps', 'Regression Testing', 'Exploratory Testing', 'AI-assisted development'],
    knowsLanguage: ['pt-BR', 'en', 'es'],
    alumniOf: d.formacoes.map(f => ({ '@type': 'EducationalOrganization', name: f.instituicao })),
    worksFor: d.experiencias.filter(e => e.atual).map(e => ({ '@type': 'Organization', name: e.instituicao })) };
  const url = SITE.url + rota(d.lang, pagina);
  const pag = pagina === 'projetos'
    ? { '@type': 'CollectionPage', url, name: titulo, inLanguage: t('meta.lang'), about: { '@id': `${SITE.url}/#pessoa` },
        hasPart: d.projetos.map(p => ({ '@type': 'CreativeWork', name: p.titulo, description: p.descricao_curta, url: p.link_projeto || p.link_github || undefined, image: p.imagem_url || undefined, keywords: (p.tecnologias || []).join(', ') })) }
    : { '@type': pagina ? 'WebPage' : 'ProfilePage', url, name: titulo, inLanguage: t('meta.lang'), mainEntity: { '@id': `${SITE.url}/#pessoa` } };
  return { '@context': 'https://schema.org', '@graph': [pessoa, { '@type': 'WebSite', '@id': `${SITE.url}/#site`, url: SITE.url, name: SITE.nome, publisher: { '@id': `${SITE.url}/#pessoa` } }, pag] };
}
