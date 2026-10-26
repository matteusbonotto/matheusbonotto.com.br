// Estrutura comum a todas as páginas: navegação, rodapé e o documento HTML.
import { SITE } from '../config.js';
import { rota, tradutor } from '../i18n/ui.js';
import { head, icone } from './comum.js';

export const PAGINAS_NAV = [['sobre', 'nav.sobre'], ['projetos', 'nav.projetos'], ['trajetoria', 'nav.trajetoria'], ['competencias', 'nav.competencias'], ['contato', 'nav.contato']];

export function navegacao(lang, t, pagina) {
  const idiomas = SITE.idiomas.map(l => `<a href="${rota(l, pagina)}" hreflang="${l}" lang="${l}" ${l === lang ? 'aria-current="true"' : ''}>${l.toUpperCase()}</a>`).join('');
  return `<a class="pular" href="#conteudo">${t('nav.pular')}</a>
<header class="nav" data-nav>
  <a class="nav-marca" href="${rota(lang)}" aria-label="${t('nav.inicio')} · ${SITE.nome}">
    <img src="/media/logo-64.webp" srcset="/media/logo-128.webp 2x" alt="${t('nav.logo')}" width="34" height="34"><span>${SITE.nome}</span>
  </a>
  <nav class="nav-links" aria-label="${t('nav.menu')}" id="menu-principal">
    <a href="${rota(lang)}" class="nav-so-menu" ${pagina === '' ? 'aria-current="page"' : ''}>${t('nav.inicio')}</a>
    ${PAGINAS_NAV.map(([id, k]) => `<a href="${rota(lang, id)}" ${pagina === id ? 'aria-current="page"' : ''}>${t(k)}</a>`).join('')}
    <a href="${rota(lang, 'cv')}" class="nav-cv">${icone('download')}${t('nav.cv')}</a>
    <div class="nav-idiomas" role="group" aria-label="${t('nav.idioma')}">${idiomas}</div>
  </nav>
  <button class="tema-botao" type="button" data-tema aria-label="${t('nav.tema')}" title="${t('nav.tema')}">${icone('sol')}${icone('lua')}</button>
  <a class="btn btn-acento nav-cta" href="${rota(lang, 'contato')}" data-magnetico>${t('nav.cta')}</a>
  <button class="nav-botao" type="button" aria-expanded="false" aria-controls="menu-principal" data-menu aria-label="${t('nav.menu')}" data-rotulo-abrir="${t('nav.menu')}" data-rotulo-fechar="${t('nav.fechar')}">${icone('menu')}</button>
</header>`;
}

export function rodape(lang, t) {
  return `<footer class="rodape">
  <div class="container rodape-grade">
    <div class="rodape-marca"><img src="/media/logo-64.webp" alt="" width="40" height="40" loading="lazy"><div><strong>${SITE.nome}</strong><p class="mono">QA Engineer · Campinas, BR</p></div></div>
    <nav class="rodape-links" aria-label="${t('nav.menu')}">
      <a href="${rota(lang)}">${t('nav.inicio')}</a>
      ${PAGINAS_NAV.map(([id, k]) => `<a href="${rota(lang, id)}">${t(k)}</a>`).join('')}
      <a href="${rota(lang, 'cv')}">${t('nav.cv')}</a>
    </nav>
  </div>
  <div class="container rodape-base">
    <p>© 2021 - ${new Date().getFullYear()} ${SITE.nome}. ${t('rodape.direitos')}</p>
    <p class="mono">${t('rodape.feito')}</p>
    <a href="#conteudo" class="rodape-topo" aria-label="${t('rodape.topo')}">${icone('cima')}<span>${t('rodape.topo')}</span></a>
  </div>
</footer>`;
}

// Canvas de partículas (rede de pontos ligada por linhas); o JS desenha e pausa fora da tela.
export const particulas = (tom = 'escuro') => `<canvas class="particulas particulas-${tom}" data-particulas="${tom}" aria-hidden="true"></canvas>`;

export function documento({ lang, pagina, titulo, descricao, jsonld, corpo, dadosJson, assinaturaDados, preload = '' }) {
  const t = tradutor(lang);
  return `<!doctype html>
<html lang="${t('meta.lang')}" data-lang="${lang}">
<head>
${head({ lang, t, titulo, descricao, pagina, jsonld, extra: preload })}
<script>document.documentElement.classList.add('js')</script>
</head>
<body data-pagina="${pagina || 'inicio'}">
<canvas class="particulas-fundo" data-particulas="fundo" aria-hidden="true"></canvas>
${navegacao(lang, t, pagina)}
<main id="conteudo" data-main data-assinatura="${assinaturaDados}">
${corpo}
</main>
${rodape(lang, t)}
<dialog class="modal" data-modal data-lenis-prevent aria-labelledby="modal-titulo"><div class="modal-caixa" data-modal-conteudo></div></dialog>
<div class="cursor" data-cursor aria-hidden="true"></div>
<script type="application/json" id="dados">${JSON.stringify(dadosJson).replace(/</g, '\\u003c')}</script>
<script type="module" src="/src/main.js"></script>
</body>
</html>`;
}
