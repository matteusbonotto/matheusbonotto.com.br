-- PDFs do projeto (plano de teste, relatórios, manual...): [{ "titulo": "...", "url": "https://..." }]. Títulos em en/es vão no i18n.
alter table public.projects add column if not exists documentos jsonb not null default '[]'::jsonb
  check (jsonb_typeof(documentos) = 'array' and pg_column_size(documentos) < 8000);
-- ROLLBACK: alter table public.projects drop column documentos;
