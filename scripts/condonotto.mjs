// Cadastra o Condonotto (SaaS de condomínios) com prints de desktop e celular e o inclui no patrocínio.
import fs from 'node:fs';
import sharp from 'sharp';
import { adminClient, SUPABASE_URL } from './supabase-admin.mjs';
const [desk, mob] = process.argv.slice(2);
const sb = await adminClient();
const subir = async (arq, nome, largura) => {
  const buf = await sharp(fs.readFileSync(arq)).resize({ width: largura }).webp({ quality: 76 }).toBuffer();
  const { error } = await sb.storage.from('media').upload(`projetos/${nome}`, buf, { contentType: 'image/webp', upsert: true });
  if (error) throw error;
  return `${SUPABASE_URL}/storage/v1/object/public/media/projetos/${nome}`;
};
const d = await subir(desk, 'condonotto.webp', 1600), m = await subir(mob, 'condonotto-mobile.webp', 780);
const linha = {
  slug: 'condonotto', titulo: 'Condonotto', categoria: 'dev', categorias: ['dev', 'vibe'], ativo: true, destaque: false, ordem: 4,
  papel: 'Fundador: produto, desenvolvimento, QA e operação',
  descricao_curta: 'App para condomínios que roda no navegador: encomendas pela foto, visitas, avisos, enquetes e mapa do condomínio.',
  descricao_completa: 'O Condonotto nasceu do portal que fiz para o meu próprio condomínio e virou uma plataforma para vários condomínios. A portaria fotografa a etiqueta da encomenda e o app preenche nome e unidade; o morador recebe a notificação com a foto e assina na retirada. Visitantes se cadastram por um link, e síndico e administradora acompanham ocorrências, enquetes e documentos num só painel.\n\nÉ uma PWA (abre no navegador e fica na tela inicial, sem loja de aplicativos), em português, inglês e espanhol, com dados isolados por condomínio, verificação em duas etapas para a gestão, notificações por e-mail e push e assinatura mensal com período grátis.',
  funcionalidades: ['Encomendas registradas pela foto da etiqueta', 'Visitantes pré-cadastrados por link', 'Enquetes com um voto por unidade', 'Mapa do condomínio desenhável', 'Marca e cores de cada condomínio', 'Documentos com aviso de vencimento'],
  conquistas: ['Em produção, com o primeiro condomínio usando no dia a dia', 'Isolamento de dados por condomínio testado com RLS'],
  tecnologias: ['React', 'TypeScript', 'Vite', 'PWA', 'Supabase', 'Stripe', 'Brevo', 'Web Push', 'Firebase Hosting', 'Playwright'],
  link_projeto: 'https://condonotto.web.app', imagem_url: d,
  galeria: [{ url: d, dispositivo: 'desktop' }, { url: m, dispositivo: 'mobile' }],
  i18n: {
    en: { papel: 'Founder: product, development, QA and operations', descricao_curta: 'Browser-based app for residential buildings: photo-logged parcels, visitors, notices, polls and a building map.',
      descricao_completa: 'Condonotto started as the portal I built for my own condominium and grew into a multi-building platform. The front desk photographs the parcel label and the app fills in the name and unit; residents get a notification with the photo and sign on pickup. Visitors register through a link, and managers follow incidents, polls and documents in a single dashboard.\n\nIt is a PWA (opens in the browser and lives on the home screen, no app store), in Portuguese, English and Spanish, with data isolated per building, two-step verification for managers, e-mail and push notifications and a monthly subscription with a free trial.',
      funcionalidades: ['Parcels logged from a photo of the label', 'Visitors pre-registered through a link', 'Polls with one vote per unit', 'Drawable building map', 'Each building\'s own brand and colors', 'Documents with expiry alerts'],
      conquistas: ['Live, with the first building using it daily', 'Per-building data isolation tested with RLS'] },
    es: { papel: 'Fundador: producto, desarrollo, QA y operación', descricao_curta: 'App para condominios que funciona en el navegador: paquetes por foto, visitas, avisos, encuestas y mapa del condominio.',
      descricao_completa: 'Condonotto nació del portal que hice para mi propio condominio y se convirtió en una plataforma para varios condominios. La portería fotografía la etiqueta del paquete y la app completa el nombre y la unidad; el residente recibe la notificación con la foto y firma al retirarlo. Las visitas se registran por un enlace, y el administrador sigue incidencias, encuestas y documentos en un solo panel.\n\nEs una PWA (se abre en el navegador y queda en la pantalla de inicio, sin tienda de apps), en portugués, inglés y español, con datos aislados por condominio, verificación en dos pasos para la gestión, notificaciones por e-mail y push y suscripción mensual con período gratis.',
      funcionalidades: ['Paquetes registrados con la foto de la etiqueta', 'Visitas pre-registradas por enlace', 'Encuestas con un voto por unidad', 'Mapa del condominio dibujable', 'Marca y colores de cada condominio', 'Documentos con aviso de vencimiento'],
      conquistas: ['En producción, con el primer condominio usándolo a diario', 'Aislamiento de datos por condominio probado con RLS'] },
  },
};
const { data: existe } = await sb.from('projects').select('id').eq('slug', 'condonotto').maybeSingle();
const r = existe ? await sb.from('projects').update(linha).eq('id', existe.id) : await sb.from('projects').insert(linha);
if (r.error) throw r.error;
const { data: pat } = await sb.from('site_content').select('value').eq('key', 'patrocinio').single();
const v = pat.value; v.projetos = [...new Set([...(v.projetos || []), 'condonotto'])];
const r2 = await sb.from('site_content').update({ value: v }).eq('key', 'patrocinio');
console.log('ok', r2.error?.message || '', v.projetos);
