// Reescreve as descrições curtas que estavam genéricas demais (pt, en, es). Uso: node scripts/textos-projetos.mjs
import { adminClient } from './supabase-admin.mjs';

const TEXTOS = {
  'mb-copiloto-jira': [
    'Barra lateral para o Jira Cloud que mostra os seus cards e os do time, edita status em massa e importa tarefas por CSV, sem sair da tela.',
    'Jira Cloud sidebar that shows your cards and your team\'s, bulk-edits status and imports tasks from CSV without leaving the page.',
    'Barra lateral para Jira Cloud que muestra tus tarjetas y las del equipo, edita estados en masa e importa tareas por CSV sin salir de la pantalla.'],
  'qa-cnk-issue-generator': [
    'Formulário que padroniza bugs e incidentes do projeto Cinemark: ambiente, passos, evidências e regra de negócio no mesmo formato para QA, PO e devs.',
    'Form that standardizes bugs and incidents for the Cinemark project: environment, steps, evidence and business rule in one format for QA, PO and devs.',
    'Formulario que estandariza bugs e incidentes del proyecto Cinemark: entorno, pasos, evidencias y regla de negocio en un mismo formato para QA, PO y devs.'],
  'simulador-ctfl': [
    'Simulado do exame ISTQB CTFL 4.0 com cronômetro, questões por nível cognitivo, gabarito comentado e histórico de tentativas.',
    'ISTQB CTFL 4.0 mock exam with a timer, questions by cognitive level, answer key and attempt history.',
    'Simulacro del examen ISTQB CTFL 4.0 con cronómetro, preguntas por nivel cognitivo, respuestas comentadas e historial de intentos.'],
  'playwright-automation': [
    'Suíte end-to-end com Playwright que automatiza as validações repetidas da regressão e deixa cada ciclo de teste mais rápido e confiável.',
    'Playwright end-to-end suite that automates repetitive regression checks, making every test cycle faster and more reliable.',
    'Suite end-to-end con Playwright que automatiza las validaciones repetidas de la regresión y hace cada ciclo de prueba más rápido y confiable.'],
  squidev: [
    'Site da Squidev, minha marca de soluções digitais: serviços, forma de trabalho e formulário de contato, leve e responsivo.',
    'Website for Squidev, my digital solutions brand: services, how we work and a contact form, light and responsive.',
    'Sitio de Squidev, mi marca de soluciones digitales: servicios, forma de trabajo y formulario de contacto, liviano y responsivo.'],
  achadubom: [
    'Vitrine de achadinhos com busca, filtros por categoria e produtos em alta, pensada para quem compra pelo celular.',
    'Deals showcase with search, category filters and trending products, built for people who shop on their phones.',
    'Vitrina de ofertas con búsqueda, filtros por categoría y productos en tendencia, pensada para quien compra desde el móvil.'],
  'importaccount-trinus': [
    'Automação em Python que trata e importa contas em lote na Trinus, trocando digitação manual por uma rotina validada.',
    'Python automation that cleans and bulk-imports accounts at Trinus, replacing manual data entry with a validated routine.',
    'Automatización en Python que trata e importa cuentas en lote en Trinus, cambiando la digitación manual por una rutina validada.'],
  'fofuxa-fashion': [
    'Cartão digital da loja Fofuxa Moda Plus Size: vendedoras, redes sociais, WhatsApp e mapa da loja a um toque.',
    'Digital business card for the Fofuxa plus-size fashion store: sales staff, social media, WhatsApp and store map in one tap.',
    'Tarjeta digital de la tienda Fofuxa Moda Plus Size: vendedoras, redes sociales, WhatsApp y mapa de la tienda en un toque.'],
  'rodolfo-seifert': [
    'Cartão digital de um escritório de advocacia, com WhatsApp, e-mail, redes e endereço a um toque para o cliente.',
    'Digital business card for a law office, with WhatsApp, e-mail, social links and address one tap away for clients.',
    'Tarjeta digital de un estudio jurídico, con WhatsApp, e-mail, redes y dirección a un toque para el cliente.'],
  'taskassistant-americanas': [
    'Formulário que gera tarefas de QA no padrão do time da Americanas, com passos e resultados esperados prontos para colar.',
    'Form that generates QA tasks in the Americanas team format, with steps and expected results ready to paste.',
    'Formulario que genera tareas de QA en el formato del equipo de Americanas, con pasos y resultados esperados listos para pegar.'],
  'importproducts-americanas': [
    'Automação em Python que prepara e valida planilhas de importação de produtos, reduzindo erros de cadastro.',
    'Python automation that prepares and validates product import spreadsheets, cutting catalog errors.',
    'Automatización en Python que prepara y valida planillas de importación de productos, reduciendo errores de registro.'],
  'paraiso-bio': [
    'Portal do condomínio Nosso Paraíso Bio com avisos, contatos úteis, delivery do bairro e endereços em um só lugar.',
    'Portal for the Nosso Paraíso Bio residential community with notices, useful contacts, local delivery and addresses in one place.',
    'Portal del condominio Nosso Paraíso Bio con avisos, contactos útiles, delivery del barrio y direcciones en un solo lugar.'],
  'dashboard-produtos': [
    'Painel em Power BI que mostra o desempenho de cada produto e categoria em indicadores fáceis de ler.',
    'Power BI dashboard showing the performance of each product and category in easy-to-read indicators.',
    'Panel en Power BI que muestra el desempeño de cada producto y categoría en indicadores fáciles de leer.'],
  'dashboard-perfil': [
    'Painel em Power BI sobre o perfil do público: faixa etária, região e interesses em gráficos e mapa.',
    'Power BI dashboard on audience profile: age range, region and interests in charts and a map.',
    'Panel en Power BI sobre el perfil del público: rango de edad, región e intereses en gráficos y mapa.'],
  'dashboard-sac': [
    'Painel em Power BI de atendimento ao cliente: volume de chamados, motivos e distribuição por região.',
    'Power BI customer service dashboard: ticket volume, reasons and distribution by region.',
    'Panel en Power BI de atención al cliente: volumen de llamados, motivos y distribución por región.'],
  'dashboard-vendas': [
    'Painel em Power BI de vendas: receita, pedidos, ranking de produtos e resultado por região e representante.',
    'Power BI sales dashboard: revenue, orders, product ranking and results by region and sales rep.',
    'Panel en Power BI de ventas: ingresos, pedidos, ranking de productos y resultados por región y representante.'],
  'kabum-challenge': [
    'Desafio técnico da KaBuM: fluxos de e-commerce automatizados com Robot Framework e Python, em palavras-chave reutilizáveis.',
    'KaBuM technical challenge: e-commerce flows automated with Robot Framework and Python using reusable keywords.',
    'Desafío técnico de KaBuM: flujos de e-commerce automatizados con Robot Framework y Python, en palabras clave reutilizables.'],
};

const sb = await adminClient();
for (const [slug, [pt, en, es]] of Object.entries(TEXTOS)) {
  const { data: p } = await sb.from('projects').select('id,i18n').eq('slug', slug).maybeSingle();
  if (!p) { console.log('sem', slug); continue; }
  const i18n = p.i18n || {};
  i18n.en = { ...(i18n.en || {}), descricao_curta: en };
  i18n.es = { ...(i18n.es || {}), descricao_curta: es };
  const { error } = await sb.from('projects').update({ descricao_curta: pt, i18n }).eq('id', p.id);
  if (error) throw error;
}
console.log('ok', Object.keys(TEXTOS).length);
