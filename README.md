# matheusbonotto.com.br

Portfólio de **Matheus Bonotto**, QA Engineer brasileiro (Campinas-SP) e fundador da Squidev. O site reúne trajetória, projetos, competências, recomendações e um currículo pronto para imprimir em PDF, em português, inglês e espanhol.

**No ar:** https://matheusbonotto.com.br

## O que tem no site

- **Início:** abertura com vídeo controlado pela rolagem, empresas atendidas, números, projetos em destaque, recomendações e serviços com calculadora de valor (hora, dia ou mês em BRL, USD e EUR).
- **Projetos:** separados por área (QA, desenvolvimento, IA e dados), com busca, filtros, grade ou lista e galeria em monitor e celular com tela cheia e zoom.
- **Trajetória:** gráfico da carreira profissional e acadêmica (no celular vira um painel com indicadores), linha do tempo, certificados e recomendações de cada período.
- **Competências:** árvore de habilidades no estilo RPG, com grade, lista e conquistas.
- **Currículo:** folhas A4 com QR code, versões por perfil (QA, DEV, Freelancer e Básico) e impressão fiel à prévia.
- **Admin:** painel para editar todo o conteúdo, com traduções, imagens, galerias e versões do currículo.

## Tecnologias

| Área | Ferramentas |
| --- | --- |
| Front-end | HTML, CSS e JavaScript sem framework, [Vite](https://vite.dev) com várias páginas |
| Animações | [GSAP](https://gsap.com) (ScrollTrigger e Flip) e [Lenis](https://lenis.darkroom.engineering) |
| Dados e login | [Supabase](https://supabase.com): Postgres com RLS, Auth e Storage |
| Hospedagem | Firebase Hosting, com cabeçalhos de segurança (CSP e HSTS) |
| Testes | [Playwright](https://playwright.dev) (de ponta a ponta, desktop e celular) e [Vitest](https://vitest.dev) (unitários) |
| Imagens | [sharp](https://sharp.pixelplumbing.com) para converter em WebP e montar as capas com monitor e celular |
| Outros | `qrcode` para o QR do currículo, Intl para datas e moedas |

## Como funciona

As páginas são **pré-renderizadas** no build (`scripts/prerender.mjs`): o script lê o Supabase e gera HTML pronto para cada página e idioma, o que é bom para SEO e para a velocidade. No navegador, o site confere se o banco mudou e, se mudou, redesenha com os dados novos. Idades e anos de experiência são calculados a partir das datas, nunca escritos à mão.

```
src/
  main.js        interações e efeitos do site
  cv.js          paginação do currículo em folhas A4
  render/        HTML das páginas (usado no build e no navegador)
  i18n/          textos da interface em pt, en e es
  admin/         painel administrativo
  styles/        CSS
scripts/         pré-render, migração de mídia, prints dos projetos
supabase/        migrations do banco
tests/           e2e (Playwright) e unitários (Vitest)
```

## Rodando localmente

```bash
npm install
npm run dev          # servidor de desenvolvimento
npm run build        # pré-render + build de produção em dist/
npm test             # testes unitários
npm run test:e2e     # testes de ponta a ponta (desktop e celular)
npm run test:tudo    # tudo acima, na ordem
```

A configuração pública do Supabase fica em `src/config.js`. Os scripts de manutenção usam um token de acesso guardado no `.env`, que não vai para o repositório.

## Créditos

Feito por Matheus Bonotto, fundador da Squidev, com auxílio do Claude Code.
