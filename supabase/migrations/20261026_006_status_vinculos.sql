-- Itens podem ficar "bloqueados" (aparecem cinza, com cadeado, sem clique) além de ocultos (visivel/ativo = false)
do $$
declare t text;
begin
  foreach t in array array['projects','professional_history','academic_history','certifications','skills_tree','achievements'] loop
    execute format('alter table public.%I add column if not exists bloqueado boolean not null default false', t);
  end loop;
end $$;

-- Recomendações ligadas à empresa da experiência (o modal da trajetória lista as recomendações daquele lugar)
update public.feedbacks f set professional_history_id = p.id
from public.professional_history p
where f.professional_history_id is null and (
  (f.empresa ilike 'americanas%' and p.instituicao ilike 'americanas%') or
  (f.empresa ilike 'sidi%' and p.instituicao = 'SiDi') or
  (f.empresa ilike 'mb labs%' and p.instituicao = 'MB Labs') or
  (f.empresa ilike 'crespo%' and p.instituicao ilike 'crespo%') or
  (f.empresa ilike '%ci&t%' and p.instituicao ilike 'americanas%'));

-- Origem dos projetos (onde foram feitos)
update public.projects set professional_history_id = (select id from public.professional_history where instituicao = 'MB Labs')
  where slug in ('stark-hub', 'qa-cnk-issue-generator', 'workitem-assistant-cnk', 'mb-copiloto-jira', 'importaccount-trinus');
update public.projects set professional_history_id = (select id from public.professional_history where instituicao = 'Squidev')
  where slug in ('squidev', 'instrutora-jaqueline', 'fofuxa-fashion', 'rodolfo-seifert', 'paraiso-bio', 'achadubom', 'evangeligo', 'qa-toolbar', 'ipvida');
update public.projects set professional_history_id = (select id from public.professional_history where instituicao ilike 'americanas%')
  where slug in ('taskassistant-americanas', 'importproducts-americanas');
-- Árvore de habilidades revisada com o currículo atual (Zephyr, CTFL, React, Supabase, Tampermonkey, Power BI, espanhol, IA em QA)
insert into public.skills_tree (nome, categoria, nivel, parent_id, ordem, desbloqueado, descricao)
select v.nome, v.cat, v.nivel, (select id from public.skills_tree where nome = v.pai), v.ordem, true, v.descr
from (values
  ('ZEPHYR', 'devops', 75, 'DEVOPS TOOLS', 3, 'Gestão de casos e ciclos de teste integrada ao Jira.'),
  ('ISTQB CTFL', 'qa', 85, 'TEST METHODOLOGIES', 0, 'Práticas e vocabulário do Certified Tester Foundation Level 4.0.'),
  ('REACT', 'dev', 60, 'FRONTEND', 9, 'Interfaces do Stark Hub e do EvangeliGO.'),
  ('SUPABASE', 'dev', 70, 'BACKEND', 9, 'Banco, autenticação, RLS e Edge Functions em produtos publicados.'),
  ('TAMPERMONKEY', 'dev', 75, 'FRONTEND', 10, 'Userscripts e extensões que automatizam o dia a dia do QA.'),
  ('POWER BI', 'data', 75, 'DASHBOARDS', 1, 'Dashboards de vendas, produtos, SAC e perfil.'),
  ('ESPANHOL', 'idiomas', 35, 'IDIOMAS', 2, 'Nível básico.'),
  ('IA APLICADA A QA', 'vibe', 80, 'AI / VIBE CODING', 3, 'Geração de cenários, revisão de requisitos e automação de tarefas com IA.')
) v(nome, cat, nivel, pai, ordem, descr)
where not exists (select 1 from public.skills_tree s where s.nome = v.nome);
update public.skills_tree set nivel = 80 where nome = 'TEST AUTOMATION';
update public.skills_tree set nivel = 80 where nome = 'PLAYWRIGHT';
update public.skills_tree set nivel = 70 where nome = 'DEVELOPMENT';

-- Sem travessões no conteúdo (o usuário considera um vício de texto de IA)
update public.projects set titulo = replace(replace(titulo, ' — ', ' · '), ' – ', ' · '),
  descricao_curta = replace(descricao_curta, ' — ', ', '), descricao_completa = replace(descricao_completa, ' — ', ', '),
  i18n = replace(replace(replace(i18n::text, ' — ', ', '), ' – ', ' · '), '—', ',')::jsonb;
update public.professional_history set descricao = replace(descricao, ' — ', ', '), i18n = replace(i18n::text, ' — ', ', ')::jsonb;
update public.feedbacks set mensagem = replace(mensagem, ' — ', ', '), i18n = replace(i18n::text, ' — ', ', ')::jsonb;
update public.site_content set value = replace(replace(value::text, ' — ', ', '), '—', ',')::jsonb;
