import { TextureChannel } from '@gltf-transform/core';

export const ktx2Path = process.cwd();

export const GLOBAL_DEFAULTS = {
  filter: 'lanczos4',
  filterScale: 1,
  powerOfTwo: false,
  slots: '*',
  jobs: 2,
};

export const Mode = {
  ETC1S: 'etc1s',
  UASTC: 'uastc',
};

export const ETC1S_DEFAULTS = {
  quality: 128,
  compression: 1,
  ...GLOBAL_DEFAULTS,
};

export const UASTC_DEFAULTS = {
  level: 2,
  rdo: 0,
  rdoDictionarySize: 32768,
  rdoBlockScale: 10.0,
  rdoStdDev: 18.0,
  rdoMultithreading: true,
  zstd: 18,
  ...GLOBAL_DEFAULTS,
};

export const MICROMATCH_OPTIONS = { nocase: true, contains: true };

export const { R, G } = TextureChannel;

export default {
  ktx2Path,
  GLOBAL_DEFAULTS,
  Mode,
  ETC1S_DEFAULTS,
  UASTC_DEFAULTS,
  MICROMATCH_OPTIONS,
  R,
  G,
};
