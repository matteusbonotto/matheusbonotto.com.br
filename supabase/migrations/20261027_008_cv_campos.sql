-- Cada versão do currículo escolhe o que mostra: seções, nível de detalhe das experiências,
-- projetos (por slug), palavras-chave para ATS e se exibe a idade. Vazio = automático pela base.
alter table public.cv_versions
  add column if not exists secoes text[] not null default array['resumo','servicos','experiencia','projetos','competencias','formacao','idiomas','palavras'],
  add column if not exists detalhe text not null default 'auto' check (detalhe in ('auto', 'completo', 'resumido', 'minimo')),
  add column if not exists projetos text[] not null default '{}',
  add column if not exists palavras_chave text[] not null default '{}',
  add column if not exists mostrar_idade boolean not null default true;
