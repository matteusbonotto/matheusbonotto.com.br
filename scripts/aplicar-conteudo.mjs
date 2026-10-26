// Aplica scripts/conteudo/*.json no banco: chaves "en"/"es" vão para a coluna i18n,
// "pt" sobrescreve as colunas originais e as demais chaves são colunas diretas.
import fs from 'node:fs';
import { adminClient } from './supabase-admin.mjs';

const sb = await adminClient();
const ler = f => JSON.parse(fs.readFileSync(new URL(`./conteudo/${f}`, import.meta.url), 'utf8'));

async function aplicar(tabela, mapa) {
  const { data, error } = await sb.from(tabela).select('id, i18n');
  if (error) throw error;
  for (const [prefixo, item] of Object.entries(mapa)) {
    const linha = data.find(l => l.id.startsWith(prefixo));
    if (!linha) { console.warn(`sem linha ${tabela} ${prefixo}`); continue; }
    const { pt, en, es, ...diretas } = item;
    const i18n = { ...linha.i18n };
    if (en) i18n.en = { ...i18n.en, ...en };
    if (es) i18n.es = { ...i18n.es, ...es };
    const { error: e } = await sb.from(tabela).update({ ...diretas, ...pt, i18n }).eq('id', linha.id);
    if (e) throw new Error(`${tabela} ${prefixo}: ${e.message}`);
  }
  console.log(`ok ${tabela} (${Object.keys(mapa).length})`);
}

await aplicar('projects', ler('projetos.json'));
for (const arq of ['trajetoria.json', 'conquistas.json']) for (const [tabela, mapa] of Object.entries(ler(arq))) await aplicar(tabela, mapa);
await aplicar('feedbacks', ler('recomendacoes.json'));

const site = ler('site.json');
const { error: eSite } = await sb.from('site_content').upsert(
  Object.entries(site).map(([key, value]) => ({ key, value })), { onConflict: 'key', ignoreDuplicates: true });
if (eSite) throw eSite;
console.log('ok site_content (só chaves novas; não sobrescreve o que foi editado no admin)');

// QA Toolbar: produto publicado na Chrome Web Store, faltava no portfólio
const { data: existe } = await sb.from('projects').select('id').eq('slug', 'qa-toolbar').maybeSingle();
if (!existe) {
  const { error } = await sb.from('projects').insert({
    slug: 'qa-toolbar', destaque: true, ativo: true, ordem: 1, categoria: 'qa',
    titulo: 'QA Toolbar Sandbox',
    papel: 'Fundador: produto, extensão, landing, painel e backend',
    descricao_curta: 'Extensão do Chrome publicada na Web Store que reúne o kit de produtividade do QA: ambientes, contas de teste, macros e preenchimento de formulários.',
    descricao_completa: 'O QA Toolbar começou como um userscript do Tampermonkey que eu usava no dia a dia e virou um produto: uma extensão Chrome (Manifest V3) publicada na Chrome Web Store, com landing page, checkout e painel administrativo.\n\nA barra reconhece o ambiente em que o QA está (dev, homologação, produção) e organiza clientes, projetos, ambientes, contas de teste e macros. O kit de produtividade inclui contador de caracteres, multiclique, Input Lab, preenchimento com dados falsos (Faker Fill), gravador de macros (Macro Studio) e visualizador de teclas: cada recurso liberado conforme o plano.\n\nO backend em Supabase cuida de cobrança, licenças, vouchers e feature flags, com Edge Functions e políticas de acesso. Publicação automatizada via GitHub Actions e notas de versão em português, inglês e espanhol.',
    funcionalidades: ['Toolbar sensível ao ambiente (dev, homologação, produção)', 'Cadastro de clientes, projetos, ambientes e contas de teste', 'Macro Studio: gravação e reprodução de fluxos', 'Faker Fill e Input Lab para preencher e estressar formulários', 'Planos com recursos liberados por assinatura', 'Painel do fundador com licenças, vouchers e MRR'],
    conquistas: ['Publicada e mantida na Chrome Web Store', 'Pipeline de publicação automatizado com GitHub Actions', 'Produto completo: extensão, landing, checkout, painel e backend'],
    tecnologias: ['Chrome Extension (MV3)', 'JavaScript', 'Supabase', 'Edge Functions', 'GitHub Actions'],
    link_projeto: 'https://qatoolbarsandbox.web.app',
    i18n: {
      en: { titulo: 'QA Toolbar Sandbox', papel: 'Founder: product, extension, landing page, admin and backend',
        descricao_curta: 'Chrome extension published on the Web Store bundling a QA productivity kit: environments, test accounts, macros and form filling.',
        descricao_completa: 'QA Toolbar started as a Tampermonkey userscript I used every day and became a product: a Chrome extension (Manifest V3) published on the Chrome Web Store, with a landing page, checkout and admin panel.\n\nThe toolbar recognizes which environment the QA is in (dev, staging, production) and organizes clients, projects, environments, test accounts and macros. The productivity kit includes a character counter, multiclick, Input Lab, fake-data form filling (Faker Fill), a macro recorder (Macro Studio) and a key viewer · each feature unlocked per plan.\n\nThe Supabase backend handles billing, licenses, vouchers and feature flags with Edge Functions and access policies. Publishing is automated through GitHub Actions, with release notes in Portuguese, English and Spanish.',
        funcionalidades: ['Environment-aware toolbar (dev, staging, production)', 'Clients, projects, environments and test accounts', 'Macro Studio: record and replay flows', 'Faker Fill and Input Lab to fill and stress forms', 'Plans with features unlocked by subscription', 'Founder dashboard with licenses, vouchers and MRR'],
        conquistas: ['Published and maintained on the Chrome Web Store', 'Automated publishing pipeline with GitHub Actions', 'End-to-end product: extension, landing, checkout, admin and backend'] },
      es: { titulo: 'QA Toolbar Sandbox', papel: 'Fundador: producto, extensión, landing, panel y backend',
        descricao_curta: 'Extensión de Chrome publicada en la Web Store que reúne el kit de productividad del QA: ambientes, cuentas de prueba, macros y llenado de formularios.',
        descricao_completa: 'QA Toolbar empezó como un userscript de Tampermonkey que yo usaba a diario y se convirtió en producto: una extensión de Chrome (Manifest V3) publicada en la Chrome Web Store, con landing page, checkout y panel administrativo.\n\nLa barra reconoce el ambiente en el que está el QA (dev, homologación, producción) y organiza clientes, proyectos, ambientes, cuentas de prueba y macros. El kit incluye contador de caracteres, multiclic, Input Lab, llenado con datos falsos (Faker Fill), grabador de macros (Macro Studio) y visor de teclas · cada recurso habilitado según el plan.\n\nEl backend en Supabase gestiona cobros, licencias, vouchers y feature flags con Edge Functions y políticas de acceso. La publicación está automatizada con GitHub Actions y las notas de versión están en portugués, inglés y español.',
        funcionalidades: ['Barra sensible al ambiente (dev, homologación, producción)', 'Clientes, proyectos, ambientes y cuentas de prueba', 'Macro Studio: grabar y reproducir flujos', 'Faker Fill e Input Lab para llenar y estresar formularios', 'Planes con recursos habilitados por suscripción', 'Panel del fundador con licencias, vouchers y MRR'],
        conquistas: ['Publicada y mantenida en la Chrome Web Store', 'Pipeline de publicación automatizado con GitHub Actions', 'Producto completo: extensión, landing, checkout, panel y backend'] },
    },
  });
  if (error) throw error;
  console.log('ok QA Toolbar inserido');
}
