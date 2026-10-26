import fs from 'node:fs';
import { defineConfig } from 'vite';

// Entradas = páginas geradas pelo pré-render (todas as index.html fora de node_modules/dist/public) + admin
function paginas(dir = '.', saida = {}) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'public', 'src', 'tests', 'scripts', 'supabase', 'assets', 'backups', 'playwright-report', 'test-results', 'revisao-prints'].includes(e.name) || e.name.startsWith('.')) continue;
    const caminho = dir === '.' ? e.name : `${dir}/${e.name}`;
    if (e.isDirectory()) paginas(caminho, saida);
    else if (e.name === 'index.html') saida[caminho.replace(/\/?index\.html$/, '') || 'inicio'] = caminho;
  }
  return saida;
}

export default defineConfig({
  build: { rollupOptions: { input: paginas() } },
  test: { include: ['tests/unit/**/*.test.js'] },
});
