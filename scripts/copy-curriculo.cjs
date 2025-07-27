// scripts/copy-curriculo.js
// Copia a pasta curriculo para public/curriculo após o build do Vite

const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../src/pages/CV/curriculo');
const dest = path.resolve(__dirname, '../public/curriculo');

function copyRecursiveSync(src, dest) {
    if (!fs.existsSync(src)) return;
    if (fs.lstatSync(src).isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach(child => {
            copyRecursiveSync(path.join(src, child), path.join(dest, child));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

copyRecursiveSync(src, dest);
console.log('curriculo copiado para public/curriculo');
