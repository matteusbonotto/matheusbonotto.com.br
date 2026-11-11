// Barra o deploy se o dist/ não tiver os PDFs do currículo (ex.: dist sobrescrito por um build sem scripts/cv-pdf.mjs).
import fs from 'node:fs';
const faltando = ['dist/cv', 'dist/en/cv', 'dist/es/cv'].filter(d => !fs.existsSync(d) || !fs.readdirSync(d).some(a => a.endsWith('.pdf')));
if (faltando.length) { console.error(`Sem PDF do currículo em: ${faltando.join(', ')}. Rode npm run build antes do deploy.`); process.exit(1); }
console.log('PDFs do currículo ok');
