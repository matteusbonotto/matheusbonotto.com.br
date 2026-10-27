-- Segurança: bloqueio do admin após 3 senhas erradas e fechamento de funções antigas expostas ao público.

-- 1) Bloqueio de login. A tabela só é lida e escrita pelas funções abaixo (RLS sem políticas).
create table if not exists public.login_bloqueios (
  email text primary key,
  falhas integer not null default 0,
  bloqueado boolean not null default false,
  atualizado timestamptz not null default now()
);
alter table public.login_bloqueios enable row level security;
revoke all on public.login_bloqueios from anon, authenticated;

-- a conta está bloqueada? (consultada antes de tentar entrar)
create or replace function public.login_bloqueado(p_email text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select bloqueado from public.login_bloqueios where email = lower(trim(p_email))), false);
$$;

-- registra uma senha errada e devolve quantas tentativas restam (0 = bloqueada).
-- Só contas de admin são contadas, para ninguém encher a tabela com e-mails aleatórios.
create or replace function public.registrar_falha_login(p_email text)
returns integer language plpgsql volatile security definer set search_path = public, auth as $$
declare v_email text := lower(trim(p_email)); v_falhas integer;
begin
  if not exists (select 1 from auth.users u join public.admins a on a.user_id = u.id where lower(u.email) = v_email) then
    return 3;
  end if;
  insert into public.login_bloqueios as b (email, falhas, bloqueado, atualizado) values (v_email, 1, false, now())
  on conflict (email) do update set falhas = b.falhas + 1, bloqueado = b.bloqueado or b.falhas + 1 >= 3, atualizado = now()
  returning falhas into v_falhas;
  return greatest(0, 3 - v_falhas);
end $$;

-- login certo zera o contador (se a conta não estiver bloqueada)
create or replace function public.login_sucesso()
returns void language sql volatile security definer set search_path = public as $$
  update public.login_bloqueios set falhas = 0, atualizado = now() where email = lower(auth.email()) and not bloqueado;
$$;

-- só uma sessão aberta pelo link do e-mail (recuperação de senha) desbloqueia a conta
create or replace function public.desbloquear_login()
returns boolean language plpgsql volatile security definer set search_path = public as $$
begin
  if not exists (select 1 from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) m where m ->> 'method' in ('recovery', 'otp', 'magiclink')) then
    return false;
  end if;
  update public.login_bloqueios set falhas = 0, bloqueado = false, atualizado = now() where email = lower(auth.email());
  return true;
end $$;

-- conta bloqueada perde o acesso de admin no banco, mesmo que alguém acerte a senha por fora do site
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
    and not exists (select 1 from public.login_bloqueios b where b.email = lower(auth.email()) and b.bloqueado);
$$;

revoke all on function public.login_bloqueado(text), public.registrar_falha_login(text), public.login_sucesso(), public.desbloquear_login() from public;
grant execute on function public.login_bloqueado(text), public.registrar_falha_login(text) to anon, authenticated;
grant execute on function public.login_sucesso(), public.desbloquear_login() to authenticated;

-- 2) Funções do site antigo: nenhuma é usada pelo site novo e algumas vazavam ou apagavam dados
--    (cleanup_old_messages apagava mensagens; get_config lia qualquer configuração; get_dashboard_stats
--    contava mensagens). Ficam só para o admin logado.
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('cleanup_old_messages', 'get_config', 'get_dashboard_stats', 'search_projects',
      'get_projects_by_institution', 'get_institution_projects', 'vincular_projeto_instituicao', 'audit_trigger_function', 'update_updated_at_column')
  loop
    execute format('revoke execute on function %s from public, anon', f.sig);
  end loop;
end $$;

-- 3) Formulários públicos: tamanho máximo e e-mail com formato válido (barra spam gigante)
alter table public.contact_messages drop constraint if exists contato_tamanhos;
alter table public.contact_messages add constraint contato_tamanhos check (char_length(coalesce(mensagem, '')) <= 5000 and char_length(coalesce(idioma, '')) <= 5) not valid;
alter table public.contact_messages drop constraint if exists contato_email;
alter table public.contact_messages add constraint contato_email check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$') not valid;
alter table public.feedbacks drop constraint if exists feedback_tamanho;
alter table public.feedbacks add constraint feedback_tamanho check (char_length(coalesce(mensagem, '')) <= 4000) not valid;

-- 4) Storage: SVG pode carregar script; o bucket público aceita só imagens rasterizadas, vídeo e PDF
update storage.buckets set allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'application/pdf'] where id = 'media';

-- o Supabase concede EXECUTE direto ao anon e ao authenticated: tira também deles
revoke execute on function public.login_sucesso(), public.desbloquear_login() from anon;
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('cleanup_old_messages', 'get_config', 'get_dashboard_stats', 'search_projects',
      'get_projects_by_institution', 'get_institution_projects', 'vincular_projeto_instituicao', 'audit_trigger_function', 'get_institutions_by_project')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;
