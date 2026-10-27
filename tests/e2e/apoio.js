// Supabase simulado: o site e o admin rodam contra o retrato tests/fixtures/dados.json, sem tocar no banco real.
import fs from 'node:fs';
import { expect } from '@playwright/test';

export const dados = JSON.parse(fs.readFileSync(new URL('../fixtures/dados.json', import.meta.url), 'utf8'));
const TABELAS = {
  projects: dados.projetos, professional_history: dados.experiencias, academic_history: dados.formacoes, certifications: dados.certificacoes,
  hard_skills: dados.competencias, soft_skills: dados.comportamentais, languages: dados.idiomas, feedbacks: dados.recomendacoes,
  skills_tree: dados.arvore, cv_versions: dados.cvs || [], achievements: dados.conquistas, profiles: [dados.perfil],
  site_content: Object.entries(dados.site).map(([key, value]) => ({ key, value })),
  contact_messages: [{ id: 'm1', nome: 'Recrutadora Teste', email: 'rh@empresa.com', assunto: 'vaga', mensagem: 'Olá, Matheus!', lida: false, created_at: '2026-10-26T12:00:00Z', idioma: 'pt' }],
  admins: [{ user_id: 'u1' }],
};
export const URLS = ['/', '/sobre/', '/projetos/', '/trajetoria/', '/competencias/', '/contato/', '/cv/'].flatMap(p => [p, `/en${p}`, `/es${p}`]);

export async function simularSupabase(page, { admin = false, perguntarIdioma = false } = {}) {
  const escritas = [];
  let falhas = 0; // bloqueio do login: 3 senhas erradas
  // o aviso de idioma da primeira visita cobre o rodapé da tela; só o teste dele o vê
  if (!perguntarIdioma) await page.addInitScript(() => { try { localStorage.setItem('idioma', 'pt'); } catch {} });
  await page.route(/supabase\.co\/(rest|auth|storage)\/v1\//, async rota => {
    const req = rota.request();
    const url = new URL(req.url());
    const [, servico, caminho] = url.pathname.match(/\/(rest|auth|storage)\/v1\/(.*)$/);
    const json = (body, status = 200) => rota.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (servico === 'auth') {
      const user = { id: 'u1', email: 'matteusbonotto@gmail.com', aud: 'authenticated', role: 'authenticated' };
      if (caminho.startsWith('token') && req.postDataJSON?.()?.password === 'senha-errada') return json({ error: 'invalid_grant', error_description: 'Invalid login credentials' }, 400);
      if (caminho.startsWith('token')) return json({ access_token: 'tok', refresh_token: 'ref', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user });
      if (caminho === 'user') return json(user);
      return json({});
    }
    if (servico === 'storage') return json({ Key: 'media/x.webp' });
    const tabela = caminho.split('?')[0];
    if (tabela === 'rpc/login_bloqueado') return json(falhas >= 3);
    if (tabela === 'rpc/registrar_falha_login') { falhas++; return json(Math.max(0, 3 - falhas)); }
    if (tabela.startsWith('rpc/')) return json(null);
    if (req.method() !== 'GET' && req.method() !== 'HEAD') {
      escritas.push({ metodo: req.method(), tabela, corpo: req.postDataJSON?.() ?? null, url: req.url() });
      return rota.fulfill({ status: req.method() === 'POST' ? 201 : 204, body: '' });
    }
    let linhas = TABELAS[tabela] ?? [];
    if (tabela === 'admins' && !admin) linhas = [];
    if (url.searchParams.get('lida') === 'eq.false') linhas = linhas.filter(m => !m.lida);
    const unico = (req.headers().accept || '').includes('vnd.pgrst.object');
    if (req.method() === 'HEAD') return rota.fulfill({ status: 200, headers: { 'content-range': `0-0/${linhas.length}` }, body: '' });
    return rota.fulfill({ status: 200, contentType: 'application/json', headers: { 'content-range': `0-${Math.max(linhas.length - 1, 0)}/${linhas.length}` }, body: JSON.stringify(unico ? linhas[0] ?? null : linhas) });
  });
  return escritas;
}

export function vigiarErros(page) {
  const erros = [];
  page.on('pageerror', e => erros.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) erros.push(m.text()); });
  return erros;
}

// Critérios do kit de revisão: nada de rolagem lateral e nenhum elemento visível vazando da tela.
export async function semVazamento(page) {
  const r = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const fora = [];
    for (const el of document.querySelectorAll('main *, header *, footer *')) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('[aria-hidden="true"], .campo-isca, [hidden], dialog:not([open]), .letreiro, .vitrine, .recs-grade, .rodape-links, .carreira-legenda, .filtros, .galeria-faixa, .carreira-rolagem, .cv-mesa, .nav-links, .rpg-palco')) continue;
      const b = el.getBoundingClientRect();
      if (b.width && (b.right > vw + 1 || b.left < -1)) fora.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} (${Math.round(b.left)}→${Math.round(b.right)})`);
    }
    return { rolagem: document.documentElement.scrollWidth - vw, fora: fora.slice(0, 8) };
  });
  expect(r.rolagem, 'rolagem lateral').toBeLessThanOrEqual(1);
  expect(r.fora, 'elementos fora da tela').toEqual([]);
}
