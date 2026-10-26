// Cliente service_role para scripts locais. A chave é buscada na Management API com o SB_PAT do .env
// e nunca é gravada em disco.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

export const REF = 'rncpbkzszbbqqipkqcgs';
export const SUPABASE_URL = `https://${REF}.supabase.co`;

export function lerEnv() {
  const txt = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
  return Object.fromEntries(txt.split(/\r?\n/).filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
}

export async function chaves() {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys?reveal=true`, { headers: { Authorization: `Bearer ${lerEnv().SB_PAT}` } });
  const lista = await r.json();
  return { anon: lista.find(k => k.name === 'anon').api_key, service: lista.find(k => k.name === 'service_role').api_key };
}

export async function adminClient() {
  return createClient(SUPABASE_URL, (await chaves()).service, { auth: { persistSession: false } });
}
