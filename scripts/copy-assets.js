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

// Copia arquivos da página de competências
console.log('🔄 Copiando arquivos da página de competências...');
const competenceSrc = path.join(projectRoot, 'src', 'pages', 'Competence', 'competence-page');
const competenceDest = path.join(projectRoot, 'public', 'competence-page');

if (fs.existsSync(competenceSrc)) {
  copyDir(competenceSrc, competenceDest);
  console.log('✅ Arquivos da página de competências copiados com sucesso!');
} else {
  console.log('❌ Pasta da página de competências não encontrada em:', competenceSrc);
}

// Copia arquivos do build (dist) para public se existir
console.log('🔄 Copiando arquivos do build...');
const distPath = path.join(projectRoot, 'dist');
const publicPath = path.join(projectRoot, 'public');

if (fs.existsSync(distPath)) {
  const items = fs.readdirSync(distPath);
  
  items.forEach(item => {
    const srcPath = path.join(distPath, item);
    const destPath = path.join(publicPath, item);
    
    // Pula pastas específicas que já existem para evitar conflitos
    if (item === 'competence-page' || item === 'curriculo') {
      console.log(`⏭️ Pulando ${item} - pasta já existe e é mantida separadamente`);
      return;
    }
    
    // Só copia se não existir ou se for diferente do que já existe
    if (fs.statSync(srcPath).isDirectory()) {
      // Para diretórios, copia tudo (exceto os excluídos acima)
      if (fs.existsSync(destPath)) {
        try {
          fs.rmSync(destPath, { recursive: true, force: true });
        } catch (error) {
          console.log(`⚠️ Não foi possível remover ${destPath}, tentando sobrescrever...`);
        }
      }
      copyDir(srcPath, destPath);
    } else {
      // Para arquivos, sobrescreve
      fs.copyFileSync(srcPath, destPath);
    }
  });
  console.log('✅ Arquivos do build copiados para public!');
} else {
  console.log('ℹ️ Pasta dist não encontrada, pulando cópia do build...');
}

// Aqui você pode adicionar mais arquivos para copiar se precisar
// Por exemplo, outros assets que devem estar em produção

console.log('🎉 Copy assets concluído!');
