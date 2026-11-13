# Plano: melhorias do site da Beatriz adaptadas ao portfólio do Matheus

Base: o que foi feito e aprovado em `projetos/beatrizgsbonotto` em 13/11/2026 (commits `dfe5aad` e `e0962d3`).
O código dos dois sites tem a mesma estrutura (`src/render/*`, `src/main.js`, `src/styles/site.css`), então quase tudo se porta direto.
Mantém a identidade daqui: acento ciano, tipografia e tom de QA Engineer. Biografia continua privada. Sem travessões.

## 1. Correção de build (primeiro, porque quebra tudo)
- `vite.config.js`: incluir `dist-e2e` (e pastas de materiais) na lista de exclusões das entradas. Hoje o build lê o HTML do `dist-e2e` e falha.

## 2. Celular compacto (os mesmos defeitos daqui)
- Base 14px abaixo de 600px, títulos de seção ~1.3rem, `--secao` 36px, `--margem` 16px.
- Menos espaço entre título e conteúdo (`.cabecalho` 12px), itens da trajetória mais baixos, capas de projeto em 16:9 com descrição de 2 linhas.
- Selo de disponibilidade com versão curta no celular (campo `curto` em `site_content.disponibilidade`), nunca quebrando linha.
- Logo inteiro no cabeçalho do celular (`.nav-marca { flex: none }`).
- Números grandes em fonte sem serifa (o "11" não pode parecer "II").
- Validar com o kit `revisao-ux-ui` (auditoria de layout e viewport) e prints em 390px.

## 3. Navegação e Sobre
- Sobre vira seção da landing (`#sobre`), com redirect 301 de `/sobre`, `/en/sobre`, `/es/sobre` no `firebase.json`.
- Avaliar o mesmo para Projetos, Trajetória e Contato (hoje são páginas separadas aqui); decidir com você antes, porque Competências tem conteúdo grande.
- Ordem da landing: topo, manifesto, sobre, números, trajetória, clientes, projetos, recomendações, serviços, contato.
- Âncoras pulam o respiro da seção e encostam o conteúdo logo abaixo do cabeçalho (ajuste em `main.js`).
- Respiro no fim da seção de projetos.

## 4. Contatos
- Ícones de contato (e-mail, WhatsApp, LinkedIn, GitHub) centralizados abaixo do nome no topo, no celular e no desktop.
- Nome alinhado nas duas bordas (`src/lib/alinhar-nome.js`), card do nome mais largo no celular.
- E-mail do bloco de contato em uma linha.

## 5. Recomendações
- Cartões compactos: avatar 36px, nome em uma linha, texto em 3 a 4 linhas.
- Desktop em 4 colunas mostrando 8; celular em lista simples, sem carrossel cortado.

## 6. Projetos
- Cartão abre o modal com imagens, descrição (problema, solução, resultado) e legenda em cada imagem; o visor em tela cheia mostra a legenda.
- Pipeline de imagens com legendas (`gerar-casos.mjs` + `prints-projetos.mjs`) para os projetos de QA, com descrição padronizada.

## 7. Modo apresentação
- Um botão só no cabeçalho do desktop (mesmo estilo do botão de tema) e item "Apresentar" no menu do celular.
- Começa pela escolha do tema. Sugestão para o Matheus: **QA**, **Desenvolvimento** e **Squidev / produtos**, cada um com seus casos e imagens.
- Abertura só com o vídeo, nome revelado na metade; vídeos de fundo em bumerangue mais lentos; fundos animados discretos.
- Galeria dos projetos da área (3 no celular), pausas para perguntas, roteiro de fala (tecla N).
- Encerramento com "Obrigado", nome, contatos com ícones e QR code do site.
- Celular: gira para a horizontal (lock de orientação, com CSS de reserva).

## 8. Verificação e publicação
- `npm test`, E2E com `CI=1` (para não reaproveitar preview antigo na porta 4173), build e `checar-pdfs`.
- Você testa; depois commit no main e deploy do Firebase.

## Pendências para decidir antes de começar
1. Temas da apresentação (sugestão acima).
2. Se Projetos, Trajetória e Contato também viram seções da landing ou continuam páginas.
