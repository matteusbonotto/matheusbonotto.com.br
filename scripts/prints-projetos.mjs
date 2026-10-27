// Sobe os prints de assets/NN-slug (desktop-*.png e mobile-*.png) para a galeria de cada projeto e gera a capa:
// monitor com o print de desktop e celular com o print mobile, desenhados em SVG e rasterizados pelo sharp.
// Uso: node scripts/prints-projetos.mjs [slug...]   (sem argumentos processa todas as pastas)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { adminClient, SUPABASE_URL } from './supabase-admin.mjs';

const RAIZ = 'assets';
const PASTA_SLUG = { 'qa-toolbar-sandbox': 'qa-toolbar' };
const sb = await adminClient();
const filtro = process.argv.slice(2);

const subir = async (buf, nome) => {
  const { error } = await sb.storage.from('media').upload(nome, buf, { contentType: 'image/webp', upsert: true, cacheControl: '31536000' });
  if (error) throw error;
  return `${SUPABASE_URL}/storage/v1/object/public/media/${nome}`;
};
const dataUri = async (arq, w, h) => `data:image/png;base64,${(await sharp(arq).resize(w, h, { fit: 'cover', position: 'top' }).png().toBuffer()).toString('base64')}`;

// Capa 1600x1000 com fundo transparente: o cartão do site mostra a própria cor por trás.
async function capa(desk, mob) {
  const SW = 1100, SH = 688; // tela do monitor (16:10)
  const mx = mob ? 180 : 250, my = 48, b = 18;
  const PW = 286, PH = 620, pb = 13; // tela do celular
  const px = mx + SW + b * 2 - 210, py = 1000 - PH - pb * 2 - 44;
  const imgD = await dataUri(desk, SW, SH);
  const BAR = 46; // faixa de status onde fica a ilha da câmera, sem cobrir o print
  const imgM = mob ? await dataUri(mob, PW, PH - BAR) : '';
  const cx = mx + b + SW / 2, base = my + SH + b * 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    <filter id="s" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur in="SourceAlpha" stdDeviation="22"/><feOffset dy="26"/><feComponentTransfer><feFuncA type="linear" slope=".38"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <linearGradient id="brilho" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="pe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa0a8"/><stop offset="1" stop-color="#d5d9de"/></linearGradient>
    <linearGradient id="aro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a3d44"/><stop offset="1" stop-color="#16171b"/></linearGradient>
    <clipPath id="tD"><rect x="${mx + b}" y="${my + b}" width="${SW}" height="${SH}" rx="6"/></clipPath>
    <clipPath id="tM"><rect x="${px + pb}" y="${py + pb}" width="${PW}" height="${PH}" rx="40"/></clipPath>
  </defs>
  <g filter="url(#s)">
    <path d="M${cx - 70} ${base} L${cx + 70} ${base} L${cx + 92} ${base + 92} L${cx - 92} ${base + 92} Z" fill="url(#pe)"/>
    <rect x="${cx - 190}" y="${base + 88}" width="380" height="16" rx="8" fill="#c4c9cf"/>
    <rect x="${mx}" y="${my}" width="${SW + b * 2}" height="${SH + b * 2}" rx="22" fill="#0c0d10" stroke="url(#aro)" stroke-width="3"/>
    <image href="${imgD}" x="${mx + b}" y="${my + b}" width="${SW}" height="${SH}" preserveAspectRatio="xMidYMin slice" clip-path="url(#tD)"/>
    <rect x="${mx + b}" y="${my + b}" width="${SW}" height="${SH}" rx="6" fill="url(#brilho)"/>
    <circle cx="${cx}" cy="${my + b / 2}" r="3" fill="#2a2c31"/>
  </g>
  ${mob ? `<g filter="url(#s)">
    <rect x="${px - 3}" y="${py + 150}" width="6" height="64" rx="3" fill="#2b2d33"/>
    <rect x="${px + PW + pb * 2 - 3}" y="${py + 120}" width="6" height="96" rx="3" fill="#2b2d33"/>
    <rect x="${px + pb}" y="${py + pb}" width="${PW}" height="${PH}" rx="40" fill="#000"/>
    <image href="${imgM}" x="${px + pb}" y="${py + pb + BAR}" width="${PW}" height="${PH - BAR}" preserveAspectRatio="xMidYMin slice" clip-path="url(#tM)"/>
    <image href="${imgM}" x="${px + pb}" y="${py + pb}" width="${PW}" height="${PH}" preserveAspectRatio="xMidYMin slice" clip-path="url(#tM)"/>
    <rect x="${px + pb}" y="${py + pb}" width="${PW}" height="${PH}" rx="40" fill="url(#brilho)"/>
    <rect x="${px + pb + PW / 2 - 46}" y="${py + pb + 12}" width="92" height="26" rx="13" fill="#000"/>
  </g>` : ''}
</svg>`;
  return sharp(Buffer.from(svg)).webp({ quality: 82, alphaQuality: 90 }).toBuffer();
}

for (const pasta of fs.readdirSync(RAIZ).filter(x => /^\d\d-/.test(x)).sort()) {
  const nome = pasta.replace(/^\d\d-/, '');
  const slug = PASTA_SLUG[nome] || nome;
  if (filtro.length && !filtro.includes(slug)) continue;
  const { data: proj } = await sb.from('projects').select('id').eq('slug', slug).maybeSingle();
  if (!proj) { console.log('sem projeto para', pasta); continue; }
  const arqs = fs.readdirSync(path.join(RAIZ, pasta)).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).sort();
  const galeria = [];
  for (const f of arqs) {
    const arq = path.join(RAIZ, pasta, f);
    const { width: w, height: h } = await sharp(arq).metadata();
    // print em pé vai para o celular, mesmo que o nome diga desktop (ex.: detalhe do cartão digital)
    const dispositivo = /^mobile/i.test(f) || h > w * 1.1 ? 'mobile' : 'desktop';
    const buf = await sharp(arq).resize({ width: Math.min(w, dispositivo === 'mobile' ? 780 : 1600), withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    const url = await subir(buf, `projetos/${slug}/${f.replace(/\.\w+$/, '.webp')}`);
    galeria.push({ url, dispositivo, w, h });
  }
  const desk = arqs.find(f => /^desktop/i.test(f));
  const mob = arqs.find(f => /^mobile/i.test(f));
  const imagem_url = `${await subir(await capa(path.join(RAIZ, pasta, desk), mob && path.join(RAIZ, pasta, mob)), `projetos/${slug}/capa.webp`)}?v=${Date.now().toString(36)}`;
  const { error } = await sb.from('projects').update({ galeria, imagem_url }).eq('id', proj.id);
  if (error) throw error;
  console.log(slug, galeria.length, 'prints');
}
