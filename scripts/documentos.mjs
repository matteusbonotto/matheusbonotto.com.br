// Publica PDFs de um projeto no Storage e grava a lista em projects.documentos (+ títulos em en/es no i18n).
// Uso: node scripts/documentos.mjs <arquivo.json>   formato: { "slug": "...", "docs": [{ "arquivo": "c:/.../x.pdf", "pt": "...", "en": "...", "es": "..." }] }
import fs from 'node:fs';
import path from 'node:path';
import { adminClient, SUPABASE_URL } from './supabase-admin.mjs';
const { slug, docs } = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const sb = await adminClient();
const lista = { pt: [], en: [], es: [] };
const versao = Date.now().toString(36); // fura o cache de 1 ano quando o PDF é refeito
for (const d of docs) {
  const nome = `projetos/${slug}/docs/${path.basename(d.arquivo)}`;
  const { error } = await sb.storage.from('media').upload(nome, fs.readFileSync(d.arquivo), { contentType: 'application/pdf', upsert: true, cacheControl: '31536000' });
  if (error) throw new Error(`${nome}: ${error.message}`);
  const url = `${SUPABASE_URL}/storage/v1/object/public/media/${nome}?v=${versao}`;
  for (const l of ['pt', 'en', 'es']) lista[l].push({ titulo: d[l], url });
}
const { data: p, error: e1 } = await sb.from('projects').select('i18n').eq('slug', slug).single();
if (e1) throw e1;
const i18n = p.i18n || {};
for (const l of ['en', 'es']) i18n[l] = { ...(i18n[l] || {}), documentos: lista[l] };
const { error: e2 } = await sb.from('projects').update({ documentos: lista.pt, i18n }).eq('slug', slug);
if (e2) throw e2;
console.log(slug, lista.pt.length, 'documentos');
