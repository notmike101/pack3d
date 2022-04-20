/**
 * Licensed Materials - Property of Michael Orozco
 * (C) Copyright Michael Orozco 2022
 */

const { parentPort } = require('worker_threads');
const { NodeIO } = require('@gltf-transform/core');
const { dedup, weld, reorder, textureResize, instance } = require('@gltf-transform/functions');
const { DracoMeshCompression, TextureTransform, TextureBasisu } = require('@gltf-transform/extensions');
const { MeshoptEncoder } = require('meshoptimizer');
const draco3d = require('draco3dgltf');
const path = require('path');

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

const io = new NodeIO()
  .registerExtensions([
    DracoMeshCompression,
    TextureTransform,
  ]);

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

async function doBasis(document, documentBinary, options, fileName, appendString = '') {
  const startSize = documentBinary.byteLength;

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

    document.setLogger(new Logger(Logger.Verbosity.DEBUG));

    if (options.doDedupe === true) {
      outFileName = await doDedupe(document, documentBinary, outFileName);
    }

    if (options.doInstancing === true) {
      outFileName = await doInstancing(document, documentBinary, outFileName, '_instance');
    }

    if (options.doReorder === true) {
      outFileName = await doReorder(document, documentBinary, outFileName, '_reorder');
    }

    if (options.doWeld === true) {
      outFileName = await doWeld(document, documentBinary, outFileName, '_weld');
    }

    if (options.doResize === true) {
      outFileName = await doResize(document, documentBinary, options, outFileName, '_resize');
    }

    if (options.doBasis === true) {
      outFileName = await doBasis(document, documentBinary, options, outFileName, '_ktx2');
    }

    if (options.doDraco === true) {
      outFileName = await doDraco(document, documentBinary, options, outFileName, '_draco');
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
    doBasis: data.doBasis,
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
