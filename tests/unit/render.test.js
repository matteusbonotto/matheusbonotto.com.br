import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONTEUDO, SECOES } from '../../src/admin/esquema.js';
import { TEXTOS } from '../../src/admin/textos.js';
import { anosEmQA, localizar, prepararIdioma, textoSite } from '../../src/lib/dados.js';
import { tradutor } from '../../src/i18n/ui.js';
import { assinatura, PAGINAS, paginaCV, paginaHTML } from '../../src/render/documento.js';
import { formatarValor, graficoCarreira } from '../../src/render/paginas.js';

const bruto = JSON.parse(fs.readFileSync(new URL('../fixtures/dados.json', import.meta.url), 'utf8'));

describe('dados', () => {
  it('localizar usa a tradução e cai para o PT quando falta', () => {
    const l = { titulo: 'Olá', descricao: 'PT', i18n: { en: { titulo: 'Hello', descricao: '' } } };
    expect(localizar(l, 'en')).toMatchObject({ titulo: 'Hello', descricao: 'PT', _traduzido: true });
    expect(localizar(l, 'pt')).toBe(l);
    expect(localizar(l, 'es')).toBe(l);
  });
  it('textoSite mescla campos comuns com o idioma', () => {
    const site = { valor_hora: { brl: 100, visivel: true, pt: { nota: 'n' }, en: { nota: 'note' } } };
    expect(textoSite(site, 'valor_hora', 'en')).toEqual({ brl: 100, visivel: true, nota: 'note' });
    expect(textoSite(site, 'valor_hora', 'es')).toEqual({ brl: 100, visivel: true, nota: 'n' });
  });
  it('anos em QA contam desde o primeiro cargo de QA', () => {
    expect(anosEmQA([{ categoria_profissional: 'QA', data_inicio: '2020-08-01' }, { categoria_profissional: 'DEV', data_inicio: '2016-01-01' }], new Date('2026-10-26'))).toBe(6);
  });
  it('valor por hora formatado na moeda e idioma certos', () => {
    expect(formatarValor(150, 'BRL', 'pt')).toMatch(/R\$\s?150/);
    expect(formatarValor(30, 'USD', 'en')).toBe('$30');
    expect(formatarValor(28, 'EUR', 'es')).toMatch(/28\s?€/);
    expect(formatarValor(null, 'USD', 'en')).toBeNull();
  });
  it('assinatura muda quando o conteúdo muda', () => {
    expect(assinatura({ a: 1 })).toBe(assinatura({ a: 1 }));
    expect(assinatura({ a: 1 })).not.toBe(assinatura({ a: 2 }));
  });
});

describe('páginas geradas', () => {
  for (const lang of ['pt', 'en', 'es']) {
    const d = prepararIdioma(bruto, lang);
    for (const pagina of Object.keys(PAGINAS)) {
      it(`${lang} /${pagina}: HTML válido, SEO completo e sem lixo`, () => {
        const html = paginaHTML(pagina, d, bruto);
        expect(html).not.toMatch(/undefined|\[object Object\]|NaN/);
        expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
        expect(html).toMatch(/<meta name="description" content="[^"]{60,}">/);
        expect(html).toMatch(/<link rel="canonical" href="https:\/\/matheusbonotto\.com\.br\//);
        expect(html.match(/hreflang=/g).length).toBeGreaterThanOrEqual(4);
        for (const p of ['og:title', 'og:description', 'og:image', 'og:url', 'og:locale']) expect(html).toContain(`property="${p}"`);
        expect(html).toContain('name="twitter:card"');
        const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
        expect(ld['@graph'][0]).toMatchObject({ '@type': 'Person', name: 'Matheus Bonotto', jobTitle: 'QA Engineer' });
      });
    }
    it(`${lang} currículo sem foto e com conteúdo`, () => {
      const html = paginaCV(d, bruto);
      expect(html).not.toMatch(/undefined|\[object Object\]/);
      expect(html.split('<main')[1]).not.toMatch(/<img[^>]+perfil/); // sem foto no documento
      expect(html.match(/class="cv-atomo/g).length).toBeGreaterThan(20);
    });
  }
  it('o gráfico da carreira tem uma barra por experiência e formação', () => {
    const d = prepararIdioma(bruto, 'pt');
    const svg = graficoCarreira(d, tradutor('pt'));
    expect(svg.match(/class="crono-barra /g)).toHaveLength(d.experiencias.length + d.formacoes.length);
  });
});

describe('esquema do admin', () => {
  it('todo campo e bloco tem rótulo nos três idiomas', () => {
    const nomes = new Set([...Object.values(SECOES).flatMap(s => s.campos.map(c => c.nome)), ...Object.values(CONTEUDO).flat().map(c => c.nome)]);
    for (const l of ['pt', 'en', 'es']) {
      for (const n of nomes) expect(TEXTOS[l].f[n], `${l}.${n}`).toBeTruthy();
      for (const k of Object.keys(SECOES)) expect(TEXTOS[l][k], `${l}.${k}`).toBeTruthy();
      for (const k of Object.keys(CONTEUDO)) expect(TEXTOS[l].c[k], `${l}.c.${k}`).toBeTruthy();
    }
  });
});
