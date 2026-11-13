// Tamanho do texto escolhido pelo visitante (A− / A+). Escala a fonte da raiz, então tudo que usa rem acompanha,
// inclusive o modo apresentação. A escolha fica salva no navegador.
const CHAVE = 'fonte-escala';
const PASSOS = [0.85, 0.92, 1, 1.1, 1.2, 1.32];
const PADRAO = 2;
const raiz = document.documentElement;

let nivel = PADRAO;
try { const s = localStorage.getItem(CHAVE); const v = s === null ? NaN : +s; if (Number.isInteger(v) && PASSOS[v]) nivel = v; } catch {}

// a base muda com o tamanho da tela (o CSS usa outra base no celular), então mede de novo antes de escalar
function aplicar() {
  raiz.style.fontSize = '';
  if (nivel === PADRAO) return;
  const base = parseFloat(getComputedStyle(raiz).fontSize) || 16;
  raiz.style.fontSize = `${base * PASSOS[nivel]}px`;
}

export function mudarFonte(passo) {
  nivel = Math.max(0, Math.min(PASSOS.length - 1, nivel + passo));
  try { localStorage.setItem(CHAVE, String(nivel)); } catch {}
  aplicar();
  document.querySelectorAll('[data-fonte]').forEach(b => { b.disabled = (+b.dataset.fonte < 0 && nivel === 0) || (+b.dataset.fonte > 0 && nivel === PASSOS.length - 1); });
  dispatchEvent(new Event('resize')); // reposiciona o que mede o texto (nome alinhado, animações)
}

export function iniciarFonte() {
  aplicar();
  addEventListener('resize', () => { if (nivel !== PADRAO) aplicar(); });
  document.addEventListener('click', e => { const b = e.target.closest('[data-fonte]'); if (b) mudarFonte(+b.dataset.fonte); });
  mudarFonte(0);
}
