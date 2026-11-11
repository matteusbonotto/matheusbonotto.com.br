// Gera public/media a partir de assets/: fotos e logo em WebP, posters dos vídeos, sequência de quadros do vídeo
// de abertura (a rolagem controla o quadro, como nas páginas da Apple) e a imagem de compartilhamento (OG).
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const ORIGEM = 'assets', DESTINO = 'public/media';
fs.rmSync(`${DESTINO}/escritorio`, { recursive: true, force: true });
fs.mkdirSync(`${DESTINO}/intro`, { recursive: true });
const LOGO = 'C:/Users/Matheus Bonotto/Documents/github/old/matheusbonotto.com.br/assets/logo-branco.png';
// o logo de origem pode não existir mais; os .webp já gerados ficam em public/media
if (fs.existsSync(LOGO)) for (const t of [64, 128]) await sharp(LOGO).resize(t).webp({ quality: 90 }).toFile(`${DESTINO}/logo-${t}.webp`);

for (const f of fs.readdirSync(ORIGEM).filter(f => f.endsWith('.png')))
  await sharp(path.join(ORIGEM, f)).resize({ width: 768 }).webp({ quality: 78 }).toFile(`${DESTINO}/${f.replace('.png', '.webp')}`);

const videos = { 'intro-name.mp4': 'intro.mp4', 'trabalhando-escritório.mp4': 'escritorio.mp4', 'fazendo-entrevista.mp4': 'entrevista.mp4' };
for (const [de, para] of Object.entries(videos)) fs.copyFileSync(path.join(ORIGEM, de), `${DESTINO}/${para}`);
// contato em bumerangue: ida + volta, para o loop não ter emenda. 1280px e 2 threads: o reverse guarda todos os quadros na memória
execFileSync('ffmpeg', ['-v', 'error', '-y', '-threads', '2', '-i', path.join(ORIGEM, 'fazendo-entrevista.mp4'), '-filter_complex', '[0:v]scale=1280:-2,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0[v]',
  '-map', '[v]', '-an', '-c:v', 'libx264', '-crf', '23', '-preset', 'veryfast', '-threads', '2', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${DESTINO}/entrevista.mp4`]);

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
// quadros da seção "Como eu trabalho" (canvas rolado pelo scroll); sem eles o vídeo fica congelado no poster
execFileSync(process.execPath, ['scripts/quadros-video.mjs', `${DESTINO}/escritorio.mp4`, `${DESTINO}/escritorio`, '60', '1280'], { stdio: 'inherit' });

// Imagem de compartilhamento 1200x630: último quadro da abertura (nome + pessoa), em alta, com corpo inteiro
execFileSync('ffmpeg', ['-v', 'error', '-y', '-sseof', '-0.1', '-i', path.join(ORIGEM, 'intro-name.mp4'), '-frames:v', '1', 'node_modules/.og.png']);
await sharp('node_modules/.og.png').extract({ left: 94, top: 196, width: 2300, height: 1208 }).resize(1200, 630).jpeg({ quality: 86, mozjpeg: true }).toFile(`${DESTINO}/og.jpg`);
fs.rmSync('node_modules/.og.png');
console.log('ok', fs.readdirSync(`${DESTINO}/intro`).length, 'quadros');
