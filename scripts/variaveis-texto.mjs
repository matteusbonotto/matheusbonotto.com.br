// Troca anos de experiência escritos à mão ("6 anos", "6 years", "6 años") por {anos}, calculado no render.
import { adminClient } from './supabase-admin.mjs';
const sb = await adminClient();
const { data, error } = await sb.from('site_content').select('key,value');
if (error) throw error;
const re = /\b\d+(\+?) (anos|years|años)\b/g;
for (const { key, value } of data) {
  const antes = JSON.stringify(value);
  const depois = antes.replace(re, '{anos}$1 $2');
  if (antes === depois) continue;
  const { error: e } = await sb.from('site_content').update({ value: JSON.parse(depois) }).eq('key', key);
  console.log(key, e ? e.message : 'ok', (antes.match(re) || []).join(', '));
}
