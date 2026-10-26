// Executa SQL no Supabase via Management API, lendo o arquivo em UTF-8 (o Bash do Windows corrompia acentos).
// Uso: node scripts/sql.mjs arquivo.sql   |   node scripts/sql.mjs -e "select 1"
import fs from 'node:fs';
import { lerEnv, REF } from './supabase-admin.mjs';
const [modo, valor] = process.argv.slice(2);
const query = modo === '-e' ? valor : fs.readFileSync(modo, 'utf8');
const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: 'POST', headers: { Authorization: `Bearer ${lerEnv().SB_PAT}`, 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify({ query }),
});
const txt = await r.text();
if (!r.ok) { console.error(`ERRO HTTP ${r.status}`, txt.slice(0, 400)); process.exit(1); }
console.log(txt);
