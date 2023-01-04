import { parentPort, workerData } from 'worker_threads';
import { NodeIO, FileUtils, ImageUtils } from '@gltf-transform/core';
import { dedup, weld, reorder, textureResize, instance, listTextureSlots, getTextureChannelMask, oxipng } from '@gltf-transform/functions';
import { DracoMeshCompression, TextureBasisu, LightsPunctual, ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptEncoder } from 'meshoptimizer';
import { spawn } from 'child_process';
import draco3d from 'draco3dgltf';
import path from 'path';
import tmp from 'tmp';
import fs from 'fs/promises';
import micromatch from 'micromatch';
import squoosh from '@squoosh/lib';
import { Logger, Verbosity } from './Logger';
import { waitExit, reportSize, createParams } from './utils';
import { MICROMATCH_OPTIONS } from './constants';

import type { Document } from '@gltf-transform/core';
import type { IPackOptions, IPackJobRequest } from 'types';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

const doDedupe = async (document: Document, documentBinary: Uint8Array, fileName: string, appendString = '') => {
  const startSize = documentBinary.byteLength;

  await document.transform(dedup());
  documentBinary = await io.writeBinary(document);

  const endSize = documentBinary.byteLength;

  reportSize('dedupe', startSize, endSize);

  return fileName + appendString;
};

const doInstancing = async (document: Document, documentBinary: Uint8Array, fileName: string, appendString = '') => {
  const startSize = documentBinary.byteLength;

  await document.transform(instance());
  documentBinary = await io.writeBinary(document);

  const endSize = documentBinary.byteLength;

  reportSize('instance', startSize, endSize);

  return fileName + appendString;
};

const doReorder = async (document: Document, documentBinary: Uint8Array, fileName: string, appendString = '') => {
  const startSize = documentBinary.byteLength;

  await document.transform(reorder({
    encoder: MeshoptEncoder,
  }));
  documentBinary = await io.writeBinary(document);

  const endSize = documentBinary.byteLength;

  reportSize('reorder', startSize, endSize);

  return fileName + appendString;
};

const doWeld = async (document: Document, documentBinary: Uint8Array, fileName: string, appendString = '') => {
  const startSize = documentBinary.byteLength;

  await document.transform(weld());
  documentBinary = await io.writeBinary(document);

  const endSize = documentBinary.byteLength;

  reportSize('weld', startSize, endSize);

  return fileName + appendString;
};

const doResize = async (document: Document, documentBinary: Uint8Array, options: IPackOptions, fileName: string, appendString = '') => {
  const startSize = documentBinary.byteLength;

  await document.transform(textureResize({
    size: [options.textureResolutionWidth, options.textureResolutionHeight],
    filter: options.resamplingFilter,
  }));

  documentBinary = await io.writeBinary(document);

  const endSize = documentBinary.byteLength;

  reportSize('resize', startSize, endSize);

  return fileName + appendString;
};

const doPNGTextureCompression = async (document: Document, pngFormatFilter) => {
  const formats = micromatch.makeRe(String(pngFormatFilter), MICROMATCH_OPTIONS);

  await document.transform(oxipng({ formats, squoosh }));
};

const doBasis = async (document: Document, documentBinary: Uint8Array, options: IPackOptions, fileName: string, logger: Logger, appendString = '') => {
  const startSize = documentBinary.byteLength;
  const ktx2Path = path.resolve(process.cwd(), 'ktx2_bins');

  documentBinary = await io.writeBinary(document);

  if (options.basisMethod === 'PNG') {
    doPNGTextureCompression(document, options.pngFormatFilter);
  } else {
    const lightExtension = document.createExtension(LightsPunctual).setRequired(true);
    const basisuExtension = document.createExtension(TextureBasisu).setRequired(true);

    const textures = document.getRoot().listTextures();
    let numCompressed = 0;

    const promises = textures.map(async (texture, textureIndex) => {
      const slots = listTextureSlots(document, texture);
      const channels = getTextureChannelMask(document, texture);
      const textureLabel = texture.getURI() || texture.getName() || `${textureIndex + 1}/${document.getRoot().listTextures().length}`;
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

      const params = [
        ...createParams(slots, channels, size, logger, textures.length, {
          filter: options.resamplingFilter,
          mode: options.basisMethod,
          quality: options.basisMethod === 'ETC1S' ? options.etc1sQuality : undefined,
          level: options.basisMethod === 'UASTC' ? options.uastcLevel : undefined,
          powerOfTwo: options.basisMethod === 'ETC1S' ? options.etc1sResizeNPOT : options.uastcResizeNPOT,
        }),
        outPath,
        inPath
      ];

      logger.debug(`${prefix}: Spawning -> ${ktx2Path}/toktx: ${params.join(' ')}`);

      const [ status, stdout, stderr ]  = await waitExit(spawn(ktx2Path + '/toktx.exe', params));

      if (status !== 0) {
        logger.error(`${prefix}: Failed -> \n\n${(stderr as any).toString()}`);
      } else {
        texture.setImage(await fs.readFile(outPath)).setMimeType('image/ktx2');

        if (texture.getURI()) {
          texture.setURI(FileUtils.basename(texture.getURI()) + '.ktx2');
        }

        numCompressed++;
      }

      const outBytes = texture?.getImage()?.byteLength ?? 0;

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
};

const doDraco = async (document: Document, documentBinary: Uint8Array, options: IPackOptions, fileName: string, appendString = '') => {
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
      method: options.vertexCompressionMethod === 'edgebreaker' ? 1 : 0,
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
};

const doPack = async (options: IPackJobRequest): Promise<{ name: string, path: string, binary: Uint8Array } | Error | unknown> => {
  try {
    if (!options.file) throw new Error('No file path specified');
    if (!options.outputPath) throw new Error('No output path specified');

    const filePathInfo = path.parse(options.file);
    const document = await io.read(options.file);
    let documentBinary = await io.writeBinary(document);
    const extension = filePathInfo.ext;
    let outFileName = filePathInfo.name;
    const logger = new Logger(Verbosity.DEBUG);

    document.setLogger((logger as any));

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

    const outFile = path.resolve(options.outputPath + '/' + outFileName);

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
};

const main = async () => {
  const data = workerData as IPackJobRequest;
  const options: IPackOptions = { ...workerData } satisfies IPackOptions;
  const startTime = performance.now();

  parentPort?.postMessage({
    type: 'logging',
    text: JSON.stringify(data),
  });

  const output = await doPack(workerData);

  if (output instanceof Error) {
    parentPort?.postMessage({
      type: 'errorreport',
      error: output,
      errorMessage: output.message,
      time: performance.now() - startTime,
    });
  } else {
    parentPort?.postMessage({
      type: 'packreport',
      file: output,
      time: performance.now() - startTime,
    });
  }

  process.exit(0);
}

main();
