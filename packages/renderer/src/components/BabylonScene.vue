<script setup lang="ts">
import '@babylonjs/loaders/glTF/2.0';
import '@babylonjs/core/Helpers/sceneHelpers';
import '@babylonjs/core/Loading/loadingScreen';
import '@babylonjs/core/Engines/Extensions/engine.views';

import { onMounted, onUpdated, ref, inject, watch, onUnmounted } from 'vue';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { ISceneLoaderPlugin, ISceneLoaderPluginAsync, SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { BoundingInfo } from '@babylonjs/core/Culling/boundingInfo';
import { AssetContainer } from '@babylonjs/core/assetContainer';
import { GLTFFileLoader } from '@babylonjs/loaders/glTF/glTFFileLoader';
import { DracoCompression } from '@babylonjs/core/Meshes/Compression/dracoCompression';
import { KhronosTextureContainer2 } from '@babylonjs/core/Misc/khronosTextureContainer2';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import type { Ref } from 'vue';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';

interface CameraPosition {
  target: {
    x: number;
    y: number;
    z: number;
  }
  position: {
    x: number;
    y: number;
    z: number;
  }
}

interface Props {
  model: File;
}

const props: Props = defineProps<Props>();
const emit = defineEmits(['cameraMove']);

const canvas: Ref<HTMLCanvasElement | null> = ref<HTMLCanvasElement | null>(null);
const cameraPosition: Ref<CameraPosition | null> = inject('cameraPosition')!;

let engine: Engine | null = null;
let scene: Scene | null = null;
let camera: ArcRotateCamera | null = null;
let loadedModelPath: any = null;
let renderNextFrame: number = 0;
let activeEntity: AssetContainer | null = null;
let savedCameraPosition: CameraPosition | null = null;
const resizeObserver: ResizeObserver = new ResizeObserver(resize);

GLTFFileLoader.IncrementalLoading = false;

SceneLoader.OnPluginActivatedObservable.add((loader: ISceneLoaderPluginAsync | ISceneLoaderPlugin): void => {
  if (loader.name === 'gltf') {
    (loader as GLTFFileLoader).animationStartMode = 0;
  }
});

DracoCompression.Configuration = {
  decoder: {
    wasmUrl: new URL('../../public/wasm/draco/draco_decoder_gltf.js', import.meta.url).href,
    wasmBinaryUrl: new URL('../../public/wasm/draco/draco_decoder_gltf.wasm', import.meta.url).href,
    fallbackUrl: new URL('../../public/wasm/draco/draco_wasm_wrapper_gltf.js', import.meta.url).href,
  },
};

KhronosTextureContainer2.URLConfig = {
  jsDecoderModule: new URL('../../public/wasm/ktx2/ktx2Decoder.js', import.meta.url).href,
  jsMSCTranscoder: new URL('../../public/wasm/basis/msc_basis_transcoder.js', import.meta.url).href,
  wasmMSCTranscoder: new URL('../../public/wasm/basis/msc_basis_transcoder.wasm', import.meta.url).href,
  wasmUASTCToASTC: null,
  wasmUASTCToBC7: new URL('../../public/wasm/ktx2/uastc_bc7.wasm', import.meta.url).href,
  wasmUASTCToRGBA_SRGB: new URL('../../public/wasm/ktx2/uastc_rgba_srgb.wasm', import.meta.url).href,
  wasmUASTCToRGBA_UNORM: new URL('../../public/wasm/ktx2/uastc_rgba32_unorm.wasm', import.meta.url).href,
  wasmZSTDDecoder: null,
};

function pointerUpEventHandler(): void {
  if (canvas.value) {
    canvas.value.removeEventListener('pointermove', pointerMoveEventHandler);
  }

  if (!camera!.position.equals(savedCameraPosition!.position as Vector3) || !camera!.target.equals(savedCameraPosition!.target as Vector3)) {
    emitCameraPosition();
  }
}

function pointerDownEventHandler(): void {  
  if (canvas.value) {
    canvas.value.addEventListener('pointermove', pointerMoveEventHandler);
  }

  savedCameraPosition = {
    position: camera!.position,
    target: camera!.target,
  };

  renderNextFrame += 1;
}

function pointerMoveEventHandler(): void {
  renderNextFrame += 1;

  emitCameraPosition();
}

function wheelEventHandler(): void {
  renderNextFrame += 1;

  emitCameraPosition();
}

function emitCameraPosition(): void {
  if (camera !== null) {
    const newCameraPosition: CameraPosition = {
      position: {
        x: camera?.position.x,
        y: camera?.position.y,
        z: camera?.position.z,
      },
      target: {
        x: camera?.target.x,
        y: camera?.target.y,
        z: camera?.target.z,
      },
    };

    emit('cameraMove', newCameraPosition);
  }
}

function getBoundingInfo(mesh: AbstractMesh | Mesh): BoundingInfo {
  const childMeshes: AbstractMesh[] = mesh.getChildMeshes();
  const min: Vector3 = childMeshes[0].getBoundingInfo().boundingBox.minimumWorld;
  const max: Vector3 = childMeshes[0].getBoundingInfo().boundingBox.maximumWorld;

  childMeshes.forEach((childMesh: AbstractMesh) => {
    const { boundingBox }: BoundingInfo = childMesh.getBoundingInfo();

    min.minimizeInPlace(boundingBox.minimumWorld);
    max.maximizeInPlace(boundingBox.maximumWorld);
  });

  return new BoundingInfo(min, max);
}

function createEnvironment(): void {
  if (engine) {
    engine.dispose();
  }

  engine = new Engine(canvas.value);
  scene = new Scene(engine);

  scene.createDefaultLight();
  scene.createDefaultSkybox();

  camera = new ArcRotateCamera('camera', 0, 1, 2, Vector3.Zero(), scene);

  engine.inputElement = canvas.value;

  camera.allowUpsideDown = false;
  camera.minZ = 0.1;
  camera.lowerRadiusLimit = 1;
  camera.fov = 0.767945;
  camera.inertia = 0,
  camera.panningInertia = 0;

  camera.attachControl(false);

  engine.runRenderLoop(engineRenderLoop);

  renderNextFrame += 1;
}

function fitCameraToFrame(): void {
  if (activeEntity === null) return;
  if (!camera) return;

  const { boundingBox, boundingSphere }: BoundingInfo = getBoundingInfo(activeEntity.createRootMesh());

  const newCameraPosition: CameraPosition = {
    position: {
      x: boundingBox.centerWorld.x,
      y: boundingBox.centerWorld.y,
      z: boundingSphere.radiusWorld * 2,
    },
    target: {
      x: boundingBox.centerWorld.x,
      y: boundingBox.centerWorld.y,
      z: boundingBox.centerWorld.z,
    },
  };

  setCameraPosition(newCameraPosition);

  emitCameraPosition();

  renderNextFrame += 1;
}

function addModelToScene(modelPath: string): Promise<void> {
  return new Promise(async (resolve): Promise<void> => {
    if (activeEntity !== null) {
      activeEntity.removeAllFromScene();
    }

    const assetContainer: AssetContainer = await SceneLoader.LoadAssetContainerAsync(modelPath, undefined, scene);

    activeEntity = assetContainer;
    loadedModelPath = modelPath;

    assetContainer.addAllToScene();

    renderNextFrame += 1;

    setTimeout((): void => {
      renderNextFrame += 1;

      resolve();
    }, 250);
  });
}

function engineRenderLoop(): void {
  if (scene && renderNextFrame > 0) {
    renderNextFrame = 0;

    scene.render();
  }
}

function setCameraPosition(newCameraPosition: CameraPosition): void {
  if (camera !== null) {
    camera.position = new Vector3(newCameraPosition.position.x, newCameraPosition.position.y, newCameraPosition.position.z);
    camera.target = new Vector3(newCameraPosition.target.x, newCameraPosition.target.y, newCameraPosition.target.z);

    renderNextFrame += 1;
  }
}

function resize(): void {
  if (engine && canvas.value) {
    const { parentElement }: HTMLElement = canvas.value;

    if (parentElement) {
      engine.setSize(0, 0);

      const { width, height }: DOMRect = parentElement.getBoundingClientRect();

      engine.setSize(width | 0, height | 0, true);

      renderNextFrame += 1;
    }
  }
}

async function onUpdatedHandler(): Promise<void> {
  if (props.model?.path !== loadedModelPath) {
    const replacingExistingModel: boolean = activeEntity !== null;

    await addModelToScene(props.model.path);

    if (replacingExistingModel || cameraPosition.value === null) {
      fitCameraToFrame();
    } else if(cameraPosition.value !== null) {
      setCameraPosition(cameraPosition.value);
    }
  }
}

async function onMountedHandler(): Promise<void> {
  if (canvas.value) {  
    canvas.value.addEventListener('pointerup', pointerUpEventHandler);
    canvas.value.addEventListener('pointerdown', pointerDownEventHandler);
    canvas.value.addEventListener('wheel', wheelEventHandler);

    if (canvas.value.parentElement) {
      resizeObserver.observe(canvas.value.parentElement);
    }

    createEnvironment();

    if (props.model) {
      await addModelToScene(props.model.path);
    }

    if (cameraPosition.value === null) {
      fitCameraToFrame();
    } else {
      setCameraPosition(cameraPosition.value);
    }
  }
}

function cameraPositionWatcher(): void {
  if (cameraPosition.value !== null) {
    setCameraPosition(cameraPosition.value);
  }
}

function onUnmountedHandler(): void {
  if (canvas.value) {
    canvas.value.removeEventListener('pointerup', pointerUpEventHandler);
    canvas.value.removeEventListener('pointerdown', pointerDownEventHandler);
    canvas.value.removeEventListener('pointermove', pointerMoveEventHandler);
    canvas.value.removeEventListener('wheel', wheelEventHandler);

    if (canvas.value.parentElement) {
      resizeObserver.unobserve(canvas.value.parentElement);
    }

    if (engine) {
      engine.dispose();
    }
  }
}

onUpdated(onUpdatedHandler);
onMounted(onMountedHandler);
onUnmounted(onUnmountedHandler);
watch(cameraPosition, cameraPositionWatcher);
</script>

<template>
  <canvas ref="canvas"></canvas>
</template>

<style lang="scss" scoped>
canvas {
  cursor: grab;
  height: 100%;
  width: 100%;
  aspect-ratio: unset;
}
</style>
