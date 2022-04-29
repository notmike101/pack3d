/**
 * Licensed Materials - Property of Michael Orozco
 * (C) Copyright Michael Orozco 2022
 */

import { build } from 'vite';

await build({ configFile: 'packages/pack-worker/vite.config.ts' });
await build({ configFile: 'packages/main/vite.config.ts' });
await build({ configFile: 'packages/preload/vite.config.ts' });
await build({ configFile: 'packages/renderer/vite.config.ts' });
