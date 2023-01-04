import type { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { TextureResizeFilter } from '@gltf-transform/functions';

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production';
    readonly VITE_DEV_SERVER_HOST: string;
    readonly VITE_DEV_SERVER_PORT: number | string;
  }
}

export interface IPackOptions {
  doDedupe: boolean;
  doReorder: boolean;
  doWeld: boolean;
  doInstancing: boolean;
  doResize: boolean;
  doBasis: boolean;
  doDraco: boolean;
  resamplingFilter: TextureResizeFilter;
  textureResolutionWidth: EnumTextureResolution;
  textureResolutionHeight: EnumTextureResolution;
  vertexCompressionMethod: 'edgebreaker' | 'sequential';
  quantizationVolume: 'mesh' | 'scene';
  quantizationColor: number;
  quantizationGeneric: number;
  quantizationNormal: number;
  quantizationPosition: number;
  quantizationTexCoord: number;
  basisMethod: 'UASTC' | 'ETC1S' | 'PNG';
  pngFormatFilter: 'JPEG' | 'PNG' | 'ALL';
  etc1sQuality: number;
  etc1sResizeNPOT: boolean;
  uastcLevel: EnumUASTCLevel;
  uastcResizeNPOT: boolean;
  encodeSpeed: number;
  decodeSpeed: number;
}

export interface IPackJobRequest extends IPackOptions {
  file: string;
  outputPath: string;
}

export interface CameraPosition {
  target: Vector3,
  position: Vector3,
}

export enum EnumUASTCLevel {
  'Fastest' = 0,
  'Fast' = 1,
  'Default' = 2,
  'Slow' = 3,
  'Very Slow' = 4,
}

export enum EnumTextureResolution {
  '128' = 128,
  '256' = 256,
  '512' = 512,
  '1024' = 1024,
  '2048' = 2048,
  '4096' = 4096,
}
