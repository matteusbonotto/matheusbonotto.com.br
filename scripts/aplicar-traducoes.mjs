// Aplica scripts/conteudo/traducoes-pendentes.json no campo i18n de cada linha (id pelo prefixo).
// "=" repete o valor em português (nomes próprios); { en, es } traz a tradução de cada idioma.
import fs from 'node:fs';
import { adminClient } from './supabase-admin.mjs';
const sb = await adminClient();
const tr = JSON.parse(fs.readFileSync(new URL('./conteudo/traducoes-pendentes.json', import.meta.url), 'utf8'));
for (const [tabela, linhas] of Object.entries(tr)) {
  const { data } = await sb.from(tabela).select('*');
  for (const [prefixo, campos] of Object.entries(linhas)) {
    const l = data.find(x => x.id.startsWith(prefixo));
    if (!l) { console.log('não achei', tabela, prefixo); continue; }
    const i18n = { ...(l.i18n || {}) };
    for (const lang of ['en', 'es']) {
      i18n[lang] = { ...(i18n[lang] || {}) };
      for (const [campo, v] of Object.entries(campos)) {
        const atual = i18n[lang][campo];
        if (atual !== undefined && atual !== '') continue;
        i18n[lang][campo] = v === '=' ? l[campo] : v[lang];
      }
    }
    const { error } = await sb.from(tabela).update({ i18n }).eq('id', l.id);
    if (error) console.log(tabela, prefixo, error.message);
  }
}
console.log('ok');
