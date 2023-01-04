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
      '@help': fileURLToPath(new URL('./help-src', import.meta.url)),
    },
  },
  define: {
    'global.__VITE_PACKAGE_VERSION__': JSON.stringify(pkg.version),
  },
  plugins: [
    vue(),
    electronRenderer({
      nodeIntegration: true,
    }),
  ],
  base: './',
  build: {
    minify: false,
    // minify: process.env.NODE_ENV === 'production',
    outDir: '../../dist/renderer',
    sourcemap: true,
  },
  server: {
    host: pkg.env.VITE_DEV_SERVER_HOST,
    port: pkg.env.VITE_DEV_SERVER_PORT,
  },
});
