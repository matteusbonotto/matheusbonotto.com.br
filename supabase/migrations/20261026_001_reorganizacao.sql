-- Reorganização do banco do portfólio (26/10/2026).
-- Aditiva: o site antigo continua funcionando; a limpeza de colunas legadas fica na 002.

-- 1. Administração por usuário (antes dependia de um e-mail que não existia no Auth)
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
insert into public.admins (user_id)
  select id from auth.users where email = 'matteusbonotto@gmail.com'
  on conflict do nothing;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- compatibilidade com o site antigo
create or replace function public.is_admin_email()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin();
$$;

drop policy if exists admins_self on public.admins;
create policy admins_self on public.admins for select using (user_id = auth.uid());

-- 2. Conteúdo traduzível e controle de visibilidade
do $$
declare t text;
begin
  foreach t in array array['projects','professional_history','academic_history','achievements',
    'skills_tree','hard_skills','soft_skills','languages','certifications','feedbacks','cv_projects'] loop
    execute format('alter table public.%I add column if not exists i18n jsonb not null default ''{}''::jsonb', t);
  end loop;
  foreach t in array array['professional_history','academic_history','achievements','skills_tree',
    'hard_skills','soft_skills','languages','certifications'] loop
    execute format('alter table public.%I add column if not exists visivel boolean not null default true', t);
  end loop;
end $$;

alter table public.projects add column if not exists slug text;
alter table public.projects add column if not exists destaque boolean not null default false;
alter table public.projects add column if not exists papel text;
create unique index if not exists projects_slug_key on public.projects (slug);

-- 3. Textos e configurações públicas do site (hero, valor/hora, contatos, SEO)
create table if not exists public.site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- 4. Mensagens de contato com limites
alter table public.contact_messages add column if not exists idioma text;
alter table public.contact_messages drop constraint if exists contact_messages_tamanhos;
alter table public.contact_messages add constraint contact_messages_tamanhos check (
  char_length(nome) between 1 and 120 and char_length(email) between 3 and 200
  and char_length(coalesce(assunto, '')) <= 200 and char_length(mensagem) between 1 and 5000
) not valid;

-- 5. RLS uniforme: leitura pública do que é visível, escrita só do admin
alter table public.cv_projects enable row level security;
alter table public.project_institution_relations enable row level security;

do $$
declare r record; t text;
begin
  for r in select tablename, policyname from pg_policies where schemaname = 'public' and tablename <> 'admins' loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;

  foreach t in array array['profiles','professional_history','academic_history','achievements','skills_tree',
    'hard_skills','soft_skills','languages','certifications','cv_projects','project_institution_relations',
    'site_content','app_config','audit_log','contact_messages','feedbacks','projects'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy admin_tudo on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;

  foreach t in array array['profiles','cv_projects','project_institution_relations','site_content'] loop
    execute format('create policy leitura_publica on public.%I for select using (true)', t);
  end loop;
  foreach t in array array['professional_history','academic_history','achievements','skills_tree',
    'hard_skills','soft_skills','languages','certifications'] loop
    execute format('create policy leitura_publica on public.%I for select using (visivel)', t);
  end loop;
end $$;

create policy leitura_publica on public.projects for select using (ativo);
create policy leitura_publica on public.feedbacks for select using (aprovado);
create policy envio_publico on public.feedbacks for insert with check (aprovado = false);
create policy envio_publico on public.contact_messages for insert with check (lida = false or lida is null);

-- 6. Storage: bucket público "media" (imagens do site); escrita só do admin
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/png','image/jpeg','image/webp','image/svg+xml','image/gif','video/mp4','application/pdf'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists media_leitura on storage.objects;
drop policy if exists media_admin_insert on storage.objects;
drop policy if exists media_admin_update on storage.objects;
drop policy if exists media_admin_delete on storage.objects;
create policy media_leitura on storage.objects for select using (bucket_id = 'media');
create policy media_admin_insert on storage.objects for insert with check (bucket_id = 'media' and public.is_admin());
create policy media_admin_update on storage.objects for update using (bucket_id = 'media' and public.is_admin());
create policy media_admin_delete on storage.objects for delete using (bucket_id = 'media' and public.is_admin());

-- 7. updated_at automático nas tabelas novas
drop trigger if exists site_content_updated_at on public.site_content;
create trigger site_content_updated_at before update on public.site_content
  for each row execute function public.update_updated_at_column();
