// Utilitários de renderização compartilhados entre o pré-render (Node) e o navegador.
import { SITE } from '../config.js';
import { rota } from '../i18n/ui.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Parágrafos a partir de texto com quebras de linha; linhas iniciadas por "- " viram subtítulos de bloco.
export function paragrafos(txt) {
  return String(txt ?? '').replace(/\r/g, '').split(/\n{2,}/).map(b => b.trim()).filter(Boolean).map(b => {
    const linhas = b.split('\n').map(l => l.trim()).filter(Boolean);
    if (linhas[0].startsWith('- ')) return `<p><strong>${esc(linhas[0].slice(2))}</strong>${linhas.length > 1 ? '<br>' + linhas.slice(1).map(esc).join('<br>') : ''}</p>`;
    return `<p>${linhas.map(esc).join('<br>')}</p>`;
  }).join('');
}

export function periodo(ini, fim, atual, t) {
  const f = d => { if (!d) return ''; const [a, m] = d.split('-'); return `${t('mes')[+m - 1]} ${a}`; };
  return `${f(ini)} → ${atual || !fim ? t('trajetoria.atual') : f(fim)}`;
}

export const iniciais = nome => String(nome).split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();

export const CAMINHOS = {
  seta: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  externo: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  github: '<path d="M9 19c-4 1.3-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>',
  email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  whatsapp: '<path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3L3 21z"/><path d="M9 10c.5 2 2 3.5 4 4l1.2-1.2 2 1-.4 1.6c-3.6.4-7.6-3.6-7.2-7.2L10.2 8l1 2L10 11.2"/>',
  fechar: '<path d="M6 6l12 12M18 6 6 18"/>',
  menu: '<path d="M4 8h16M4 16h16"/>',
  esquerda: '<path d="m15 6-6 6 6 6"/>',
  direita: '<path d="m9 6 6 6-6 6"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  baixo: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  cima: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  predio: '<path d="M4 21V5l8-2v18M12 8h8v13M4 21h17M7.5 8v.01M7.5 12v.01M7.5 16v.01M15.5 12v.01M15.5 16v.01"/>',
  casa: '<path d="M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5M10 20v-5h4v5"/>',
  hibrido: '<path d="M3 12 9 7l6 5v8H3zM6.5 20v-4h5v4M15 9h6v11h-6M18 12v.01M18 16v.01"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  local: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  'vista-grade': '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  'vista-lista': '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  'vista-arvore': '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M12 7.5v4M12 11.5 5.8 16.8M12 11.5l6.2 5.3"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  lua: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  globo: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  feedz: '<path d="M4 5h16v11H9l-5 4z"/><path d="M9 9h6M9 12h4"/>',
  cadeado: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  arquivo: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  escudo: '<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
  repetir: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/>',
  robo: '<rect x="5" y="8" width="14" height="11" rx="2"/><path d="M12 4v4M9 13h.01M15 13h.01M9 16h6M3 12v3M21 12v3"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  medalha: '<circle cx="12" cy="9" r="5"/><path d="m9 13-2 8 5-3 5 3-2-8"/>',
  codigo: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13 6l-2 12"/>',
  servidor: '<rect x="4" y="4" width="16" height="7" rx="1.5"/><rect x="4" y="13" width="16" height="7" rx="1.5"/><path d="M8 7.5h.01M8 16.5h.01"/>',
  peca: '<path d="M10 4h4v3a2 2 0 1 0 0 4v3h3v6H7v-6h3a2 2 0 1 0 0-4H7V4z"/>',
  grafico: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  infinito: '<path d="M7 9a3 3 0 1 0 0 6c2 0 3-1.5 5-3s3-3 5-3a3 3 0 1 1 0 6c-2 0-3-1.5-5-3s-3-3-5-3z"/>',
  quadro: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16M5.5 8h1.5M11.5 8h1.5M11.5 11h1.5M17.5 8h1"/>',
  pincel: '<path d="M14 4 20 10l-8 8H6v-6z"/><path d="m11 7 6 6"/>',
  brilho: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
  estrela: '<path d="m12 3 2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6L3.3 9.2l6.1-.6z"/>',
  busca: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  menos: '<path d="M5 12h14"/>',
  ajustar: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  ampliar: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M11 8v6M8 11h6"/>',
};
export const icone = (nome, rotulo) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ${rotulo ? `role="img" aria-label="${esc(rotulo)}"` : 'aria-hidden="true"'}>${CAMINHOS[nome]}</svg>`;

// <head> com SEO completo: title, description, canonical, hreflang, Open Graph, Twitter e JSON-LD.
export function head({ lang, t, titulo, descricao, pagina = '', jsonld, extra = '' }) {
  const url = SITE.url + rota(lang, pagina);
  const alternos = SITE.idiomas.map(l => `<link rel="alternate" hreflang="${UIlang(l)}" href="${SITE.url + rota(l, pagina)}">`).join('')
    + `<link rel="alternate" hreflang="x-default" href="${SITE.url + rota('pt', pagina)}">`;
  const og = `${SITE.url}/media/og.jpg`;
  return `<meta charset="utf-8">
<script>try{var t=localStorage.getItem('tema');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<meta name="author" content="${SITE.nome}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#EEEEEC" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E0E10" media="(prefers-color-scheme: dark)">
<link rel="canonical" href="${url}">
${alternos}
<meta property="og:type" content="profile">
<meta property="og:site_name" content="${SITE.nome}">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${SITE.nome} · ${SITE.cargo}">
<meta property="og:locale" content="${t('meta.locale')}">
${SITE.idiomas.filter(l => l !== lang).map(l => `<meta property="og:locale:alternate" content="${{ pt: 'pt_BR', en: 'en_US', es: 'es_ES' }[l]}">`).join('')}
<meta property="profile:first_name" content="Matheus">
<meta property="profile:last_name" content="Bonotto">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(titulo)}">
<meta name="twitter:description" content="${esc(descricao)}">
<meta name="twitter:image" content="${og}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-96x96.png" sizes="96x96" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="preconnect" href="${'https://rncpbkzszbbqqipkqcgs.supabase.co'}" crossorigin>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : ''}
${extra}`;
}
const UIlang = l => ({ pt: 'pt-BR', en: 'en', es: 'es' }[l]);
