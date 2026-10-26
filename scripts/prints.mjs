// Prints de revisão: percorre a página e fotografa cada seção. Uso:
// node scripts/prints.mjs <url> <saida> <largura>x<altura> [seletor...]
import fs from 'node:fs';
import { chromium } from '@playwright/test';

const [url, saida, tam, ...secoes] = process.argv.slice(2);
const [w, h] = tam.split('x').map(Number);
fs.mkdirSync(saida, { recursive: true });
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: w < 800 });
const erros = [];
p.on('pageerror', e => erros.push(e.message));
p.on('console', m => m.type() === 'error' && erros.push(m.text()));
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
for (const s of secoes.length ? secoes : ['#topo']) {
  const [sel, desloc = '0'] = s.split('@');
  await p.evaluate(([sel, d]) => { const el = document.querySelector(sel); scrollTo({ top: el.getBoundingClientRect().top + scrollY + innerHeight * +d, behavior: 'instant' }); }, [sel, desloc]);
  await p.waitForTimeout(1300);
  await p.screenshot({ path: `${saida}/${w}x${h}-${sel.replace(/\W/g, '')}${desloc !== '0' ? '-' + desloc.replace('.', '_') : ''}.png` });
}
console.log(erros.length ? 'ERROS:\n' + [...new Set(erros)].join('\n') : 'sem erros de console');
await b.close();
