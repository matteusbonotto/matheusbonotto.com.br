// Gera o PDF de cada versão do currículo (QA, DEV, Freelancer...) em cada idioma dentro de dist/, para o botão
// "Baixar PDF" da página do currículo. Roda depois do vite build: abre o próprio build e imprime como o navegador faria.
import { chromium } from '@playwright/test';
import { preview } from 'vite';
import { SITE } from '../src/config.js';
import { rota } from '../src/i18n/ui.js';

const servidor = await preview({ preview: { port: 4174, strictPort: true } });
const navegador = await chromium.launch();
try {
  const page = await navegador.newPage();
  for (const lang of SITE.idiomas) {
    const url = `http://localhost:4174${rota(lang, 'cv')}`;
    await page.goto(url);
    const versoes = await page.locator('[data-variante]').evaluateAll(bs => bs.map(b => b.dataset.variante));
    for (const v of versoes) {
      await page.goto(`${url}?perfil=${encodeURIComponent(v)}`, { waitUntil: 'networkidle' });
      await page.waitForFunction(x => document.documentElement.dataset.cvPronto === x, v);
      const destino = `dist${rota(lang, 'cv')}${await page.locator('.cv-arquivo').textContent()}`;
      await page.pdf({ path: destino, preferCSSPageSize: true, printBackground: true });
      console.log(`pdf ok: ${destino}`);
    }
  }
} finally {
  await navegador.close();
  servidor.httpServer.close();
}
