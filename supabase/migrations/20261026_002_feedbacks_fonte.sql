-- Recomendações também vêm do Feedz (plataforma interna da MB Labs) e de e-mail
alter table public.feedbacks drop constraint if exists feedbacks_fonte_check;
alter table public.feedbacks add constraint feedbacks_fonte_check check (fonte in ('Site', 'LinkedIn', 'Feedz', 'E-mail'));
