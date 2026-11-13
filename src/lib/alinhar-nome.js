// Alinha as linhas do nome nas duas bordas: o sobrenome e o cargo ganham o espaçamento entre letras
// que faz a largura deles ficar igual à do "Beatriz" em assinatura (primeiro filho do bloco).
const larguraTexto = el => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().width; };

export function alinharNome(bloco) {
  if (!bloco) return () => {};
  const [ref, ...linhas] = bloco.children;
  bloco.style.width = 'fit-content';
  const ajustar = () => {
    const alvo = larguraTexto(ref);
    if (!alvo) return;
    for (const el of linhas) {
      el.style.letterSpacing = '0px';
      el.style.marginRight = '';
      el.style.clipPath = '';
      const n = el.textContent.length;
      if (n < 2) continue;
      // o espaçamento também entra depois da última letra; a margem negativa devolve esse espaço para o texto centralizado não deslocar
      let ls = (alvo - larguraTexto(el)) / (n - 1);
      el.style.letterSpacing = `${ls}px`;
      // segunda passada: o navegador arredonda o espaçamento, então corrige pelo que realmente ficou
      ls += (alvo - (larguraTexto(el) - ls)) / (n - 1);
      el.style.letterSpacing = `${ls}px`;
      el.style.marginRight = `${-ls}px`;
      el.style.clipPath = `inset(-1em ${Math.max(ls, 0)}px -1em 0)`; // corta só a sobra invisível (e a borda) depois da última letra
    }
  };
  document.fonts?.ready.then(ajustar);
  ajustar();
  addEventListener('resize', ajustar);
  return () => removeEventListener('resize', ajustar);
}
