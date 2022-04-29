<!--
/**
 * Licensed Materials - Property of Michael Orozco
 * (C) Copyright Michael Orozco 2022
 */
-->
<script setup lang="ts">
import '@babylonjs/loaders/gLTF';
import '@babylonjs/core/Helpers/sceneHelpers';
import '@babylonjs/core/Loading/loadingScreen';
import '@babylonjs/core/Engines/Extensions/engine.views';

import { onMounted, onUpdated, ref, inject, watch } from 'vue';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { ISceneLoaderPlugin, ISceneLoaderPluginAsync, SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import type { GLTFFileLoader } from '@babylonjs/loaders/glTF/glTFFileLoader';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { BoundingInfo } from '@babylonjs/core/Culling/boundingInfo';
import type { Ref } from 'vue';

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

const props = defineProps<Props>();
const emit = defineEmits(['cameraMove']);

const canvas = ref<HTMLCanvasElement | null>(null);
const isGrabbing = ref<boolean>(false);

let engine: Engine | null = null;
let scene: Scene | null = null;
let camera: ArcRotateCamera | null = null;
let loadedModelPath: any = null;
let loadedModel: AbstractMesh | null = null;
let renderNextFrame: boolean = false;
const resizeObserver = new ResizeObserver(resize);

const cameraPosition: Ref<CameraPosition | null> = inject('cameraPosition')!;

function pointerUpEventHandler(): void {
  isGrabbing.value = false;

  emitCameraPosition();
}

function pointerDownEventHandler(): void {
  isGrabbing.value = true;
}

function emitCameraPosition(): void {
  if (camera !== null) {
    const cameraPosition: CameraPosition = {
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

    emit('cameraMove', cameraPosition);
  }
}

function pointerMoveEventHandler(): void {
  if (isGrabbing.value === true && camera !== null) {
    renderNextFrame = true;

    emitCameraPosition();
  }
}

function modelAddToSceneSuccess(): void {
  loadedModel = scene?.rootNodes.find((node) => node.name === '__root__') as AbstractMesh ?? null;

  if (cameraPosition.value !== null) {
    updateCameraPosition(cameraPosition.value);
  } else {
    const { boundingBox, boundingSphere } = getBoundingInfo(loadedModel);

    updateCameraPosition({
      position: {
        x: 0,
        y: 0,
        z: boundingSphere.radius * 2,
      },
      target: {
        x: boundingBox.center.x,
        y: boundingBox.center.y,
        z: boundingBox.center.z,
      },
    });

    emitCameraPosition();
  }

  renderNextFrame = true;
}

function getBoundingInfo(mesh: AbstractMesh) {
  const childMeshes = mesh.getChildMeshes();
  const min = childMeshes[0].getBoundingInfo().boundingBox.minimumWorld;
  const max = childMeshes[0].getBoundingInfo().boundingBox.maximumWorld;

  childMeshes.forEach((childMesh) => {
    const { boundingBox } = childMesh.getBoundingInfo();

    min.minimizeInPlace(boundingBox.minimumWorld);
    max.maximizeInPlace(boundingBox.maximumWorld);
  });

  const boundingInfo = new BoundingInfo(min, max);

  return {
    boundingBox: boundingInfo.boundingBox,
    boundingSphere: boundingInfo.boundingSphere,
  }
}

function createEnvironment() {
  if (engine) {
    engine.dispose();
  }

  engine = new Engine(canvas.value);
  scene = new Scene(engine);
  
  (window as any).scene = scene;

  scene.createDefaultLight();
  scene.createDefaultSkybox();

  camera = new ArcRotateCamera('camera', 0, 1, 2, Vector3.Zero(), scene);

  engine.inputElement = canvas.value;

  camera.allowUpsideDown = false;
  camera.minZ = 0.1;
  // camera.maxZ = 2000;
  camera.lowerRadiusLimit = 1;
  camera.fov = 0.767945;
  camera.inertia = 0,
  camera.panningInertia = 0;
  // camera.angularSensibilityX = 350;
  // camera.angularSensibilityY = 350;
  // camera.panningSensibility = 350;
  // camera.wheelPrecision = 10;
  // camera.pinchPrecision = 500;
  // camera.useFramingBehavior = true;

  // const framingBehavior = camera.getBehaviorByName("Framing") as FramingBehavior;

  // if (framingBehavior) {
  //   framingBehavior.framingTime = 0;
  //   framingBehavior.elevationReturnTime = -1;
  // }

  camera.attachControl(false);

  engine.runRenderLoop(engineRenderLoop);

  renderNextFrame = true;
}

function addModelToScene(model: string): void {
  loadedModelPath = model;

  // createEnvironment();

  SceneLoader.OnPluginActivatedObservable.addOnce((loader: ISceneLoaderPluginAsync | ISceneLoaderPlugin): void => {
    if (loader.name === 'gltf') {
      (loader as GLTFFileLoader).animationStartMode = 0;
    }
  });

  SceneLoader.Append(model, undefined, undefined, modelAddToSceneSuccess);

  renderNextFrame = true;
}

function engineRenderLoop(): void {
  if (scene && renderNextFrame === true) {
    renderNextFrame = false;

    scene.render();
  }
}

function updateCameraPosition(cameraPosition: CameraPosition) {
  if (camera !== null) {
    camera.position = new Vector3(cameraPosition.position.x, cameraPosition.position.y, cameraPosition.position.z);
    camera.target = new Vector3(cameraPosition.target.x, cameraPosition.target.y, cameraPosition.target.z);
    
    renderNextFrame = true;
  }
}

function wheelEventHandler(): void {
  renderNextFrame = true;
}

function resize(): void {
  if (engine && canvas.value) {
    const { parentElement } = canvas.value;

    if (parentElement) {
      engine.setSize(0, 0);

      const { width, height } = parentElement.getBoundingClientRect();

      engine.setSize(width | 0, height | 0, true);

      renderNextFrame = true;
    }
  }
}

function onUpdatedHandler(): void {
  if (props.model?.path !== loadedModelPath) {
    for (const mesh of scene!.meshes) {
      (mesh as AbstractMesh).dispose();
    }

    addModelToScene(props.model.path);
  }
}

function onMountedHandler(): void {
  if (canvas.value) {  
    canvas.value.addEventListener('pointerup', pointerUpEventHandler);
    canvas.value.addEventListener('pointerdown', pointerDownEventHandler);
    canvas.value.addEventListener('pointermove', pointerMoveEventHandler);
    canvas.value.addEventListener('wheel', wheelEventHandler);

    if (canvas.value.parentElement) {
      resizeObserver.observe(canvas.value.parentElement);
    }

    createEnvironment();

    if (props.model) {
      addModelToScene(props.model.path);
    }
  }
}

function cameraPositionWatcher() {
  if (cameraPosition.value !== null) {
    updateCameraPosition(cameraPosition.value);
  }
}

onUpdated(onUpdatedHandler);
onMounted(onMountedHandler);
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
