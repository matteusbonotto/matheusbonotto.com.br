-- Árvore de habilidades: Playwright (usado no dia a dia) e o ramo de IA / vibe coding
insert into public.skills_tree (nome, categoria, nivel, parent_id, ordem, desbloqueado, descricao)
select 'PLAYWRIGHT', 'qa', 75, id, 3, true, 'Automação end-to-end com Playwright.' from public.skills_tree where nome = 'TEST AUTOMATION'
  and not exists (select 1 from public.skills_tree where nome = 'PLAYWRIGHT');
insert into public.skills_tree (nome, categoria, nivel, parent_id, ordem, desbloqueado, descricao)
select 'AI / VIBE CODING', 'vibe', 75, null, 7, true, 'Desenvolvimento assistido por IA para criar ferramentas e automações.'
where not exists (select 1 from public.skills_tree where nome = 'AI / VIBE CODING');
insert into public.skills_tree (nome, categoria, nivel, parent_id, ordem, desbloqueado, descricao)
select n, 'vibe', 75, (select id from public.skills_tree where nome = 'AI / VIBE CODING'), o, true, d
from (values ('PROMPT DESIGN', 1, 'Prompts estruturados para análise, documentação e geração de cenários de teste.'),
             ('AI-ASSISTED DEVELOPMENT', 2, 'Produtos completos (extensão, SaaS, PWA) construídos com Claude Code.')) v(n, o, d)
where not exists (select 1 from public.skills_tree s where s.nome = v.n);
