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
    // Ignorar arquivos/pastas .git
    if (item === '.git' || item.startsWith('.git')) {
      return;
    }
    
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Copia arquivos do currículo para desenvolvimento (public)
console.log('🔄 Copiando arquivos do currículo para desenvolvimento...');
const curriculoSrc = path.join(projectRoot, 'src', 'pages', 'Cv', 'curriculo');
const curriculoDest = path.join(projectRoot, 'public', 'curriculo');

if (fs.existsSync(curriculoSrc)) {
  copyDir(curriculoSrc, curriculoDest);
  console.log('✅ Arquivos do currículo copiados com sucesso!');
} else {
  console.log('❌ Pasta do currículo não encontrada em:', curriculoSrc);
}

// Copia arquivos das competências para desenvolvimento (public)
console.log('🔄 Copiando arquivos das competências para desenvolvimento...');
const competenceSrc = path.join(projectRoot, 'src', 'pages', 'Competence', 'competence-page');
const competenceDest = path.join(projectRoot, 'public', 'competence-page');

if (fs.existsSync(competenceSrc)) {
  copyDir(competenceSrc, competenceDest);
  console.log('✅ Arquivos das competências copiados com sucesso!');
} else {
  console.log('❌ Pasta das competências não encontrada em:', competenceSrc);
}

// Aqui você pode adicionar mais arquivos para copiar se precisar
// Por exemplo, outros assets que devem estar em produção

console.log('🎉 Copy assets para desenvolvimento concluído!');
