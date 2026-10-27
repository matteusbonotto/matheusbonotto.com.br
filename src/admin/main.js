// Painel admin: login (Supabase Auth), CRUD de todas as tabelas descritas em esquema.js, mensagens e textos do site.
// Toda escrita passa pelo RLS (só quem está na tabela "admins" grava). Interface em PT/EN/ES.
import './admin.css';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';
import { CONTEUDO, SECOES } from './esquema.js';
import { TEXTOS } from './textos.js';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, detectSessionInUrl: true } });
const app = document.getElementById('app');
const IDIOMAS = ['pt', 'en', 'es'];
let lang = (() => { try { return localStorage.getItem('admin-lang'); } catch { return null; } })() || (navigator.language || 'pt').slice(0, 2);
if (!IDIOMAS.includes(lang)) lang = 'pt';
const T = () => TEXTOS[lang];
const tx = (k, vars) => String(T()[k] ?? k).replace(/\{(\w+)\}/g, (_, n) => vars?.[n] ?? '');
const rotulo = nome => T().f[nome] || nome;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// ---------- avisos ----------
function aviso(msg, tipo = 'ok') {
  const el = document.createElement('div');
  el.className = `aviso aviso-${tipo}`;
  el.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
  el.textContent = msg;
  document.body.append(el);
  setTimeout(() => el.classList.add('saindo'), 3200);
  setTimeout(() => el.remove(), 3700);
}
const falhou = e => { console.error(e); aviso(tx('erro', { msg: e?.message || e }), 'erro'); };

// ---------- autenticação ----------
async function ehAdmin(user) {
  const { data, error } = await sb.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  return !error && !!data;
}

function telaLogin(modo = 'entrar', msg = '') {
  document.title = tx('titulo');
  app.innerHTML = `<main class="login">
    <form class="login-caixa" data-form-login novalidate>
      <img src="/media/logo-128.webp" alt="" width="64" height="64">
      <h1>${tx('titulo')}</h1>
      ${seletorIdioma()}
      ${modo === 'senha' ? `<label>${tx('novaSenha')}<input type="password" name="senha" autocomplete="new-password" minlength="8" required></label>
        <button class="botao primario" type="submit">${tx('salvarSenha')}</button>`
      : `<label>${tx('email')}<input type="email" name="email" autocomplete="username" required></label>
        ${modo === 'entrar' ? `<label>${tx('senha')}<input type="password" name="senha" autocomplete="current-password" required></label>` : ''}
        <button class="botao primario" type="submit">${modo === 'entrar' ? tx('entrar') : tx('enviarLink')}</button>
        <button class="botao link" type="button" data-modo="${modo === 'entrar' ? 'recuperar' : 'entrar'}">${modo === 'entrar' ? tx('esqueci') : tx('voltarLogin')}</button>`}
      <p class="login-msg" role="status" aria-live="polite">${esc(msg)}</p>
    </form>
  </main>`;
  $('[data-modo]')?.addEventListener('click', e => telaLogin(e.currentTarget.dataset.modo));
  ligarIdioma(() => telaLogin(modo, msg));
  $('[data-form-login]').addEventListener('submit', async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const botao = $('button[type=submit]', e.target);
    botao.disabled = true;
    try {
      if (modo === 'entrar') {
        // 3 senhas erradas bloqueiam a conta; só a recuperação de senha (link no e-mail) desbloqueia
        const email = f.email.trim();
        const { data: bloqueada } = await sb.rpc('login_bloqueado', { p_email: email });
        if (bloqueada) return telaLogin('recuperar', tx('contaBloqueada'));
        const { error } = await sb.auth.signInWithPassword({ email, password: f.senha });
        if (error) {
          const { data: restam } = await sb.rpc('registrar_falha_login', { p_email: email });
          if (restam === 0) return telaLogin('recuperar', tx('contaBloqueada'));
          return telaLogin('entrar', `${tx('erroLogin')} ${restam > 0 && restam < 3 ? tx('tentativasRestam', { n: restam }) : ''}`.trim());
        }
        await sb.rpc('login_sucesso');
        await iniciar();
      } else if (modo === 'recuperar') {
        await sb.auth.resetPasswordForEmail(f.email.trim(), { redirectTo: `${location.origin}/admin/` });
        telaLogin('entrar', tx('linkEnviado'));
      } else {
        const { error } = await sb.auth.updateUser({ password: f.senha });
        if (error) throw error;
        await sb.rpc('desbloquear_login');
        history.replaceState(null, '', '/admin/');
        aviso(tx('senhaSalva'));
        await iniciar();
      }
    } catch (err) { falhou(err); botao.disabled = false; }
  });
}

function seletorIdioma() {
  return `<div class="idiomas" role="group" aria-label="${tx('idioma')}">${IDIOMAS.map(l => `<button type="button" data-lang="${l}" aria-pressed="${l === lang}">${l.toUpperCase()}</button>`).join('')}</div>`;
}
function ligarIdioma(redesenhar) {
  $$('[data-lang]').forEach(b => b.addEventListener('click', () => {
    lang = b.dataset.lang;
    try { localStorage.setItem('admin-lang', lang); } catch {}
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
    redesenhar();
  }));
}

// ---------- estrutura ----------
const MENU = [
  ['', [['painel', 'painel'], ['mensagens', 'mensagens'], ['conteudo', 'conteudo']]],
  ['grupoConteudo', [['tabela/projects', 'projects'], ['tabela/feedbacks', 'feedbacks'], ['tabela/cv_versions', 'cv_versions']]],
  ['grupoCarreira', [['tabela/professional_history', 'professional_history'], ['tabela/academic_history', 'academic_history'], ['tabela/certifications', 'certifications']]],
  ['grupoCompetencias', [['tabela/skills_tree', 'skills_tree'], ['tabela/hard_skills', 'hard_skills'], ['tabela/soft_skills', 'soft_skills'], ['tabela/languages', 'languages'], ['tabela/achievements', 'achievements']]],
];
let naoLidas = 0;

function moldura(conteudo, rota) {
  document.title = `${tx('titulo')}`;
  app.innerHTML = `<div class="painel-app">
    <header class="topo">
      <button class="botao icone menu-botao" type="button" data-menu aria-label="${tx('menu')}" aria-expanded="false" aria-controls="lateral">☰</button>
      <a class="marca" href="#/painel"><img src="/media/logo-64.webp" alt="" width="32" height="32"><span>Admin</span></a>
      ${seletorIdioma()}
      <a class="botao fantasma" href="/" target="_blank" rel="noopener">${tx('verSite')} ↗</a>
      <button class="botao fantasma" type="button" data-sair>${tx('sair')}</button>
    </header>
    <nav class="lateral" id="lateral" aria-label="${tx('menu')}">
      ${MENU.map(([g, itens]) => `${g ? `<p class="grupo">${tx(g)}</p>` : ''}<ul>${itens.map(([r, k]) => `<li><a href="#/${r}" ${rota === r ? 'aria-current="page"' : ''}>${tx(k)}${k === 'mensagens' && naoLidas ? `<span class="contador" aria-label="${tx('naoLidas')}">${naoLidas}</span>` : ''}</a></li>`).join('')}</ul>`).join('')}
    </nav>
    <main class="area" id="area" tabindex="-1">${conteudo}</main>
  </div>`;
  ligarIdioma(rotear);
  $('[data-sair]').addEventListener('click', async () => { await sb.auth.signOut(); telaLogin(); });
  const menu = $('[data-menu]');
  menu.addEventListener('click', () => { const aberto = document.body.classList.toggle('menu-aberto'); menu.setAttribute('aria-expanded', aberto); });
  $$('.lateral a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('menu-aberto'); menu.setAttribute('aria-expanded', false); }));
}

async function rotear() {
  const rota = location.hash.replace(/^#\/?/, '') || 'painel';
  moldura(`<p class="carregando">${tx('carregando')}</p>`, rota);
  try {
    if (rota === 'painel') return await painel(rota);
    if (rota === 'mensagens') return await mensagens(rota);
    if (rota === 'conteudo') return await conteudo(rota);
    const [, tabela] = rota.match(/^tabela\/(\w+)$/) || [];
    if (tabela && SECOES[tabela]) return await lista(tabela, rota);
    location.hash = '#/painel';
  } catch (e) { falhou(e); }
}
const area = () => $('#area');

// ---------- painel ----------
const faltaTraduzir = (cfg, linha) => cfg.campos.filter(c => c.i18n && linha[c.nome] && (Array.isArray(linha[c.nome]) ? linha[c.nome].length : true))
  .some(c => ['en', 'es'].some(l => { const v = linha.i18n?.[l]?.[c.nome]; return v === undefined || v === '' || (Array.isArray(v) && !v.length); }));

async function painel() {
  const tabelas = Object.keys(SECOES);
  const res = await Promise.all(tabelas.map(t => sb.from(t).select('*')));
  const { count } = await sb.from('contact_messages').select('id', { count: 'exact', head: true }).eq('lida', false);
  naoLidas = count || 0;
  const pend = [];
  res.forEach(({ data }, i) => (data || []).forEach(l => { if (faltaTraduzir(SECOES[tabelas[i]], l)) pend.push([tabelas[i], l]); }));
  moldura(`<h1>${tx('painel')}</h1>
    <p class="dica">${tx('publicadoNaHora')}</p>
    <ul class="cartoes-numeros">
      <li><a href="#/mensagens"><strong>${naoLidas}</strong><span>${tx('naoLidas')} · ${tx('mensagens')}</span></a></li>
      ${tabelas.map((t, i) => `<li><a href="#/tabela/${t}"><strong>${res[i].data?.length ?? 0}</strong><span>${tx(t)}</span></a></li>`).join('')}
    </ul>
    <h2>${tx('pendencias')} <span class="contador">${pend.length}</span></h2>
    ${pend.length ? `<ul class="pendencias">${pend.map(([t, l]) => `<li><a href="#/tabela/${t}" data-editar-direto="${t}:${l.id}"><span class="etiqueta">${tx(t)}</span>${esc(SECOES[t].titulo(l))}</a></li>`).join('')}</ul>` : `<p class="dica">${tx('semPendencias')}</p>`}`, 'painel');
  $$('[data-editar-direto]').forEach(a => a.addEventListener('click', async e => {
    e.preventDefault();
    const [t, id] = a.dataset.editarDireto.split(':');
    location.hash = `#/tabela/${t}`;
    setTimeout(() => editar(t, id), 300);
  }));
}

// ---------- mensagens ----------
async function mensagens(rota) {
  const { data, error } = await sb.from('contact_messages').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  naoLidas = data.filter(m => !m.lida).length;
  const fmt = d => new Intl.DateTimeFormat(lang === 'pt' ? 'pt-BR' : lang, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d));
  moldura(`<h1>${tx('mensagens')} <span class="contador">${naoLidas}</span></h1>
    ${data.length ? `<ul class="mensagens">${data.map(m => `<li class="${m.lida ? '' : 'nova'}"><details data-msg="${m.id}">
      <summary><strong>${esc(m.nome)}</strong><span>${esc(m.assunto || '')}</span><time>${fmt(m.created_at)}</time></summary>
      <div class="msg-corpo"><p class="dica">${esc(m.email)} · ${tx('recebidaEm', { data: fmt(m.created_at) })}${m.idioma ? ` · ${m.idioma.toUpperCase()}` : ''}</p>
        <p class="msg-texto">${esc(m.mensagem)}</p>
        <div class="acoes"><a class="botao primario" href="mailto:${esc(m.email)}?subject=${encodeURIComponent(`Re: ${m.assunto || 'matheusbonotto.com.br'}`)}">${tx('responder')}</a>
          <button class="botao" type="button" data-lida="${m.id}" data-valor="${!m.lida}">${m.lida ? tx('marcarNaoLida') : tx('marcarLida')}</button>
          <button class="botao perigo" type="button" data-excluir-msg="${m.id}">${tx('excluir')}</button></div></div>
    </details></li>`).join('')}</ul>` : `<p class="dica">${tx('vazio')}</p>`}`, rota);
  $$('details[data-msg]').forEach(d => d.addEventListener('toggle', async () => {
    const m = data.find(x => x.id === d.dataset.msg);
    if (d.open && !m.lida) { await sb.from('contact_messages').update({ lida: true }).eq('id', m.id); m.lida = true; d.parentElement.classList.remove('nova'); }
  }));
  $$('[data-lida]').forEach(b => b.addEventListener('click', async () => {
    const { error: e } = await sb.from('contact_messages').update({ lida: b.dataset.valor === 'true' }).eq('id', b.dataset.lida);
    e ? falhou(e) : mensagens(rota);
  }));
  $$('[data-excluir-msg]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm(tx('confirmarExcluir', { item: data.find(x => x.id === b.dataset.excluirMsg)?.nome }))) return;
    const { error: e } = await sb.from('contact_messages').delete().eq('id', b.dataset.excluirMsg);
    e ? falhou(e) : (aviso(tx('excluido')), mensagens(rota));
  }));
}

// ---------- listas (CRUD) ----------
let cache = {};
async function carregar(tabela) {
  const cfg = SECOES[tabela];
  const { data, error } = await sb.from(tabela).select('*').order(cfg.ordem, { ascending: !cfg.desc, nullsFirst: false });
  if (error) throw error;
  cache[tabela] = data;
  return data;
}

async function lista(tabela, rota) {
  const cfg = SECOES[tabela];
  const dados = await carregar(tabela);
  const linhas = cfg.arvore ? ordenarArvore(dados) : dados.map(l => [l, 0]);
  moldura(`<div class="lista-topo"><h1>${tx(tabela)} <span class="contador">${dados.length}</span></h1>
      <input type="search" class="busca" placeholder="${tx('buscar')}" aria-label="${tx('buscar')}" data-busca>
      <button class="botao primario" type="button" data-novo>+ ${tx('novo')}</button></div>
    ${dados.length ? `<ul class="itens" data-itens>${linhas.map(([l, nivel], i) => `<li data-id="${l.id}" data-texto="${esc(cfg.busca.map(b => [].concat(l[b] ?? '').join(' ')).join(' ').toLowerCase())}" style="--nivel:${nivel}">
      ${cfg.imagem ? `<span class="miniatura">${cfg.imagem(l) ? `<img src="${esc(cfg.imagem(l))}" alt="" loading="lazy">` : ''}</span>` : ''}
      <button type="button" class="item-principal" data-editar="${l.id}"><strong>${esc(cfg.titulo(l))}</strong>${cfg.sub ? `<span>${esc(cfg.sub(l) || '')}</span>` : ''}${faltaTraduzir(cfg, l) ? `<span class="etiqueta alerta">${tx('faltaTraducao')}</span>` : ''}${cfg.pendente?.(l) ? `<span class="etiqueta pendente">${tx('pendente')}</span>` : ''}</button>
      <span class="chaves">${cfg.chaves.map(k => `<label class="chave" title="${rotulo(k)}"><input type="checkbox" data-chave="${k}" ${l[k] ? 'checked' : ''}><span>${rotulo(k)}</span></label>`).join('')}</span>
      ${cfg.ordem === 'ordem' && !cfg.arvore ? `<span class="mover"><button type="button" class="botao icone" data-mover="-1" aria-label="${tx('subir')}" ${i === 0 ? 'disabled' : ''}>↑</button><button type="button" class="botao icone" data-mover="1" aria-label="${tx('descer')}" ${i === dados.length - 1 ? 'disabled' : ''}>↓</button></span>` : ''}
      <button type="button" class="botao icone perigo" data-excluir="${l.id}" aria-label="${tx('excluir')}">✕</button>
    </li>`).join('')}</ul>` : `<p class="dica">${tx('vazio')}</p>`}`, rota);

  $('[data-novo]').addEventListener('click', () => editar(tabela, null));
  $('[data-busca]')?.addEventListener('input', e => { const q = e.target.value.toLowerCase(); $$('[data-itens] > li').forEach(li => { li.hidden = q && !li.dataset.texto.includes(q); }); });
  $$('[data-editar]').forEach(b => b.addEventListener('click', () => editar(tabela, b.dataset.editar)));
  $$('[data-chave]').forEach(c => c.addEventListener('change', async () => {
    const id = c.closest('li').dataset.id;
    const { error } = await sb.from(tabela).update({ [c.dataset.chave]: c.checked }).eq('id', id);
    if (error) { c.checked = !c.checked; falhou(error); } else aviso(tx('salvo'));
  }));
  $$('[data-mover]').forEach(b => b.addEventListener('click', async () => {
    const id = b.closest('li').dataset.id, i = dados.findIndex(x => x.id === id), j = i + +b.dataset.mover;
    if (j < 0 || j >= dados.length) return;
    const lista2 = [...dados];
    [lista2[i], lista2[j]] = [lista2[j], lista2[i]];
    // renumera tudo (10, 20, 30…) para não depender de ordens repetidas no banco
    const mudou = lista2.map((x, k) => ({ id: x.id, ordem: (k + 1) * 10 })).filter((x, k) => lista2[k].ordem !== x.ordem);
    for (const m of mudou) { const { error } = await sb.from(tabela).update({ ordem: m.ordem }).eq('id', m.id); if (error) return falhou(error); }
    lista(tabela, rota);
  }));
  $$('[data-excluir]').forEach(b => b.addEventListener('click', async () => {
    const l = dados.find(x => x.id === b.dataset.excluir);
    if (!confirm(tx('confirmarExcluir', { item: cfg.titulo(l) }))) return;
    const { error } = await sb.from(tabela).delete().eq('id', l.id);
    error ? falhou(error) : (aviso(tx('excluido')), lista(tabela, rota));
  }));
}

function ordenarArvore(dados) {
  const filhos = new Map(), saida = [];
  dados.forEach(n => { const k = n.parent_id || 'raiz'; (filhos.get(k) || filhos.set(k, []).get(k)).push(n); });
  const visitar = (k, nivel) => (filhos.get(k) || []).forEach(n => { saida.push([n, nivel]); visitar(n.id, nivel + 1); });
  visitar('raiz', 0);
  dados.forEach(n => { if (!saida.some(([x]) => x === n)) saida.push([n, 0]); });
  return saida;
}

// ---------- campos do formulário ----------
function campo(c, valor, prefixo = '', tabela = '') {
  const id = `c-${prefixo}${c.nome}`;
  const nome = `${prefixo}${c.nome}`;
  const tipo = c.tipo || 'texto';
  const req = c.obrigatorio && !prefixo ? 'required' : '';
  const ajuda = c.ajuda ? `<small>${tx(`ajuda_${c.ajuda}`)}</small>` : '';
  const lab = `<label for="${id}">${rotulo(c.nome)}${c.obrigatorio && !prefixo ? ' *' : ''}</label>`;
  const max = c.max ? `maxlength="${c.max}"` : '';
  switch (tipo) {
    case 'area': return `<div class="campo">${lab}<textarea id="${id}" name="${nome}" rows="${c.linhas || 4}" ${req} ${max}>${esc(valor)}</textarea>${ajuda}</div>`;
    case 'numero': return `<div class="campo">${lab}<input id="${id}" name="${nome}" type="number" step="any" value="${esc(valor)}"></div>`;
    case 'data': return `<div class="campo">${lab}<input id="${id}" name="${nome}" type="date" value="${esc(valor || '')}" ${req}></div>`;
    case 'url': return `<div class="campo">${lab}<input id="${id}" name="${nome}" type="url" inputmode="url" value="${esc(valor)}" placeholder="https://"></div>`;
    case 'email': return `<div class="campo">${lab}<input id="${id}" name="${nome}" type="email" value="${esc(valor)}"></div>`;
    case 'bool': return `<div class="campo campo-bool"><label class="chave"><input type="checkbox" id="${id}" name="${nome}" ${valor ? 'checked' : ''}><span>${rotulo(c.nome)}</span></label></div>`;
    case 'select': return `<div class="campo">${lab}<select id="${id}" name="${nome}"><option value=""></option>${c.opcoes.map(o => `<option ${o === valor ? 'selected' : ''}>${esc(o)}</option>`).join('')}${valor && !c.opcoes.includes(valor) ? `<option selected>${esc(valor)}</option>` : ''}</select>${ajuda}</div>`;
    case 'multi': return `<fieldset class="campo"><legend>${rotulo(c.nome)}</legend><div class="opcoes">${c.opcoes.map(o => `<label class="chave"><input type="checkbox" name="${nome}" value="${o}" ${(valor || []).includes(o) ? 'checked' : ''}><span>${o}</span></label>`).join('')}</div>${ajuda}</fieldset>`;
    case 'lista': return `<div class="campo">${lab}<textarea id="${id}" name="${nome}" rows="5" data-lista>${esc((valor || []).join('\n'))}</textarea><small>${tx('umPorLinha')}</small></div>`;
    case 'tags': return `<div class="campo">${lab}<input id="${id}" name="${nome}" value="${esc((valor || []).join(', '))}" data-tags><small>${c.ajuda ? `${tx(`ajuda_${c.ajuda}`)} · ` : ''}${tx('separarVirgula')}</small></div>`;
    case 'nivel': return `<div class="campo">${lab}<div class="nivel-campo"><input id="${id}" name="${nome}" type="range" min="0" max="100" step="5" value="${valor ?? 50}" oninput="this.nextElementSibling.value=this.value"><output>${valor ?? 50}</output></div></div>`;
    case 'pai': {
      const nos = (cache[tabela] || []).filter(n => n.id !== valor?.__proprio);
      return `<div class="campo">${lab}<select id="${id}" name="${nome}"><option value="">${tx('semPai')}</option>${ordenarArvore(nos).map(([n, nv]) => `<option value="${n.id}" ${n.id === valor?.atual ? 'selected' : ''}>${'· '.repeat(nv)}${esc(n.nome)}</option>`).join('')}</select></div>`;
    }
    case 'imagem': return `<div class="campo" data-campo-imagem="${nome}" data-pasta="${c.pasta}" data-largura="${c.largura || 1600}">${lab}
      <input type="hidden" name="${nome}" value="${esc(valor || '')}">
      <div class="imagem-previa">${valor ? `<img src="${esc(valor)}" alt="">` : ''}</div>
      <div class="acoes"><label class="botao">${valor ? tx('trocarImagem') : tx('enviarImagem')}<input type="file" accept="image/*" hidden data-arquivo></label>
      ${valor ? `<button type="button" class="botao perigo" data-remover-imagem>${tx('removerImagem')}</button>` : ''}</div></div>`;
    case 'galeria': return `<fieldset class="campo" data-campo-galeria="${nome}" data-pasta="${c.pasta}"><legend>${rotulo(c.nome)}</legend>
      <input type="hidden" name="${nome}" value="${esc(JSON.stringify(valor || []))}" data-json>
      <ul class="galeria-admin">${(valor || []).map((g, i) => `<li><img src="${esc(g.url)}" alt=""><select data-disp="${i}"><option value="desktop" ${g.dispositivo !== 'mobile' ? 'selected' : ''}>${tx('desktop')}</option><option value="mobile" ${g.dispositivo === 'mobile' ? 'selected' : ''}>${tx('mobile')}</option></select><button type="button" class="botao icone perigo" data-tirar="${i}" aria-label="${tx('remover')}">✕</button></li>`).join('')}</ul>
      <label class="botao">${tx('adicionarPrint')}<input type="file" accept="image/*" multiple hidden data-arquivos></label></fieldset>`;
    default: return `<div class="campo">${lab}<input id="${id}" name="${nome}" value="${esc(valor)}" ${req} ${max}>${ajuda}</div>`;
  }
}

function lerCampo(c, form, prefixo = '') {
  const nome = `${prefixo}${c.nome}`;
  const el = form.elements[nome];
  switch (c.tipo) {
    case 'bool': return !!el?.checked;
    case 'multi': return $$(`input[name="${nome}"]:checked`, form).map(i => i.value);
    case 'numero': return el.value === '' ? null : Number(el.value);
    case 'nivel': return Number(el.value);
    case 'lista': return el.value.split('\n').map(s => s.trim()).filter(Boolean);
    case 'tags': return el.value.split(',').map(s => s.trim()).filter(Boolean);
    case 'galeria': return JSON.parse(el.value || '[]');
    case 'data': case 'url': case 'select': case 'pai': case 'imagem': return el.value || null;
    default: return el.value.trim();
  }
}

// Redimensiona no navegador e envia como WebP para o bucket público "media".
async function enviarImagem(arquivo, pasta, largura = 1600) {
  const bmp = await createImageBitmap(arquivo);
  const escala = Math.min(1, largura / bmp.width);
  const cv = Object.assign(document.createElement('canvas'), { width: Math.round(bmp.width * escala), height: Math.round(bmp.height * escala) });
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
  const blob = await new Promise(r => cv.toBlob(r, 'image/webp', 0.8));
  const caminho = `${pasta}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}.webp`;
  const { error } = await sb.storage.from('media').upload(caminho, blob, { contentType: 'image/webp' });
  if (error) throw error;
  return sb.storage.from('media').getPublicUrl(caminho).data.publicUrl;
}

function ligarUploads(form) {
  $$('[data-campo-imagem]', form).forEach(box => {
    const oculto = $('input[type=hidden]', box), previa = $('.imagem-previa', box);
    $('[data-arquivo]', box).addEventListener('change', async e => {
      const f = e.target.files[0]; if (!f) return;
      previa.innerHTML = `<p class="dica">${tx('enviando')}</p>`;
      try { oculto.value = await enviarImagem(f, box.dataset.pasta, +box.dataset.largura); previa.innerHTML = `<img src="${esc(oculto.value)}" alt="">`; } catch (err) { previa.innerHTML = ''; falhou(err); }
    });
    $('[data-remover-imagem]', box)?.addEventListener('click', () => { oculto.value = ''; previa.innerHTML = ''; });
  });
  $$('[data-campo-galeria]', form).forEach(box => {
    const oculto = $('[data-json]', box);
    const redesenhar = () => {
      const lista = JSON.parse(oculto.value);
      $('.galeria-admin', box).innerHTML = lista.map((g, i) => `<li><img src="${esc(g.url)}" alt=""><select data-disp="${i}"><option value="desktop" ${g.dispositivo !== 'mobile' ? 'selected' : ''}>${tx('desktop')}</option><option value="mobile" ${g.dispositivo === 'mobile' ? 'selected' : ''}>${tx('mobile')}</option></select><button type="button" class="botao icone perigo" data-tirar="${i}" aria-label="${tx('remover')}">✕</button></li>`).join('');
    };
    box.addEventListener('change', e => {
      const s = e.target.closest('[data-disp]'); if (!s) return;
      const lista = JSON.parse(oculto.value); lista[+s.dataset.disp].dispositivo = s.value; oculto.value = JSON.stringify(lista);
    });
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-tirar]'); if (!b) return;
      const lista = JSON.parse(oculto.value); lista.splice(+b.dataset.tirar, 1); oculto.value = JSON.stringify(lista); redesenhar();
    });
    $('[data-arquivos]', box).addEventListener('change', async e => {
      const lista = JSON.parse(oculto.value);
      try {
        for (const f of e.target.files) {
          const img = await createImageBitmap(f);
          const url = await enviarImagem(f, box.dataset.pasta, img.width > img.height ? 1600 : 780);
          lista.push({ url, dispositivo: img.width > img.height ? 'desktop' : 'mobile' });
        }
      } catch (err) { falhou(err); }
      oculto.value = JSON.stringify(lista); redesenhar();
    });
  });
}

// ---------- editor (gaveta) ----------
function gaveta(titulo, corpo, aoSalvar) {
  $('.gaveta')?.remove();
  const d = document.createElement('dialog');
  d.className = 'gaveta';
  d.setAttribute('aria-label', titulo);
  d.innerHTML = `<form method="dialog" class="gaveta-form" novalidate>
    <header><h2>${esc(titulo)}</h2><button type="button" class="botao icone" data-fechar aria-label="${tx('cancelar')}">✕</button></header>
    <div class="gaveta-corpo">${corpo}</div>
    <footer><button type="button" class="botao" data-fechar>${tx('cancelar')}</button><button type="submit" class="botao primario">${tx('salvar')}</button></footer>
  </form>`;
  document.body.append(d);
  d.showModal();
  const form = $('form', d);
  $$('[data-fechar]', d).forEach(b => b.addEventListener('click', () => d.close()));
  d.addEventListener('close', () => d.remove());
  $$('[data-aba-idioma]', d).forEach(b => b.addEventListener('click', () => {
    const grupo = b.closest('.traducoes');
    $$('[data-aba-idioma]', grupo).forEach(x => x.setAttribute('aria-selected', x === b));
    $$('[data-painel-idioma]', grupo).forEach(p => { p.hidden = p.dataset.painelIdioma !== b.dataset.abaIdioma; });
  }));
  ligarUploads(form);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const botao = $('button[type=submit]', form);
    botao.disabled = true;
    try { if (await aoSalvar(form) !== false) d.close(); } catch (err) { falhou(err); } finally { botao.disabled = false; }
  });
  return d;
}

// Abas PT / EN / ES para os campos traduzíveis
function blocoTraducoes(campos, valores, i18n) {
  if (!campos.length) return '';
  return `<section class="traducoes"><div class="abas-idioma" role="tablist" aria-label="${tx('traducao')}">${['en', 'es'].map((l, i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-aba-idioma="${l}">${tx(l)}</button>`).join('')}</div>
    ${['en', 'es'].map((l, i) => `<div data-painel-idioma="${l}" ${i ? 'hidden' : ''}>${campos.map(c => campo({ ...c, obrigatorio: false }, i18n?.[l]?.[c.nome] ?? (c.tipo === 'lista' ? [] : ''), `${l}__`)).join('')}</div>`).join('')}
  </section>`;
}

async function editar(tabela, id) {
  const cfg = SECOES[tabela];
  if (!cache[tabela]) await carregar(tabela);
  const linha = id ? cache[tabela].find(x => x.id === id) : Object.fromEntries(cfg.campos.filter(c => c.padrao !== undefined).map(c => [c.nome, c.padrao]));
  if (!linha) return;
  const valor = c => (c.tipo === 'pai' ? { atual: linha.parent_id, __proprio: linha.id } : linha[c.nome]);
  const corpo = `<div class="grade-campos">${cfg.campos.map(c => campo(c, valor(c), '', tabela)).join('')}</div>
    ${blocoTraducoes(cfg.campos.filter(c => c.i18n), linha, linha.i18n)}`;
  gaveta(`${id ? tx('editar') : tx('novo')} · ${tx(tabela)}`, corpo, async form => {
    const reg = {};
    for (const c of cfg.campos) reg[c.nome] = lerCampo(c, form);
    const faltam = cfg.campos.filter(c => c.obrigatorio && (reg[c.nome] === '' || reg[c.nome] === null)).map(c => rotulo(c.nome));
    if (faltam.length) { aviso(tx('obrigatorio', { campos: faltam.join(', ') }), 'erro'); return false; }
    const i18n = { ...(linha.i18n || {}) };
    for (const l of ['en', 'es']) {
      i18n[l] = { ...(i18n[l] || {}) };
      for (const c of cfg.campos.filter(x => x.i18n)) {
        const v = lerCampo(c, form, `${l}__`);
        if (v === '' || v === null || (Array.isArray(v) && !v.length)) delete i18n[l][c.nome]; else i18n[l][c.nome] = v;
      }
    }
    reg.i18n = i18n;
    if (tabela === 'projects' && reg.categorias?.length) reg.categoria = reg.categorias[0];
    if (reg.slug !== undefined) reg.slug = reg.slug.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const q = id ? sb.from(tabela).update(reg).eq('id', id) : sb.from(tabela).insert(reg);
    const { error } = await q;
    if (error) throw error;
    aviso(tx('salvo'));
    lista(tabela, `tabela/${tabela}`);
  });
}

// ---------- textos do site ----------
async function conteudo(rota) {
  const { data, error } = await sb.from('site_content').select('*');
  if (error) throw error;
  const v = Object.fromEntries(data.map(l => [l.key, l.value]));
  moldura(`<h1>${tx('conteudo')}</h1><p class="dica">${tx('publicadoNaHora')}</p>
    <ul class="blocos-conteudo">${Object.keys(CONTEUDO).map(k => `<li><button type="button" class="item-principal" data-bloco="${k}"><strong>${T().c[k]}</strong><span>${esc(resumoBloco(k, v[k]))}</span></button></li>`).join('')}</ul>`, rota);
  $$('[data-bloco]').forEach(b => b.addEventListener('click', () => editarBloco(b.dataset.bloco, v[b.dataset.bloco] || {}, () => conteudo(rota))));
}
function resumoBloco(k, v) {
  if (!v) return '-';
  if (k === 'valor_hora') return ['brl', 'usd', 'eur'].map(m => `${m.toUpperCase()} ${v[m] ?? '-'}`).join(' · ');
  if (k === 'clientes') return (v || []).map(c => c.nome || c).join(', ');
  if (k === 'palavras_chave') return (v || []).length + ' · ' + (v || []).slice(0, 6).join(', ');
  if (k === 'contato') return v.email || '';
  const pt = v.pt;
  if (Array.isArray(pt)) return pt.map(x => x.titulo).join(', ');
  return Object.values(pt || {}).flat().join(' · ').slice(0, 120);
}

function editarBloco(k, v, depois) {
  const campos = CONTEUDO[k];
  let corpo = '';
  if (k === 'servicos') {
    corpo = IDIOMAS.map(l => `<fieldset class="campo"><legend>${tx(l)}</legend><div data-servicos="${l}">${(v[l] || []).map(s => linhaServico(s)).join('')}</div>
      <button type="button" class="botao" data-add-servico="${l}">+ ${tx('adicionar')}</button></fieldset>`).join('');
  } else if (k === 'palavras_chave') {
    corpo = campo({ nome: 'palavras', tipo: 'tags' }, Array.isArray(v) ? v : []);
  } else if (k === 'clientes') {
    corpo = `<div data-clientes>${(Array.isArray(v) ? v : []).map(c => linhaCliente(typeof c === 'string' ? { nome: c } : c)).join('')}</div><button type="button" class="botao" data-add-cliente>+ ${tx('adicionar')}</button>`;
  } else {
    const comuns = campos.filter(c => !c.i18n), trad = campos.filter(c => c.i18n);
    corpo = `<div class="grade-campos">${comuns.map(c => campo(c, v[c.nome])).join('')}${trad.map(c => campo(c, v.pt?.[c.nome], 'pt__')).join('')}</div>
      ${blocoTraducoes(trad, v, { en: v.en, es: v.es })}`;
  }
  const d = gaveta(T().c[k], corpo, async form => {
    let novo;
    if (k === 'servicos') {
      novo = Object.fromEntries(IDIOMAS.map(l => [l, $$(`[data-servicos="${l}"] .servico`, form).map(s => ({ titulo: $('[data-s-titulo]', s).value.trim(), texto: $('[data-s-texto]', s).value.trim() })).filter(s => s.titulo)]));
    } else if (k === 'palavras_chave') {
      novo = lerCampo({ nome: 'palavras', tipo: 'tags' }, form);
    } else if (k === 'clientes') {
      novo = $$('[data-clientes] .cliente', form).map(c => ({ nome: $('[data-c-nome]', c).value.trim(), logo: $('input[type=hidden]', c).value || null })).filter(c => c.nome);
    } else {
      novo = {};
      for (const c of campos.filter(x => !x.i18n)) novo[c.nome] = lerCampo(c, form);
      for (const l of IDIOMAS) { novo[l] = {}; for (const c of campos.filter(x => x.i18n)) novo[l][c.nome] = lerCampo(c, form, `${l}__`); }
    }
    const { error } = await sb.from('site_content').upsert({ key: k, value: novo });
    if (error) throw error;
    aviso(tx('salvo'));
    depois();
  });
  d.addEventListener('click', e => {
    const s = e.target.closest('[data-add-servico]');
    if (s) $(`[data-servicos="${s.dataset.addServico}"]`, d).insertAdjacentHTML('beforeend', linhaServico({}));
    if (e.target.closest('[data-add-cliente]')) { $('[data-clientes]', d).insertAdjacentHTML('beforeend', linhaCliente({})); ligarUploads($('[data-clientes]', d).lastElementChild); }
    const r = e.target.closest('[data-remover-linha]');
    if (r) r.parentElement.remove();
  });
}
const linhaServico = s => `<div class="servico"><input data-s-titulo value="${esc(s.titulo)}" aria-label="${rotulo('titulo')}" placeholder="${rotulo('titulo')}"><textarea data-s-texto rows="2" aria-label="${rotulo('texto')}" placeholder="${rotulo('texto')}">${esc(s.texto)}</textarea><button type="button" class="botao icone perigo" data-remover-linha aria-label="${tx('remover')}">✕</button></div>`;
const linhaCliente = c => `<div class="cliente"><input data-c-nome value="${esc(c.nome)}" aria-label="${rotulo('nome')}" placeholder="${rotulo('nome')}">${campo({ nome: 'logo', tipo: 'imagem', pasta: 'clientes', largura: 96 }, c.logo, `cli${Math.random().toString(36).slice(2, 6)}_`)}<button type="button" class="botao icone perigo" data-remover-linha aria-label="${tx('remover')}">✕</button></div>`;

// ---------- início ----------
async function iniciar() {
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
  if (/type=recovery/.test(location.hash)) return telaLogin('senha');
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return telaLogin();
  if (!(await ehAdmin(session.user))) { await sb.auth.signOut(); return telaLogin('entrar', tx('semPermissao')); }
  const { count } = await sb.from('contact_messages').select('id', { count: 'exact', head: true }).eq('lida', false);
  naoLidas = count || 0;
  if (!location.hash.startsWith('#/')) location.hash = '#/painel';
  rotear();
}
sb.auth.onAuthStateChange(evento => { if (evento === 'PASSWORD_RECOVERY') telaLogin('senha'); });
addEventListener('hashchange', () => { if (location.hash.startsWith('#/')) rotear(); });
iniciar();
