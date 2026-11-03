// Gera o PDF do currículo (versão padrão) em cada idioma dentro de dist/, para o botão "Baixar CV (PDF)"
// baixar o arquivo em 1 clique. Roda depois do vite build: abre o próprio build e imprime como o navegador faria.
import { chromium } from '@playwright/test';
import { preview } from 'vite';
import { SITE } from '../src/config.js';
import { rota, tradutor } from '../src/i18n/ui.js';

const servidor = await preview({ preview: { port: 4174, strictPort: true } });
const navegador = await chromium.launch();
try {
  const page = await navegador.newPage();
  for (const lang of SITE.idiomas) {
    await page.goto(`http://localhost:4174${rota(lang, 'cv')}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-paginas] .folha');
    const destino = `dist${rota(lang, 'cv')}${tradutor(lang)('cv.arquivo')}`;
    await page.pdf({ path: destino, preferCSSPageSize: true, printBackground: true });
    console.log(`pdf ok: ${destino}`);
  }
} finally {
  await navegador.close();
  servidor.httpServer.close();
}
