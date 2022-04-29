import { parentPort } from 'worker_threads';
import micromatch from 'micromatch';
import { GLOBAL_DEFAULTS, UASTC_DEFAULTS, ETC1S_DEFAULTS, Mode, MICROMATCH_OPTIONS, R, G } from './constants';

export async function waitExit(process) {
  let stdout = '';
  let stderr = '';

  if (process.stdout) {
    for await (const chunk of process.stdout) {
      stdout += chunk;
    }
  }

  if (process.stderr) {
    for await (const chunk of process.stderr) {
      stderr += chunk;
    }
  }

  const status = await new Promise((resolve, _) => {
    process.on('close', resolve);
  });

  return [status, stdout, stderr];
}

export function reportSize(action, startSize, endSize) {
  parentPort!.postMessage({
    type: 'sizereport',
    action,
    startSize,
    endSize,
  });
}

export function isPowerOfTwo(value) {
  if (value <= 2) return true;
  return (value & (value - 1)) === 0 && value !== 0;
}

export function isMultipleOfFour(value) {
  return value % 4 === 0;
}

export function ceilMultipleOfFour(value) {
  if (value <= 4) return 4;
  return value % 4 ? value + 4 - (value % 4) : value;
}

export function preferredPowerOfTwo(value) {
  if (value <= 4) return 4;

  const lo = floorPowerOfTwo(value);
  const hi = ceilPowerOfTwo(value);

  if (hi - value > value - lo) return lo;
  return hi;
}

export function floorPowerOfTwo(value) {
  return Math.pow(2, Math.floor(Math.log(value) / Math.LN2));
}

export function ceilPowerOfTwo(value) {
  return Math.pow(2, Math.ceil(Math.log(value) / Math.LN2));
}

export function createParams(slots, channels, size, logger, numTextures, options) {
  const params: string[] = [];

  params.push('--genmipmap');

  if (options.filter === undefined) {
    options.filter = GLOBAL_DEFAULTS.filter;
  }
  if (options.filter !== GLOBAL_DEFAULTS.filter) params.push('--filter', options.filter);

  if (options.filterScale === undefined) {
    options.filterScale = GLOBAL_DEFAULTS.filterScale;
  }
  if (options.filterScale !== GLOBAL_DEFAULTS.filterScale) {
    params.push('--fscale', options.filterScale);
  }


  if (options.mode === Mode.UASTC) {
    const _options = options;
    params.push('--uastc', _options.level);
    if (_options.rdo !== UASTC_DEFAULTS.rdo) {
      params.push('--uastc_rdo_l', _options.rdo);
    }
    if (_options.rdoDictionarySize !== UASTC_DEFAULTS.rdoDictionarySize) {
      params.push('--uastc_rdo_d', _options.rdoDictionarySize);
    }
    if (_options.rdoBlockScale !== UASTC_DEFAULTS.rdoBlockScale) {
      params.push('--uastc_rdo_b', _options.rdoBlockScale);
    }
    if (_options.rdoStdDev !== UASTC_DEFAULTS.rdoStdDev) {
      params.push('--uastc_rdo_s', _options.rdoStdDev);
    }
    if (!_options.rdoMultithreading) {
      params.push('--uastc_rdo_m');
    }
    if (_options.zstd && _options.zstd > 0) {
      params.push('--zcmp', _options.zstd);
    }
  } else {
    const _options = options;
    params.push('--bcmp');
    if (_options.quality === undefined) {
      _options.quality = ETC1S_DEFAULTS.quality;
    }
    if (_options.quality !== ETC1S_DEFAULTS.quality) {
      params.push('--qlevel', _options.quality);
    }

    if (_options.compression === undefined) {
      _options.compression = ETC1S_DEFAULTS.compression;
    }
    if (_options.compression !== ETC1S_DEFAULTS.compression) {
      params.push('--clevel', _options.compression);
    }

    if (_options.maxEndpoints) params.push('--max_endpoints', _options.maxEndpoints);
    if (_options.maxSelectors) params.push('--max_selectors', _options.maxSelectors);

    if (_options.rdoOff) {
      params.push('--no_endpoint_rdo', '--no_selector_rdo');
    } else if (_options.rdoThreshold) {
      params.push('--endpoint_rdo_threshold', _options.rdoThreshold);
      params.push('--selector_rdo_threshold', _options.rdoThreshold);
    }

    if (slots.find((slot) => micromatch.isMatch(slot, '*normal*', MICROMATCH_OPTIONS))) {
      params.push('--normal_map');
    }
  }

  if (slots.length && !slots.find((slot) => micromatch.isMatch(slot, '*{color,emissive}*', MICROMATCH_OPTIONS))) {
    // See: https://github.com/donmccurdy/glTF-Transform/issues/215
    params.push('--assign_oetf', 'linear', '--assign_primaries', 'none');
  }

  if (channels === R) {
    params.push('--target_type', 'R');
  } else if (channels === G || channels === (R | G)) {
    params.push('--target_type', 'RG');
  }

  // Minimum size on any dimension is 4px.
  // See: https://github.com/donmccurdy/glTF-Transform/issues/502

  let width;
  let height;

  if (options.powerOfTwo) {
    width = preferredPowerOfTwo(size[0]);
    height = preferredPowerOfTwo(size[1]);
  } else {
    if (!isPowerOfTwo(size[0]) || !isPowerOfTwo(size[1])) {
      logger.warn(
        `toktx: Texture dimensions ${size[0]}x${size[1]} are NPOT, and may` +
          ' fail in older APIs (including WebGL 1.0) on certain devices.'
      );
    }
    width = isMultipleOfFour(size[0]) ? size[0] : ceilMultipleOfFour(size[0]);
    height = isMultipleOfFour(size[1]) ? size[1] : ceilMultipleOfFour(size[1]);
  }

  if (width !== size[0] || height !== size[1]) {
    if (width > 4096 || height > 4096) {
      logger.warn(
        `toktx: Resizing to nearest power of two, ${width}x${height}px. Texture dimensions` +
          ' greater than 4096px may not render on some mobile devices.' +
          ' Resize to a lower resolution before compressing, if needed.'
      );
    }
    params.push('--resize', `${width}x${height}`);
  }

  // if (options.jobs && options.jobs > 1 && numTextures > 1) {
  //   // See: https://github.com/donmccurdy/glTF-Transform/pull/389#issuecomment-1089842185
  //   const threads = Math.max(2, Math.min(NUM_CPUS, (3 * NUM_CPUS) / numTextures));
  //   params.push('--threads', threads);
  // }

  return params;
}

export default {
  waitExit,
  reportSize,
  isPowerOfTwo,
  isMultipleOfFour,
  ceilMultipleOfFour,
  preferredPowerOfTwo,
  floorPowerOfTwo,
  ceilPowerOfTwo,
  createParams,
};
