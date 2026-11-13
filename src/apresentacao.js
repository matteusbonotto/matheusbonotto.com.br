// Modo apresentação: slides em tela cheia com vídeo ou fundo animado, transições e roteiro de fala (tecla N).
// Estrutura pensada para entrevista: apresentação, casos e pausas para perguntas entre os blocos.
import './styles/apresentacao.css';
import QRCode from 'qrcode';
import { SITE } from './config.js';
import { alinharNome } from './lib/alinhar-nome.js';
import { icone } from './render/comum.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Vídeos em bumerangue (ida e volta, sem emenda). A abertura roda na velocidade normal; os de fundo, mais devagar.
const V = {
  intro: { src: '/media/intro.mp4', vel: 1, unico: true },
  introLoop: { src: '/media/ap-intro.mp4', vel: 0.6 },
  escritorio: { src: '/media/ap-escritorio.mp4', vel: 0.6 },
  entrevista: { src: '/media/entrevista.mp4', vel: 0.6 },
};

// Até 3 feedbacks reais (avaliações do Google já publicadas no site), curtos.
// ---------- Dados lidos da própria página (fonte única: o que já está publicado no site) ----------
const dadosPagina = () => { try { return JSON.parse(document.getElementById('dados')?.textContent || '{}'); } catch { return {}; } };
const sobreTexto = () => document.querySelector('.sobre-lead')?.textContent.trim() || '';
const fotoPerfil = () => document.querySelector('.sobre-foto img')?.getAttribute('src') || '';
const iniciais = nome => String(nome || '').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');

// até 3 feedbacks na ordem em que a landing carrega, garantindo pelo menos um de gestão
const GESTAO = /gestor|gerente|lead|coorden|diretor|head|ceo|cto|fundador|s[óo]cio|supervisor|manager|product owner/i;
const recorte = (s, n) => { const t = String(s || '').trim(); if (t.length <= n) return t; const c = t.slice(0, n); return c.slice(0, c.lastIndexOf(' ')) + '…'; };
function feedbacks() {
  const recs = (dadosPagina().recomendacoes || []).filter(r => r.mensagem);
  const escolhidos = recs.slice(0, 3);
  const gestao = recs.find(r => GESTAO.test(`${r.cargo || ''} ${r.empresa || ''}`));
  if (gestao && !escolhidos.includes(gestao)) escolhidos[escolhidos.length - 1] = gestao;
  return escolhidos.filter(Boolean).sort((a, b) => recs.indexOf(a) - recs.indexOf(b));
}
const avatar = r => r.imagem_url ? `<img class="ap-avatar" src="${esc(r.imagem_url)}" alt="" loading="lazy">` : `<span class="ap-avatar ap-avatar-ini" aria-hidden="true">${esc(iniciais(r.nome))}</span>`;

// Lista em sequência (uma informação embaixo da outra, numerada): mais fácil de ler e de seguir o raciocínio
const seq = (itens, classe = '') => `<ol class="ap-seq ${classe}">${itens.map(([titulo, texto], i) => `<li style="--i:${i + 1}"><span class="ap-seq-n">${i + 1}</span><div><b>${titulo}</b><span>${texto}</span></div></li>`).join('')}</ol>`;
// caso de sucesso: onde foi, qual era o problema, a solução e o impacto
const caso = (onde, problema, solucao, impacto) => seq([['Onde', onde], ['Problema', problema], ['Solução', solucao], ['Impacto', impacto]], 'ap-seq-caso');

// missão, visão e valores publicados na seção Sobre do site
function mvv() {
  return [...document.querySelectorAll('.mvv article')].map(a => {
    const itens = [...a.querySelectorAll('li')].map(li => li.textContent.trim());
    return [a.querySelector('h2')?.textContent.trim() || '', itens.length ? itens.join(' · ') : a.querySelector('p')?.textContent.trim() || ''];
  }).filter(([t, d]) => t && d);
}

// Slides padrão da estrutura de entrevista: sobre, carreira, casos, feedbacks, projetos, por que eu, encerramento
const slideSobre = (titulo, pilares, notas) => ({ fundo: 'aurora', html: () => `
      <div class="ap-sobre">${fotoPerfil() ? `<div class="ap-foto-caixa" style="--i:1"><img class="ap-foto" src="${esc(fotoPerfil())}" alt=""></div>` : ''}
      <div><p class="ap-rotulo">Sobre</p><h2>${titulo}</h2>${sobreTexto() ? `<p class="ap-sub ap-resumo">${esc(sobreTexto())}</p>` : ''}${seq(pilares)}</div></div>`, notas });
const slideMvv = notas => ({ fundo: 'aurora', html: () => `<p class="ap-rotulo">Quem sou</p><h2>Missão, visão e valores.</h2>${seq(mvv())}`, notas });

// carreira: linha do tempo em barras (gráfico) com os números na mesma tela; itens = [início, fim ou null, empresa, papel]
const slideCarreira = (titulo, itens, notas) => ({ fundo: 'ondas', html: () => {
  const hoje = new Date().getFullYear();
  const ini = Math.min(...itens.map(i => i[0])), fim = hoje + 1;
  const x = a => ((a - ini) / (fim - ini)) * 100;
  const marcas = Array.from({ length: fim - ini + 1 }, (_, k) => ini + k).filter(a => (a - ini) % 3 === 0);
  if (hoje - marcas[marcas.length - 1] >= 2) marcas.push(hoje); // o ano atual só entra se não encostar na marca anterior
  const empresas = new Set(itens.filter(i => !/técnico em|curso|formação/i.test(i[2] + ' ' + i[3])).map(i => i[2].split(' (')[0])).size;
  return `<p class="ap-rotulo">Carreira</p><h2>${titulo}</h2>
    <div class="ap-numeros"><span><b>${hoje - ini}</b> anos de experiência</span><span><b>${empresas}</b> empresas</span></div>
    <div class="ap-gantt" role="img" aria-label="Linha do tempo da carreira">
      ${itens.map(([a, b, org, papel], i) => `<div class="ap-gantt-linha" style="--i:${i + 1}"><span class="ap-gantt-rot"><b>${org}</b>${papel}</span><span class="ap-gantt-trilho"><i style="left:${x(a)}%;width:${x((b ?? hoje) + 1) - x(a)}%"><em>${b ? `${a} a ${b}` : `desde ${a}`}</em></i></span></div>`).join('')}
      <div class="ap-gantt-linha ap-gantt-eixo"><span></span><span class="ap-gantt-trilho">${marcas.map(a => `<small style="left:${x(a)}%">${a}</small>`).join('')}</span></div>
    </div>`;
}, notas });
// prova do caso: a tela da ferramenta quando existe; senão, um feedback da mesma empresa
function provaHTML(prova) {
  if (!prova) return '';
  const d = dadosPagina(); const projetos = d.apresentacao || d.projetos || [];
  const p = prova.projeto ? projetos.find(x => x.slug === prova.projeto) : null;
  const img = p?.galeria?.[0];
  if (img) return `<figure class="ap-prova"><img src="${esc(img.url)}" alt="${esc(prova.rotulo || p.titulo)}" loading="lazy"><figcaption>${esc(prova.rotulo || p.titulo)}</figcaption></figure>`;
  if (prova.referencia) return `<figure class="ap-prova ap-prova-ref"><blockquote>${esc(prova.referencia.texto)}</blockquote><figcaption>${esc(prova.referencia.titulo)}</figcaption></figure>`;
  const recs = (d.recomendacoes || []).filter(r => prova.empresa && r.empresa && r.empresa.toLowerCase().includes(prova.empresa.toLowerCase()));
  const rec = recs[prova.indice || 0];
  if (rec) return `<figure class="ap-prova ap-prova-rec"><blockquote>"${esc(recorte(rec.mensagem, 220))}"</blockquote><figcaption>${esc(rec.nome)}${rec.cargo ? ` · ${esc(rec.cargo)}` : ''}</figcaption></figure>`;
  return '';
}
const slideCaso = (areas, video, rotulo, titulo, problema, solucao, impacto, regra, notas, prova) => ({ areas, video,
  html: `<p class="ap-rotulo">Case de sucesso</p><h2>${titulo}</h2>
    <div class="ap-caso"><div>${caso(rotulo.split('·').pop().trim(), problema, solucao, impacto)}${regra && !prova?.referencia ? `<p class="ap-regra">${regra}</p>` : ''}</div>${provaHTML(prova)}</div>`, notas });
// formação: técnico, graduação, pós e certificações na mesma grade de cartões
const ano = s => (s ? String(s).slice(0, 4) : '');
const slideFormacao = notas => ({ fundo: 'aurora', html: () => {
  const d = dadosPagina();
  const form = (d.formacoes || []).slice().sort((a, b) => String(b.inicio).localeCompare(String(a.inicio)));
  const item = (t, sub, i) => `<li style="--i:${i + 1}"><b>${esc(t)}</b><span>${esc(sub)}</span></li>`;
  const semAcento = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const tipoLabel = v => { const s = semAcento(v); return /lato|pos|especializ|mba/.test(s) ? 'Pós-graduação' : /bacharel|gradua|licenciatura|tecnologo/.test(s) ? 'Graduação' : /tecnic/.test(s) ? 'Curso técnico' : /livre/.test(s) ? 'Curso livre' : String(v || ''); };
  const periodo = f => { const a = ano(f.inicio), b = f.atual ? 'atual' : ano(f.fim); return !b || b === a ? a : `${a} → ${b}`; };
  const cursos = form.map(f => semAcento(f.curso));
  const certs = (d.certificacoes || []).filter(c => !cursos.some(cur => cur && semAcento(c.nome).includes(cur))).sort((a, b) => String(b.data).localeCompare(String(a.data)));
  const grupos = [
    form.length ? `<div class="ap-grupo"><h3>Formação acadêmica</h3><ul>${form.map((f, i) => item(f.curso, [tipoLabel(f.tipo), f.instituicao, periodo(f)].filter(Boolean).join(' · '), i)).join('')}</ul></div>` : '',
    certs.length ? `<div class="ap-grupo"><h3>Cursos e certificações</h3><ul>${certs.map((c, i) => item(c.nome, [c.instituicao, ano(c.data)].filter(Boolean).join(' · '), i)).join('')}</ul></div>` : '',
  ].filter(Boolean).join('');
  return `<p class="ap-rotulo">Formação</p><h2>Técnico, graduação e cursos.</h2>
    <div class="ap-formacao">${grupos || '<p class="ap-sub">Formação e certificações estão na página Trajetória do site.</p>'}</div>`;
}, notas });
const slideFeedbacks = (titulo, notas) => ({ video: V.entrevista, html: () => `
      <p class="ap-rotulo">Feedbacks</p><h2>${titulo}</h2>
      <div class="ap-recs">${feedbacks().map((r, i) => `<blockquote style="--i:${i + 1}"><p>“${esc(recorte(r.mensagem, 200))}”</p><footer>${avatar(r)}<cite><b>${esc(r.nome)}</b>${[r.cargo, r.empresa].filter(Boolean).map(esc).join(' · ')}</cite></footer></blockquote>`).join('')}</div>`, notas });

// legenda da foto: o texto cadastrado ou, na falta dele, o nome do arquivo (desktop-02-monitoramento -> Monitoramento)
const ACENTOS = { Inicio: 'Início', Questao: 'Questão', Configuracoes: 'Configurações', Descricao: 'Descrição', Relatorio: 'Relatório' };
const rotuloFoto = url => {
  const nome = String(url).split('/').pop().replace(/\.\w+$/, '').replace(/^(desktop|mobile|p\d+)-?\d*-?/, '')
    .replace(/[-_]+/g, ' ').replace(/([a-z])(\d)/g, '$1 $2').trim();
  if (!nome) return '';
  const texto = nome.charAt(0).toUpperCase() + nome.slice(1);
  return texto.split(' ').map(p => ACENTOS[p] || p).join(' ');
};
// uma imagem por projeto, na ordem dos destaques da área
function fotosProjetos(area) {
  const d = dadosPagina(); const projetos = d.apresentacao || d.projetos || [];
  return AREAS[area].destaques.map(slug => projetos.find(p => p.slug === slug)).filter(Boolean)
    .map(p => { const g = (p.galeria || [])[0]; return g ? { src: g.url, legenda: p.titulo, tela: g.legenda ? '' : rotuloFoto(g.url) } : null; })
    .filter(Boolean);
}
// contatos publicados na página (e-mail, WhatsApp, LinkedIn, GitHub), mais o site
function contatos() {
  const vistos = new Set();
  const lista = [...document.querySelectorAll('a[href^="mailto:"], a[href*="wa.me/"], a[href*="linkedin.com"], a[href*="github.com"]')]
    .map(a => a.href.startsWith('mailto:') ? [a.href, a.href.slice(7), 'email'] : a.href.includes('wa.me') ? [a.href, 'WhatsApp', 'whatsapp'] : a.href.includes('github') ? [a.href, 'GitHub', 'github'] : [a.href, 'LinkedIn', 'linkedin'])
    .filter(([h]) => !vistos.has(h) && vistos.add(h));
  return [...lista, [SITE.url, SITE.url.replace('https://', ''), 'globo']];
}

// Áreas: o tema escolhido no início define os casos, as imagens e a profissão da capa
const AREAS = {
  qa: { nome: 'QA', cargo: 'QA Engineer', projetos: ['qa-toolbar', 'stark-hub', 'qa-cnk-issue-generator', 'simulador-ctfl', 'playwright-automation'], destaques: ['qa-toolbar', 'stark-hub', 'qa-cnk-issue-generator', 'simulador-ctfl'] },
  dev: { nome: 'Desenvolvimento', cargo: 'Desenvolvedor web', projetos: ['condonotto', 'evangeligo', 'zunido', 'achadubom'], destaques: ['condonotto', 'evangeligo', 'zunido', 'achadubom'] },
  squidev: { nome: 'Squidev', cargo: 'Fundador da Squidev', projetos: ['squidev', 'instrutora-jaqueline', 'ipvida', 'fofuxa-fashion'], destaques: ['squidev', 'instrutora-jaqueline', 'ipvida', 'fofuxa-fashion'] },
};

const SLIDES = (area) => [
  // 1. Introdução: o vídeo escreve o nome; entra só a profissão
  { video: V.intro, abertura: true, classe: 'ap-capa ap-capa-limpa', html: `<p class="ap-cargo-3d">${esc(AREAS[area].cargo)}</p>`,
    notas: 'Cumprimente pelo nome e agradeça o tempo. Diga em uma frase o que vai mostrar: quem você é, sua carreira e casos reais. Avise que vai pausar para perguntas.' },

  // 2. Sobre
  slideSobre('QA que entende de produto e de código.', [
    ['Qualidade', 'QA desde 2020, em times da SiDi, Americanas e MB Labs.'],
    ['Automação', 'Playwright, Robot Framework e Python para tirar o repetitivo da regressão.'],
    ['Ferramentas próprias', 'Quando falta uma ferramenta para o time, eu construo: QA Toolbar e Stark Hub.'],
  ], 'Apresente-se em até 1 minuto: área, anos de experiência e o que procura agora. Ligue com a vaga: diga por que ela faz sentido para você.'),

  // 3. Carreira
  slideMvv('Fale da missão com suas palavras e dê um exemplo real de cada valor no trabalho. Isso responde "como você trabalha?" antes da pergunta.'),

  // 3. Carreira: linha do tempo e números na mesma tela
  slideCarreira('Do suporte técnico ao QA e à própria marca.', [
    [2016, 2019, 'Crespo e Caires', 'Analista de Suporte Técnico'],
    [2019, 2020, 'Realiza Software', 'Desenvolvedor de Software'],
    [2020, 2022, 'SiDi', 'Quality Assurance Test'],
    [2022, 2023, 'Americanas S.A.', 'Técnico de Garantia de Qualidade'],
    [2024, null, 'MB Labs', 'Quality Assurance (Cinemark)'],
    [2025, null, 'Squidev', 'Fundador e desenvolvedor'],
  ], 'Conte a carreira como uma história: suporte deu empatia com o usuário, desenvolvimento deu base técnica, QA juntou as duas coisas. Não leia as datas, comente o aprendizado de cada etapa.'),

  // 3b. Formação
  slideFormacao('Diga o que cada formação somou: o técnico deu base prática, a graduação deu fundamento, a pós especializou em teste de software. Cite um curso que mudou sua forma de trabalhar.'),

  // 4. Casos reais por área
  slideCaso(['qa'], V.entrevista, 'Caso real · QA Toolbar Sandbox', 'O kit do QA a um clique.',
    'Troca constante de ambiente, conta de teste e massa de dados durante os testes.',
    'Criei uma extensão do Chrome que reúne ambientes, contas de teste e atalhos de produtividade.',
    'Publicada na Chrome Web Store; menos tempo procurando dado e ambiente, mais tempo testando.',
    '', 'Comece pela dor do time, depois mostre a solução e o resultado. Diga como garantiu segurança dos dados de teste.',
    { projeto: 'qa-toolbar', rotulo: 'QA Toolbar Sandbox na Chrome Web Store' }),
  slideCaso(['qa'], V.escritorio, 'Caso real · Cinemark (MB Labs)', 'Bugs padronizados do primeiro registro.',
    'Bugs e incidentes chegavam com informações faltando, e o time perdia tempo pedindo detalhes.',
    'Montei o QA CNK Issue Generator: formulário com ambiente, passos, evidências e regra de negócio.',
    'Registros completos e no mesmo padrão, prontos para o time de desenvolvimento agir.',
    '', 'Mostre que QA também melhora processo. Se perguntarem, fale de como alinhou o padrão com o time.',
    { projeto: 'qa-cnk-issue-generator', rotulo: 'QA CNK Issue Generator' }),
  slideCaso(['qa'], V.entrevista, 'Caso real · Stark Hub', 'Governança e QA sobre o Azure DevOps.',
    'Acompanhamento de qualidade espalhado entre quadros, planilhas e mensagens.',
    'Plataforma que lê o fluxo real do Azure DevOps e organiza governança, QA e produtividade.',
    'Visão única do andamento, pronta para ser escalada para outros times.',
    'Também no portfólio: simulador do exame ISTQB CTFL 4.0 e suíte end-to-end com Playwright.', 'Use este caso para falar de visão de processo e métricas de qualidade.',
    { projeto: 'stark-hub', rotulo: 'Stark Hub · monitoramento' }),
  slideCaso(['dev'], V.escritorio, 'Caso real · Condonotto', 'O condomínio inteiro no navegador.',
    'Encomendas, visitas e avisos controlados em papel e em grupos de mensagem.',
    'App web com encomendas pela foto, visitas, avisos, enquetes e mapa do condomínio.',
    'Moradores e portaria com o mesmo registro, sem instalar nada.',
    '', 'Explique as decisões técnicas: web sem instalação, foto como registro, permissões por perfil.',
    { projeto: 'condonotto', rotulo: 'Condonotto' }),
  slideCaso(['dev'], V.entrevista, 'Caso real · EvangeliGO', 'Hábitos que viram jogo.',
    'Dificuldade de manter constância em hábitos diários.',
    'PWA gamificado com metas, progresso e recompensas.',
    'Experiência de aplicativo no celular, publicada como PWA.',
    '', 'Destaque produto e engajamento: o que motivou cada mecânica do jogo.',
    { projeto: 'evangeligo', rotulo: 'EvangeliGO' }),
  slideCaso(['dev'], V.escritorio, 'Caso real · Zunido', 'Um blog que se escreve e se publica sozinho.',
    'Manter um blog atualizado exige tempo diário de pesquisa, escrita e divulgação.',
    'Automação que escreve, revisa, publica e divulga posts sobre assuntos do momento.',
    'Publicação contínua com custo zero de infraestrutura.',
    '', 'Fale de automação de ponta a ponta e de como controla a qualidade do conteúdo gerado.',
    { projeto: 'zunido', rotulo: 'Zunido' }),
  slideCaso(['squidev'], V.escritorio, 'Caso real · Squidev', 'Soluções digitais para pequenos negócios.',
    'Pequenos negócios precisam de presença digital rápida, bonita e barata de manter.',
    'Sites, PWAs, cartões digitais e identidade visual, do briefing à publicação.',
    'Clientes como a Instrutora Jaqueline, a IPVida e a Fofuxa Moda com canal direto para o cliente.',
    '', 'Mostre que cuida do projeto inteiro: conversa com o cliente, design, código, teste e publicação.',
    { projeto: 'squidev', rotulo: 'Squidev' }),
  slideCaso(['squidev'], V.entrevista, 'Caso real · Instrutora Jaqueline', 'Um site com cara de aplicativo.',
    'A instrutora divulgava aulas e regiões só por mensagem.',
    'Site PWA com aulas, pacotes e regiões de atendimento.',
    'Clientes encontram tudo num só lugar e falam direto pelo WhatsApp.',
    '', 'Use como exemplo de entrega rápida para cliente real.',
    { projeto: 'instrutora-jaqueline', rotulo: 'Instrutora Jaqueline' }),

  // 5. Pausa
  { pausa: true, fundo: 'constelacao', html: `<p class="ap-rotulo">Pausa</p><h2>Alguma pergunta até aqui?</h2><p class="ap-sub">Posso detalhar qualquer caso antes de seguir.</p>`,
    notas: 'Pare de verdade e espere. Se não houver perguntas, pergunte qual dos casos mais se parece com o dia a dia da vaga.' },

  // 6. Feedbacks
  slideFeedbacks('O que dizem líderes e colegas.', 'Leia um trecho curto de uma recomendação e diga quem é a pessoa. Relacione com uma competência da vaga.'),

  // 7. Projetos
  { fundo: 'constelacao', html: () => `
      <p class="ap-rotulo">Projetos</p><h2>Alguns projetos desta área.</h2>
      <ul class="ap-galeria">${fotosProjetos(area).map((f, i) => `<li style="--i:${i + 1}"><img src="${esc(f.src)}" alt="" loading="lazy"><span><b>${esc(f.legenda)}</b>${f.tela ? `<em>${esc(f.tela)}</em>` : ''}</span></li>`).join('')}</ul>`,
    notas: 'Passe rápido pelas imagens. Se houver tempo, abra um projeto ao vivo no site.' },

  // 8. Por que eu
  { fundo: 'aurora', html: `<p class="ap-rotulo">O que eu entrego</p><h2>Por que posso somar ao time.</h2>${seq([
      ['Qualidade desde o início', 'Testo pensando no usuário e no negócio, não só no critério de aceite.'],
      ['Automação que se paga', 'Tiro o trabalho repetitivo da regressão e deixo o time mais rápido.'],
      ['Autonomia', 'Quando falta uma ferramenta ou processo, eu proponho e construo.'],
    ])}`,
    notas: 'Resuma o valor em três frases. Depois faça suas perguntas: como o time trabalha com qualidade hoje, qual o maior desafio e quais os próximos passos do processo.' },

  // 9. Encerramento
  { pausa: true, video: V.introLoop, classe: 'ap-capa ap-fim', html: () => `
      <div class="ap-fim-texto"><p class="ap-rotulo">Obrigado</p><h2>Perguntas finais? Fico à disposição.</h2>
      <ul class="ap-contatos">${contatos().map(([href, txt, ic]) => `<li><a href="${esc(href)}" target="_blank" rel="noopener"><span class="ap-contato-ic">${icone(ic)}</span>${esc(txt)}</a></li>`).join('')}</ul></div>
      <figure class="ap-qr"><div data-ap-qr></div><figcaption>${esc(SITE.url.replace('https://', ''))}</figcaption></figure>`,
    notas: 'Agradeça. Combine o próximo passo e o prazo de retorno. Mostre o QR code para acessarem o site.' },
];

/* Fundos animados em canvas, discretos: aurora (manchas de luz), ondas (linhas finas) e constelação (pontos que seguem o mouse). */
function fundoAnimado(canvas) {
  const g = canvas.getContext('2d');
  const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let modo = '', w = 0, h = 0, dpr = 1, raf = 0, pontos = [];
  const mouse = { x: -1e4, y: -1e4 };
  const medir = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    pontos = Array.from({ length: Math.round(Math.min(90, (w * h) / 18000)) }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25 }));
  };
  const quadro = t => {
    g.clearRect(0, 0, w, h);
    if (modo === 'aurora') {
      [[.25, .35, '60,198,184'], [.75, .6, '14,124,123'], [.5, .85, '141,232,222']].forEach(([fx, fy, cor], i) => {
        const x = w * (fx + Math.sin(t / 7000 + i * 2) * .12), y = h * (fy + Math.cos(t / 9000 + i) * .1), r = Math.max(w, h) * .45;
        const grad = g.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(${cor},.22)`); grad.addColorStop(1, `rgba(${cor},0)`);
        g.fillStyle = grad; g.fillRect(0, 0, w, h);
      });
    } else if (modo === 'ondas') {
      g.lineWidth = 1;
      for (let k = 0; k < 14; k++) {
        g.strokeStyle = `rgba(60,198,184,${0.09 + k * 0.016})`;
        g.beginPath();
        for (let x = 0; x <= w; x += 12) {
          const y = h * (.35 + k * .035) + Math.sin(x / 220 + t / 2600 + k * .5) * 38 + Math.sin(x / 90 - t / 3800) * 8 + (mouse.y > 0 ? (mouse.y - h / 2) * .03 * Math.exp(-((x - mouse.x) ** 2) / 60000) : 0);
          x ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.stroke();
      }
    } else if (modo === 'constelacao') {
      for (const p of pontos) {
        p.x = (p.x + p.vx + w) % w; p.y = (p.y + p.vy + h) % h;
        const dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy);
        if (d < 160) { p.x -= dx * .004; p.y -= dy * .004; }
      }
      for (let i = 0; i < pontos.length; i++) {
        const a = pontos[i];
        g.fillStyle = 'rgba(141,232,222,.55)'; g.beginPath(); g.arc(a.x, a.y, 1.4, 0, 6.29); g.fill();
        for (let j = i + 1; j < pontos.length; j++) {
          const b = pontos[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) { g.strokeStyle = `rgba(60,198,184,${(1 - d / 130) * .22})`; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
        }
      }
    }
    if (!reduzido && modo) raf = requestAnimationFrame(quadro);
  };
  const mover = e => { mouse.x = e.clientX; mouse.y = e.clientY; };
  addEventListener('resize', medir);
  addEventListener('pointermove', mover);
  medir();
  return {
    usar(novo) { modo = novo || ''; cancelAnimationFrame(raf); canvas.classList.toggle('ativo', !!modo); if (modo) quadro(performance.now()); else g.clearRect(0, 0, w, h); },
    parar() { cancelAnimationFrame(raf); removeEventListener('resize', medir); removeEventListener('pointermove', mover); },
  };
}

let raiz = null;

export function abrir(aoFechar = () => {}) {
  if (raiz) return;
  let slides = [];
  let i = 0, soltarNome = () => {}, revelar = null;
  const inicio = Date.now();
  raiz = document.createElement('dialog'); // camada superior do navegador: fica acima de qualquer modal do site
  raiz.className = 'ap';
  raiz.setAttribute('role', 'dialog');
  raiz.setAttribute('aria-modal', 'true');
  raiz.setAttribute('aria-label', 'Modo apresentação');
  raiz.innerHTML = `
    <video class="ap-video" muted loop playsinline aria-hidden="true"></video>
    <canvas class="ap-fundo" aria-hidden="true"></canvas>
    <div class="ap-veu" aria-hidden="true"></div>
    <section class="ap-slide" aria-live="polite"></section>
    <aside class="ap-notas" hidden><b>Roteiro</b><p></p></aside>
    <footer class="ap-barra">
      <span class="ap-cont"></span>
      <span class="ap-tempo">00:00</span>
      <span class="ap-acoes">
        <span class="ap-fonte" role="group" aria-label="Tamanho do texto"><button type="button" data-fonte="-1" aria-label="Diminuir texto">A−</button><button type="button" data-fonte="1" aria-label="Aumentar texto">A+</button></span>
        <button type="button" data-ap="notas" title="Roteiro (N)">Roteiro</button>
        <button type="button" data-ap="ant" aria-label="Anterior">←</button>
        <button type="button" data-ap="prox" aria-label="Próximo">→</button>
        <button type="button" data-ap="sair" title="Sair (Esc)">Sair</button>
      </span>
      <i class="ap-progresso"></i>
    </footer>`;
  document.body.appendChild(raiz);
  raiz.showModal();
  raiz.addEventListener('cancel', e => { e.preventDefault(); fechar(); });
  document.documentElement.classList.add('ap-aberta');
  const $ = s => raiz.querySelector(s);
  const video = $('.ap-video');
  const fundo = fundoAnimado($('.ap-fundo'));

  // abertura: só o vídeo; na metade da ida (antes da volta do bumerangue) o nome aparece e a tela escurece
  function abertura() {
    raiz.classList.add('ap-so-video');
    let feito = false;
    const mostrar = () => { if (feito) return; feito = true; raiz.classList.remove('ap-so-video'); video.removeEventListener('timeupdate', checar); };
    const checar = () => { if (video.duration && video.currentTime >= video.duration / 2) mostrar(); };
    video.addEventListener('timeupdate', checar);
    const reserva = setTimeout(mostrar, 6000); // se o vídeo não carregar, revela mesmo assim
    return () => { clearTimeout(reserva); mostrar(); };
  }

  function mostrar(n) {
    if (!slides.length) return;
    i = Math.max(0, Math.min(slides.length - 1, n));
    const s = slides[i];
    revelar?.(); revelar = null;
    soltarNome();
    const slide = $('.ap-slide');
    slide.classList.remove('ap-entra');
    void slide.offsetWidth; // reinicia a animação de entrada
    slide.className = `ap-slide ${s.classe || ''} ${s.pausa ? 'ap-pausa' : ''}`;
    slide.innerHTML = typeof s.html === 'function' ? s.html() : s.html;
    slide.classList.add('ap-entra');
    soltarNome = alinharNome(slide.querySelector('[data-ap-nome]'));
    const qr = slide.querySelector('[data-ap-qr]');
    if (qr) QRCode.toString(SITE.url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0E0E10', light: '#ffffff' } }).then(svg => { qr.innerHTML = svg; });
    const v = s.video;
    if (v) {
      if (video.getAttribute('src') !== v.src) { video.src = v.src; }
      video.loop = !v.unico;
      if (s.abertura) video.currentTime = 0;
      video.playbackRate = v.vel;
      video.play().catch(() => {});
    } else video.pause();
    raiz.classList.toggle('ap-sem-video', !v);
    fundo.usar(v ? '' : s.fundo);
    if (s.abertura) revelar = abertura();
    $('.ap-notas p').textContent = s.notas;
    $('.ap-cont').textContent = `${i + 1} / ${slides.length}${s.pausa && !s.classe?.includes('ap-fim') ? ' · pausa para perguntas' : ''}`;
    $('.ap-progresso').style.transform = `scaleX(${(i + 1) / slides.length})`;
  }
  // a velocidade volta ao padrão quando o src muda; reaplica quando o vídeo carrega
  video.addEventListener('loadedmetadata', () => { video.playbackRate = slides[i].video?.vel || 1; });

  const relogio = setInterval(() => {
    const s = Math.floor((Date.now() - inicio) / 1000);
    $('.ap-tempo').textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }, 1000);

  function fechar() {
    if (!raiz) return;
    clearInterval(relogio);
    revelar?.();
    soltarNome();
    fundo.parar();
    document.removeEventListener('keydown', teclas);
    document.removeEventListener('fullscreenchange', saiuTelaCheia);
    raiz.remove();
    raiz = null;
    document.documentElement.classList.remove('ap-aberta');
    screen.orientation?.unlock?.();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    aoFechar();
  }
  const saiuTelaCheia = () => { if (!document.fullscreenElement) fechar(); };
  const alternarNotas = () => { $('.ap-notas').hidden = !$('.ap-notas').hidden; };

  // tela de escolha do tema (Administração, Seguros ou TI), também pelas teclas 1, 2 e 3
  function escolher() {
    raiz.classList.add('ap-sem-video');
    fundo.usar('aurora');
    const slide = $('.ap-slide');
    slide.className = 'ap-slide ap-escolha ap-entra';
    slide.innerHTML = `<p class="ap-rotulo">Modo apresentação</p><h2>Qual é o foco desta conversa?</h2>
      <div class="ap-areas">${Object.entries(AREAS).map(([id, a], n) => `<button type="button" data-area="${id}" style="--i:${n + 1}"><span>${n + 1}</span>${a.nome}</button>`).join('')}</div>`;
    $('.ap-notas p').textContent = 'Escolha o foco da conversa. A apresentação mostra só os casos e projetos dessa área.';
    $('.ap-cont').textContent = 'Escolha o tema';
    slide.querySelector('[data-area]').focus();
  }
  function iniciar(area) {
    slides = SLIDES(area).filter(s => !s.areas || s.areas.includes(area));
    mostrar(0);
    $('[data-ap="prox"]').focus();
  }

  function teclas(e) {
    if (!slides.length) {
      const area = { 1: 'qa', 2: 'dev', 3: 'squidev' }[e.key];
      if (area) iniciar(area); else if (e.key === 'Escape') fechar();
      return;
    }
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) {
      e.preventDefault();
      // na abertura, o primeiro "próximo" só antecipa o nome
      if (revelar && raiz.classList.contains('ap-so-video')) { revelar(); revelar = null; return; }
      mostrar(i + 1);
    }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); mostrar(i - 1); }
    else if (e.key === 'Escape') fechar();
    else if (e.key.toLowerCase() === 'n') alternarNotas();
    else if (e.key === 'Home') mostrar(0);
    else if (e.key === 'End') mostrar(slides.length - 1);
  }

  raiz.addEventListener('click', e => {
    const area = e.target.closest('[data-area]')?.dataset.area;
    if (area) { iniciar(area); return; }
    const acao = e.target.closest('[data-ap]')?.dataset.ap;
    if (acao === 'prox') { if (revelar && raiz.classList.contains('ap-so-video')) { revelar(); revelar = null; } else mostrar(i + 1); }
    else if (acao === 'ant') mostrar(i - 1);
    else if (acao === 'sair') fechar();
    else if (acao === 'notas') alternarNotas();
  });
  document.addEventListener('keydown', teclas);

  // celular: toque no terço esquerdo volta, no direito avança; deslizar também troca de slide.
  // Com a tela girada (celular em pé), o "esquerdo" da apresentação fica no topo da tela física.
  let toque = null;
  raiz.addEventListener('touchstart', e => {
    if (e.touches.length > 1) { toque = null; return; } // dois dedos: é zoom, não navegação
    toque = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  }, { passive: true });
  raiz.addEventListener('touchend', e => {
    if (!toque || !slides.length || e.target.closest('button, a, [data-area], .ap-notas')) { toque = null; return; }
    const f = e.changedTouches[0];
    const girada = matchMedia('(orientation: portrait) and (max-width: 700px)').matches;
    const [d, cruz, pos, tam] = girada ? [f.clientY - toque.y, f.clientX - toque.x, f.clientY, innerHeight] : [f.clientX - toque.x, f.clientY - toque.y, f.clientX, innerWidth];
    const rapido = Date.now() - toque.t < 600;
    toque = null;
    if (Math.abs(d) > 50 && Math.abs(d) > Math.abs(cruz) && rapido) { avancar(d < 0 ? 1 : -1); return; }
    if (Math.abs(d) < 12 && Math.abs(cruz) < 12) { if (pos < tam / 3) avancar(-1); else if (pos > tam * 2 / 3) avancar(1); }
  }, { passive: true });
  function avancar(passo) {
    if (passo > 0 && revelar && raiz.classList.contains('ap-so-video')) { revelar(); revelar = null; return; }
    mostrar(i + passo);
  }
  // só fecha ao sair da tela cheia se ela chegou a abrir (alguns navegadores bloqueiam)
  setTimeout(() => document.addEventListener('fullscreenchange', saiuTelaCheia), 300);
  screen.orientation?.lock?.('landscape').catch(() => {});
  escolher();
}
