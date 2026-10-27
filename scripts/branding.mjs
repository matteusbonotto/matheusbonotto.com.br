// Cadastra as identidades visuais de assets/Branding: slides do manual em WebP e o PDF no Storage.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { adminClient, SUPABASE_URL } from './supabase-admin.mjs';
const RAIZ = 'assets/Branding';
const NOMES = { 'Nosso-Paraiso-Bio': 'Nosso Paraíso Bio', 'QA-Toolbar-Sandbox': 'QA Toolbar Sandbox', 'Mundo-Tech-Informatica': 'Mundo Tech Informática', 'Monumentos-Marmores': 'Monumentos Mármores' };
const sb = await adminClient();
const publica = c => `${SUPABASE_URL}/storage/v1/object/public/media/${c}`;
const subir = async (caminho, buf, contentType) => {
  const { error } = await sb.storage.from('media').upload(caminho, buf, { contentType, upsert: true });
  if (error) throw new Error(`${caminho}: ${error.message}`);
  return publica(caminho);
};
for (const [i, pasta] of fs.readdirSync(RAIZ).sort().entries()) {
  const base = pasta.replace(/^\d+-/, '');
  const titulo = NOMES[base] || base.replace(/-/g, ' ');
  const slug = `marca-${base.toLowerCase()}`;
  const dir = path.join(RAIZ, pasta, 'slides');
  const galeria = [];
  for (const arq of fs.readdirSync(dir).sort()) {
    const buf = await sharp(fs.readFileSync(path.join(dir, arq))).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    galeria.push({ url: await subir(`branding/${slug}/${arq.replace(/\.png$/, '.webp')}`, buf, 'image/webp'), dispositivo: 'desktop' });
  }
  const pdf = fs.readdirSync(path.join(RAIZ, pasta)).find(a => a.endsWith('.pdf'));
  const manual = pdf ? await subir(`branding/${slug}/manual-de-marca.pdf`, fs.readFileSync(path.join(RAIZ, pasta, pdf)), 'application/pdf') : null;
  const linha = {
    slug, titulo, categoria: 'design', categorias: ['design'], ativo: true, destaque: false, ordem: 300 + i,
    papel: 'Designer: logotipo e identidade visual',
    descricao_curta: `Identidade visual de ${titulo}: logotipo, variações, paleta, tipografia e aplicações.`,
    descricao_completa: `Criei o logotipo e o manual de marca de ${titulo}. O manual explica o conceito do símbolo, as variações de cor (colorida, monocromática, em relevo), a paleta com a psicologia das cores, a tipografia, as regras de uso e exemplos de aplicação.`,
    funcionalidades: ['Conceito e construção do logotipo', 'Variações de cor e versão em relevo', 'Paleta e psicologia das cores', 'Tipografia', 'Regras de uso', 'Aplicações da marca'],
    conquistas: [], tecnologias: ['Branding', 'Logotipo', 'Manual de marca'],
    link_projeto: manual, imagem_url: galeria[0].url, galeria,
    i18n: {
      en: { papel: 'Designer: logo and visual identity', descricao_curta: `Visual identity for ${titulo}: logo, variations, palette, typography and applications.`,
        descricao_completa: `I designed the logo and brand guidelines for ${titulo}. The guide covers the symbol concept, color variations (full color, monochrome, embossed), the palette and its color psychology, typography, usage rules and application examples.`,
        funcionalidades: ['Logo concept and construction', 'Color variations and embossed version', 'Palette and color psychology', 'Typography', 'Usage rules', 'Brand applications'], conquistas: [] },
      es: { papel: 'Diseñador: logotipo e identidad visual', descricao_curta: `Identidad visual de ${titulo}: logotipo, variaciones, paleta, tipografía y aplicaciones.`,
        descricao_completa: `Creé el logotipo y el manual de marca de ${titulo}. El manual explica el concepto del símbolo, las variaciones de color (a color, monocromática, en relieve), la paleta con la psicología de los colores, la tipografía, las reglas de uso y ejemplos de aplicación.`,
        funcionalidades: ['Concepto y construcción del logotipo', 'Variaciones de color y versión en relieve', 'Paleta y psicología de los colores', 'Tipografía', 'Reglas de uso', 'Aplicaciones de la marca'], conquistas: [] },
    },
  };
  const { data: existe } = await sb.from('projects').select('id').eq('slug', slug).maybeSingle();
  const r = existe ? await sb.from('projects').update(linha).eq('id', existe.id) : await sb.from('projects').insert(linha);
  if (r.error) throw r.error;
  console.log('ok', slug, galeria.length, manual ? 'pdf' : '');
}
