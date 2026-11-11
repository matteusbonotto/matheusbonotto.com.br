// Refaz os 10 prints do Achadubom (assets/08-achadubom) com o site no ar. Depois: node scripts/prints-projetos.mjs achadubom
import { chromium, devices } from '@playwright/test';
import path from 'node:path';

const SITE = 'https://achadubom.com.br';
const PASTA = 'assets/08-achadubom';
const TERMO = 'café'; // precisa ter resultado na busca

const b = await chromium.launch();
async function tela(ctxOpts, cenas) {
  const ctx = await b.newContext({ ...ctxOpts, locale: 'pt-BR' });
  const p = await ctx.newPage();
  for (const [nome, passo] of cenas) {
    await passo(p);
    await p.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await p.waitForTimeout(1200);
    await p.screenshot({ path: path.join(PASTA, `${nome}.png`) });
    console.log('ok', nome);
  }
  await ctx.close();
}
const abrir = (url, y = 0) => async (p) => {
  if (p.url() !== SITE + url) await p.goto(SITE + url, { waitUntil: 'networkidle' });
  // rola até o fim e volta, para as animações de "revelar" e as imagens preguiçosas carregarem
  await p.evaluate(async (y) => { for (let v = 0; v < document.body.scrollHeight; v += 500) { scrollTo(0, v); await new Promise(r => setTimeout(r, 80)); } scrollTo(0, y); }, y);
};
// rola até o título com esse texto (o carrossel da home nunca fica parado, então sem scrollIntoView)
const ate = (texto) => (p) => p.evaluate((texto) => {
  const el = [...document.querySelectorAll('h1,h2,h3')].find(e => e.textContent.includes(texto) && e.checkVisibility());
  if (el) scrollTo(0, el.getBoundingClientRect().top + scrollY - (document.querySelector("header")?.offsetHeight || 90) - 24);
}, texto);
const filtros = async (p) => { await p.getByRole('button', { name: /Filtros/ }).first().click(); };
const digitar = async (p) => { await p.locator('input[placeholder*="Buscar"]:visible').first().fill(TERMO); };

await tela({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }, [
  ['desktop-01-hero', abrir('/')],
  ['desktop-02-produtos-em-alta', async (p) => { await abrir('/')(p); await ate('Mais vendidos agora')(p); }],
  ['desktop-03-busca', async (p) => { await abrir('/')(p); await digitar(p); }],
  ['desktop-04-resultado-busca', abrir(`/buscar/?q=${encodeURIComponent(TERMO)}`)],
  ['desktop-05-filtro-categorias', async (p) => { await abrir('/d/casa-e-cozinha/')(p); await filtros(p); }],
]);
await tela({ ...devices['iPhone 13'], deviceScaleFactor: 2 }, [
  ['mobile-01-produtos-em-alta', async (p) => { await abrir('/')(p); await ate('Mais vendidos agora')(p); }],
  ['mobile-02-lista-achadinhos', abrir('/d/achadinhos/')],
  ['mobile-03-filtros', async (p) => { await abrir('/d/achadinhos/')(p); await filtros(p); }],
  ['mobile-04-sobre', abrir('/como-funciona/')],
  ['mobile-05-hero', abrir('/')],
]);
await b.close();
