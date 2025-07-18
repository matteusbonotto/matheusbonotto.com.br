import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🧹 Limpando cache e arquivos temporários...');

// Função para remover diretório recursivamente
function removeDir(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`✅ Removido: ${dirPath}`);
    }
}

// Função para limpar arquivos por extensão
function cleanFilesByExtension(dir, extensions) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            cleanFilesByExtension(filePath, extensions);
        } else {
            const ext = path.extname(file).toLowerCase();
            if (extensions.includes(ext)) {
                fs.unlinkSync(filePath);
                console.log(`✅ Removido arquivo: ${filePath}`);
            }
        }
    });
}

// Limpar cache do Vite
removeDir(path.join(projectRoot, 'node_modules', '.vite'));
removeDir(path.join(projectRoot, '.vite'));

// Limpar pasta de build anterior
removeDir(path.join(projectRoot, 'dist'));
removeDir(path.join(projectRoot, 'producao'));

// Limpar cache do npm
console.log('🧹 Limpando cache do npm...');
try {
    const { execSync } = await import('child_process');
    execSync('npm cache clean --force', { stdio: 'inherit' });
    console.log('✅ Cache do npm limpo!');
} catch (error) {
    console.log('⚠️  Erro ao limpar cache do npm:', error.message);
}

// Limpar arquivos temporários
console.log('🧹 Limpando arquivos temporários...');
cleanFilesByExtension(projectRoot, ['.tmp', '.temp', '.log']);

console.log('🎉 Limpeza concluída!');
console.log('💡 Agora você pode fazer o build sem problemas de cache.');
