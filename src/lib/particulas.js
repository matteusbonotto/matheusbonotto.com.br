// Rede de partículas em canvas: pontos à deriva ligados por linhas quando próximos; o mouse atrai a rede.
// Leve de propósito: densidade pela área, 30 a 90 pontos, pausa fora da tela e com movimento reduzido fica estática.
export function particulas(canvas, { semMovimento = false } = {}) {
  const g = canvas.getContext('2d');
  const escuro = canvas.dataset.particulas === 'escuro';
  const lerCor = () => (escuro ? '255,255,255' : getComputedStyle(document.documentElement).getPropertyValue('--particula').trim() || '14,14,16');
  let cor = lerCor();
  const lerAcento = () => getComputedStyle(document.documentElement).getPropertyValue('--acento-rgb').trim() || '14,124,123';
  let acento = lerAcento();
  addEventListener('tema', () => { cor = lerCor(); acento = lerAcento(); desenhar(); });
  let w = 0, h = 0, dpr = 1, pts = [], visivel = false, raf = 0;
  const mouse = { x: -1e4, y: -1e4 };

  function medir() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const n = Math.max(30, Math.min(90, Math.round((w * h) / 16000)));
    pts = Array.from({ length: n }, (_, i) => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: Math.random() * 1.4 + 0.6, a: i % 9 === 0 }));
    desenhar();
  }

  function desenhar() {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const D = 120;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy;
        if (d2 < D * D) { g.strokeStyle = `rgba(${cor},${(1 - Math.sqrt(d2) / D) * (escuro ? 0.18 : 0.09)})`; g.lineWidth = 0.7; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke(); }
      }
      const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
      if (dm < 160) { g.strokeStyle = `rgba(${acento},${(1 - dm / 160) * 0.5})`; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(mouse.x, mouse.y); g.stroke(); }
      g.fillStyle = p.a ? `rgba(${acento},.7)` : `rgba(${cor},${escuro ? 0.55 : 0.28})`;
      g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill();
    }
  }

  function passo() {
    for (const p of pts) {
      const dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy);
      if (d < 160 && d > 1) { p.vx += (dx / d) * 0.012; p.vy += (dy / d) * 0.012; }
      p.vx *= 0.985; p.vy *= 0.985;
      if (Math.hypot(p.vx, p.vy) < 0.08) { p.vx += (Math.random() - 0.5) * 0.04; p.vy += (Math.random() - 0.5) * 0.04; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    }
    desenhar();
    if (visivel) raf = requestAnimationFrame(passo);
  }

  const io = new IntersectionObserver(([en]) => {
    visivel = en.isIntersecting;
    cancelAnimationFrame(raf);
    if (visivel && !semMovimento) raf = requestAnimationFrame(passo);
  });
  // durante a rolagem a rede congela: redesenhar o canvas de tela cheia a cada quadro disputa com a rolagem
  let retomar = 0;
  const aoRolar = () => {
    cancelAnimationFrame(raf); clearTimeout(retomar);
    retomar = setTimeout(() => { cancelAnimationFrame(raf); if (visivel && !semMovimento) raf = requestAnimationFrame(passo); }, 200);
  };
  addEventListener('scroll', aoRolar, { passive: true });
  const mover = e => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
  const sair = () => { mouse.x = mouse.y = -1e4; };
  const alvo = canvas.dataset.particulas === 'fundo' ? window : canvas.parentElement;
  alvo.addEventListener('pointermove', mover, { passive: true });
  alvo.addEventListener('pointerleave', sair);
  const ro = new ResizeObserver(medir);
  ro.observe(canvas);
  io.observe(canvas);
  return () => { io.disconnect(); ro.disconnect(); cancelAnimationFrame(raf); clearTimeout(retomar); removeEventListener('scroll', aoRolar); alvo.removeEventListener('pointermove', mover); alvo.removeEventListener('pointerleave', sair); };
}
