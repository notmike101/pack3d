const { parentPort } = require('worker_threads');
const { NodeIO } = require('@gltf-transform/core');
const { dedup, weld, reorder, textureResize } = require('@gltf-transform/functions');
const { DracoMeshCompression, TextureTransform, TextureBasisu } = require('@gltf-transform/extensions');
const { MeshoptEncoder } = require('meshoptimizer');
const draco3d = require('draco3dgltf');
const path = require('path');
const { Blob } = require('buffer');

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

    if (options.doBasis === true) {
      const startSize = documentBinary.byteLength;

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
          decodeSpeed: 1,
          encodeSpeed: 1,
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

      outFileName += '_dedup';
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

      outFileName += '_reorder';
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

      outFileName += '_weld';
    }

    if (options.doResize === true) {
      const startSize = documentBinary.byteLength;

      await document.transform(textureResize());
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

    outFileName += extension;

    const outFile = path.resolve(outputPath + '/' + outFileName);

    if (outFile === filePath) throw new Error('No modfiications made');

    await io.write(outFile, document);

    return {
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
    doResize: data.doResize,
    doBasis: data.doBasis,
    doDraco: data.doDraco,
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
