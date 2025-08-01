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

// Configuração dos assets a serem copiados para desenvolvimento (public)
const assetsConfig = [
  {
    src: path.join(projectRoot, 'src', 'pages', 'Cv', 'curriculo'),
    dest: path.join(projectRoot, 'public', 'curriculo'),
    name: 'Currículo'
  },
  {
    src: path.join(projectRoot, 'src', 'pages', 'Competence', 'competence-page'),
    dest: path.join(projectRoot, 'public', 'competence-page'),
    name: 'Competências'
  }
  // Adicione mais assets aqui se necessário
];

// Função para copiar todos os assets
function copyAllAssets() {
  console.log('🔄 Iniciando cópia de assets para desenvolvimento...');
  
  assetsConfig.forEach(config => {
    if (fs.existsSync(config.src)) {
      copyDir(config.src, config.dest);
      console.log(`✅ ${config.name} copiado com sucesso!`);
    } else {
      console.log(`❌ ${config.name} não encontrado em: ${config.src}`);
    }
  });
  
  console.log('🎉 Copy assets para desenvolvimento concluído!');
}

// Função para assistir mudanças nos arquivos
function watchAssets() {
  console.log('👀 Assistindo mudanças nos assets para desenvolvimento...');
  
  assetsConfig.forEach(config => {
    if (fs.existsSync(config.src)) {
      fs.watch(config.src, { recursive: true }, (eventType, filename) => {
        if (filename) {
          console.log(`🔄 ${config.name} alterado: ${filename}`);
          copyDir(config.src, config.dest);
          console.log(`✅ ${config.name} atualizado!`);
        }
      });
    }
  });
}

// Executa baseado no argumento
const args = process.argv.slice(2);

if (args.includes('--watch')) {
  copyAllAssets();
  watchAssets();
} else {
  copyAllAssets();
}
