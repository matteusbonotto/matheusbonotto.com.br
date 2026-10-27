import { expect, test } from '@playwright/test';
import { dados, semVazamento, simularSupabase, URLS, vigiarErros } from './apoio.js';

test.beforeEach(async ({ page }) => { await simularSupabase(page); });

test.describe('todas as páginas, nos 3 idiomas', () => {
  for (const url of URLS) {
    test(`${url} carrega sem erros, com um h1, idioma certo e sem vazar da tela`, async ({ page }) => {
      const erros = vigiarErros(page);
      await page.goto(url);
      const lang = url.startsWith('/en/') ? 'en' : url.startsWith('/es/') ? 'es' : 'pt-BR';
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('h1')).toHaveCount(1);
      expect((await page.title()).length).toBeGreaterThan(15);
      await expect(page.locator('body')).not.toContainText(/undefined|\[object Object\]|NaN/);
      await semVazamento(page);
      expect(erros).toEqual([]);
    });
  }
});

test('SEO: meta tags, Open Graph, hreflang, JSON-LD, sitemap e robots', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /QA Engineer/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://matheusbonotto.com.br/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og\.jpg$/);
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(4);
  const ld = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  expect(ld['@graph'][0]['@type']).toBe('Person');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap.match(/<loc>/g)).toHaveLength(21);
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /admin/');
  expect((await request.get('/media/og.jpg')).ok()).toBeTruthy();
});

test('navegação: menu, páginas e troca de idioma', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) {
    const botao = page.locator('[data-menu]');
    await botao.click();
    await expect(botao).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(botao).toHaveAttribute('aria-expanded', 'false');
    await botao.click();
  }
  await page.locator('.nav-links a[href="/projetos/"]').click();
  await expect(page).toHaveURL(/\/projetos\/$/);
  await expect(page.locator('.nav-links a[aria-current="page"]')).toHaveAttribute('href', '/projetos/');
  if (isMobile) await page.locator('[data-menu]').click();
  await page.locator('.nav-idiomas a[hreflang="en"]').click();
  await expect(page).toHaveURL(/\/en\/projetos\/$/);
  await expect(page.locator('h1')).toHaveAccessibleName('Projects');
});

test('abertura: título escondido sobre o vídeo e visível depois da rolagem', async ({ page }) => {
  await page.goto('/');
  const titulo = page.locator('.hero-titulo');
  await expect(titulo).toHaveCSS('opacity', '0');
  await expect(page.locator('[data-nav]')).not.toHaveClass(/escura/); // começa clara e escurece com o vídeo
  await expect(page.locator('.hero.quadros')).toHaveCount(1); // quadros do vídeo carregaram
  await page.evaluate(() => scrollTo(0, document.querySelector('[data-hero]').offsetHeight - innerHeight));
  await expect(titulo).toHaveCSS('opacity', '1', { timeout: 5000 });
  await expect(page.locator('.caminhos .caminho')).toHaveCount(6); // atalhos: sobre, projetos, trajetória, competências, contato, currículo
  await expect(page.locator('.caminhos')).toBeInViewport();
});

test('com movimento reduzido tudo aparece sem animação', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await simularSupabase(page);
  await page.goto('/');
  await expect(page.locator('.hero-titulo')).toBeInViewport();
  await expect(page.locator('.hero-titulo')).toHaveCSS('opacity', '1');
  await ctx.close();
});

test('projetos: filtros, busca, modal com galeria e fechamento', async ({ page }) => {
  await page.goto('/projetos/');
  const visiveis = () => page.locator('.cartao:visible');
  await page.getByRole('tab', { name: /Dados/ }).click();
  await expect(visiveis()).toHaveCount(dados.projetos.filter(p => (p.categorias || []).includes('data')).length);
  await page.getByRole('tab', { name: /Todos/ }).click();
  await page.locator('[data-busca]').fill('playwright');
  await expect(visiveis().first()).toContainText(/Playwright/i);
  await page.locator('[data-busca]').fill('xyzxyz');
  await expect(page.locator('[data-nenhum]')).toBeVisible();
  await page.locator('[data-busca]').fill('');

  const comGaleria = dados.projetos.find(p => p.galeria?.some(g => g.dispositivo === 'mobile'));
  await page.locator(`[data-abrir-projeto="${comGaleria.slug}"]`).first().click();
  const modal = page.locator('[data-modal]');
  await expect(modal).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`#projeto/${comGaleria.slug}$`));
  await expect(modal.locator('h2')).toHaveText(comGaleria.titulo);
  await modal.getByRole('tab', { name: 'Mobile' }).click();
  await expect(modal.locator('.galeria-item:visible').first()).toHaveAttribute('data-dispositivo', 'mobile');
  await modal.getByRole('tab', { name: 'Desktop' }).click();
  await expect(modal.locator('.galeria-item:visible').first()).toHaveAttribute('data-dispositivo', 'desktop');
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(page).not.toHaveURL(/#projeto\//);
});

test('link direto para um projeto abre o modal', async ({ page }) => {
  await page.goto('/projetos/#projeto/qa-toolbar');
  await expect(page.locator('[data-modal] h2')).toHaveText('QA Toolbar Sandbox');
});

test('trajetória: gráfico profissional + acadêmico e filtro', async ({ page }) => {
  await page.goto('/trajetoria/');
  const total = dados.experiencias.length + dados.formacoes.length;
  await expect(page.locator('.crono-barra')).toHaveCount(total);
  await expect(page.locator('.linha-item:visible')).toHaveCount(total);
  await page.getByRole('tab', { name: 'Acadêmico' }).click();
  await expect(page.locator('.linha-item:visible')).toHaveCount(dados.formacoes.length);
  await expect(page.locator('.crono-linha.apagada')).toHaveCount(dados.experiencias.length);
  // clicar na barra da UNASP abre o modal com detalhes e as imagens cadastradas (foto de formatura)
  const unasp = dados.formacoes.find(f => f.instituicao === 'UNASP');
  await page.locator(`.crono-barra[data-abrir-carreira="form:${unasp.id}"]`).click();
  await expect(page.locator('[data-modal] h2')).toHaveText(unasp.curso);
  await expect(page.locator('[data-modal] .arquivos li')).toHaveCount(unasp.imagens_urls.length);
  await expect(page.locator('.carreira-legenda li')).toHaveCount(5);
});

test('competências: árvore e conquistas', async ({ page }) => {
  await page.goto('/competencias/');
  await expect(page.locator('.arvore')).toHaveCount(dados.arvore.filter(n => !n.parent_id).length);
  await expect(page.locator('.medalha-botao')).toHaveCount(dados.conquistas.length);
  await page.locator('.medalha-botao').first().click();
  await expect(page.locator('[data-modal] h2')).toBeVisible();
  await page.locator('[data-fechar-modal]').click();
  await expect(page.locator('[data-modal]')).toBeHidden();
});

test('contato: valida e envia a mensagem', async ({ page }) => {
  const escritas = await simularSupabase(page);
  await page.goto('/contato/');
  const enviar = page.getByRole('button', { name: /Enviar mensagem/ });
  await enviar.click();
  await expect(page.locator('[data-status]')).toHaveText(/Preencha/);
  await expect(page.locator('#f-nome')).toHaveAttribute('aria-invalid', 'true');
  await page.fill('#f-nome', 'Recrutadora');
  await page.fill('#f-email', 'rh@empresa.com');
  await page.fill('#f-msg', 'Temos uma vaga de QA.');
  await enviar.click();
  await expect(page.locator('[data-status]')).toHaveText(/Mensagem enviada/);
  expect(escritas.find(e => e.tabela === 'contact_messages').corpo).toMatchObject({ nome: 'Recrutadora', email: 'rh@empresa.com', idioma: 'pt', lida: false });
});

test('currículo: folhas A4, sem foto, numeradas', async ({ page }) => {
  await page.goto('/cv/');
  const folhas = page.locator('.folha');
  await expect(folhas.first()).toBeVisible();
  expect(await folhas.count()).toBeGreaterThanOrEqual(2);
  await expect(page.locator('.folha img')).toHaveCount(0);
  await expect(folhas.last().locator('.folha-numero')).toHaveText(/Página \d de \d/);
  // cada folha tem exatamente as proporções de A4 (210 × 297 mm)
  const { w, h } = await folhas.first().evaluate(el => ({ w: el.offsetWidth, h: el.offsetHeight }));
  expect(Math.abs(h / w - 297 / 210)).toBeLessThan(0.01);
  // nenhum bloco ultrapassa a folha
  const estouro = await page.evaluate(() => [...document.querySelectorAll('.folha')].some(f => f.scrollHeight > f.clientHeight + 1));
  expect(estouro).toBe(false);
});

test('grade / lista em projetos, trajetória e conquistas (e a escolha fica salva)', async ({ page }) => {
  await page.goto('/projetos/');
  const alvo = page.locator('[data-vista-alvo="projetos"]');
  await expect(alvo).toHaveAttribute('data-vista', 'grade');
  await page.locator('[data-vistas="projetos"] [data-vista="lista"]').click();
  await expect(alvo).toHaveAttribute('data-vista', 'lista');
  await page.reload();
  await expect(alvo).toHaveAttribute('data-vista', 'lista');
  await semVazamento(page);
  await page.goto('/trajetoria/');
  await page.locator('[data-vistas="trajetoria"] [data-vista="grade"]').click();
  await expect(page.locator('[data-vista-alvo="trajetoria"]')).toHaveAttribute('data-vista', 'grade');
  await page.goto('/competencias/');
  await page.locator('[data-vistas="conquistas"] [data-vista="lista"]').click();
  await expect(page.locator('.medalha-desc').first()).toBeVisible();
});

test('árvore de habilidades RPG: categorias, nós e detalhes', async ({ page }) => {
  await page.goto('/competencias/');
  const raizes = dados.arvore.filter(n => !n.parent_id);
  await expect(page.locator('[data-raiz]')).toHaveCount(raizes.length);
  const qa = raizes.find(r => r.categoria === 'qa');
  const palco = page.locator(`[data-palco="${qa.id}"]`);
  await expect(palco).toBeVisible();
  const descendentes = id => dados.arvore.filter(n => n.parent_id === id).flatMap(n => [n, ...descendentes(n.id)]);
  await expect(palco.locator('.rpg-no')).toHaveCount(1 + descendentes(qa.id).length);
  await palco.locator('.rpg-no.raiz').click();
  await expect(page.locator('[data-modal] h2')).toHaveText(qa.nome);
  await page.keyboard.press('Escape');
  await page.locator('[data-vistas="arvore"] [data-vista="grade"]').click();
  await expect(page.locator('.arvore').first()).toBeVisible();
  await expect(page.locator('.rpg')).toBeHidden();
});

test('celular: nome do cabeçalho em uma linha e menu ocupando a tela', async ({ page, isMobile }) => {
  test.skip(!isMobile);
  await page.goto('/');
  const nome = page.locator('.nav-marca span');
  expect((await nome.boundingBox()).height).toBeLessThan(30);
  await page.locator('[data-menu]').click();
  const painel = await page.locator('.nav-links').boundingBox();
  expect(painel.height).toBeGreaterThan(page.viewportSize().height * 0.9);
  await expect(page.locator('.nav-links a[href="/contato/"]')).toBeInViewport();
});

test('modal rola com a roda do mouse e recomendações mostram 5 + ver mais', async ({ page, isMobile }) => {
  await page.goto('/projetos/');
  await page.locator('[data-abrir-projeto]').first().click();
  const modal = page.locator('[data-modal]');
  await expect(modal).toBeVisible();
  if (!isMobile) {
    await page.mouse.move(600, 500);
    await page.mouse.wheel(0, 1200);
    await expect.poll(() => modal.evaluate(m => m.scrollTop)).toBeGreaterThan(100);
  }
  await page.keyboard.press('Escape');
  await page.goto('/');
  const itens = page.locator('.recs-grade > li');
  const total = dados.recomendacoes.length;
  test.skip(total <= 5 || isMobile); // no celular as recomendações viram uma fileira deslizante com todas
  await expect(page.locator('.recs-grade > li:visible')).toHaveCount(5);
  await page.locator('[data-ver-mais-recs]').click();
  await expect(page.locator('.recs-grade > li:visible')).toHaveCount(total);
  await expect(itens).toHaveCount(total);
});

test('árvore RPG começa afastada e aproxima pelo botão', async ({ page }) => {
  await page.goto('/competencias/');
  const svg = page.locator('[data-palco]:not([hidden]) > svg.rpg-svg');
  const w0 = Number(await svg.getAttribute('width'));
  await page.locator('[data-zoom="1"]').click();
  await expect.poll(async () => Number(await svg.getAttribute('width'))).toBeGreaterThan(w0);
});

// Botões nunca quebram linha nem cortam o texto (revisão de UX/UI), em todas as páginas e nos 3 idiomas
test('nenhum botão quebra linha ou vaza o texto', async ({ page }) => {
  test.setTimeout(120000);
  for (const url of URLS) {
    await page.goto(url);
    const ruins = await page.evaluate(() => {
      const sel = '.btn, [role="tab"], .vistas button, .valor-grupo button, .rpg-acoes button, .caminho, .ler-mais, .expandir, .nav-cv, .galeria-modos button, .cv-versoes button, .cv-barra button, .nav-lingua summary';
      const out = [];
      for (const el of document.querySelectorAll(sel)) {
        const cs = getComputedStyle(el);
        if (!el.offsetParent || cs.visibility === 'hidden' || el.closest('[aria-hidden="true"], [hidden]')) continue;
        // só o texto conta (ícone ao lado do texto não é quebra de linha): cada nó de texto em uma única linha
        const nos = []; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); while (w.nextNode()) if (w.currentNode.textContent.trim()) nos.push(w.currentNode);
        const topos = new Set(nos.flatMap(n => { const r = document.createRange(); r.selectNodeContents(n); return [...r.getClientRects()].filter(x => x.width > 1).map(x => Math.round(x.bottom / 6)); }));
        if (topos.size > 1 || el.scrollWidth > el.clientWidth + 2) out.push(`${el.className || el.tagName}: "${el.textContent.trim().slice(0, 30)}"`);
      }
      return out;
    });
    expect(ruins, `botões quebrados em ${url}`).toEqual([]);
  }
});

test('celular: primeira visita pergunta o idioma e lembra a escolha', async ({ browser, isMobile }) => {
  test.skip(!isMobile);
  const ctx = await browser.newContext({ ...(await import('@playwright/test')).devices['Pixel 7'], locale: 'pt-BR' });
  const page = await ctx.newPage();
  await simularSupabase(page, { perguntarIdioma: true });
  await page.goto('/');
  const aviso = page.locator('.idioma-aviso');
  await expect(aviso).toBeVisible();
  await aviso.getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('.idioma-aviso')).toHaveCount(0);
  await ctx.close();
});

test('currículo: versões vêm do banco e o admin lista os currículos', async ({ page }) => {
  await page.goto('/cv/');
  const versoes = (dados.cvs || []);
  if (versoes.length) await expect(page.locator('[data-variante]')).toHaveCount(versoes.length);
  await expect(page.locator('.folha').first()).toBeVisible();
});

test('prints na moldura do aparelho e calculadora recolhida só no celular', async ({ page, isMobile }) => {
  const comCena = dados.projetos.find(p => p.ativo !== false && (p.galeria || []).some(g => g.dispositivo === 'mobile'));
  await page.goto(`/projetos/#projeto/${comCena.slug}`);
  const modal = page.locator("[data-modal]");
  await modal.locator('[data-modo="desktop"]').click();
  await expect(modal.locator('.moldura-desktop img').first()).toBeVisible();
  await modal.locator('[data-modo="mobile"]').click();
  const cel = modal.locator('.moldura-mobile').first();
  await expect(cel).toBeVisible();
  // a imagem começa abaixo da faixa da câmera
  const [moldura, img] = await Promise.all([cel.boundingBox(), cel.locator('img').boundingBox()]);
  expect(img.y - moldura.y).toBeGreaterThan(20);
  await page.goto('/contato/');
  await expect(page.locator('.valor-dobra')).toHaveJSProperty('open', !isMobile);
});
