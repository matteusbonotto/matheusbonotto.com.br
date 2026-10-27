-- Versões do currículo viram registros editáveis no admin (criar, editar, ocultar, excluir).
-- "base" escolhe a lógica de montagem: ordem das experiências, nível de detalhe e projetos exibidos.
create table if not exists public.cv_versions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  base text not null default 'qa' check (base in ('qa', 'dev', 'freela', 'basico')),
  titulo text,
  resumo text,
  visivel boolean not null default true,
  ordem integer not null default 0,
  i18n jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.cv_versions enable row level security;
drop policy if exists admin_tudo on public.cv_versions;
create policy admin_tudo on public.cv_versions for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists leitura_publica on public.cv_versions;
create policy leitura_publica on public.cv_versions for select using (visivel);

-- migra o conteúdo que estava em site_content.cv_variantes
insert into public.cv_versions (slug, nome, base, titulo, resumo, ordem, i18n)
select v.slug, v.nome, v.slug,
  c.value -> v.slug -> 'pt' ->> 'titulo', c.value -> v.slug -> 'pt' ->> 'resumo', v.ordem,
  jsonb_build_object(
    'en', jsonb_build_object('nome', v.nome_en, 'titulo', c.value -> v.slug -> 'en' ->> 'titulo', 'resumo', c.value -> v.slug -> 'en' ->> 'resumo'),
    'es', jsonb_build_object('nome', v.nome_es, 'titulo', c.value -> v.slug -> 'es' ->> 'titulo', 'resumo', c.value -> v.slug -> 'es' ->> 'resumo'))
from (values ('qa', 'QA', 'QA', 'QA', 1), ('dev', 'DEV', 'DEV', 'DEV', 2), ('freela', 'Freelancer', 'Freelancer', 'Freelancer', 3), ('basico', 'Básico', 'Basic', 'Básico', 4))
  as v(slug, nome, nome_en, nome_es, ordem)
left join public.site_content c on c.key = 'cv_variantes'
on conflict (slug) do nothing;
