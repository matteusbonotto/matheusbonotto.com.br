// Interações e efeitos de todas as páginas (exceto o currículo). O HTML vem pronto do pré-render;
// aqui ligamos o comportamento e, se o banco mudou depois do build, redesenhamos com os dados atuais.
import './styles/site.css';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { tradutor } from './i18n/ui.js';
import { buscarTudo, prepararIdioma } from './lib/dados.js';
import { particulas } from './lib/particulas.js';
import { assinatura, PAGINAS } from './render/documento.js';
import { icone } from './render/comum.js';
import { detalheCarreira, detalheConquista, detalheProjeto, detalheRecomendacao, detalheSkill, formularioRecomendacao } from './render/paginas.js';

gsap.registerPlugin(ScrollTrigger, Flip);
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const lang = document.documentElement.dataset.lang || 'pt';
const pagina = document.body.dataset.pagina === 'inicio' ? '' : document.body.dataset.pagina;
const t = tradutor(lang);
const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mouse = matchMedia('(hover: hover) and (pointer: fine)').matches;
const main = $('[data-main]');
let dados = JSON.parse($('#dados')?.textContent || '{}');
let limpar = [];

// ---------- Rolagem suave (Lenis) sincronizada com o GSAP ----------
let lenis = null;
if (!semMovimento) {
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// ---------- Tela de abertura ----------
// Sai quando passaram 3 s, a página (com os quadros do vídeo) carregou e o vídeo do topo pode tocar; no máximo 8 s.
const telaAbertura = $('[data-splash]');
if (telaAbertura && !document.documentElement.classList.contains('sem-splash')) {
  lenis?.stop();
  const tempo = new Promise(r => setTimeout(r, Math.max(0, 3000 - performance.now())));
  const carregou = new Promise(r => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })));
  const video = $('.contato-video');
  const videoPronto = new Promise(r => (!video || video.readyState >= 3 ? r() : video.addEventListener('canplay', r, { once: true })));
  Promise.race([Promise.all([tempo, carregou, videoPronto]), new Promise(r => setTimeout(r, 8000))]).then(() => {
    try { sessionStorage.setItem('splash', '1'); sessionStorage.setItem(`splash:${location.pathname}`, '1'); } catch {}
    telaAbertura.classList.add('saindo');
    lenis?.start();
    setTimeout(() => telaAbertura.remove(), 700);
  });
} else telaAbertura?.remove();

// ---------- Navegação ----------
const nav = $('[data-nav]');
const botaoMenu = $('[data-menu]');
function menu(abrir) {
  nav.classList.toggle('aberta', abrir);
  botaoMenu.setAttribute('aria-expanded', abrir);
  botaoMenu.innerHTML = icone(abrir ? 'fechar' : 'menu');
  botaoMenu.setAttribute('aria-label', abrir ? botaoMenu.dataset.rotuloFechar : botaoMenu.dataset.rotuloAbrir);
  document.body.style.overflow = abrir ? 'hidden' : '';
  abrir ? lenis?.stop() : lenis?.start();
}
botaoMenu.addEventListener('click', () => menu(!nav.classList.contains('aberta')));
addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('aberta')) { menu(false); botaoMenu.focus(); } });
let ultimoY = 0, ultimoEscuro = '';
const aoRolar = () => {
  const y = scrollY;
  // lê a altura antes de mexer em classes: ler depois forçaria um layout a cada evento de rolagem
  const hero = pagina === '' && document.querySelector('.hero.animado');
  const fimHero = hero ? Math.max(1, hero.offsetHeight - innerHeight) : 1;
  nav.classList.toggle('rolou', y > 10 && pagina !== 'contato');
  if (pagina === 'contato') nav.classList.add('escura', 'contato'); // contato abre sobre vídeo escuro
  // na home a barra começa clara e escurece junto com o vídeo de abertura; quando o vídeo vira quadro, volta ao normal
  let v = 0;
  if (hero) {
    const p = Math.min(1, y / fimHero);
    v = p < 0.55 ? p / 0.55 : Math.max(0, 1 - (p - 0.55) / 0.2);
  }
  const escuro = v.toFixed(2);
  if (escuro !== ultimoEscuro) { nav.style.setProperty('--escuro', escuro); ultimoEscuro = escuro; }
  nav.classList.toggle('escura', v > 0.45);
  nav.classList.toggle('sobre-video', v > 0.02);


  ultimoY = y;
};
addEventListener('scroll', aoRolar, { passive: true });
aoRolar();
document.addEventListener('click', e => {
  const a = e.target.closest('a[href*="#"]');
  if (!a || a.target) return;
  const url = new URL(a.href);
  if (url.pathname !== location.pathname || !url.hash) return;
  const alvo = document.getElementById(decodeURIComponent(url.hash.slice(1)));
  if (!alvo) return;
  e.preventDefault();
  if (nav.classList.contains('aberta')) menu(false);
  lenis ? lenis.scrollTo(alvo, { offset: -8 }) : alvo.scrollIntoView({ behavior: semMovimento ? 'auto' : 'smooth' });
  history.replaceState(null, '', url.hash);
});

// ---------- Cursor e botões magnéticos ----------
const cursor = $('[data-cursor]');
if (mouse && !semMovimento) {
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.18, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.18, ease: 'power3' });
  addEventListener('pointermove', e => { cursor.classList.add('ativo'); xTo(e.clientX); yTo(e.clientY); }, { passive: true });
  document.addEventListener('pointerover', e => cursor.classList.toggle('grande', !!e.target.closest('a, button, [data-arrastar], summary, input, select, textarea')));
  document.documentElement.addEventListener('pointerleave', () => cursor.classList.remove('ativo'));
}
function magneticos(raiz) {
  if (!mouse || semMovimento) return;
  for (const el of $$('[data-magnetico]', raiz)) {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.4, ease: 'power3' });
    });
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'power3.out' }));
  }
}
magneticos(nav);
// acesso discreto ao admin: clique direito no logo abre um balão de cheat code; com o código certo
// aparece o item "Admin" no menu (lembrado neste navegador), que leva à tela de login
const CHEAT = 'iddqd';
const linkAdmin = (animar = false) => {
  const menu = $('.nav-links', nav);
  if (!menu || $('.nav-admin', menu)) return;
  const a = document.createElement('a');
  a.href = '/admin/'; a.className = 'nav-admin'; a.innerHTML = `${icone('cadeado')}${t('nav.admin')}`;
  $('.nav-cv', menu).before(a);
  if (animar && !semMovimento) gsap.from(a, { opacity: 0, y: -8, duration: .6, ease: 'power2.out' });
};
try { if (localStorage.getItem('admin-liberado') === '1') linkAdmin(); } catch {}
function balaoCheat(ancora) {
  $('.cheat')?.remove();
  const b = document.createElement('div');
  b.className = 'cheat'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', t('cheat.titulo'));
  b.innerHTML = `<form class="cheat-form" novalidate><label for="cheat-codigo">${icone('codigo')}${t('cheat.titulo')}</label>
    <input id="cheat-codigo" name="codigo" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${t('cheat.dica')}" aria-describedby="cheat-msg">
    <p class="cheat-msg" id="cheat-msg" aria-live="assertive"></p></form>`;
  document.body.append(b);
  const r = ancora.getBoundingClientRect();
  const esq = Math.max(12, Math.min(r.left, innerWidth - b.offsetWidth - 12));
  b.style.left = `${esq}px`;
  b.style.top = `${r.bottom + 12}px`;
  // sem espaço embaixo (logo do rodapé): o balão abre para cima
  if (r.bottom + 12 + b.offsetHeight > innerHeight) { b.style.top = `${r.top - b.offsetHeight - 12}px`; b.classList.add('acima'); }
  b.style.setProperty('--seta', `${Math.max(16, r.left + r.width / 2 - esq)}px`);
  const campo = $('input', b), msg = $('.cheat-msg', b);
  const fechar = () => { removeEventListener('pointerdown', fora, true); removeEventListener('keydown', esc); b.classList.add('saindo'); setTimeout(() => b.remove(), semMovimento ? 0 : 250); };
  const fora = e => { if (!b.contains(e.target)) fechar(); };
  const esc = e => { if (e.key === 'Escape') fechar(); };
  addEventListener('pointerdown', fora, true); addEventListener('keydown', esc);
  campo.addEventListener('input', () => { b.classList.remove('erro'); msg.textContent = ''; });
  $('form', b).addEventListener('submit', e => {
    e.preventDefault();
    if (campo.value.trim().toLowerCase() === CHEAT) {
      b.classList.remove('erro'); b.classList.add('certo'); msg.textContent = t('cheat.ok');
      try { localStorage.setItem('admin-liberado', '1'); } catch {}
      linkAdmin(true);
      setTimeout(fechar, 1100);
    } else {
      b.classList.remove('erro'); void b.offsetWidth; b.classList.add('erro');
      msg.textContent = t('cheat.erro'); campo.select();
    }
  });
  requestAnimationFrame(() => campo.focus());
}
document.addEventListener('contextmenu', e => { const m = e.target.closest('.nav-marca img, .rodape-marca img'); if (!m) return; e.preventDefault(); balaoCheat(m); });
// idioma: escolha lembrada; no celular, a primeira visita pergunta o idioma antes da leitura
document.addEventListener('click', e => { const a = e.target.closest('a[hreflang]'); if (a) { try { localStorage.setItem('idioma', a.hreflang); } catch {} } });
(() => {
  let escolhido = null;
  try { escolhido = localStorage.getItem('idioma'); } catch {}
  if (escolhido || !matchMedia('(max-width: 1079px)').matches) return;
  const aviso = document.createElement('div');
  aviso.className = 'idioma-aviso'; aviso.setAttribute('role', 'dialog'); aviso.setAttribute('aria-label', 'Idioma · Language · Idioma');
  aviso.innerHTML = `<p>Idioma · Language · Idioma</p><div>${$$('[data-idioma]').map(a => `<a href="${a.getAttribute('href')}" hreflang="${a.hreflang}" ${a.getAttribute('aria-current') ? 'aria-current="true"' : ''}>${a.textContent}</a>`).join('')}</div><button type="button" aria-label="${t('projetos.fechar')}">×</button>`;
  $('button', aviso).addEventListener('click', () => { try { localStorage.setItem('idioma', lang); } catch {} aviso.remove(); });
  document.body.append(aviso);
})();
// fecha o seletor de idioma ao tocar fora
document.addEventListener('click', e => { const d = $('[data-lingua]'); if (d?.open && !d.contains(e.target)) d.open = false; });

// tema claro/escuro (a escolha fica salva; sem escolha, segue o sistema)
$('[data-tema]')?.addEventListener('click', () => {
  const atual = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const novo = atual === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = novo;
  try { localStorage.setItem('tema', novo); } catch {}
  dispatchEvent(new Event('tema'));
});
const fundo = $('[data-particulas]');
// no toque a rede de partículas fica parada: o celular gasta a bateria e a rolagem com o que importa
if (fundo) particulas(fundo, { semMovimento: semMovimento || !mouse });

// ---------- Efeitos gerais ----------
function dividirPalavras(raiz) {
  for (const el of $$('[data-dividir]', raiz)) {
    if (el.dataset.dividido) continue;
    el.dataset.dividido = '1';
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = el.textContent.trim().split(/\s+/).map((p, i) => `<span class="palavra" aria-hidden="true"><span style="--i:${i}">${p}</span></span>`).join(' ');
  }
}

function revelar(raiz) {
  const io = new IntersectionObserver(entradas => {
    for (const en of entradas) if (en.isIntersecting) { en.target.classList.add('visivel'); io.unobserve(en.target); }
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.1 });
  $$('.revelar, [data-dividir], [data-carreira]', raiz).forEach(el => {
    const irmaos = el.parentElement ? $$(':scope > .revelar', el.parentElement) : [];
    if (irmaos.length > 1) el.style.setProperty('--atraso', `${Math.min(irmaos.indexOf(el), 8) * 70}ms`);
    io.observe(el);
  });
  const io2 = new IntersectionObserver(entradas => {
    for (const en of entradas) if (en.isIntersecting) { contar(en.target); io2.unobserve(en.target); }
  }, { threshold: 0.6 });
  $$('[data-contar]', raiz).forEach(el => io2.observe(el));
  limpar.push(() => { io.disconnect(); io2.disconnect(); });
}

// o texto do número nunca muda: robôs e leitores de tela leem sempre o valor real, com ou sem JS.
// A contagem é só visual, num ::after (data-mostra) que cobre o texto enquanto ela dura.
function contar(el) {
  const alvo = +el.dataset.contar;
  if (semMovimento || !alvo) return;
  const o = { v: 0 };
  gsap.to(o, { v: alvo, duration: 1.6, ease: 'power3.out',
    onUpdate: () => { el.dataset.mostra = Math.round(o.v); el.classList.add('contando'); },
    onComplete: () => el.classList.remove('contando') });
}

function inclinar(raiz) {
  if (!mouse || semMovimento) return;
  for (const card of $$('[data-inclinar]', raiz)) {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', `${x * 100}%`); card.style.setProperty('--my', `${y * 100}%`);
      gsap.to(card, { rotateY: (x - 0.5) * 6, rotateX: (0.5 - y) * 6, transformPerspective: 1100, duration: 0.5, ease: 'power3' });
    });
    card.addEventListener('pointerleave', () => gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.8, ease: 'power3' }));
  }
}


function videosAuto(raiz) {
  for (const v of $$('[data-video-auto]', raiz)) {
    if (semMovimento) continue;
    // toca uma vez (sem loop) e para no último quadro; não recomeça ao voltar à tela
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { if (!v.ended) { v.preload = 'auto'; v.play().catch(() => {}); } } else v.pause(); }, { threshold: 0.1 });
    io.observe(v);
    limpar.push(() => io.disconnect());
  }
}

function arrastar(raiz) {
  for (const el of $$('[data-arrastar]', raiz)) {
    let x0 = 0, s0 = 0, ativo = false, moveu = false;
    el.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.target.closest('summary, a')) return; ativo = true; moveu = false; x0 = e.clientX; s0 = el.scrollLeft; el.classList.add('arrastando'); });
    const mover = e => { if (!ativo) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) moveu = true; el.scrollLeft = s0 - dx; };
    const soltar = () => { if (!ativo) return; ativo = false; el.classList.remove('arrastando'); };
    addEventListener('pointermove', mover); addEventListener('pointerup', soltar);
    el.addEventListener('click', e => { if (moveu) { e.preventDefault(); e.stopPropagation(); } }, true);
    limpar.push(() => { removeEventListener('pointermove', mover); removeEventListener('pointerup', soltar); });
  }
}

// Abas/filtros com setas do teclado
function abasTeclado(botoes, selecionar) {
  botoes.forEach((b, i) => {
    b.tabIndex = b.getAttribute('aria-selected') === 'true' ? 0 : -1;
    b.addEventListener('click', () => selecionar(b));
    b.addEventListener('keydown', e => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      const alvo = botoes[(i + d + botoes.length) % botoes.length];
      selecionar(alvo); alvo.focus();
    });
  });
  return b => botoes.forEach(x => { const s = x === b; x.setAttribute('aria-selected', s); x.tabIndex = s ? 0 : -1; });
}

// ---------- Modal (projetos e conquistas) ----------
const modal = $('[data-modal]');
let origemModal = null;
function abrirModal(html, hash, estreito = false) {
  origemModal = document.activeElement;
  modal.classList.toggle('modal-estreito', estreito);
  modal.classList.remove('fechando');
  const conteudo = $('[data-modal-conteudo]', modal);
  conteudo.innerHTML = html;
  if (!modal.open) modal.showModal();
  else if (!semMovimento) gsap.fromTo(conteudo, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .5, ease: 'power2.out', clearProps: 'all' });
  modal.scrollTop = 0;
  lenis?.stop();
  galeria(modal);
  esqueletos(modal);
  if (hash) history.pushState({ modal: hash }, '', `#${hash}`);
}
function abrirProjeto(slug, hist = true) {
  const p = dados.projetos?.find(x => x.slug === slug);
  if (p) abrirModal(detalheProjeto(p, t, dados.experiencias?.find(e => e.id === p.professional_history_id)?.instituicao), hist && `projeto/${slug}`);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-abrir-projeto]');
  if (b) { e.preventDefault(); abrirProjeto(b.dataset.abrirProjeto); return; }
  const c = e.target.closest('[data-abrir-conquista]');
  if (c) { const q = dados.conquistas?.find(x => x.id === c.dataset.abrirConquista); if (q) abrirModal(detalheConquista(q, t, lang), null, true); return; }
  const rc = e.target.closest('[data-abrir-rec]');
  if (rc) { const x = dados.recomendacoes?.find(r => r.id === rc.dataset.abrirRec); if (x) abrirModal(detalheRecomendacao(x, t), null, true); return; }
  if (e.target.closest('[data-deixar-rec]')) { abrirModal(formularioRecomendacao(t), null, true); enviarRecomendacao($('[data-form-rec]', modal)); return; }
  const sk = e.target.closest('[data-abrir-skill]');
  if (sk && !sk.closest('.arrastando-moveu')) { const n = dados.arvore?.find(x => x.id === sk.dataset.abrirSkill); if (n) abrirModal(detalheSkill(n, dados.arvore, t, dados.projetos), null, true); return; }
  const vz = e.target.closest('a[data-visor]');
  if (vz) { e.preventDefault(); const todos = $$('a[data-visor]', vz.closest('ul') || vz.parentElement).map(a => ({ src: a.href, alt: $('img', a)?.alt || '' })); visor(todos, todos.findIndex(x => x.src === vz.href)); return; }
  const r = e.target.closest('[data-abrir-carreira]');
  if (r) { const [tipo, id] = r.dataset.abrirCarreira.split(':'); const it = dados.trajetoria?.find(x => x.tipo === tipo && x.id === id); if (it) abrirModal(detalheCarreira(it, t, dados)); return; }
  if (e.target.closest('[data-fechar-modal]') || e.target === modal) fecharModal();
});
// fecha com transição: a caixa desce e some, depois o <dialog> fecha de verdade
function fecharModal() {
  if (!modal.open || modal.classList.contains('fechando')) return;
  if (semMovimento) { modal.close(); return; }
  modal.classList.add('fechando');
  setTimeout(() => { modal.classList.remove('fechando'); modal.close(); }, 260);
}
modal.addEventListener('cancel', e => {
  e.preventDefault();
  const visor = $('.visor', modal);
  visor ? visor._fechar() : fecharModal();
});
// "+N" nas categorias do cartão: mostra as demais sem abrir o projeto
function maisSelos(b) {
  const caixa = b.closest('.selos');
  caixa.classList.add('aberta');
  $$('.selo-extra', caixa).forEach((s, i) => { s.hidden = false; if (!semMovimento) gsap.from(s, { opacity: 0, x: -10, duration: .5, delay: i * .08, ease: 'power2.out', clearProps: 'all' }); });
  b.remove();
}
document.addEventListener('click', e => { const b = e.target.closest('[data-mais-selos]'); if (b) { e.preventDefault(); e.stopPropagation(); maisSelos(b); } }, true);
document.addEventListener('keydown', e => { const b = e.target.closest?.('[data-mais-selos]'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); maisSelos(b); } }, true);
// barras do gráfico também abrem com Enter/Espaço (são role="button")
document.addEventListener('keydown', e => { const r = e.target.closest?.('g[data-abrir-skill]'); if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); r.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
modal.addEventListener('close', () => {
  $('.visor', modal)?.remove();
  lenis?.start();
  if (location.hash.startsWith('#projeto/')) history.replaceState(null, '', location.pathname + location.search);
  origemModal?.focus?.();
});
addEventListener('popstate', () => { const h = location.hash.match(/^#projeto\/(.+)$/); h ? abrirProjeto(h[1], false) : fecharModal(); });

// galeria do projeto: um print por vez dentro da moldura, miniaturas embaixo e tela cheia com zoom
function galeria(raiz) {
  const g = $('[data-galeria]', raiz);
  if (!g) return;
  const itens = $$('.galeria-item', g), minis = $$('[data-galeria-ir]', g), cont = $('[data-galeria-contador]', g);
  const ant = $('[data-galeria-ant]', g), prox = $('[data-galeria-prox]', g);
  let modo = 'desktop', atual = 0;
  const doModo = () => itens.filter(li => !modoAtivo() || li.dataset.dispositivo === modo);
  const modoAtivo = () => $$('[data-modo]', g).length > 0;
  const mostrar = (n, dir = 0) => {
    const lista = doModo();
    if (!lista.length) return;
    atual = (n + lista.length) % lista.length;
    const alvo = lista[atual];
    for (const li of itens) {
      const ativo = li === alvo;
      if (ativo && !li.classList.contains('ativo') && dir && !semMovimento) gsap.fromTo(li, { opacity: 0, x: dir * 24 }, { opacity: 1, x: 0, duration: .6, ease: 'power2.out', clearProps: 'transform,opacity' });
      li.classList.toggle('ativo', ativo);
      li.inert = !ativo;
    }
    minis.forEach(b => { const on = b.dataset.galeriaIr === alvo.dataset.i; b.classList.toggle('ativa', on); b.setAttribute('aria-current', on); if (on) b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: semMovimento ? 'auto' : 'smooth' }); });
    cont.textContent = `${atual + 1} / ${lista.length}`;
    ant.hidden = prox.hidden = lista.length < 2;
  };
  ant.addEventListener('click', () => mostrar(atual - 1, -1));
  prox.addEventListener('click', () => mostrar(atual + 1, 1));
  minis.forEach(b => b.addEventListener('click', () => {
    const i = doModo().findIndex(li => li.dataset.i === b.dataset.galeriaIr);
    mostrar(i, i > atual ? 1 : -1);
  }));
  g.addEventListener('keydown', e => { if (e.target.closest('.galeria-palco, .galeria-miniaturas')) { if (e.key === 'ArrowRight') mostrar(atual + 1, 1); if (e.key === 'ArrowLeft') mostrar(atual - 1, -1); } });
  // deslizar o dedo no palco troca o print
  let x0 = null;
  $('.galeria-palco', g).addEventListener('pointerdown', e => { x0 = e.clientX; });
  $('.galeria-palco', g).addEventListener('pointerup', e => { if (x0 !== null && Math.abs(e.clientX - x0) > 50) { g._arrastou = true; mostrar(atual + (e.clientX < x0 ? 1 : -1), e.clientX < x0 ? 1 : -1); } x0 = null; });
  const modos = $$('[data-modo]', g);
  const trocarModo = m => {
    modo = m;
    modos.forEach(b => b.setAttribute('aria-selected', b.dataset.modo === m));
    itens.forEach(li => { li.hidden = modoAtivo() && li.dataset.dispositivo !== m; });
    minis.forEach(b => { b.parentElement.hidden = modoAtivo() && b.parentElement.dataset.dispositivo !== m; });
    mostrar(0);
    if (!semMovimento) gsap.from($('.galeria-palco', g), { opacity: 0, y: 10, duration: .55, ease: 'power2.out', clearProps: 'all' });
  };
  modos.forEach(b => b.addEventListener('click', () => trocarModo(b.dataset.modo)));
  trocarModo(modos.length && innerWidth < 640 && itens.some(li => li.dataset.dispositivo === 'mobile') ? 'mobile' : 'desktop');
  g.addEventListener('click', e => {
    const b = e.target.closest('[data-galeria-ampliar]');
    if (!b) return;
    if (g._arrastou) { g._arrastou = false; return; }
    visor(doModo().map(li => $('img', li)), atual, i => mostrar(i));
  });
}

// tela cheia: aproxima e afasta (botões, roda do mouse, pinça, duplo clique), arrasta quando ampliado
function visor(imgs, inicio, aoTrocar) {
  const v = document.createElement('div');
  v.className = 'visor';
  v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true'); v.setAttribute('aria-label', t('projetos.galeria'));
  v.innerHTML = `<div class="visor-area"><img class="visor-img" alt="" draggable="false"></div>
  <div class="visor-barra">
    <button type="button" data-v="ant" aria-label="${t('projetos.anterior')}">${icone('esquerda')}</button><span class="mono" data-v-cont></span><button type="button" data-v="prox" aria-label="${t('projetos.proxima')}">${icone('direita')}</button>
    <span class="visor-sep" aria-hidden="true"></span>
    <button type="button" data-v="menos" aria-label="${t('projetos.zoomMenos')}">${icone('menos')}</button><span class="mono visor-zoom" data-v-zoom>100%</span><button type="button" data-v="mais" aria-label="${t('projetos.zoomMais')}">${icone('mais')}</button>
    <button type="button" data-v="ajustar" aria-label="${t('projetos.zoomAjustar')}">${icone('ajustar')}</button>
  </div>
  <button type="button" class="visor-fechar" data-v="fechar" aria-label="${t('projetos.fechar')}">${icone('fechar')}</button>`;
  // dentro do modal aberto ou, fora dele (ex.: certificados da trajetória), direto na página
  (modal.open ? modal : document.body).append(v);
  if (!modal.open) lenis?.stop();
  const area = $('.visor-area', v), img = $('.visor-img', v);
  let i = inicio, z = 1, x = 0, y = 0;
  const aplicar = (anim = true) => {
    const max = Math.max(0, (z - 1) / 2);
    x = Math.min(Math.max(x, -img.offsetWidth * max), img.offsetWidth * max);
    y = Math.min(Math.max(y, -img.offsetHeight * max), img.offsetHeight * max);
    gsap.to(img, { x, y, scale: z, duration: anim && !semMovimento ? .3 : 0, ease: 'power2.out', overwrite: true });
    $('[data-v-zoom]', v).textContent = `${Math.round(z * 100)}%`;
    v.classList.toggle('ampliado', z > 1);
  };
  const zoom = (nz, cx, cy) => {
    nz = Math.min(Math.max(nz, 1), 5);
    if (cx !== undefined) { // mantém parado o ponto sob o cursor
      const r = area.getBoundingClientRect(), px = cx - r.left - r.width / 2, py = cy - r.top - r.height / 2;
      x = px - ((px - x) * nz) / z; y = py - ((py - y) * nz) / z;
    }
    z = nz; if (z === 1) { x = 0; y = 0; }
    aplicar();
  };
  const ir = n => {
    i = (n + imgs.length) % imgs.length;
    v.classList.add('carregando');
    img.onload = () => { v.classList.remove('carregando'); if (!semMovimento) gsap.fromTo(img, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .45, ease: 'power2.out' }); };
    img.src = imgs[i].currentSrc || imgs[i].src; img.alt = imgs[i].alt;
    z = 1; x = 0; y = 0; aplicar(false);
    $('[data-v-cont]', v).textContent = `${i + 1} / ${imgs.length}`;
    $$('[data-v="ant"], [data-v="prox"]', v).forEach(b => { b.hidden = imgs.length < 2; });
    aoTrocar?.(i);
  };
  const fechar = () => {
    removeEventListener('keydown', teclas);
    if (!modal.open) lenis?.start();
    if (semMovimento) { v.remove(); return; }
    gsap.to(v, { opacity: 0, duration: .35, ease: 'power1.in', onComplete: () => v.remove() });
  };
  v._fechar = fechar;
  const teclas = e => {
    if (e.key === 'Escape' && !modal.open) fechar();
    else if (e.key === 'ArrowRight') ir(i + 1);
    else if (e.key === 'ArrowLeft') ir(i - 1);
    else if (e.key === '+' || e.key === '=') zoom(z * 1.4);
    else if (e.key === '-') zoom(z / 1.4);
    else if (e.key === '0') zoom(1);
  };
  addEventListener('keydown', teclas);
  v.addEventListener('click', e => {
    const b = e.target.closest('[data-v]');
    if (!b) { if (e.target === area && z === 1 && !v._moveu) fechar(); return; }
    ({ ant: () => ir(i - 1), prox: () => ir(i + 1), mais: () => zoom(z * 1.4), menos: () => zoom(z / 1.4), ajustar: () => zoom(1), fechar })[b.dataset.v]();
  });
  area.addEventListener('wheel', e => { e.preventDefault(); zoom(z * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY); }, { passive: false });
  img.addEventListener('dblclick', e => zoom(z > 1 ? 1 : 2.5, e.clientX, e.clientY));
  // arrastar com um dedo/mouse; pinça com dois dedos
  const toques = new Map();
  let dist0 = 0, z0 = 1, ultimo = null;
  area.addEventListener('pointerdown', e => { area.setPointerCapture(e.pointerId); toques.set(e.pointerId, e); ultimo = e; if (toques.size === 2) { const [a, b] = [...toques.values()]; dist0 = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); z0 = z; } });
  area.addEventListener('pointermove', e => {
    if (!toques.has(e.pointerId)) return;
    toques.set(e.pointerId, e);
    if (toques.size === 2) { const [a, b] = [...toques.values()]; z = Math.min(Math.max(z0 * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / dist0, 1), 5); aplicar(false); return; }
    if (z > 1 && ultimo) { x += e.clientX - ultimo.clientX; y += e.clientY - ultimo.clientY; aplicar(false); }
    ultimo = e;
  });
  const soltar = e => { toques.delete(e.pointerId); ultimo = null; };
  area.addEventListener('pointerup', soltar); area.addEventListener('pointercancel', soltar);
  // deslizar sem zoom troca de imagem
  let sx = null;
  area.addEventListener('pointerdown', e => { sx = e.clientX; }, true);
  area.addEventListener('pointerup', e => { v._moveu = sx !== null && Math.abs(e.clientX - sx) > 10; if (z === 1 && sx !== null && Math.abs(e.clientX - sx) > 60 && toques.size === 0) ir(i + (e.clientX < sx ? 1 : -1)); sx = null; }, true);
  ir(inicio);
  if (!semMovimento) gsap.from(v, { opacity: 0, duration: .4, ease: 'power1.out' });
  $('[data-v="fechar"]', v).focus();
}

// ================= INÍCIO =================
function carregarQuadros(canvas, aoPrimeiro) {
  const total = +canvas.dataset.quadros, quadros = [];
  for (let i = 0; i < total; i++) {
    const img = new Image();
    img.decoding = 'async';
    img.src = `${canvas.dataset.sequencia}${String(i).padStart(3, '0')}.webp`;
    if (i === 0) img.onload = aoPrimeiro;
    quadros.push(img);
  }
  return quadros;
}

// Densidade do canvas: nunca acima da resolução do quadro (1120px). Pintar 2880px de um quadro de 1120 só custa tempo.
const densidade = (img, w, h) => Math.max(1, Math.min(devicePixelRatio, mouse ? 2 : 1.5, Math.max(img.naturalWidth / w, img.naturalHeight / h)));

// Degradê transparente de cada borda [esquerda, topo, direita, base] ao longo do vídeo (0 → 1).
// Início: vídeo estendido, sem degradê. Meio: moeda/rosto centralizados, bordas suaves. Fim: o Matheus fica à
// direita e de corpo inteiro: a borda direita quase não esfuma e a de baixo nunca esfuma (não "come" os pés).
const BORDAS = [[0, [0, 0, 0, 0]], [0.5, [0.1, 0.1, 0.1, 0]], [0.7, [0.09, 0.09, 0.05, 0]], [1, [0.08, 0.07, 0.015, 0]]];
function bordas(p) {
  const j = BORDAS.findIndex(([q]) => q >= p);
  if (j <= 0) return BORDAS[0][1];
  const [p0, a] = BORDAS[j - 1], [p1, b] = BORDAS[j], f = (p - p0) / (p1 - p0);
  return a.map((v, n) => v + (b[n] - v) * f);
}

function heroEfeitos(raiz) {
  const hero = $('[data-hero]', raiz);
  if (!hero || semMovimento) return; // sem movimento: estado final do CSS com o pôster (nome completo)
  const palco = $('.hero-palco', hero), midia = $('[data-hero-midia]', hero), canvas = $('canvas', midia);
  const g = canvas.getContext('2d');
  hero.classList.add('animado');
  let atual = 0, progresso = 0, ultimo = '';
  const desenhar = (i, forcar) => {
    const img = quadros[i];
    if (!img?.complete || !img.naturalWidth) return;
    const w = canvas.clientWidth, h = canvas.clientHeight, dpr = densidade(img, w, h);
    if (!w || !h) return;
    // a timeline chama a cada tique da rolagem; só repinta se o quadro ou o tamanho mudou
    const chave = `${i}|${w}|${h}|${dpr}`;
    if (chave === ultimo && !forcar) return;
    ultimo = chave;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    // Começa estendido (cobre a tela) e, até a metade do vídeo, vai se ajustando ao quadro inteiro e centralizado;
    // as bordas ganham um degradê transparente que funde o vídeo no fundo da mesma cor.
    const k = Math.min(1, i / ((quadros.length - 1) * 0.5));
    const cobre = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const cabe = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const esc = cobre + (cabe - cobre) * k;
    const dw = img.naturalWidth * esc, dh = img.naturalHeight * esc, x = (canvas.width - dw) / 2, y = (canvas.height - dh) / 2;
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.drawImage(img, x, y, dw, dh);
    const [be, bt, bd, bb] = bordas(i / (quadros.length - 1));
    if (be + bt + bd + bb > 0.002) {
      g.globalCompositeOperation = 'destination-in';
      for (const [x0, y0, x1, y1, a, b] of [[x, 0, x + dw, 0, be, bd], [0, y, 0, y + dh, bt, bb]]) {
        const gr = g.createLinearGradient(x0, y0, x1, y1);
        gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(Math.max(a, 0.0001), '#000'); gr.addColorStop(Math.min(1 - b, 0.9999), '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(0, 0, canvas.width, canvas.height);
      }
      g.globalCompositeOperation = 'source-over';
    }
  };
  const quadros = carregarQuadros(canvas, () => { hero.classList.add('quadros'); requestAnimationFrame(() => desenhar(atual)); });

  let fim = {};
  const medir = () => {
    gsap.set(midia, { clearProps: 'top,left,right,width,height,translate,aspectRatio,borderRadius' });
    const p = palco.getBoundingClientRect(), m = midia.getBoundingClientRect();
    fim = { top: m.top - p.top, left: m.left - p.left, width: m.width, height: m.height, cheio: [p.width, p.height] };
    gsap.set(midia, { right: 'auto', translate: 'none', aspectRatio: 'auto' });
  };
  medir();
  ScrollTrigger.addEventListener('refreshInit', medir);
  const ctx = gsap.context(() => {
    const rolagem = { trigger: hero, start: 'top top', end: 'bottom bottom' };
    // fase 1 (0 → 55%): quadros do vídeo; fase 2 (55 → 85%): encolhe; texto entra de 72% em diante
    ScrollTrigger.create({ ...rolagem, onUpdate: s => {
      progresso = s.progress;
      const i = Math.min(quadros.length - 1, Math.round(Math.min(1, progresso / 0.55) * (quadros.length - 1)));
      if (i !== atual) { atual = i; desenhar(i); }
    } });
    gsap.timeline({ scrollTrigger: { ...rolagem, scrub: 0.5, invalidateOnRefresh: true }, onUpdate: () => desenhar(atual) })
      .set({}, {}, 0)
      .fromTo(midia, { top: 0, left: 0, width: () => fim.cheio[0], height: () => fim.cheio[1], borderRadius: 0 },
        { top: () => fim.top, left: () => fim.left, width: () => fim.width, height: () => fim.height, borderRadius: 20, ease: 'power2.inOut', duration: 0.3 }, 0.55)
      .set({}, {}, 1);
    // estado inicial explícito: um fromTo dentro de timeline com scrub não o aplicava de forma confiável
    const texto = $$('.hero-texto > *', hero);
    gsap.set(texto, { opacity: 0, y: 40 });
    gsap.timeline({ scrollTrigger: { ...rolagem, scrub: 0.5 } })
      .to($('[data-hero-intro]', hero), { opacity: 0, y: 20, duration: 0.08 }, 0.47)
      .to($('.sombra-v', midia), { opacity: 0, duration: 0.15 }, 0.55)
      .to(texto, { opacity: 1, y: 0, stagger: 0.03, duration: 0.14, ease: 'power3.out' }, 0.72)
      .set({}, {}, 1);
  }, raiz);
  const redim = () => requestAnimationFrame(() => desenhar(atual, true));
  addEventListener('resize', redim);
  ScrollTrigger.addEventListener('refresh', redim);
  limpar.push(() => { ctx.revert(); ScrollTrigger.removeEventListener('refreshInit', medir); ScrollTrigger.removeEventListener('refresh', redim); removeEventListener('resize', redim); hero.classList.remove('animado', 'quadros'); });
}

function manifestoEfeitos(raiz) {
  const sec = $('[data-manifesto]', raiz);
  if (!sec) return;
  const frases = $$('[data-frase]', sec), barra = $('[data-progresso]', sec);
  const ativar = p => {
    const passo = Math.min(frases.length - 1, Math.floor(p * frases.length));
    frases.forEach((f, i) => { f.classList.toggle('ativa', i === passo); f.classList.toggle('passou', i < passo); });
    if (barra) barra.style.width = `${p * 100}%`;
  };
  ativar(0);
  const st = ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', onUpdate: s => ativar(s.progress) });
  limpar.push(() => st.kill());
  transicaoVideo(sec, $('.manifesto-palco', sec), true);
  // o vídeo do escritório anda quadro a quadro com a rolagem, como a abertura
  const canvas = $('.manifesto-canvas', sec);
  if (!canvas || semMovimento) return;
  const g = canvas.getContext('2d');
  let atual = 0;
  const desenhar = i => {
    const img = quadros[i];
    if (!img?.complete || !img.naturalWidth) return;
    const dpr = densidade(img, canvas.clientWidth, canvas.clientHeight), w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (!w || !h) return;
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    // no celular o vídeo aparece inteiro (sem corte); no desktop cobre a tela com o mesmo enquadramento do pôster
    const inteiro = innerWidth <= 600;
    // recorta 9% da direita e de baixo: some a marca d'água do canto inferior direito
    const sw = img.naturalWidth * 0.91, sh = img.naturalHeight * 0.91;
    const k = (inteiro ? Math.min : Math.max)(w / sw, h / sh), dw = sw * k, dh = sh * k;
    g.clearRect(0, 0, w, h);
    g.drawImage(img, 0, 0, sw, sh, (w - dw) * (inteiro ? 0.5 : 0.66), inteiro ? Math.round(56 * (w / canvas.clientWidth)) : (h - dh) * 0.5, dw, dh);
  };
  const quadros = carregarQuadros(canvas, () => { sec.classList.add('quadros'); requestAnimationFrame(() => desenhar(atual)); });
  const sq = ScrollTrigger.create({ trigger: sec, start: 'top bottom', end: 'bottom top', onUpdate: s => {
    const i = Math.min(quadros.length - 1, Math.round(s.progress * (quadros.length - 1)));
    if (i !== atual) { atual = i; desenhar(i); }
  } });
  const redim = () => requestAnimationFrame(() => desenhar(atual));
  addEventListener('resize', redim);
  limpar.push(() => { sq.kill(); removeEventListener('resize', redim); sec.classList.remove('quadros'); });
}

// Entrada: o vídeo nasce como um quadro arredondado e se expande até a tela cheia. Saída: recua e escurece.
function transicaoVideo(gatilho, palco, comSaida) {
  if (semMovimento || !palco) return;
  const ctx = gsap.context(() => {
    gsap.fromTo(palco, { '--clip': () => `${Math.min(innerWidth * 0.06, 64)}px`, '--clip-r': '28px' },
      { '--clip': '0px', '--clip-r': '0px', ease: 'none', scrollTrigger: { trigger: gatilho, start: 'top bottom', end: 'top top', scrub: true, invalidateOnRefresh: true } });
    if (comSaida) gsap.to(palco, { scale: 0.92, opacity: 0.4, ease: 'none', scrollTrigger: { trigger: gatilho, start: 'bottom bottom', end: 'bottom top', scrub: true } });
  });
  limpar.push(() => ctx.revert());
}

// ================= GRADE / LISTA / ÁRVORE =================
function vistasEfeitos(raiz) {
  for (const grupo of $$('[data-vistas]', raiz)) {
    const alvo = $(`[data-vista-alvo="${grupo.dataset.vistas}"]`, raiz);
    if (!alvo) continue;
    const botoes = $$('[data-vista]', grupo);
    const chave = `vista:${grupo.dataset.vistas}`;
    const aplicar = v => {
      alvo.dataset.vista = v;
      botoes.forEach(b => b.setAttribute('aria-pressed', b.dataset.vista === v));
      $$('.revelar', alvo).forEach(el => el.classList.add('visivel'));
      try { localStorage.setItem(chave, v); } catch {}
      ScrollTrigger.refresh();
    };
    botoes.forEach(b => b.addEventListener('click', () => {
      if (alvo.dataset.vista === b.dataset.vista) return;
      const itens = $$(':scope > li:not([hidden]), :scope > [data-grupo]:not([hidden]) .cartao:not([hidden])', alvo);
      comEsqueleto(itens, () => aplicar(b.dataset.vista));
    }));
    let salvo = null;
    try { salvo = localStorage.getItem(chave); } catch {}
    if (salvo && botoes.some(b => b.dataset.vista === salvo)) aplicar(salvo);
  }
  // recolher/expandir ramos da árvore RPG
  for (const palco of $$('[data-palco]', raiz)) {
    const recolhidos = new Set();
    const aplicarRamos = () => {
      const oculto = id => { let no = $(`[data-no="${CSS.escape(id)}"]`, palco); while (no && no.dataset.pai) { if (recolhidos.has(no.dataset.pai)) return true; no = $(`[data-no="${CSS.escape(no.dataset.pai)}"]`, palco); } return false; };
      $$('[data-no]', palco).forEach(n => n.classList.toggle('escondido', oculto(n.dataset.no)));
      $$('[data-filho]', palco).forEach(g => g.classList.toggle('escondido', oculto(g.dataset.filho)));
      $$('[data-alternar]', palco).forEach(b => {
        const fechado = recolhidos.has(b.dataset.alternar);
        b.setAttribute('aria-expanded', !fechado); $('text', b).textContent = fechado ? '+' : '−';
        b.classList.toggle('escondido', oculto(b.dataset.alternar));
      });
    };
    const alternar = b => { const id = b.dataset.alternar; recolhidos.has(id) ? recolhidos.delete(id) : recolhidos.add(id); aplicarRamos(); };
    palco.addEventListener('click', e => { const b = e.target.closest('[data-alternar]'); if (b) { e.stopPropagation(); alternar(b); } });
    palco.addEventListener('keydown', e => { const b = e.target.closest('[data-alternar]'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); alternar(b); } });
    palco._rpg = { recolhidos, aplicarRamos };
  }
  $$('[data-rpg-todos]', raiz).forEach(b => b.addEventListener('click', () => {
    for (const palco of $$('[data-palco]', raiz)) {
      const { recolhidos, aplicarRamos } = palco._rpg;
      recolhidos.clear();
      if (b.dataset.rpgTodos === 'fechar') $$('[data-alternar]', palco).forEach(x => { if (x.dataset.paiAlt) recolhidos.add(x.dataset.alternar); });
      aplicarRamos();
    }
  }));
  // abas da árvore RPG (uma categoria por vez)
  const abas = $$('[data-raiz]', raiz);
  if (abas.length) {
    const marcar = abasTeclado(abas, b => {
      marcar(b);
      $$('[data-palco]', raiz).forEach(p => { p.hidden = p.dataset.palco !== b.dataset.raiz; if (!p.hidden) p._ajustar?.(); });
    });
  }
}

// filtros e trocas de vista com transição: os que ficam deslizam até o lugar novo, os que entram aparecem
function animarLayout(itens, mudar) {
  if (semMovimento || !itens.length) { mudar(); ScrollTrigger.refresh(); return; }
  const estado = Flip.getState(itens);
  mudar();
  Flip.from(estado, {
    duration: .6, ease: 'power2.inOut', absolute: true, nested: true, prune: true,
    onEnter: els => gsap.fromTo(els, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .55, delay: .15, stagger: .035, ease: 'power2.out', clearProps: 'transform,opacity' }),
    onLeave: els => gsap.to(els, { opacity: 0, y: -10, duration: .3, ease: 'power1.in' }),
    onComplete: () => ScrollTrigger.refresh(),
  });
}

// Skeleton ao trocar filtro ou vista: a mudança é aplicada na hora, os itens ficam invisíveis (a página não muda
// de altura) e blocos cintilantes ocupam o lugar exato de cada um; depois de 1,2 s o conteúdo entra.
let esqueletoAtual = null;
function comEsqueleto(itens, mudar) {
  esqueletoAtual?.cancelar();
  mudar();
  const vis = itens.filter(el => el.offsetParent !== null && !el.hidden);
  if (semMovimento || !vis.length) { ScrollTrigger.refresh(); return; }
  const blocos = [...new Set(vis.map(el => el.parentElement))];
  const sx = scrollX, sy = scrollY;
  const camada = document.createElement('div');
  camada.className = 'esq-camada';
  camada.setAttribute('aria-hidden', 'true');
  camada.innerHTML = vis.slice(0, 30).map(el => {
    const r = el.getBoundingClientRect();
    if (r.bottom < -300 || r.top > innerHeight + 600) return '';
    const raio = getComputedStyle(el.firstElementChild || el).borderRadius;
    return `<i style="top:${r.top + sy}px;left:${r.left + sx}px;width:${r.width}px;height:${r.height}px;border-radius:${raio}"></i>`;
  }).join('');
  blocos.forEach(b => { b.classList.add('esq-oculto'); b.setAttribute('aria-busy', 'true'); });
  document.body.append(camada);
  const fim = () => { camada.remove(); blocos.forEach(b => { b.classList.remove('esq-oculto'); b.removeAttribute('aria-busy'); }); };
  const espera = setTimeout(() => {
    esqueletoAtual = null;
    fim();
    gsap.fromTo(vis.slice(0, 40), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .45, stagger: .03, ease: 'power2.out', clearProps: 'transform,opacity' });
    ScrollTrigger.refresh();
  }, 1200);
  esqueletoAtual = { cancelar: () => { clearTimeout(espera); fim(); } };
}

// ================= PROJETOS =================
function projetosEfeitos(raiz) {
  const area = $('[data-projetos]', raiz);
  if (!area) return;
  const busca = $('[data-busca]', area), nenhum = $('[data-nenhum]', area);
  const botoes = $$('[data-filtro]', area);
  let filtro = 'todos';
  const aplicar = (anim = true) => (anim ? animarLayout($$('.cartao', area), filtrarAgora) : filtrarAgora());
  const filtrarAgora = () => {
    const q = busca.value.trim().toLowerCase();
    let total = 0;
    for (const g of $$('[data-grupo]', area)) {
      const grupoAtivo = filtro === 'todos' || g.dataset.grupo === filtro;
      let n = 0;
      for (const li of $$('.cartao', g)) {
        const ok = grupoAtivo && (filtro !== 'todos' || li.dataset.secundario !== 'true' || q) && (!q || li.dataset.texto.includes(q));
        li.hidden = !ok; if (ok) { n++; li.classList.add('visivel'); }
      }
      g.hidden = !n; total += n;
    }
    nenhum.hidden = total > 0;
    ScrollTrigger.refresh();
  };
  const marcar = abasTeclado(botoes, b => { filtro = b.dataset.filtro; marcar(b); comEsqueleto($$('.cartao', area), filtrarAgora); });
  let espera = 0;
  busca.addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(aplicar, 160); });
  const inicial = location.hash.slice(1);
  const b = botoes.find(x => x.dataset.filtro === inicial);
  if (b) { filtro = inicial; marcar(b); }
  aplicar(false);
}

// ================= TRAJETÓRIA =================
function trajetoriaEfeitos(raiz) {
  const area = $('[data-trajetoria]', raiz);
  if (!area) return;
  const botoes = $$('[data-filtro-linha]', area);
  const marcar = abasTeclado(botoes, b => {
    marcar(b);
    const f = b.dataset.filtroLinha;
    $$('.crono-linha, .crono-m-linha', area).forEach(g => g.classList.toggle('apagada', f !== 'todos' && g.dataset.tipo !== f));
    comEsqueleto($$('.linha-item', area), () => $$('.linha-item', area).forEach(li => { li.hidden = f !== 'todos' && li.dataset.tipo !== f; li.classList.add('visivel'); }));
  });
}

// ================= COMPETÊNCIAS =================
function competenciasEfeitos(raiz) {
  const area = $('[data-conquistas]', raiz);
  if (!area) return;
  const botoes = $$('[data-filtro-conq]', area);
  const marcar = abasTeclado(botoes, b => {
    marcar(b);
    const f = b.dataset.filtroConq;
    comEsqueleto($$('.medalhas > li', area), () => $$('.medalhas > li', area).forEach(li => { li.hidden = f !== 'todas' && !li.dataset.cats.split(' ').includes(f); li.classList.add('visivel'); }));
  });
}

// ================= CALCULADORA DE VALORES =================
let cambio = null;
async function taxas() {
  if (cambio) return cambio;
  try { const r = await fetch('https://open.er-api.com/v6/latest/BRL'); const j = await r.json(); cambio = j.rates; } catch { cambio = { USD: 0.18, EUR: 0.16 }; }
  return cambio;
}
function valorEfeitos(raiz) {
  for (const box of $$('[data-valor]', raiz)) {
    const cfg = JSON.parse(box.dataset.valor);
    const est = { regime: 'pj', moeda: 'BRL', unidade: 'hora' };
    const total = $('[data-valor-total]', box), suf = $('[data-valor-sufixo]', box), cambioNota = $('[data-valor-cambio]', box), prefixo = $('[data-valor-prefixo]', box);
    const sufixos = JSON.parse(suf.dataset.sufixos);
    const fmt = (n, m) => new Intl.NumberFormat({ pt: 'pt-BR', en: 'en-US', es: 'es-ES' }[cfg.lang], { style: 'currency', currency: m, maximumFractionDigits: 0 }).format(n);
    const prefixoOriginal = prefixo.textContent;
    const notaEl = $('[data-valor-nota]', box), notaOriginal = notaEl.textContent;
    const marcar = (k, v) => { est[k] = v; $$(`[data-valor-${k}]`, box).forEach(x => x.setAttribute('aria-pressed', x.dataset[`valor${k[0].toUpperCase()}${k.slice(1)}`] === v)); };
    const calcular = async () => {
      const mult = { hora: 1, dia: cfg.h, mes: cfg.h * cfg.d }[est.unidade];
      let valor, convertido = false;
      notaEl.textContent = est.regime === 'clt' ? notaEl.dataset.clt : notaOriginal;
      if (est.regime === 'clt') {
        const mensal = cfg.clt;
        const base = mensal / (cfg.h * cfg.d) * mult;
        if (est.moeda === 'BRL') valor = base; else { const r = await taxas(); valor = base * (r[est.moeda] || 0); convertido = true; }
        prefixo.textContent = '';
      } else {
        valor = cfg[est.moeda.toLowerCase()] * mult;
        prefixo.textContent = prefixoOriginal;
      }
      total.textContent = valor ? fmt(valor, est.moeda) : '-';
      suf.textContent = sufixos[est.unidade];
      cambioNota.hidden = !convertido;
    };
    for (const k of ['regime', 'moeda', 'unidade']) {
      const bs = $$(`[data-valor-${k}]`, box);
      bs.forEach(b => b.addEventListener('click', () => {
        const v = b.dataset[`valor${k[0].toUpperCase()}${k.slice(1)}`];
        // CLT é pretensão mensal: ao escolher, mostra o mês; ao voltar para PJ/freelancer, volta para a hora
        if (k === 'regime' && v !== est.regime) marcar('unidade', v === 'clt' ? 'mes' : 'hora');
        marcar(k, v); calcular();
      }));
    }
  }
}

// ================= RECOMENDAÇÃO DE VISITANTE (entra como não aprovada; o admin decide) =================
function enviarRecomendacao(f) {
  const status = $('[data-status]', f);
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(f));
    if (v.site) return;
    const ruins = [['nome', !v.nome.trim()], ['mensagem', v.mensagem.trim().length < 20]];
    ruins.forEach(([n, r]) => f.elements[n].setAttribute('aria-invalid', r));
    status.className = 'form-status';
    if (ruins.some(([, r]) => r)) { status.textContent = status.dataset.invalido; status.classList.add('erro'); return; }
    const botao = $('button[type=submit]', f);
    botao.disabled = true;
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/feedbacks`, {
        method: 'POST',
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ nome: v.nome.trim(), cargo: v.cargo.trim() || null, empresa: v.empresa.trim() || null, mensagem: v.mensagem.trim(), fonte: 'Site', aprovado: false, data_feedback: new Date().toISOString().slice(0, 10) }),
      });
      if (!r.ok) throw new Error(r.status);
      f.reset(); status.textContent = status.dataset.ok; status.classList.add('ok');
    } catch { status.textContent = status.dataset.erro; status.classList.add('erro'); } finally { botao.disabled = false; }
  });
}

// ================= CONTATO =================
function formulario(raiz) {
  const f = $('[data-form]', raiz);
  if (!f) return;
  const status = $('[data-status]', f), botao = $('[data-enviar]', f);
  const assunto = new URLSearchParams(location.search).get('assunto');
  if (assunto && f.elements.assunto.querySelector(`option[value="${CSS.escape(assunto)}"]`)) f.elements.assunto.value = assunto;
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(f));
    if (v.site) return; // isca anti-spam
    const invalidos = [['nome', !v.nome.trim()], ['email', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)], ['mensagem', !v.mensagem.trim()]];
    invalidos.forEach(([n, ruim]) => f.elements[n].setAttribute('aria-invalid', ruim));
    const primeiro = invalidos.find(([, ruim]) => ruim);
    status.className = 'form-status';
    if (primeiro) { status.textContent = status.dataset.invalido; status.classList.add('erro'); f.elements[primeiro[0]].focus(); return; }
    const texto = botao.innerHTML;
    botao.disabled = true; botao.textContent = botao.dataset.textoEnviando;
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/contact_messages`, {
        method: 'POST',
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ nome: v.nome.trim(), email: v.email.trim(), assunto: v.assunto, mensagem: v.mensagem.trim(), idioma: lang, lida: false }),
      });
      if (!r.ok) throw new Error(r.status);
      f.reset();
      status.textContent = status.dataset.ok; status.classList.add('ok');
    } catch {
      status.textContent = status.dataset.erro; status.classList.add('erro');
    } finally {
      botao.disabled = false; botao.innerHTML = texto;
    }
  });
}

// Recomendações: 5 visíveis e um botão para as demais
function maisRecs(raiz) {
  const b = $('[data-ver-mais-recs]', raiz);
  if (!b) return;
  const mais = b.textContent;
  b.addEventListener('click', () => {
    const abrir = b.getAttribute('aria-expanded') !== 'true';
    $$('[data-rec-extra]', raiz).forEach(li => { li.hidden = !abrir; li.classList.add('visivel'); });
    b.setAttribute('aria-expanded', abrir); b.textContent = abrir ? b.dataset.menos : mais;
    if (!abrir) $('#recomendacoes', raiz)?.scrollIntoView({ block: 'start' });
    ScrollTrigger.refresh();
  });
}

// Faixas que rolam para o lado: sombra na borda e um aviso animado "deslize" até a primeira rolagem
function deslizes(raiz) {
  for (const el of $$('.filtros, [data-deslize]', raiz)) {
    if (el.closest('.deslize-caixa')) continue;
    const caixa = document.createElement('div');
    caixa.className = 'deslize-caixa';
    el.before(caixa); caixa.append(el);
    const dica = document.createElement('span');
    dica.className = 'deslize-dica'; dica.setAttribute('aria-hidden', 'true');
    dica.innerHTML = `<span>${t('vista.deslize')}</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
    caixa.append(dica);
    const medir = () => {
      const sobra = el.scrollWidth - el.clientWidth;
      caixa.classList.toggle('tem-mais', sobra > 8 && el.scrollLeft < sobra - 8);
      caixa.classList.toggle('tem-antes', el.scrollLeft > 8);
      if (sobra <= 8) caixa.classList.remove('com-dica');
    };
    el.addEventListener('scroll', medir, { passive: true });
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    // aparece por 3 s e volta a cada 10 s, enquanto ainda houver conteúdo escondido à direita
    let fim = 0;
    const mostrar = () => { if (!caixa.classList.contains('tem-mais')) return; caixa.classList.add('com-dica'); clearTimeout(fim); fim = setTimeout(() => caixa.classList.remove('com-dica'), 3000); };
    const ciclo = setInterval(mostrar, 13000);
    setTimeout(mostrar, 600);
    limpar.push(() => { ro.disconnect(); clearInterval(ciclo); clearTimeout(fim); });
  }
}

// Árvore RPG: começa afastada (a árvore inteira cabe na largura) e aproxima com botões, pinça ou Ctrl + roda
function zoomArvore(raiz) {
  const palcos = $$('[data-palco]', raiz);
  for (const palco of palcos) {
    const svg = $('svg', palco);
    const W = +svg.getAttribute('width'), H = +svg.getAttribute('height');
    let z = 1;
    const caber = () => Math.min(1, Math.max(0.3, (palco.clientWidth - 24) / W));
    const aplicar = (nz, cx = palco.clientWidth / 2, cy = 0) => {
      nz = Math.min(1.6, Math.max(Math.min(caber(), 0.3), nz));
      const rx = (palco.scrollLeft + cx) / z, ry = (palco.scrollTop + cy) / z;
      z = nz;
      svg.setAttribute('width', Math.round(W * z)); svg.setAttribute('height', Math.round(H * z));
      palco.scrollLeft = rx * z - cx; palco.scrollTop = ry * z - cy;
      ScrollTrigger.refresh();
    };
    palco._zoom = d => (d === 0 ? (aplicar(caber()), palco.scrollLeft = (palco.scrollWidth - palco.clientWidth) / 2) : aplicar(z * (d > 0 ? 1.3 : 1 / 1.3)));
    palco._ajustar = () => { if (!palco.hidden && palco.clientWidth) palco._zoom(0); };
    palco._ajustar();
    palco.addEventListener('wheel', e => { if (!e.ctrlKey) return; e.preventDefault(); const r = palco.getBoundingClientRect(); aplicar(z * (e.deltaY < 0 ? 1.12 : 1 / 1.12), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    // pinça com dois dedos
    const toques = new Map();
    let d0 = 0, z0 = 1;
    palco.addEventListener('pointerdown', e => { if (e.pointerType !== 'touch') return; toques.set(e.pointerId, e); if (toques.size === 2) { const [a, b] = [...toques.values()]; d0 = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); z0 = z; } });
    palco.addEventListener('pointermove', e => {
      if (!toques.has(e.pointerId)) return; toques.set(e.pointerId, e);
      if (toques.size !== 2 || !d0) return;
      const [a, b] = [...toques.values()], r = palco.getBoundingClientRect();
      aplicar(z0 * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / d0, (a.clientX + b.clientX) / 2 - r.left, (a.clientY + b.clientY) / 2 - r.top);
    });
    const fim = e => { toques.delete(e.pointerId); if (toques.size < 2) d0 = 0; };
    palco.addEventListener('pointerup', fim); palco.addEventListener('pointercancel', fim);
  }
  $$('[data-zoom]', raiz).forEach(b => b.addEventListener('click', () => { const p = palcos.find(x => !x.hidden); p?._zoom(+b.dataset.zoom); }));
}

// Texto longo no celular: mostra 4 linhas e um "Continuar lendo" que expande no lugar
function recolhiveis(raiz) {
  for (const p of $$('.recolhivel', raiz)) {
    if (p.nextElementSibling?.classList.contains('expandir')) continue;
    requestAnimationFrame(() => {
      if (p.scrollHeight <= p.clientHeight + 4) return;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'expandir'; b.setAttribute('aria-expanded', 'false'); b.textContent = t('recs.continuar');
      b.addEventListener('click', () => { const aberto = p.classList.toggle('aberto'); b.setAttribute('aria-expanded', aberto); b.textContent = aberto ? t('trajetoria.menos') : t('recs.continuar'); ScrollTrigger.refresh(); });
      p.after(b);
    });
  }
}

// vitrine de destaques: com mouse, os cartões perto do cursor crescem como o Dock do Mac e os vizinhos abrem espaço deslizando para os lados
function vitrine(raiz) {
  const v = $('.vitrine', raiz);
  if (!v) return;
  if (!mouse || semMovimento) return;
  const cartoes = $$('.destaque', v);
  const ESCALA = 0.16, ALCANCE = 420;
  let quadro = 0, mx = null;
  const dock = () => {
    quadro = 0;
    const caixa = v.getBoundingClientRect();
    const vis = cartoes.map(c => { const r = c.getBoundingClientRect(); return { c, r, cx: r.left + r.width / 2 }; }).filter(o => o.r.right > caixa.left - 200 && o.r.left < caixa.right + 200);
    if (!vis.length) return;
    vis.forEach(o => { const d = Math.min(Math.abs(o.cx - mx) / ALCANCE, 1); o.s = 1 + ESCALA * (1 - d * d) ** 2 * (d < 1); o.g = (o.s - 1) * o.r.width; });
    vis.sort((a, b) => a.cx - b.cx);
    const k = vis.reduce((m, o, n) => (Math.abs(o.cx - mx) < Math.abs(vis[m].cx - mx) ? n : m), 0);
    vis.forEach((o, n) => {
      let x = 0;
      if (n > k) { x = vis[k].g / 2 + o.g / 2; for (let j = k + 1; j < n; j++) x += vis[j].g; }
      if (n < k) { x = -(vis[k].g / 2 + o.g / 2); for (let j = n + 1; j < k; j++) x -= vis[j].g; }
      gsap.to(o.c, { scale: o.s, x, zIndex: Math.round(o.s * 100), duration: .45, ease: 'power3.out', overwrite: 'auto' });
    });
  };
  v.addEventListener('mousemove', e => { mx = e.clientX; if (!quadro) quadro = requestAnimationFrame(dock); });
  v.addEventListener('mouseleave', () => { cancelAnimationFrame(quadro); quadro = 0; gsap.to(cartoes, { scale: 1, x: 0, duration: .6, ease: 'power3.out', overwrite: 'auto', onComplete: () => gsap.set(cartoes, { clearProps: 'zIndex' }) }); });
}

// esqueleto animado no lugar da imagem enquanto ela carrega; depois a imagem entra com fade
const COM_ESQUELETO = '.cartao-img img, .destaque-midia img, .moldura img, .miniatura img, .mini-projetos img, .patrocinio-projetos img, .sobre-foto img';
function esqueletos(raiz) {
  for (const img of $$(COM_ESQUELETO, raiz)) {
    if (img.complete && img.naturalWidth) continue;
    const caixa = img.parentElement;
    caixa.classList.add('esqueleto'); img.classList.add('img-espera');
    const pronto = () => { caixa.classList.remove('esqueleto'); img.classList.remove('img-espera'); };
    img.addEventListener('load', pronto, { once: true });
    img.addEventListener('error', pronto, { once: true });
  }
}

function iniciar() {
  vitrine(main);
  esqueletos(main);
  recolhiveis(main);
  dividirPalavras(main);
  revelar(main);
  heroEfeitos(main);
  manifestoEfeitos(main);
  projetosEfeitos(main);
  trajetoriaEfeitos(main);
  competenciasEfeitos(main);
  vistasEfeitos(main);
  zoomArvore(main);
  maisRecs(main);
  deslizes(main);
  valorEfeitos(main);
  // no desktop a calculadora do contato já vem aberta; no celular fica recolhida
  if (matchMedia('(min-width: 601px)').matches) $$('[data-dobra-desktop]', main).forEach(x => { x.open = true; });
  formulario(main);
  transicaoVideo($('.contato-hero', main), $('.contato-hero', main), false);
  inclinar(main);
  videosAuto(main);
  arrastar(main);
  magneticos(main);
  ScrollTrigger.refresh();
  const h = location.hash.match(/^#projeto\/(.+)$/);
  if (h) abrirProjeto(h[1], false);
}

iniciar();
aoRolar();
addEventListener('load', () => ScrollTrigger.refresh());

// Conteúdo editado no admin depois do build: redesenha com os dados atuais do banco.
buscarTudo().then(bruto => {
  if (assinatura(bruto) === main.dataset.assinatura) return;
  const d = prepararIdioma(bruto, lang);
  dados = PAGINAS[pagina].dados(d, t);
  limpar.forEach(f => f()); limpar = [];
  main.innerHTML = PAGINAS[pagina].corpo(d, t);
  main.dataset.assinatura = assinatura(bruto);
  iniciar();
}).catch(() => {});
