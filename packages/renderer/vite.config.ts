import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electronRenderer from 'vite-plugin-electron/renderer';
import pkg from '../../package.json'

export default defineConfig({
  mode: process.env.NODE_ENV,
  root: __dirname,
  plugins: [
    vue(),
    electronRenderer(),
  ],
  base: './',
  build: {
    sourcemap: true,
    outDir: '../../dist/renderer',
  },
  server: {
    host: pkg.env.VITE_DEV_SERVER_HOST,
    port: pkg.env.VITE_DEV_SERVER_PORT,
  },
})
