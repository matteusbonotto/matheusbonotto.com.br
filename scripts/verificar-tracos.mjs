// Garante que nenhum travessão (— ou –) existe no banco. Uso: node scripts/verificar-tracos.mjs
import { adminClient } from './supabase-admin.mjs';
const sb = await adminClient();
let total = 0;
for (const t of ['projects', 'professional_history', 'academic_history', 'certifications', 'feedbacks', 'skills_tree', 'hard_skills', 'soft_skills', 'languages', 'achievements', 'site_content']) {
  const { data, error } = await sb.from(t).select('*');
  if (error) { console.log(t, error.message); continue; }
  const n = (JSON.stringify(data).match(/[—–]/g) || []).length;
  if (n) console.log(t, n);
  total += n;
}
console.log(total ? `${total} travessões encontrados` : 'sem travessões no banco');
process.exitCode = total ? 1 : 0;
