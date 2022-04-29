/**
 * Licensed Materials - Property of Michael Orozco
 * (C) Copyright Michael Orozco 2022
 */

const { parentPort } = require('worker_threads');
const { NodeIO, FileUtils, ImageUtils, TextureChannel } = require('@gltf-transform/core');
const { dedup, weld, reorder, textureResize, instance, listTextureSlots, getTextureChannelMask, oxipng } = require('@gltf-transform/functions');
const { DracoMeshCompression, TextureTransform, TextureBasisu, LightsPunctual, ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const { MeshoptEncoder } = require('meshoptimizer');
const draco3d = require('draco3dgltf');
const path = require('path');
const { spawn } = require('child_process');
const tmp = require('tmp');
const fs = require('fs/promises');
const micromatch = require('micromatch');
const squoosh = require('@squoosh/lib');

class Logger {
  static Verbosity = {
    SILENT: 4,
    ERROR: 3,
    WARN: 2,
    INFO: 1,
    DEBUG: 0,
  };

  static DEFAULT_INSTANCE = new Logger(Logger.Verbosity.INFO);

  constructor(verbosity) {
    this.verbosity = verbosity;
  }

  debug(text) {
    if (this.verbosity <= Logger.Verbosity.DEBUG) {
      parentPort.postMessage({
        type: 'logging',
        verbosity: this.verbosity,
        text,
      });
    }
  }

  info(text) {
    if (this.verbosity <= Logger.Verbosity.INFO) {
      parentPort.postMessage({
        type: 'logging',
        verbosity: this.verbosity,
        text,
      });
    }
  }

  warn(text) {
    if (this.verbosity <= Logger.Verbosity.WARN) {
      parentPort.postMessage({
        type: 'logging',
        verbosity: this.verbosity,
        text,
      });
    }
  }

  error(text) {
    if (this.verbosity <= Logger.Verbosity.ERROR) {
      parentPort.postMessage({
        type: 'logging',
        verbosity: this.verbosity,
        text,
      });
    }
  }
}

async function waitExit(process) {
  let stdout = '';
	if (process.stdout) {
		for await (const chunk of process.stdout) {
			stdout += chunk;
		}
	}
	let stderr = '';
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

const ktx2Path = process.cwd();

const GLOBAL_DEFAULTS = {
  filter: 'lanczos4',
  filterScale: 1,
  powerOfTwo: false,
  slots: '*',
  jobs: 2,
};

const Mode = {
	ETC1S: 'etc1s',
	UASTC: 'uastc',
};

const ETC1S_DEFAULTS = {
	quality: 128,
	compression: 1,
	...GLOBAL_DEFAULTS,
};

const UASTC_DEFAULTS = {
	level: 2,
	rdo: 0,
	rdoDictionarySize: 32768,
	rdoBlockScale: 10.0,
	rdoStdDev: 18.0,
	rdoMultithreading: true,
	zstd: 18,
	...GLOBAL_DEFAULTS,
};

const MICROMATCH_OPTIONS = { nocase: true, contains: true };

const { R, G } = TextureChannel;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  /*
  .registerExtensions([
    DracoMeshCompression,
    TextureTransform,
  ]);
  */

function reportSize(action, startSize, endSize) {
  parentPort.postMessage({
    type: 'sizereport',
    action,
    startSize,
    endSize,
  });
}

async function doDedupe(document, documentBinary, fileName, appendString = '') {
  const startSize = documentBinary.byteLength;

  await document.transform(dedup());
  documentBinary = await io.writeBinary(document);

  const endSize = documentBinary.byteLength;

  reportSize('dedupe', startSize, endSize);

  return fileName + appendString;
}

async function doInstancing(document, documentBinary, fileName, appendString = '') {
  const startSize = documentBinary.byteLength;
      
  await document.transform(instance());
  documentBinary = await io.writeBinary(document);

  const endSize = doumentBinary.byteLength;

  reportSize('instance', startSize, endSize);

  return fileName + appendString;
}

async function doReorder(document, documentBinary, fileName, appendString = '') {
  const startSize = documentBinary.byteLength;

  await document.transform(reorder({
    encoder: MeshoptEncoder,
  }));
  documentBinary = await io.writeBinary(document);

  const endSize = documentBinary.byteLength;

  reportSize('reorder', startSize, endSize);

  return fileName + appendString;
}

async function doWeld(document, documentBinary, fileName, appendString = '') {
  const startSize = documentBinary.byteLength;

  await document.transform(weld());
  documentBinary = await io.writeBinary(document);

  const endSize = documentBinary.byteLength;

  reportSize('weld', startSize, endSize);

  return fileName + appendString;
}

async function doResize(document, documentBinary, options, fileName, appendString = '') {
  const startSize = documentBinary.byteLength;

  await document.transform(textureResize({
    size: [options.textureResolutionWidth, options.textureResolutionHeight],
    filter: options.resamplingFilter,
  }));
  documentBinary = await io.writeBinary(document);

  const endSize = documentBinary.byteLength;

  reportSize('resize', startSize, endSize);

  return fileName + appendString;
}

function createParams(slots, channels, size, logger, numTextures, options) {
  const params = [];

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

	if (options.jobs && options.jobs > 1 && numTextures > 1) {
		// See: https://github.com/donmccurdy/glTF-Transform/pull/389#issuecomment-1089842185
		const threads = Math.max(2, Math.min(NUM_CPUS, (3 * NUM_CPUS) / numTextures));
		params.push('--threads', threads);
	}

	return params;
}

function isPowerOfTwo(value) {
	if (value <= 2) return true;
	return (value & (value - 1)) === 0 && value !== 0;
}

function isMultipleOfFour(value) {
	return value % 4 === 0;
}

function ceilMultipleOfFour(value) {
	if (value <= 4) return 4;
	return value % 4 ? value + 4 - (value % 4) : value;
}

function preferredPowerOfTwo(value) {
	if (value <= 4) return 4;

	const lo = floorPowerOfTwo(value);
	const hi = ceilPowerOfTwo(value);

	if (hi - value > value - lo) return lo;
	return hi;
}

function floorPowerOfTwo(value) {
	return Math.pow(2, Math.floor(Math.log(value) / Math.LN2));
}

function ceilPowerOfTwo(value) {
	return Math.pow(2, Math.ceil(Math.log(value) / Math.LN2));
}

async function doBasis(document, documentBinary, options, fileName, logger, appendString = '') {
  const startSize = documentBinary.byteLength;

  documentBinary = await io.writeBinary(document);

  if (options.basisMethod === 'png') {
    const formats = micromatch.makeRe(String(options.pngFormatFilter), MICROMATCH_OPTIONS);
    const slots = micromatch.makeRe(String(options.slots), MICROMATCH_OPTIONS);

    await document.transform(oxipng({ formats, squoosh }));
  } else {
    const lightExtension = document.createExtension(LightsPunctual).setRequired(true);
    const basisuExtension = document.createExtension(TextureBasisu).setRequired(true);

    const textures = document.getRoot().listTextures();
    let numCompressed = 0;

    const promises = textures.map(async (texture, textureIndex) => {
      const slots = listTextureSlots(document, texture);
      const channels = getTextureChannelMask(document, texture);
      const textureLabel = texture.getURI() || texture.getName() || `${textureIndex + 1}/${doc.getRoot().listTextures().length}`;
      const prefix = `toktx:texture(${textureLabel})`;
      const textureMimeType = texture.getMimeType();

      logger.debug(`${prefix}: Slots -> [${slots.join(', ')}]`);

      if (textureMimeType === 'image/ktx2') {
        logger.debug(`${prefix}: Skipping KTX2 texture`);

        return;
      } else if (!['image/png', 'image/jpeg'].includes(textureMimeType)) {
        logger.warn(`${prefix}: Unsupported texture type: ${textureMimeType}`);

        return;
      }

      const image = texture.getImage();
      const size = texture.getSize();

      if (!image || !size) {
        logger.warn(`${prefix}: Skipping, unreadable texture`);

        return;
      }

      const extension = texture.getURI() ? FileUtils.extension(texture.getURI()) : ImageUtils.mimeTypeToExtension(textureMimeType);
      const inPath = tmp.tmpNameSync({ postfix: '.' + extension });
      const outPath = tmp.tmpNameSync({ postfix: '.ktx2' });
      const inBytes = image.byteLength;

      await fs.writeFile(inPath, Buffer.from(image));

      const passedOptions = {
        filter: options.filter,
        mode: options.basisMethod,
      };

      if (options.basisMethod === 'etc1s') {
        passedOptions.quality = options.etc1sQuality;
        passedOptions.powerOfTwo = options.etc1sResizeNPOT;
      } else if (options.basisMethod === 'uastc') {
        passedOptions.quality = options.uastcQuality;
        passedOptions.powerOfTwo = options.uastcResizeNPOT;
      }

      const params = [
        ...createParams(slots, channels, size, logger, textures.length, passedOptions),
        outPath,
        inPath
      ];

      logger.debug(`${prefix}: Spawning -> ${ktx2Path}/toktx: ${params.join(' ')}`);

      const [ status, stdout, stderr ] = await waitExit(spawn(ktx2Path + '/toktx', params));

      if (status !== 0) {
        logger.error(`${prefix}: Failed -> \n\n${stderr.toString()}`);
      } else {
        texture.setImage(await fs.readFile(outPath)).setMimeType('image/ktx2');

        if (texture.getURI()) {
          texture.setURI(FileUtils.basename(texture.getURI()) + '.ktx2');
        }

        numCompressed++;
      }

      const outBytes = texture.getImage().byteLength;

      logger.debug(`${prefix}: ${inBytes} -> ${outBytes} bytes`);
    });

    await Promise.all(promises);

    if (numCompressed === 0) {
      logger.warn('toktx: No textures were found, or none were selected for compression.');
    }

    const usesKTX2 = document.getRoot().listTextures().some((texture) => texture.getMimeType() === 'image/ktx2');

    if (!usesKTX2) {
      basisuExtension.dispose();
      lightExtension.dispose();
    }
  }

  documentBinary = await io.writeBinary(document);  

  const endSize = documentBinary.byteLength;

  reportSize('basis', startSize, endSize);

  return fileName + appendString;
}

async function doDraco(document, documentBinary, options, fileName, appendString = '') {
  const startSize = documentBinary.byteLength;

  io.registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'draco3d.encoder': await draco3d.createEncoderModule(),
  });

  document.createExtension(DracoMeshCompression)
        .setRequired(true)
        .setEncoderOptions({
          decodeSpeed: options.decodeSpeed,
          encodeSpeed: options.encodeSpeed,
          method: options.vertexCompressionMethod,
          quantizationVolume: options.quantizationVolume,
          quantizationBits: {
            POSITION: options.quantizationPosition,
            NORMAL: options.quantizationNormal,
            COLOR: options.quantizationColor,
            TEX_COORD: options.quantizationTexCoord,
            GENERIC: options.quantizationGeneric,
          }
        });

  documentBinary = await io.writeBinary(document);

  const endSize = documentBinary.byteLength;

  reportSize('draco', startSize, endSize);

  return fileName + appendString;
}

async function doPack(filePath, outputPath, options = {}) {  
  try {
    if (!filePath) throw new Error('No file path specified');
    if (!outputPath) throw new Error('No output path specified');

    const filePathInfo = path.parse(filePath);
    const document = await io.read(filePath);
    let documentBinary = await io.writeBinary(document);
    const extension = filePathInfo.ext;
    let outFileName = filePathInfo.name;
    const logger = new Logger(Logger.Verbosity.DEBUG);

    document.setLogger(logger);

    if (options.doDedupe === true) {
      outFileName = await doDedupe(document, documentBinary, outFileName);
    }

    if (options.doInstancing === true) {
      outFileName = await doInstancing(document, documentBinary, outFileName);
    }

    if (options.doReorder === true) {
      outFileName = await doReorder(document, documentBinary, outFileName);
    }

    if (options.doWeld === true) {
      outFileName = await doWeld(document, documentBinary, outFileName);
    }

    if (options.doResize === true) {
      outFileName = await doResize(document, documentBinary, options, outFileName);
    }

    if (options.doBasis === true) {
      outFileName = await doBasis(document, documentBinary, options, outFileName, logger);
    }

    if (options.doDraco === true) {
      outFileName = await doDraco(document, documentBinary, options, outFileName);
    }

    outFileName += '_packed' + extension;

    const outFile = path.resolve(outputPath + '/' + outFileName);

    await io.write(outFile, document);
    documentBinary = await io.writeBinary(document);

    return {
      name: outFileName,
      path: outFile,
      binary: documentBinary,
    };
  } catch (err) {
    if (typeof err === 'string') {
      return new Error(err);
    }

    return err;
  }
}

parentPort.on('message', async (data) => {
  const startTime = performance.now();

  const output = await doPack(data.file, data.outputPath, {
    doDedupe: data.doDedupe,
    doReorder: data.doReorder,
    doWeld: data.doWeld,
    doInstancing: data.doInstancing,
    doResize: data.doResize,
    doDraco: data.doDraco,
    resamplingFilter: data.resamplingFilter,
    textureResolutionWidth: data.textureResolutionWidth,
    textureResolutionHeight: data.textureResolutionHeight,
    vertexCompressionMethod: data.vertexCompressionMethod,
    quantizationVolume: data.quantizationVolume,
    quantizationColor: data.quantizationColor,
    quantizationGeneric: data.quantizationGeneric,
    quantizationNormal: data.quantizationNormal,
    quantizationPosition: data.quantizationPosition,
    quantizationTexcoord: data.quantizationTexcoord,
    encodeSpeed: data.encodeSpeed,
    decodeSpeed: data.decodeSpeed,
    doBasis: data.doBasis,
    basisMethod: data.basisMethod,
    pngFormatFilter: data.pngFormatFilter,
    etc1sQuality: data.etc1sQuality,
    etc1sResizeNPOT: data.etc1sResizeNPOT,
    uastcLevel: data.uastcLevel,
    uastcResizeNPOT: data.uastcResizeNPOT,
  });

  if (output instanceof Error) {
    parentPort.postMessage({
      type: 'errorreport',
      error: output,
      errorMessage: output.message,
      time: performance.now() - startTime,
    });
  } else {
    parentPort.postMessage({
      type: 'packreport',
      file: output,
      time: performance.now() - startTime,
    });
  }

  process.exit(0);
});
