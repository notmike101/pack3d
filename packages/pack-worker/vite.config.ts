import { defineConfig, normalizePath } from 'vite'
import { builtinModules } from 'module'
import path from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import pkg from '../../package.json'

export default defineConfig({
  mode: process.env.NODE_ENV,
  root: __dirname,
  build: {
    outDir: '../../dist/workers/pack-worker',
    lib: {
      entry: 'index.ts',
      formats: ['cjs'],
      fileName: () => '[name].cjs',
    },
    minify: process.env.NODE_ENV === 'production',
    sourcemap: true,
    commonjsOptions: {
      ignoreDynamicRequires: true,
    },
    rollupOptions: {
      external: [
        'electron',
        ...builtinModules,
      ],
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: normalizePath(path.resolve(__dirname, '../../node_modules/@squoosh/lib/build/*.wasm')), dest: '.'},
      ],
    }),
  ],
  server: {
    host: pkg.env.VITE_DEV_SERVER_HOST,
    port: pkg.env.VITE_DEV_SERVER_PORT,
  },
});
