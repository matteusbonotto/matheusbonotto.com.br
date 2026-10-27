// Currículo em modo "editor de documentos": distribui os blocos em folhas A4 reais (a impressão sai igual
// à prévia), controla o zoom e atualiza o conteúdo se o banco mudou desde o build.
import './styles/cv.css';
import QRCode from 'qrcode';
import { tradutor } from './i18n/ui.js';
import { buscarTudo, prepararIdioma } from './lib/dados.js';
import { assinatura, conteudoCV } from './render/documento.js';

const main = document.querySelector('[data-main]');
const caixa = document.querySelector('[data-paginas]');
const lang = document.documentElement.dataset.lang || 'pt';
const t = tradutor(lang);
const MM = 96 / 25.4;
const ALTURA_UTIL = (297 - 2 * 16 - 7) * MM; // folha A4 menos margens de 16 mm e a linha de cabeçalho (iguais ao CSS)

function paginar() {
  const fluxo = caixa.querySelector('[data-fluxo]') || caixa.querySelector('.folha');
  const atomos = [...caixa.querySelectorAll('.cv-atomo')];
  // palavras-chave invisíveis: fora da paginação, vão no rodapé da última folha sem ocupar espaço
  const palavras = caixa.querySelector('.cv-palavras');
  // mede tudo numa folha única, sem zoom
  caixa.style.zoom = 1;
  const medir = () => {
    caixa.innerHTML = '';
    const medida = document.createElement('article');
    medida.className = 'folha medindo';
    caixa.append(medida);
    atomos.forEach(a => medida.append(a));
    const alt = atomos.map(a => {
      const cs = getComputedStyle(a);
      return a.getBoundingClientRect().height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
    });
    medida.remove();
    return alt;
  };
  // distribui os blocos; um bloco "junto" (título, cabeçalho de cargo) só fica na folha se o próximo couber com ele
  const distribuir = alt => {
    const plano = [{ itens: [], usado: 0 }];
    for (let i = 0; i < atomos.length; i++) {
      const preciso = atomos[i].hasAttribute('data-junto') && i + 1 < atomos.length ? alt[i] + alt[i + 1] : alt[i];
      let f = plano.at(-1);
      if (f.usado > 0 && f.usado + preciso > ALTURA_UTIL) { f = { itens: [], usado: 0 }; plano.push(f); }
      f.itens.push(i); f.usado += alt[i];
    }
    return plano;
  };
  // sem folha final quase vazia: se a última ficaria com pouco conteúdo, compacta um pouco e tenta de novo
  let plano;
  for (const nivel of [0, 1, 2, 3]) {
    caixa.dataset.compacto = nivel;
    plano = distribuir(medir());
    if (plano.length === 1 || plano.at(-1).usado > ALTURA_UTIL * 0.3) break;
  }
  const folhas = plano.map(f => { const el = document.createElement('article'); el.className = 'folha'; f.itens.forEach(i => el.append(atomos[i])); return el; });
  if (palavras) folhas.at(-1).append(palavras);
  folhas.forEach((f, i) => {
    const cab = document.createElement('p');
    cab.className = 'folha-cabeca';
    cab.textContent = caixa.dataset.cabeca;
    f.prepend(cab);
    const n = document.createElement('p');
    n.className = 'folha-numero';
    n.textContent = caixa.dataset.rotuloPagina.replace('{n}', i + 1).replace('{total}', folhas.length);
    f.append(n);
    caixa.append(f);
  });
  if (!fluxo) return;
}

// ---------- Zoom (como no editor) ----------
const valor = document.querySelector('[data-zoom-valor]');
let zoom = 1, ajustado = true;
const ajustar = () => Math.min(1, (innerWidth - 32) / (210 * MM + 0));
function aplicarZoom() {
  caixa.style.zoom = zoom;
  valor.textContent = `${Math.round(zoom * 100)}%`;
}
document.querySelectorAll('[data-zoom]').forEach(b => b.addEventListener('click', () => {
  const d = +b.dataset.zoom;
  if (d === 0) { ajustado = true; zoom = ajustar(); } else { ajustado = false; zoom = Math.min(2, Math.max(0.4, Math.round((zoom + d * 0.1) * 10) / 10)); }
  aplicarZoom();
}));
addEventListener('resize', () => { if (ajustado) { zoom = ajustar(); aplicarZoom(); } });
document.querySelector('[data-imprimir]')?.addEventListener('click', () => print());
// a impressão usa sempre 100%
// o navegador usa o título da página como nome do PDF
let tituloOriginal = document.title;
addEventListener('beforeprint', () => { caixa.style.zoom = 1; tituloOriginal = document.title; document.title = (document.querySelector('.cv-arquivo')?.textContent || tituloOriginal).replace(/\.pdf$/, ''); });
addEventListener('afterprint', () => { document.title = tituloOriginal; });
addEventListener('afterprint', aplicarZoom);

// QR code sempre aponta para a URL atual (com a versão escolhida); idade calculada no dia da visita.
async function detalhesVivos() {
  const svg = await QRCode.toString(location.href, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' });
  caixa.querySelectorAll('.cv-qr').forEach(a => { a.innerHTML = svg; a.href = location.href; });
  caixa.querySelectorAll('[data-nascimento]').forEach(el => {
    const n = Math.floor((Date.now() - new Date(`${el.dataset.nascimento}T12:00:00`)) / (365.25 * 864e5));
    el.textContent = `(${el.dataset.modelo.replace('{n}', n)})`;
  });
}

let dados = null;
const botoesV = [...document.querySelectorAll('[data-variante]')];
const primeira = botoesV[0]?.dataset.variante;
let variante = new URLSearchParams(location.search).get('perfil');
if (!botoesV.some(b => b.dataset.variante === variante)) variante = primeira;
const arquivo = document.querySelector('.cv-arquivo');
const nomeBase = arquivo?.textContent || '';
function desenhar() {
  botoesV.forEach(b => b.setAttribute('aria-pressed', b.dataset.variante === variante));
  if (arquivo) arquivo.textContent = nomeBase.replace(/_QA\.pdf$/, `_${variante.toUpperCase()}.pdf`);
  if (dados) caixa.innerHTML = `<article class="folha" data-fluxo>${conteudoCV(dados, t, '', variante)}</article>`;
  paginar();
  detalhesVivos();
  aplicarZoom();
}
botoesV.forEach(b => b.addEventListener('click', () => {
  variante = b.dataset.variante;
  const u = new URL(location.href);
  variante === primeira ? u.searchParams.delete('perfil') : u.searchParams.set('perfil', variante);
  history.replaceState(null, '', u);
  desenhar();
}));

async function iniciar() {
  await document.fonts.ready;
  zoom = ajustar();
  if (variante === primeira) desenhar();
}
iniciar();

buscarTudo().then(bruto => {
  dados = prepararIdioma(bruto, lang);
  if (assinatura(bruto) === main.dataset.assinatura && variante === primeira) return;
  main.dataset.assinatura = assinatura(bruto);
  desenhar();
}).catch(() => { if (variante !== primeira) desenhar(); });
