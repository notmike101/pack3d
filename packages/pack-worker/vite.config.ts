import { defineConfig } from 'vite'
import pkg from '../../package.json'
import { builtinModules } from 'module'


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
    rollupOptions: {
      external: [
        'electron',
        ...builtinModules,
        ...Object.keys(pkg.dependencies || {}),
      ],
    },
  },
  server: {
    host: pkg.env.VITE_DEV_SERVER_HOST,
    port: pkg.env.VITE_DEV_SERVER_PORT,
  },
});
