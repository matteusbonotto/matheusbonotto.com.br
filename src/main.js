// Interações e efeitos de todas as páginas (exceto o currículo). O HTML vem pronto do pré-render;
// aqui ligamos o comportamento e, se o banco mudou depois do build, redesenhamos com os dados atuais.
import './styles/site.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { tradutor } from './i18n/ui.js';
import { buscarTudo, prepararIdioma } from './lib/dados.js';
import { particulas } from './lib/particulas.js';
import { assinatura, PAGINAS } from './render/documento.js';
import { icone } from './render/comum.js';
import { detalheCarreira, detalheConquista, detalheProjeto, detalheRecomendacao, detalheSkill, formularioRecomendacao } from './render/paginas.js';

gsap.registerPlugin(ScrollTrigger);
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
let ultimoY = 0;
const aoRolar = () => {
  const y = scrollY;
  nav.classList.toggle('rolou', y > 10 && pagina !== 'contato');
  if (pagina === 'contato') nav.classList.add('escura', 'contato'); // contato abre sobre vídeo escuro
  // na home a barra começa clara e escurece junto com o vídeo de abertura; quando o vídeo vira quadro, volta ao normal
  const hero = pagina === '' && document.querySelector('.hero.animado');
  let v = 0;
  if (hero) {
    const p = Math.min(1, y / Math.max(1, hero.offsetHeight - innerHeight));
    v = p < 0.55 ? p / 0.55 : Math.max(0, 1 - (p - 0.55) / 0.2);
  }
  nav.style.setProperty('--escuro', v.toFixed(3));
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
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, .4)' }));
  }
}
magneticos(nav);
// acesso discreto ao admin: clique direito no logo ou no nome e, em até 10 s, digitar "iddq" (o clássico iddqd também funciona)
let armado = 0, digitado = '';
document.addEventListener('contextmenu', e => { if (!e.target.closest('.nav-marca, .rodape-marca')) return; e.preventDefault(); armado = Date.now(); digitado = ''; });
addEventListener('keydown', e => {
  if (!armado || Date.now() - armado > 10000 || e.key.length !== 1) return;
  digitado = (digitado + e.key.toLowerCase()).slice(-4);
  if (digitado === 'iddq') location.href = '/admin/';
});
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
if (fundo) particulas(fundo, { semMovimento });

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

function contar(el) {
  const alvo = +el.dataset.contar;
  if (semMovimento || !alvo) { el.textContent = alvo; return; }
  const o = { v: 0 };
  gsap.to(o, { v: alvo, duration: 1.6, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v); } });
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
  $('[data-modal-conteudo]', modal).innerHTML = html;
  if (!modal.open) modal.showModal();
  modal.scrollTop = 0;
  lenis?.stop();
  galeria(modal);
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
  if (sk && !sk.closest('.arrastando-moveu')) { const n = dados.arvore?.find(x => x.id === sk.dataset.abrirSkill); if (n) abrirModal(detalheSkill(n, dados.arvore, t), null, true); return; }
  const r = e.target.closest('[data-abrir-carreira]');
  if (r) { const [tipo, id] = r.dataset.abrirCarreira.split(':'); const it = dados.trajetoria?.find(x => x.tipo === tipo && x.id === id); if (it) abrirModal(detalheCarreira(it, t, dados)); return; }
  if (e.target.closest('[data-fechar-modal]') || e.target === modal) modal.close();
});
// barras do gráfico também abrem com Enter/Espaço (são role="button")
document.addEventListener('keydown', e => { const r = e.target.closest?.('g[data-abrir-skill]'); if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); r.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
modal.addEventListener('close', () => {
  lenis?.start();
  if (location.hash.startsWith('#projeto/')) history.replaceState(null, '', location.pathname + location.search);
  origemModal?.focus?.();
});
addEventListener('popstate', () => { const h = location.hash.match(/^#projeto\/(.+)$/); h ? abrirProjeto(h[1], false) : modal.open && modal.close(); });

function galeria(raiz) {
  const g = $('[data-galeria]', raiz);
  if (!g) return;
  const faixa = $('[data-galeria-faixa]', g), cont = $('[data-galeria-contador]', g);
  const ant = $('[data-galeria-ant]', g), prox = $('[data-galeria-prox]', g);
  const visiveis = () => $$('.galeria-item:not([hidden])', faixa);
  const atualizar = () => {
    const itens = visiveis();
    const i = itens.findIndex(li => li.offsetLeft + li.offsetWidth / 2 > faixa.scrollLeft + 40);
    cont.textContent = `${Math.max(i, 0) + 1} / ${itens.length}`;
    ant.disabled = faixa.scrollLeft < 8;
    prox.disabled = faixa.scrollLeft + faixa.clientWidth >= faixa.scrollWidth - 8;
  };
  const mover = dir => { const li = visiveis()[0]; faixa.scrollBy({ left: dir * ((li?.offsetWidth || 300) + 16), behavior: semMovimento ? 'auto' : 'smooth' }); };
  ant.addEventListener('click', () => mover(-1));
  prox.addEventListener('click', () => mover(1));
  faixa.addEventListener('scroll', atualizar, { passive: true });
  faixa.addEventListener('keydown', e => { if (e.key === 'ArrowRight') mover(1); if (e.key === 'ArrowLeft') mover(-1); });
  const modos = $$('[data-modo]', g);
  const modo = m => {
    modos.forEach(b => { b.setAttribute('aria-selected', b.dataset.modo === m); });
    $$('.galeria-item', faixa).forEach(li => { li.hidden = modos.length > 0 && li.dataset.dispositivo !== m; });
    faixa.scrollLeft = 0; atualizar();
  };
  modos.forEach(b => b.addEventListener('click', () => modo(b.dataset.modo)));
  modos.length ? modo(innerWidth < 640 && $('[data-dispositivo="mobile"]', faixa) ? 'mobile' : 'desktop') : atualizar();
  requestAnimationFrame(atualizar);
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
  let atual = 0, progresso = 0;
  const desenhar = i => {
    const img = quadros[i];
    if (!img?.complete || !img.naturalWidth) return;
    const w = canvas.clientWidth, h = canvas.clientHeight, dpr = Math.min(devicePixelRatio, 2);
    if (!w || !h) return;
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
  const redim = () => requestAnimationFrame(() => desenhar(atual));
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
    botoes.forEach(b => b.addEventListener('click', () => aplicar(b.dataset.vista)));
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

// ================= PROJETOS =================
function projetosEfeitos(raiz) {
  const area = $('[data-projetos]', raiz);
  if (!area) return;
  const busca = $('[data-busca]', area), nenhum = $('[data-nenhum]', area);
  const botoes = $$('[data-filtro]', area);
  let filtro = 'todos';
  const aplicar = () => {
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
  const marcar = abasTeclado(botoes, b => { filtro = b.dataset.filtro; marcar(b); aplicar(); });
  busca.addEventListener('input', aplicar);
  const inicial = location.hash.slice(1);
  const b = botoes.find(x => x.dataset.filtro === inicial);
  if (b) { filtro = inicial; marcar(b); }
  aplicar();
}

// ================= TRAJETÓRIA =================
function trajetoriaEfeitos(raiz) {
  const area = $('[data-trajetoria]', raiz);
  if (!area) return;
  const botoes = $$('[data-filtro-linha]', area);
  const marcar = abasTeclado(botoes, b => {
    marcar(b);
    const f = b.dataset.filtroLinha;
    $$('.linha-item', area).forEach(li => { li.hidden = f !== 'todos' && li.dataset.tipo !== f; li.classList.add('visivel'); });
    $$('.crono-linha', area).forEach(g => g.classList.toggle('apagada', f !== 'todos' && g.dataset.tipo !== f));
    ScrollTrigger.refresh();
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
    $$('.medalhas > li', area).forEach(li => { li.hidden = f !== 'todas' && !li.dataset.cats.split(' ').includes(f); li.classList.add('visivel'); });
    ScrollTrigger.refresh();
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

// vitrine de destaques: no toque, pausa o letreiro por alguns segundos
function vitrine(raiz) {
  const v = $('.vitrine', raiz);
  if (!v) return;
  let pausa = 0;
  v.addEventListener('touchstart', () => { v.classList.add('tocando'); clearTimeout(pausa); }, { passive: true });
  v.addEventListener('touchend', () => { pausa = setTimeout(() => v.classList.remove('tocando'), 2500); }, { passive: true });
}

function iniciar() {
  vitrine(main);
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
