import { expect, test } from '@playwright/test';
import { simularSupabase, semVazamento, vigiarErros } from './apoio.js';

async function entrar(page) {
  await page.goto('/admin/');
  await page.getByLabel('E-mail').fill('matteusbonotto@gmail.com');
  await page.getByLabel('Senha').fill('senha-de-teste');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: /Painel/ })).toBeVisible();
}

test('conta sem permissão não entra', async ({ page }) => {
  await simularSupabase(page, { admin: false });
  await page.goto('/admin/');
  await page.getByLabel('E-mail').fill('outra@pessoa.com');
  await page.getByLabel('Senha').fill('x');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('status')).toHaveText(/não tem acesso/);
});

test('admin: login, painel, idioma e mensagens', async ({ page, isMobile }) => {
  const erros = vigiarErros(page);
  await simularSupabase(page, { admin: true });
  await entrar(page);
  await expect(page.locator('.cartoes-numeros li')).toHaveCount(11);
  await semVazamento(page);
  await page.locator('.topo').getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible();
  await page.locator('.topo').getByRole('button', { name: 'PT', exact: true }).click();
  if (isMobile) await page.locator('[data-menu]').click();
  await page.locator('.lateral').getByRole('link', { name: /Mensagens/ }).click();
  await page.getByText('Recrutadora Teste').click();
  await expect(page.getByText('Olá, Matheus!')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Responder por e-mail' })).toHaveAttribute('href', /^mailto:rh@empresa\.com/);
  expect(erros).toEqual([]);
});

test('admin: editar projeto salva PT e traduções EN/ES', async ({ page, isMobile }) => {
  const escritas = await simularSupabase(page, { admin: true });
  await entrar(page);
  if (isMobile) await page.locator('[data-menu]').click();
  await page.locator('.lateral').getByRole('link', { name: 'Projetos' }).click();
  await page.locator('[data-editar]').first().click();
  const gaveta = page.locator('dialog.gaveta');
  await expect(gaveta).toBeVisible();
  await gaveta.locator('[name="descricao_curta"]').fill('Descrição nova em PT');
  await gaveta.getByRole('tab', { name: 'Espanhol' }).click();
  await gaveta.locator('[name="es__descricao_curta"]').fill('Descripción nueva');
  await gaveta.getByRole('button', { name: 'Salvar' }).click();
  await expect(gaveta).toBeHidden();
  const patch = escritas.find(e => e.tabela === 'projects' && e.metodo === 'PATCH');
  expect(patch.corpo.descricao_curta).toBe('Descrição nova em PT');
  expect(patch.corpo.i18n.es.descricao_curta).toBe('Descripción nueva');
  expect(patch.corpo.i18n.en.descricao_curta).toBeTruthy(); // tradução existente preservada
});

test('admin: campo obrigatório vazio não salva', async ({ page, isMobile }) => {
  const escritas = await simularSupabase(page, { admin: true });
  await entrar(page);
  if (isMobile) await page.locator('[data-menu]').click();
  await page.locator('.lateral').getByRole('link', { name: 'Experiência' }).click();
  await page.getByRole('button', { name: '+ Novo' }).click();
  await page.locator('dialog.gaveta').getByRole('button', { name: 'Salvar' }).click();
  await expect(page.locator('.aviso-erro')).toContainText('Preencha');
  expect(escritas.filter(e => e.tabela === 'professional_history')).toHaveLength(0);
});

test('admin: valor por hora é editável', async ({ page, isMobile }) => {
  const escritas = await simularSupabase(page, { admin: true });
  await entrar(page);
  if (isMobile) await page.locator('[data-menu]').click();
  await page.locator('.lateral').getByRole('link', { name: 'Textos do site' }).click();
  await page.getByRole('button', { name: /Valor por hora/ }).click();
  await page.locator('[name="usd"]').fill('35');
  await page.locator('dialog.gaveta').getByRole('button', { name: 'Salvar' }).click();
  const up = escritas.find(e => e.tabela === 'site_content');
  expect(up.corpo).toMatchObject({ key: 'valor_hora', value: { usd: 35 } });
});
