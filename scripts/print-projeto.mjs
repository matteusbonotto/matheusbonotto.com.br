// Tira um print 1440x900 de um site e grava como imagem do projeto. Uso: node scripts/print-projeto.mjs <slug> <url>
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { adminClient, SUPABASE_URL } from './supabase-admin.mjs';
const [slug, url] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
const webp = await sharp(await p.screenshot()).resize({ width: 1600 }).webp({ quality: 74 }).toBuffer(); await b.close();
const sb = await adminClient(); const arquivo = `projetos/${slug}.webp`;
const { error } = await sb.storage.from('media').upload(arquivo, webp, { contentType: 'image/webp', upsert: true }); if (error) throw error;
await sb.from('projects').update({ imagem_url: `${SUPABASE_URL}/storage/v1/object/public/media/${arquivo}` }).eq('slug', slug);
console.log('ok', arquivo, (webp.length / 1024) | 0, 'KB');
