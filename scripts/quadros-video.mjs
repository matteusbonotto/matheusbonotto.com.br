// Extrai N quadros de um vídeo para a sequência rolada pelo scroll (como a abertura), usando o Chrome instalado.
// Uso: node scripts/quadros-video.mjs public/media/escritorio.mp4 public/media/escritorio 60 960
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { chromium } from '@playwright/test';
const [video, saida, n = '60', largura = '960'] = process.argv.slice(2);
fs.mkdirSync(saida, { recursive: true });
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage();
const dados = fs.readFileSync(video).toString('base64');
await p.setContent(`<video id="v" muted src="data:video/mp4;base64,${dados}"></video><canvas id="c"></canvas>`);
const info = await p.evaluate(() => new Promise(ok => { const v = document.getElementById('v'); const f = () => ok({ d: v.duration, w: v.videoWidth, h: v.videoHeight }); v.readyState >= 1 ? f() : v.addEventListener('loadedmetadata', f); }));
console.log(info);
for (let i = 0; i < +n; i++) {
  const t = Math.min(info.d - 0.05, (info.d * i) / (+n - 1));
  const png = await p.evaluate(t => new Promise(ok => {
    const v = document.getElementById('v'), c = document.getElementById('c');
    v.addEventListener('seeked', () => { c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0); ok(c.toDataURL('image/png').split(',')[1]); }, { once: true });
    v.currentTime = t;
  }), t);
  await sharp(Buffer.from(png, 'base64')).resize({ width: +largura }).webp({ quality: 72 }).toFile(path.join(saida, `${String(i).padStart(3, '0')}.webp`));
}
await b.close();
