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
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { BoundingInfo } from '@babylonjs/core/Culling/boundingInfo';
import { AssetContainer } from '@babylonjs/core/assetContainer';
import { GLTFFileLoader } from '@babylonjs/loaders/glTF/glTFFileLoader';
import { DracoCompression } from '@babylonjs/core/Meshes/Compression/dracoCompression';
import { KhronosTextureContainer2 } from '@babylonjs/core/Misc/khronosTextureContainer2';
import { PointerEventTypes, PointerInfo } from '@babylonjs/core/Events/pointerEvents.js';
import { waitFrames } from '../utils';

import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import type { Ref } from 'vue';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';

interface CameraPosition {
  target: Vector3;
  position: Vector3;
}

interface Props {
  model: File;
}

const props: Props = defineProps<Props>();
const emit = defineEmits(['cameraMove']);

const canvas = ref<HTMLCanvasElement | null>(null);
const cameraPosition = inject('cameraPosition') as Ref<CameraPosition | null>;
const engine = ref<Engine | null>(null);
const scene = ref<Scene | null>(null);
const camera = ref<ArcRotateCamera | null>(null);
const loadedModelPath = ref<string | null>(null);
const renderNextFrame = ref<number>(0);
const renderSemaphore = ref<number>(0);
const activeEntity = ref<AssetContainer | null>(null);
const savedCameraPosition = ref<CameraPosition | null>(null);
const resizeObserver = ref<ResizeObserver | null>(null);
const isCanvasGrabbed = ref<boolean>(false);

GLTFFileLoader.IncrementalLoading = false;

SceneLoader.OnPluginActivatedObservable.add((loader) => {
  if (loader.name === 'gltf') {
    (loader as GLTFFileLoader).animationStartMode = 0;
  }
});

DracoCompression.Configuration = {
  decoder: {
    wasmUrl: './wasm/draco/draco_decoder_gltf.js',
    wasmBinaryUrl: './wasm/draco/draco_decoder_gltf.wasm',
    fallbackUrl: './wasm/draco/draco_wasm_wrapper_gltf.js',
  },
};

KhronosTextureContainer2.URLConfig = {
  jsDecoderModule: './wasm/ktx2/ktx2Decoder.js',
  jsMSCTranscoder: './wasm/basis/msc_basis_transcoder.js',
  wasmMSCTranscoder: './wasm/basis/msc_basis_transcoder.wasm',
  wasmUASTCToASTC: null,
  wasmUASTCToBC7: './wasm/ktx2/uastc_bc7.wasm',
  wasmUASTCToRGBA_SRGB: './wasm/ktx2/uastc_rgba_srgb.wasm',
  wasmUASTCToRGBA_UNORM: './wasm/ktx2/uastc_rgba32_unorm.wasm',
  wasmZSTDDecoder: null,
};

const pointerUpEventHandler = () => {
  isCanvasGrabbed.value = false;
  renderSemaphore.value -= 1;

  if (camera.value && savedCameraPosition.value) {
    if (!camera.value.position.equals(savedCameraPosition.value.position) || !camera.value.target.equals(savedCameraPosition.value.target)) {
      emitCameraPosition();
    }
  }
};

const pointerDownEventHandler = () => {
  isCanvasGrabbed.value = true;
  renderSemaphore.value += 1;

  if (camera.value) {
    savedCameraPosition.value = {
      position: camera.value.position.clone(),
      target: camera.value.target.clone(),
    };
  }
};

const pointerMoveEventHandler = () => {
  if (isCanvasGrabbed.value === false) return;

  renderNextFrame.value += 1;

  emitCameraPosition();
};

const wheelEventHandler = () => {
  renderNextFrame.value += 1;

  emitCameraPosition();
};

const emitCameraPosition = () => {
  if (!camera.value) return;

  const newCameraPosition: CameraPosition = {
    position: camera.value.position.clone(),
    target: camera.value.target.clone(),
  };

  emit('cameraMove', newCameraPosition);
};

const getBoundingInfo = (mesh: AbstractMesh | Mesh) => {
  const childMeshes = mesh.getChildMeshes();
  const min = childMeshes[0].getBoundingInfo().boundingBox.minimumWorld;
  const max = childMeshes[0].getBoundingInfo().boundingBox.maximumWorld;

  childMeshes.forEach((childMesh) => {
    const { boundingBox } = childMesh.getBoundingInfo();

    min.minimizeInPlace(boundingBox.minimumWorld);
    max.maximizeInPlace(boundingBox.maximumWorld);
  });

  return new BoundingInfo(min, max);
};

const createEnvironment = () => {
  if (engine.value) {
    engine.value.dispose();
  }

  engine.value = new Engine(canvas.value);
  scene.value = new Scene(engine.value as Engine);

  scene.value.createDefaultEnvironment({
    createGround: false,
  });

  camera.value = new ArcRotateCamera('camera', 0, 1, 2, Vector3.Zero(), scene.value as Scene);

  engine.value.inputElement = canvas.value;

  camera.value.allowUpsideDown = false;
  camera.value.minZ = 0.1;
  camera.value.lowerRadiusLimit = 1;
  camera.value.fov = 0.767945;
  camera.value.inertia = 0,
  camera.value.panningInertia = 0;

  camera.value.attachControl(false);

  scene.value.onPointerObservable.add(pointerObservable);

  engine.value.runRenderLoop(engineRenderLoop);

  renderNextFrame.value += 1;
};

const fitCameraToFrame = () => {
  if (activeEntity.value === null) return;
  if (!camera.value) return;

  const { boundingBox, boundingSphere } = getBoundingInfo(activeEntity.value.createRootMesh());

  const newCameraPosition: CameraPosition = {
    position: new Vector3(boundingBox.centerWorld.x, boundingBox.centerWorld.y, boundingSphere.radiusWorld * 2),
    target: boundingBox.centerWorld.clone(),
  };

  setCameraPosition(newCameraPosition);

  emitCameraPosition();

  renderNextFrame.value += 1;
};

const addModelToScene = async (modelPath: string) => {
  if (activeEntity.value !== null) {
    activeEntity.value.removeAllFromScene();
  }

  const assetContainer = await SceneLoader.LoadAssetContainerAsync(modelPath, undefined, scene.value as Scene);

  activeEntity.value = assetContainer;
  loadedModelPath.value = modelPath;

  assetContainer.addAllToScene();

  renderSemaphore.value += 1;
  await waitFrames(5, scene.value as Scene);
  renderSemaphore.value -= 1;
};

const engineRenderLoop = () => {
  if (!scene.value) return;

  if (renderNextFrame.value > 0 || renderSemaphore.value > 0) {
    renderNextFrame.value = 0;

    scene.value.render();
  }
};

const setCameraPosition = (newCameraPosition: CameraPosition) => {
  if (!camera.value) return;

  camera.value.position = newCameraPosition.position.clone();
  camera.value.target = newCameraPosition.target.clone();

  renderNextFrame.value += 1;
};

const resize = () => {
  if (!engine.value || !canvas.value) return;

  const { parentElement } = canvas.value;

  if (parentElement) {
    engine.value.setSize(0, 0);

    const { width, height } = parentElement.getBoundingClientRect();

    engine.value.setSize(width | 0, height | 0, true);

    renderNextFrame.value += 1;
  }
};

const onUpdatedHandler = async () => {
  if (props.model?.path === loadedModelPath.value) return;

  createEnvironment();

  const replacingExistingModel = activeEntity.value !== null;

  await addModelToScene(props.model.path);

  if (replacingExistingModel || cameraPosition.value === null) {
    fitCameraToFrame();
  } else if(cameraPosition.value !== null) {
    setCameraPosition(cameraPosition.value);
  }
};

const pointerObservable = (pointerInfo: PointerInfo) => {
  if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
    pointerDownEventHandler();
  } else if (pointerInfo.type === PointerEventTypes.POINTERUP) {
    pointerUpEventHandler();
  } else if (pointerInfo.type === PointerEventTypes.POINTERMOVE && isCanvasGrabbed.value === true) {
    pointerMoveEventHandler();
  } else if (pointerInfo.type === PointerEventTypes.POINTERWHEEL) {
    wheelEventHandler();
  }
};

const onMountedHandler = async () => {
  if (!canvas.value) return;

  if (resizeObserver.value === null) {
    resizeObserver.value = new ResizeObserver(resize);
  }

  if (canvas.value.parentElement) {
    resizeObserver.value.observe(canvas.value.parentElement);
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
};

const cameraPositionWatcher = (newValue: CameraPosition | null) => {
  if (!newValue) return;

  setCameraPosition(newValue);
};

const onUnmountedHandler = () => {
  if (engine.value) {
    engine.value.dispose();
  }

  if (canvas.value?.parentElement && resizeObserver.value !== null) {
    resizeObserver.value.unobserve(canvas.value.parentElement);
    resizeObserver.value = null;
  }
};

onUpdated(onUpdatedHandler);
onMounted(onMountedHandler);
onUnmounted(onUnmountedHandler);
watch(cameraPosition, cameraPositionWatcher);
</script>

<template>
  <canvas ref="canvas" class="cursor-grab h-full w-full aspect-[unset] outline-none select-none"></canvas>
</template>
