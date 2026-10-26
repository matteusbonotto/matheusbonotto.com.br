// Gera as páginas estáticas (PT na raiz, EN e ES em subpastas) com o conteúdo do banco já no HTML,
// para o Google e o LinkedIn lerem tudo sem executar JavaScript. Também gera sitemap.xml e robots.txt.
// Com FIXTURE=1 usa tests/fixtures/dados.json (testes sem rede).
import fs from 'node:fs';
import QRCode from 'qrcode';
import { SITE } from '../src/config.js';
import { rota } from '../src/i18n/ui.js';
import { buscarTudo, prepararIdioma } from '../src/lib/dados.js';
import { PAGINAS, paginaCV, paginaHTML } from '../src/render/documento.js';

const FIXTURE = 'tests/fixtures/dados.json';
let dados;
if (process.env.FIXTURE) dados = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
else {
  dados = await buscarTudo();
  fs.writeFileSync(FIXTURE, JSON.stringify(dados, null, 1)); // atualiza o retrato usado pelos testes
}

const escrever = (arq, html) => { fs.mkdirSync(arq.replace(/[^/]+$/, '') || '.', { recursive: true }); fs.writeFileSync(arq, html); };
for (const lang of SITE.idiomas) {
  const base = lang === 'pt' ? '' : `${lang}/`;
  const d = prepararIdioma(dados, lang);
  for (const pagina of Object.keys(PAGINAS)) escrever(`${base}${pagina ? pagina + '/' : ''}index.html`, paginaHTML(pagina, d, dados));
  const qr = await QRCode.toString(SITE.url + rota(lang, 'cv'), { type: 'svg', margin: 0, errorCorrectionLevel: 'M' });
  escrever(`${base}cv/index.html`, paginaCV(d, dados, qr));
}

const hoje = new Date().toISOString().slice(0, 10);
const urls = [...Object.keys(PAGINAS), 'cv'].flatMap(p => SITE.idiomas.map(l => `  <url><loc>${SITE.url + rota(l, p)}</loc><lastmod>${hoje}</lastmod>${SITE.idiomas.map(a => `<xhtml:link rel="alternate" hreflang="${a === 'pt' ? 'pt-BR' : a}" href="${SITE.url + rota(a, p)}"/>`).join('')}<priority>${p ? '0.8' : '1.0'}</priority></url>`));
fs.writeFileSync('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`);
fs.writeFileSync('public/robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${SITE.url}/sitemap.xml\n`);
console.log(`pré-render ok (${process.env.FIXTURE ? 'fixture' : 'banco'}): ${SITE.idiomas.length * (Object.keys(PAGINAS).length + 1)} páginas`);
