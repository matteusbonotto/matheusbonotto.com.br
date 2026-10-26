// Uso único (26/10/2026): baixa todas as imagens referenciadas no banco (repositório antigo, links externos
// e URLs assinadas que expiram), converte para WebP e sobe no bucket público "media", atualizando o banco.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const REF = 'rncpbkzszbbqqipkqcgs';
const ANTIGO = 'C:/Users/Matheus Bonotto/Documents/github/old/matheusbonotto.com.br';
const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split('\n').filter(l => l.includes('=')).map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()]));
const api = (p, o = {}) => fetch(`https://api.supabase.com/v1/projects/${REF}${p}`, { ...o, headers: { Authorization: `Bearer ${env.SB_PAT}`, 'Content-Type': 'application/json' } }).then(r => r.json());
const keys = await api('/api-keys?reveal=true');
const service = keys.find(k => k.name === 'service_role').api_key;
const sb = createClient(`https://${REF}.supabase.co`, service, { auth: { persistSession: false } });

const alvos = [
  ['projects', 'imagem_url', 'projetos', 1600], ['professional_history', 'logo_url', 'logos', 256],
  ['academic_history', 'logo_url', 'logos', 256], ['feedbacks', 'imagem_url', 'pessoas', 256],
  ['achievements', 'imagem_url', 'conquistas', 384], ['achievements', 'evidencias_urls', 'evidencias', 1600],
  ['achievements', 'evidence_file', 'evidencias', 1600], ['profiles', 'avatar_url', 'perfil', 512],
  ['professional_history', 'imagens_urls', 'trajetoria', 1600], ['academic_history', 'imagens_urls', 'trajetoria', 1600],
];
const publico = `https://${REF}.supabase.co/storage/v1/object/public/media/`;
const cache = new Map();

async function baixar(u) {
  if (u.startsWith('assets/') || u.startsWith('/assets/')) return fs.readFileSync(path.join(ANTIGO, u.replace(/^\//, '')));
  const assinada = u.match(/\/storage\/v1\/object\/(?:sign|public)\/images\/([^?]+)/);
  if (assinada) {
    const { data, error } = await sb.storage.from('images').download(decodeURIComponent(assinada[1]));
    if (error) throw error;
    return Buffer.from(await data.arrayBuffer());
  }
  const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

async function migrar(u, pasta, largura, nome) {
  if (!u || u.startsWith(publico)) return u;
  if (cache.has(u)) return cache.get(u);
  const buf = await baixar(u);
  const webp = await sharp(buf).rotate().resize({ width: largura, withoutEnlargement: true }).webp({ quality: 74 }).toBuffer();
  const arquivo = `${pasta}/${nome}.webp`;
  const { error } = await sb.storage.from('media').upload(arquivo, webp, { contentType: 'image/webp', upsert: true });
  if (error) throw error;
  console.log(`ok ${arquivo} ${(buf.length / 1024) | 0}KB -> ${(webp.length / 1024) | 0}KB`);
  cache.set(u, publico + arquivo);
  return publico + arquivo;
}

const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
const falhas = [];
for (const [tabela, col, pasta, largura] of alvos) {
  const { data, error } = await sb.from(tabela).select('*');
  if (error) throw error;
  for (const linha of data) {
    const base = slug(linha.titulo || linha.instituicao || linha.nome || linha.nome_completo || linha.id);
    const valor = linha[col];
    try {
      let novo;
      if (Array.isArray(valor)) novo = await Promise.all(valor.map((u, i) => migrar(u, pasta, largura, `${base}-${i + 1}`)));
      else novo = await migrar(valor, pasta, largura, `${base}-${linha.id.slice(0, 6)}`);
      if (JSON.stringify(novo) !== JSON.stringify(valor)) {
        const { error: e } = await sb.from(tabela).update({ [col]: novo }).eq('id', linha.id);
        if (e) throw e;
      }
    } catch (e) {
      falhas.push(`${tabela}.${col} ${base}: ${e.message}`);
    }
  }
}
console.log('FALHAS:', falhas.length ? '\n' + falhas.join('\n') : 'nenhuma');
