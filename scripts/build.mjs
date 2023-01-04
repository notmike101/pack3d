import { build } from 'vite';
import fs from 'fs';

const removeDir = (path) => {
  try {
    fs.rmdirSync(path, { recursive: true });
  } catch (err) {
    console.warn(err.message);
  }
};

removeDir('dist/renderer');
removeDir('dist/workers');
removeDir('dist/main');

await build({ configFile: 'packages/pack-worker/vite.config.ts' });
await build({ configFile: 'packages/main/vite.config.ts' });
await build({ configFile: 'packages/renderer/vite.config.ts' });
