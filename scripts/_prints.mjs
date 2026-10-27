import { chromium, devices } from '@playwright/test';
const b = await chromium.launch();
const erros = [];
for (const [nome, ctx] of [['d', { viewport: { width: 1440, height: 900 } }], ['m', devices['Pixel 7']]]) {
  const p = await (await b.newContext(ctx)).newPage();
  p.on('pageerror', e => erros.push(nome + ' ' + e.message));
  await p.addInitScript(() => localStorage.setItem('idioma', 'pt'));
  await p.goto('http://localhost:4174/', { waitUntil: 'networkidle' });
  const v = p.locator('.vitrine');
  await v.scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
  if (nome === 'd') { const r = await v.boundingBox(); await p.mouse.move(r.x + r.width * .45, r.y + r.height / 2); await p.waitForTimeout(900); }
  await p.screenshot({ path: 'C:/Users/MATHEU~1/AppData/Local/Temp/claude/c--Users-Matheus-Bonotto-Documents-github-smarthub/c817d176-d48b-4ed1-9fb2-28ce1ccff71b/scratchpad/' + nome + '-vitrine.png' });
  await p.locator('.manifesto').scrollIntoViewIfNeeded(); await p.evaluate(() => scrollBy(0, innerHeight * 1.5)); await p.waitForTimeout(1200);
  await p.screenshot({ path: 'C:/Users/MATHEU~1/AppData/Local/Temp/claude/c--Users-Matheus-Bonotto-Documents-github-smarthub/c817d176-d48b-4ed1-9fb2-28ce1ccff71b/scratchpad/' + nome + '-manifesto.png' });
  await p.goto('http://localhost:4174/projetos/', { waitUntil: 'networkidle' });
  const mais = p.locator('.cartao [data-mais-selos]:visible').first();
  if (await mais.count()) { await mais.click(); await p.waitForTimeout(500); }
  await p.locator('.grupo').first().screenshot({ path: 'C:/Users/MATHEU~1/AppData/Local/Temp/claude/c--Users-Matheus-Bonotto-Documents-github-smarthub/c817d176-d48b-4ed1-9fb2-28ce1ccff71b/scratchpad/' + nome + '-cards.png' });
  console.log(nome, 'modal aberto?', await p.locator('[data-modal][open]').count());
  await p.goto('http://localhost:4174/projetos/#projeto/condonotto', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  await p.screenshot({ path: 'C:/Users/MATHEU~1/AppData/Local/Temp/claude/c--Users-Matheus-Bonotto-Documents-github-smarthub/c817d176-d48b-4ed1-9fb2-28ce1ccff71b/scratchpad/' + nome + '-galeria.png' });
  await p.locator('.galeria-item.ativo [data-galeria-ampliar]').click(); await p.waitForTimeout(700);
  await p.locator('[data-v="mais"]').click(); await p.locator('[data-v="mais"]').click(); await p.waitForTimeout(600);
  await p.screenshot({ path: 'C:/Users/MATHEU~1/AppData/Local/Temp/claude/c--Users-Matheus-Bonotto-Documents-github-smarthub/c817d176-d48b-4ed1-9fb2-28ce1ccff71b/scratchpad/' + nome + '-visor.png' });
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  console.log(nome, 'visor fechado', await p.locator('.visor').count(), 'modal ainda aberto', await p.locator('[data-modal][open]').count());
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  console.log(nome, 'modal fechado', await p.locator('[data-modal][open]').count());
}
console.log(erros);
await b.close();
