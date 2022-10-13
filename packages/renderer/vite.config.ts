import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electronRenderer from 'vite-plugin-electron-renderer';
import pkg from '../../package.json'
import { fileURLToPath } from 'url';

export default defineConfig({
  mode: process.env.NODE_ENV,
  root: __dirname,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    vue(),
    electronRenderer(),
  ],
  base: './',
  build: {
    minify: process.env.NODE_ENV === 'production',
    outDir: '../../dist/renderer',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['@babylonjs/core', '@babylonjs/loaders', 'vue'],
        },
      },
    },
  },
  server: {
    host: pkg.env.VITE_DEV_SERVER_HOST,
    port: pkg.env.VITE_DEV_SERVER_PORT,
  },
});
