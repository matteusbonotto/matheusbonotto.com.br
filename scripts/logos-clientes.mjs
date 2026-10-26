// Sobe os logos das empresas (favicons oficiais) e grava site_content.clientes = [{ nome, logo }].
import fs from 'node:fs';
import sharp from 'sharp';
import { adminClient, SUPABASE_URL } from './supabase-admin.mjs';
const PASTA = process.argv[2];
const sb = await adminClient();
const pub = a => `${SUPABASE_URL}/storage/v1/object/public/media/${a}`;
const { data: exp } = await sb.from('professional_history').select('instituicao, logo_url');
const clientes = [
  ['Samsung', 'samsung.com'], ['Americanas', null], ['Cinemark LATAM', 'cinemark.com.br'], ['Bullla', 'bullla.com.br'],
  ['Bankeiro', 'bankeiro.com.br'], ['Trinus', 'trinus.co'], ['Vinci Partners', 'vincipartners.com'],
];
const out = [];
for (const [nome, dom] of clientes) {
  let logo = exp.find(e => e.instituicao.startsWith(nome))?.logo_url || null;
  if (dom) {
    const webp = await sharp(fs.readFileSync(`${PASTA}/${dom}.png`)).resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 90 }).toBuffer();
    const arq = `clientes/${dom.split('.')[0]}.webp`;
    const { error } = await sb.storage.from('media').upload(arq, webp, { contentType: 'image/webp', upsert: true });
    if (error) throw error;
    logo = pub(arq);
  }
  out.push({ nome, logo });
}
const { error } = await sb.from('site_content').upsert({ key: 'clientes', value: out });
if (error) throw error;
console.log(out);
