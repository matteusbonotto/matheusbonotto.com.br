// Recupera fotos e certificados do site antigo (histórico do Git), sobe para o storage e cadastra no banco.
// Uso: node scripts/legado-fotos.mjs <pasta com os arquivos extraídos>
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { adminClient, SUPABASE_URL } from './supabase-admin.mjs';

const pasta = process.argv[2];
const sb = await adminClient();
const subir = async (arq, nome, largura = 1600) => {
  const buf = await sharp(path.join(pasta, arq)).rotate().resize({ width: largura, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  const { error } = await sb.storage.from('media').upload(nome, buf, { contentType: 'image/webp', upsert: true, cacheControl: '31536000' });
  if (error) throw error;
  return `${SUPABASE_URL}/storage/v1/object/public/media/${nome}`;
};

// certificados (o de psicologia ficou de fora: mostra CPF e não é da área)
const CERTS = [
  ['Certificate_SCRUM.png', 'scrum-foundation', 'Scrum Foundation Professional Certificate (SFPC)', 'CertiProf', '2020-07-06', 2],
  ['DEVOPS.png', 'devops-essentials', 'DevOps Essentials Professional Certificate (DEPC)', 'CertiProf', '2020-08-26', 3],
  ['1621000848190.png', 'rpa-business-analysis', 'RPA Business Analysis Fundamentals', 'UiPath', '2020-08-19', 4],
  ['1620808669108.png', 'remote-work', 'Remote Work and Virtual Collaboration Professional Certificate (RWVCPC)', 'CertiProf', '2021-01-25', 5],
  ['CERTIFICATE_LANDING_PAGE_XCGPBBPWSEJX.jpeg', 'usp-teste-de-software', 'Introdução ao Teste de Software', 'USP (Coursera)', null, 6],
];
const { data: perfil } = await sb.from('certifications').select('profile_id').limit(1).single();
for (const [arq, slug, nome, inst, data, ordem] of CERTS) {
  const url = await subir(arq, `certificados/${slug}.webp`);
  const linha = { nome, instituicao: inst, data_certificacao: data, validade: null, certificado_url: url, ordem, visivel: true, profile_id: perfil?.profile_id,
    i18n: slug === 'usp-teste-de-software' ? { en: { nome: 'Introduction to Software Testing' }, es: { nome: 'Introducción a las Pruebas de Software' } } : {} };
  const { data: existe } = await sb.from('certifications').select('id').eq('nome', nome).maybeSingle();
  const r = existe ? await sb.from('certifications').update(linha).eq('id', existe.id) : await sb.from('certifications').insert(linha);
  if (r.error) throw r.error;
}
// a pós da VINCIT também ganha a imagem que já existia na trajetória
await sb.from('certifications').update({ certificado_url: `${SUPABASE_URL}/storage/v1/object/public/media/trajetoria/vincit-1.webp` }).eq('nome', 'Especialização em Teste de Software').is('certificado_url', null);

// fotos de 2019 e 2020 (dez/2019 a fev/2020: período da Realiza Software; a palestra foi no SENAC)
const FOTOS = { 'Realiza Software': ['1581243020638.jpg', '1576393597990.jpg', '1576454531851.jpg', '1582477653172.jpg'] };
for (const [inst, arqs] of Object.entries(FOTOS)) {
  const urls = [];
  for (const a of arqs) urls.push(await subir(a, `trajetoria/realiza-${a.replace(/\.\w+$/, '')}.webp`, 1400));
  const { data: e } = await sb.from('professional_history').select('id,imagens_urls').eq('instituicao', inst).single();
  const r = await sb.from('professional_history').update({ imagens_urls: [...new Set([...(e.imagens_urls || []), ...urls])] }).eq('id', e.id);
  if (r.error) throw r.error;
}
const senac = await subir('1577463317321.jpg', 'trajetoria/senac-palestra.webp', 1400);
const { data: s } = await sb.from('academic_history').select('id,imagens_urls').eq('instituicao', 'SENAC').single();
await sb.from('academic_history').update({ imagens_urls: [...new Set([...(s.imagens_urls || []), senac])] }).eq('id', s.id);
console.log('ok', fs.readdirSync(pasta).length);
