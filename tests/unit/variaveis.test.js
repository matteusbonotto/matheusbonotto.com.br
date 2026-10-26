import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { idadeEm, prepararIdioma, variaveis } from '../../src/lib/dados.js';
import { assinatura, PAGINAS } from '../../src/render/documento.js';
import { tradutor } from '../../src/i18n/ui.js';

const bruto = JSON.parse(fs.readFileSync(new URL('../fixtures/dados.json', import.meta.url), 'utf8'));

describe('números calculados pela data', () => {
  it('idade vira só no dia do aniversário', () => {
    expect(idadeEm('1997-11-26', new Date(2026, 10, 25))).toBe(28);
    expect(idadeEm('1997-11-26', new Date(2026, 10, 26))).toBe(29);
  });

  it('troca {anos} e {idade} nos textos do site e nunca deixa a variável crua', () => {
    const d = { ...bruto, site: { ...bruto.site, teste: { pt: { a: 'QA há {anos} anos, {idade} de idade' } } } };
    const p = prepararIdioma(d, 'pt');
    const v = variaveis(d);
    expect(p.site.teste.pt.a).toBe(`QA há ${v.anos} anos, ${v.idade} de idade`);
    for (const lang of ['pt', 'en', 'es']) expect(JSON.stringify(prepararIdioma(bruto, lang).site)).not.toMatch(/\{(anos|idade)\}/);
  });

  it('a assinatura muda quando os anos mudam, para a página se redesenhar', () => {
    const exp = bruto.experiencias.map(e => ({ ...e, data_inicio: e.categoria_profissional === 'QA' ? '2000-01-01' : e.data_inicio }));
    expect(assinatura({ ...bruto, experiencias: exp })).not.toBe(assinatura(bruto));
  });
});

describe('recomendações', () => {
  it('mostra 5 e esconde as demais atrás do "ver mais"', () => {
    const d = prepararIdioma(bruto, 'pt');
    const html = PAGINAS[''].corpo(d, tradutor('pt'));
    const total = d.recomendacoes.length;
    expect((html.match(/data-rec-extra/g) || []).length).toBe(Math.max(0, total - 5));
    if (total > 5) expect(html).toContain('data-ver-mais-recs');
  });
});
