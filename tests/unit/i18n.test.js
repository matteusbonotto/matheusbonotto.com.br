import { describe, expect, it } from 'vitest';
import { TEXTOS } from '../../src/admin/textos.js';
import { tradutor, UI } from '../../src/i18n/ui.js';

const chaves = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? chaves(v, `${p}${k}.`) : [`${p}${k}`]));

describe('traduções do site', () => {
  for (const lang of ['en', 'es']) {
    it(`${lang} tem exatamente as mesmas chaves que pt`, () => {
      expect(Object.keys(UI[lang]).sort()).toEqual(Object.keys(UI.pt).sort());
    });
    it(`${lang} não tem texto vazio nem igual a um placeholder`, () => {
      for (const [k, v] of Object.entries(UI[lang])) {
        expect(v, k).toBeTruthy();
        if (Array.isArray(v)) expect(v.length, k).toBe(UI.pt[k].length);
      }
    });
  }
  it('tradutor falha alto para chave inexistente (texto novo sem tradução quebra o build)', () => {
    expect(() => tradutor('pt')('chave.que.nao.existe')).toThrow(/sem tradução/);
  });
  it('interpola variáveis', () => {
    expect(tradutor('en')('projetos.qtd', { n: 3 })).toBe('3 projects');
  });
});

describe('traduções do admin', () => {
  for (const lang of ['en', 'es']) {
    it(`${lang} tem as mesmas chaves que pt (inclusive rótulos de campos)`, () => {
      expect(chaves(TEXTOS[lang]).sort()).toEqual(chaves(TEXTOS.pt).sort());
    });
  }
});
