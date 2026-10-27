// Padroniza as imagens de todos os projetos: galeria com os prints originais e capa com o print inteiro (sem corte)
// dentro de um monitor e, quando há print de celular, de um celular, desenhados em SVG e rasterizados pelo sharp.
// Fontes: assets/NN-slug (desktop-*.png e mobile-*.png); sem pasta, usa a galeria atual ou a imagem antiga do projeto.
// Uso: node scripts/prints-projetos.mjs [slug...]   (sem argumentos processa todos os projetos)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { adminClient, SUPABASE_URL } from './supabase-admin.mjs';

const RAIZ = 'assets';
const PASTA_SLUG = { 'qa-toolbar-sandbox': 'qa-toolbar' };
const sb = await adminClient();
const filtro = process.argv.slice(2);
const ehCapa = url => /\/capa\.webp/.test(url || '');

const subir = async (buf, nome) => {
  const { error } = await sb.storage.from('media').upload(nome, buf, { contentType: 'image/webp', upsert: true, cacheControl: '31536000' });
  if (error) throw error;
  return `${SUPABASE_URL}/storage/v1/object/public/media/${nome}`;
};
const baixar = async url => Buffer.from(await (await fetch(url)).arrayBuffer());
const dataUri = async (buf, w, h) => `data:image/png;base64,${(await sharp(buf).resize(Math.round(w), Math.round(h), { fit: 'fill' }).png().toBuffer()).toString('base64')}`;

// Capa 1600x1000 com fundo transparente. As telas assumem a proporção de cada print, então nada é cortado.
async function capa(desk, mob) {
  const md = await sharp(desk).metadata();
  const rD = md.height / md.width;
  const b = 18, PE = 104; // aro do monitor e altura do pé
  const SW = Math.min(1060, 700 / rD), SH = SW * rD;
  let cel = null;
  if (mob) {
    const mm = await sharp(mob).metadata();
    const rM = mm.height / mm.width;
    const tablet = rM < 1.6;
    const BAR = tablet ? 26 : 44, pb = tablet ? 16 : 13;
    const HC = Math.min(tablet ? 470 : 590, (tablet ? 400 : 290) * rM), WC = HC / rM;
    cel = { tablet, BAR, pb, WC, HC, W: WC + pb * 2, H: HC + BAR + pb * 2, rx: tablet ? 34 : 52, rxT: tablet ? 20 : 40 };
  }
  const largMon = SW + b * 2, altMon = SH + b * 2 + PE;
  const sobrepor = cel ? Math.min(cel.W * 0.62, 210) : 0;
  const largTotal = largMon + (cel ? cel.W - sobrepor : 0);
  const mx = (1600 - largTotal) / 2, my = (1000 - Math.max(altMon, cel ? cel.H : 0)) / 2 + (cel && cel.H > altMon ? cel.H - altMon : 0);
  const cx = mx + b + SW / 2, base = my + SH + b * 2;
  const imgD = await dataUri(desk, SW, SH);
  let svgCel = '';
  if (cel) {
    const px = mx + largMon - sobrepor, py = Math.max(16, my + altMon - cel.H - 14);
    const imgM = await dataUri(mob, cel.WC, cel.HC);
    const tx = px + cel.pb, ty = py + cel.pb;
    svgCel = `<g filter="url(#s)">
    <rect x="${px + cel.W - 3}" y="${py + 120}" width="6" height="90" rx="3" fill="#2b2d33"/>
    <rect x="${px}" y="${py}" width="${cel.W}" height="${cel.H}" rx="${cel.rx}" fill="#0c0d10" stroke="url(#aro)" stroke-width="3"/>
    <clipPath id="tM"><rect x="${tx}" y="${ty}" width="${cel.WC}" height="${cel.HC + cel.BAR}" rx="${cel.rxT}"/></clipPath>
    <g clip-path="url(#tM)"><rect x="${tx}" y="${ty}" width="${cel.WC}" height="${cel.BAR}" fill="#000"/>
    <image href="${imgM}" x="${tx}" y="${ty + cel.BAR}" width="${cel.WC}" height="${cel.HC}" preserveAspectRatio="none"/>
    <rect x="${tx}" y="${ty}" width="${cel.WC}" height="${cel.HC + cel.BAR}" fill="url(#brilho)"/></g>
    ${cel.tablet ? `<circle cx="${tx + cel.WC / 2}" cy="${ty + cel.BAR / 2}" r="5" fill="#1d1f24"/>` : `<rect x="${tx + cel.WC / 2 - 44}" y="${ty + 10}" width="88" height="25" rx="12.5" fill="#1a1b1f"/>`}
  </g>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    <filter id="s" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur in="SourceAlpha" stdDeviation="22"/><feOffset dy="26"/><feComponentTransfer><feFuncA type="linear" slope=".38"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <linearGradient id="brilho" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".09"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="pe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa0a8"/><stop offset="1" stop-color="#d5d9de"/></linearGradient>
    <linearGradient id="aro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a3d44"/><stop offset="1" stop-color="#16171b"/></linearGradient>
    <clipPath id="tD"><rect x="${mx + b}" y="${my + b}" width="${SW}" height="${SH}" rx="6"/></clipPath>
  </defs>
  <g filter="url(#s)">
    <path d="M${cx - 70} ${base} L${cx + 70} ${base} L${cx + 92} ${base + PE - 12} L${cx - 92} ${base + PE - 12} Z" fill="url(#pe)"/>
    <rect x="${cx - 190}" y="${base + PE - 16}" width="380" height="16" rx="8" fill="#c4c9cf"/>
    <rect x="${mx}" y="${my}" width="${largMon}" height="${SH + b * 2}" rx="22" fill="#0c0d10" stroke="url(#aro)" stroke-width="3"/>
    <image href="${imgD}" x="${mx + b}" y="${my + b}" width="${SW}" height="${SH}" preserveAspectRatio="none" clip-path="url(#tD)"/>
    <rect x="${mx + b}" y="${my + b}" width="${SW}" height="${SH}" rx="6" fill="url(#brilho)"/>
    <circle cx="${cx}" cy="${my + b / 2}" r="3" fill="#2a2c31"/>
  </g>
  ${svgCel}
</svg>`;
  return sharp(Buffer.from(svg)).webp({ quality: 84, alphaQuality: 90 }).toBuffer();
}

const pastas = Object.fromEntries(fs.readdirSync(RAIZ).filter(x => /^\d\d-/.test(x)).map(p => {
  const nome = p.replace(/^\d\d-/, '');
  return [PASTA_SLUG[nome] || nome, path.join(RAIZ, p)];
}));
const { data: projetos } = await sb.from('projects').select('id,slug,imagem_url,galeria').order('ordem');

for (const proj of projetos) {
  const { slug } = proj;
  if (filtro.length && !filtro.includes(slug)) continue;
  let galeria = [];
  const bufs = []; // [{ buf, dispositivo }] na ordem da galeria
  if (pastas[slug]) {
    const arqs = fs.readdirSync(pastas[slug]).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).sort();
    for (const f of arqs) {
      const buf = fs.readFileSync(path.join(pastas[slug], f));
      const { width: w, height: h } = await sharp(buf).metadata();
      // print em pé vai para o celular, mesmo que o nome diga desktop (ex.: detalhe do cartão digital)
      const dispositivo = /^mobile/i.test(f) || h > w * 1.1 ? 'mobile' : 'desktop';
      const web = await sharp(buf).resize({ width: Math.min(w, dispositivo === 'mobile' ? 780 : 1600), withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
      galeria.push({ url: process.env.SECO ? "" : await subir(web, `projetos/${slug}/${f.replace(/\.\w+$/, '.webp')}`), dispositivo, w, h });
      bufs.push({ buf, dispositivo });
    }
  } else {
    const fontes = (proj.galeria || []).length ? proj.galeria : (proj.imagem_url && !ehCapa(proj.imagem_url) ? [{ url: proj.imagem_url, dispositivo: 'desktop' }] : []);
    if (!fontes.length) { console.log(slug, 'sem imagem'); continue; }
    for (const g of fontes) {
      const buf = await baixar(g.url);
      const { width: w, height: h } = await sharp(buf).metadata();
      galeria.push({ ...g, w, h });
      bufs.push({ buf, dispositivo: g.dispositivo === 'mobile' ? 'mobile' : 'desktop' });
    }
  }
  const desk = bufs.find(x => x.dispositivo === 'desktop')?.buf;
  const mob = bufs.find(x => x.dispositivo === 'mobile')?.buf;
  if (!desk) { console.log(slug, 'sem print de desktop'); continue; }
  if (process.env.SECO) { fs.writeFileSync(path.join(process.env.SECO, `${slug}.webp`), await capa(desk, mob)); console.log(slug, "(teste)"); continue; }
  const imagem_url = `${await subir(await capa(desk, mob), `projetos/${slug}/capa.webp`)}?v=${Date.now().toString(36)}`;
  const { error } = await sb.from('projects').update({ galeria, imagem_url }).eq('id', proj.id);
  if (error) throw error;
  console.log(slug, galeria.length, 'prints');
}
