// Captura prints de uso (desktop e mobile, em 3 pontos da página) de cada projeto com site no ar
// e grava em projects.galeria; no fim monta a capa em moldura (prints-projetos). Uso: node scripts/capturar-galerias.mjs [slug ...]
import { chromium, devices } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { adminClient, SUPABASE_URL } from './supabase-admin.mjs';

const sb = await adminClient();
const filtro = process.argv.slice(2);
const { data: projetos, error } = await sb.from('projects').select('id, slug, titulo, link_projeto').eq('ativo', true).order('ordem');
if (error) throw error;
const alvos = projetos.filter(p => p.link_projeto && !/github\.com/.test(p.link_projeto) && (!filtro.length || filtro.includes(p.slug)));

const MODOS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, largura: 1440 },
  mobile: { ...devices['iPhone 13'], largura: 780 },
};
const b = await chromium.launch();
for (const p of alvos) {
  const galeria = [];
  try {
    for (const [disp, { largura, ...ctxOpts }] of Object.entries(MODOS)) {
      const ctx = await b.newContext({ ...ctxOpts, locale: 'pt-BR' });
      const pg = await ctx.newPage();
      await pg.goto(p.link_projeto, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
      await pg.waitForTimeout(2000);
      await pg.locator('[data-consent="nao"]').click({ timeout: 1500 }).catch(() => {}); // fecha aviso de cookies
      // percorre a página para disparar animações de "revelar ao rolar"
      const altura = await pg.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } return document.documentElement.scrollHeight; });
      const vh = ctxOpts.viewport.height;
      const posicoes = [0, vh * 1.1, vh * 2.3].filter(y => y === 0 || y < altura - vh * 0.4);
      for (const [i, y] of posicoes.entries()) {
        await pg.evaluate(y => scrollTo(0, y), y);
        await pg.waitForTimeout(900);
        const webp = await sharp(await pg.screenshot()).resize({ width: largura }).webp({ quality: 72 }).toBuffer();
        const arquivo = `galerias/${p.slug}/${disp}-${i + 1}.webp`;
        const { error: e } = await sb.storage.from('media').upload(arquivo, webp, { contentType: 'image/webp', upsert: true });
        if (e) throw e;
        galeria.push({ url: `${SUPABASE_URL}/storage/v1/object/public/media/${arquivo}?v=${Date.now().toString(36)}`, dispositivo: disp });
      }
      await ctx.close();
    }
    const { error: e } = await sb.from('projects').update({ galeria }).eq('id', p.id);
    if (e) throw e;
    console.log(`ok ${p.slug}: ${galeria.length} prints`);
  } catch (e) {
    console.log(`FALHOU ${p.slug}: ${e.message}`);
  }
}
await b.close();
// padrão: capa com os prints dentro do monitor e do celular (e w/h na galeria) sai junto
const feitos = alvos.map(p => p.slug);
if (feitos.length) execFileSync(process.execPath, ['scripts/prints-projetos.mjs', ...feitos], { stdio: 'inherit' });
