-- Galeria de prints por projeto: [{ "url": "...", "dispositivo": "desktop" | "mobile", "legenda": "..." }]
alter table public.projects add column if not exists galeria jsonb not null default '[]'::jsonb;
