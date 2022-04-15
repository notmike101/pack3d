import { parentPort } from 'worker_threads';
import { NodeIO } from '@gltf-transform/core';
import { dedup, weld, reorder, textureResize, instance } from '@gltf-transform/functions';
import { DracoMeshCompression, TextureTransform, TextureBasisu } from '@gltf-transform/extensions';
import { MeshoptEncoder } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import path from 'path';

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

async function doPack(filePath, outputPath, options = {}) {  
  try {
    if (!filePath) throw new Error('No file path specified');
    if (!outputPath) throw new Error('No output path specified');

    const io = new NodeIO()
      .registerExtensions([
        DracoMeshCompression,
        TextureTransform,
      ])
      .registerDependencies({
        'draco3d.decoder': await draco3d.createDecoderModule(),
        'draco3d.encoder': await draco3d.createEncoderModule(),
      });

    const filePathInfo = path.parse(filePath);
    const document = await io.read(filePath);
    let documentBinary = await io.writeBinary(document);
    const extension = filePathInfo.ext;
    let outFileName = filePathInfo.name;

    document.setLogger(new Logger(Logger.Verbosity.DEBUG));

    if (options.doDedupe === true) {
      const startSize = documentBinary.byteLength;

      await document.transform(dedup());
      documentBinary = await io.writeBinary(document);

      const endSize = documentBinary.byteLength;

      parentPort.postMessage({
        type: 'sizereport',
        action: 'dedupe',
        startSize,
        endSize,
      });
    }

    if (options.doInstancing === true) {
      const startSize = documentBinary.byteLength;
      
      await document.transform(instance());
      documentBinary = await io.writeBinary(document);

      const endSize = doumentBinary.byteLength;

      parentPort.postMessage({
        type: 'sizereport',
        action: 'instance',
        startSize,
        endSize,
      });

      outFileName += '_instance';
    }

    if (options.doReorder === true) {
      const startSize = documentBinary.byteLength;

      await document.transform(reorder({
        encoder: MeshoptEncoder,
      }));
      documentBinary = await io.writeBinary(document);
      
      const endSize = documentBinary.byteLength;

      parentPort.postMessage({
        type: 'sizereport',
        action: 'reorder',
        startSize,
        endSize,
      });
    }

    if (options.doWeld === true) {
      const startSize = documentBinary.byteLength;

      await document.transform(weld());
      documentBinary = await io.writeBinary(document);
      
      const endSize = documentBinary.byteLength;

      parentPort.postMessage({
        type: 'sizereport',
        action: 'weld',
        startSize,
        endSize,
      });
    }

    if (options.doResize === true) {
      const startSize = documentBinary.byteLength;

      await document.transform(textureResize({
        size: [options.textureResolutionWidth, options.textureResolutionHeight],
        filter: options.resamplingFilter,
      }));
      documentBinary = await io.writeBinary(document);
      
      const endSize = documentBinary.byteLength;

      parentPort.postMessage({
        type: 'sizereport',
        action: 'resize',
        startSize,
        endSize,
      });

      outFileName += '_resize';
    }

    if (options.doBasis === true) {
      const startSize = documentBinary.byteLength;

      document.createTexture('')

      documentBinary = await io.writeBinary(document);
      
      const endSize = documentBinary.byteLength;

      parentPort.postMessage({
        type: 'sizereport',
        action: 'basis',
        startSize,
        endSize,
      });

      outFileName += '_ktx2';
    }

    if (options.doDraco === true) {
      const startSize = documentBinary.byteLength;

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

      parentPort.postMessage({
        type: 'sizereport',
        action: 'draco',
        startSize,
        endSize,
      });

      outFileName += '_draco';
    }

    outFileName += '_packed' + extension;

    const outFile = path.resolve(outputPath + '/' + outFileName);

    if (outFile === filePath) throw new Error('No modfiications made');

    await io.write(outFile, document);

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
