// Gera public/media a partir de assets/: fotos e logo em WebP, posters dos vídeos, sequência de quadros do vídeo
// de abertura (a rolagem controla o quadro, como nas páginas da Apple) e a imagem de compartilhamento (OG).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const ORIGEM = 'assets', DESTINO = 'public/media';
fs.rmSync(`${DESTINO}/escritorio`, { recursive: true, force: true });
fs.mkdirSync(`${DESTINO}/intro`, { recursive: true });
const LOGO = 'C:/Users/Matheus Bonotto/Documents/github/old/matheusbonotto.com.br/assets/logo-branco.png';
for (const t of [64, 128]) await sharp(LOGO).resize(t).webp({ quality: 90 }).toFile(`${DESTINO}/logo-${t}.webp`);

for (const f of fs.readdirSync(ORIGEM).filter(f => f.endsWith('.png')))
  await sharp(path.join(ORIGEM, f)).resize({ width: 768 }).webp({ quality: 78 }).toFile(`${DESTINO}/${f.replace('.png', '.webp')}`);

const videos = { 'intro-name.mp4': 'intro.mp4', 'trabalhando-escritório.mp4': 'escritorio.mp4', 'fazendo-entrevista.mp4': 'entrevista.mp4' };
for (const [de, para] of Object.entries(videos)) fs.copyFileSync(path.join(ORIGEM, de), `${DESTINO}/${para}`);

// Chrome (canal "chrome") decodifica H.264; o Chromium do Playwright não.
const b = await chromium.launch({ channel: 'chrome', args: ['--allow-file-access-from-files'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const tmp = path.resolve('node_modules/.cache-video.html');
async function abrir(video) {
  fs.writeFileSync(tmp, `<body style="margin:0;background:#000"><video id=v muted src="${pathToFileURL(path.resolve(DESTINO, video)).href}" style="display:block;width:1280px;height:720px"></video></body>`);
  await p.goto(pathToFileURL(tmp).href);
  return p.evaluate(() => new Promise(r => { const v = document.getElementById('v'); v.readyState >= 1 ? r(v.duration) : v.onloadedmetadata = () => r(v.duration); }));
}
const quadro = t => p.evaluate(t => new Promise(r => { const v = document.getElementById('v'); v.onseeked = () => requestAnimationFrame(() => r()); v.currentTime = t; }), t).then(() => p.locator('#v').screenshot());

const QUADROS = 60;
// recorte que tira o ícone do Gemini (canto inferior direito) mantendo nome e pessoa inteiros
const RECORTE = { left: 60, top: 60, width: 1120, height: 600 };
let dur = await abrir('escritorio.mp4');
await sharp(await quadro(0.5)).webp({ quality: 70 }).toFile(`${DESTINO}/escritorio-poster.webp`);
dur = await abrir('intro.mp4');
for (let i = 0; i < QUADROS; i++) {
  const img = await quadro(Math.min(dur - 0.05, (dur * i) / (QUADROS - 1)));
  await sharp(img).extract(RECORTE).webp({ quality: 62 }).toFile(`${DESTINO}/intro/${String(i).padStart(3, '0')}.webp`);
}
await sharp(await quadro(dur - 0.05)).extract(RECORTE).webp({ quality: 74 }).toFile(`${DESTINO}/intro-poster.webp`);
dur = await abrir('entrevista.mp4');
await sharp(await quadro(1)).webp({ quality: 70 }).toFile(`${DESTINO}/entrevista-poster.webp`);
await b.close();
fs.rmSync(tmp);

// Imagem de compartilhamento 1200x630
const foto = await sharp(path.join(ORIGEM, 'perfil-social.png')).resize({ height: 630 }).toBuffer();
const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="#EEEEEC"/>
<text x="72" y="120" font-family="Consolas, monospace" font-size="24" fill="#D7301F" letter-spacing="2">QA ENGINEER</text>
<text x="68" y="250" font-family="Arial Black, Arial" font-weight="900" font-size="96" fill="#0E0E10" letter-spacing="-3">Matheus</text>
<text x="68" y="350" font-family="Arial Black, Arial" font-weight="900" font-size="96" fill="#0E0E10" letter-spacing="-3">Bonotto</text>
<text x="72" y="430" font-family="Arial" font-size="30" fill="#4A4A50">Testes manuais · Automação · Playwright · Robot</text>
<text x="72" y="560" font-family="Consolas, monospace" font-size="24" fill="#4A4A50">matheusbonotto.com.br</text></svg>`;
await sharp(Buffer.from(svg)).composite([{ input: foto, left: 1200 - 473, top: 0 }]).jpeg({ quality: 82 }).toFile(`${DESTINO}/og.jpg`);
console.log('ok', fs.readdirSync(`${DESTINO}/intro`).length, 'quadros');
