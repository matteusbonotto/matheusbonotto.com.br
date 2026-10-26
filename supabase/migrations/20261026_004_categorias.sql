-- Projetos podem pertencer a mais de uma categoria: qa, dev, vibe (vibe coding / IA), data
alter table public.projects add column if not exists categorias text[] not null default '{}';
update public.projects set categorias = array[lower(categoria)] where categorias = '{}' and categoria is not null;
update public.projects set categorias = array['qa','dev','vibe'] where slug in ('qa-toolbar','stark-hub');
update public.projects set categorias = array['dev','vibe'] where slug = 'evangeligo';
update public.projects set categorias = array['qa','dev'] where slug in ('mb-copiloto-jira','qa-cnk-issue-generator','simulador-ctfl','workitem-assistant-cnk','taskassistant-americanas');
