import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import path from 'path'
import JavaScriptObfuscator from 'vite-plugin-javascript-obfuscator'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuetify(),
    // Plugin de obfuscação JavaScript (apenas para build de produção)
    JavaScriptObfuscator({
      // Configurações de obfuscação
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 1,
      numbersToExpressions: true,
      simplify: true,
      stringArrayShuffle: true,
      splitStrings: true,
      stringArrayThreshold: 1,
      transformObjectKeys: true,
      unicodeEscapeSequence: false,
      identifierNamesGenerator: 'hexadecimal',
      renameGlobals: false,
      selfDefending: false,
      stringArray: true,
      rotateStringArray: true,
      debugProtection: false,
      debugProtectionInterval: 0,
      disableConsoleOutput: false,
      domainLock: [],
      reservedNames: [],
      reservedStrings: [],
      seed: 0,
      sourceMap: false,
      target: 'browser',
      // Aplicar apenas em modo de produção
      apply: 'build',
      // Excluir arquivos específicos se necessário
      exclude: [
        /node_modules/,
        /\.spec\./,
        /\.test\./
      ]
    }),
  ],
  build: {
    outDir: 'public',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Força novos nomes de arquivos a cada build
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
