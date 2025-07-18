import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Função para copiar diretório recursivamente
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const items = fs.readdirSync(src);
  
  items.forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Copia arquivos do currículo
console.log('🔄 Copiando arquivos do currículo...');
const curriculoSrc = path.join(projectRoot, 'src', 'pages', 'Cv', 'curriculo');
const curriculoDest = path.join(projectRoot, 'public', 'curriculo');

if (fs.existsSync(curriculoSrc)) {
  copyDir(curriculoSrc, curriculoDest);
  console.log('✅ Arquivos do currículo copiados com sucesso!');
} else {
  console.log('❌ Pasta do currículo não encontrada em:', curriculoSrc);
}

// Aqui você pode adicionar mais arquivos para copiar se precisar
// Por exemplo, outros assets que devem estar em produção

console.log('🎉 Copy assets concluído!');
