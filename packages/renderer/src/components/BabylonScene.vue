<script setup lang="ts">
import '@babylonjs/loaders/gLTF';
import '@babylonjs/core/Helpers/sceneHelpers';
import '@babylonjs/core/Loading/loadingScreen';
import '@babylonjs/core/Engines/Extensions/engine.views';

import { onMounted, onUpdated, ref } from 'vue';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { ISceneLoaderPlugin, ISceneLoaderPluginAsync, SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import type { Ref } from 'vue';
import type { GLTFFileLoader } from '@babylonjs/loaders/glTF/glTFFileLoader';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import type { SmartArray } from '@babylonjs/core/Misc/smartArray';

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
  cameraPosition: CameraPosition | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['cameraMove']);

const canvas: Ref<HTMLCanvasElement | null> = ref(null);
const isGrabbing: Ref<boolean> = ref(false);

let engine: Engine | null = null;
let scene: Scene | null = null;
let camera: ArcRotateCamera | null = null;
let loadedModel: any = null;
let renderNextFrame: boolean = false;
const resizeObserver = new ResizeObserver(resize);

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
  renderNextFrame = true;
}

function addModelToScene(model: string): void {
  loadedModel = model;

  SceneLoader.OnPluginActivatedObservable.addOnce((loader: ISceneLoaderPluginAsync | ISceneLoaderPlugin): void => {
    if (loader.name === 'gltf') {
      (loader as GLTFFileLoader).animationStartMode = 0;
    }
  });

  SceneLoader.Append(model, undefined, undefined, modelAddToSceneSuccess);
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
      const { width, height } = parentElement.getBoundingClientRect();

      engine.setSize(width | 0, height | 0, true);

      renderNextFrame = true;
    }
  }
}

function onUpdatedHandler(): void {
  if (props.cameraPosition !== null) {
    updateCameraPosition(props.cameraPosition);
  }

  if (props.model?.path !== loadedModel) {
    scene!.meshes.forEach((mesh: AbstractMesh) => {
      mesh.dispose();
    });

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

    engine = new Engine(canvas.value);
    scene = new Scene(engine);

    scene.createDefaultEnvironment();

    camera = new ArcRotateCamera('camera', 0, 1, 2, Vector3.Zero(), scene);

    if (props.cameraPosition !== null) {
      updateCameraPosition(props.cameraPosition);
    } else {
      emitCameraPosition();
    }

    engine.inputElement = canvas.value;

    camera.allowUpsideDown = false;
    camera.minZ = 0.1;
    camera.maxZ = 2000;
    camera.lowerRadiusLimit = 1;
    camera.fov = 0.767945;
    camera.inertia = 0,
    camera.panningInertia = 0;
    camera.angularSensibilityX = 350;
    camera.angularSensibilityY = 350;
    camera.panningSensibility = 350;
    camera.wheelPrecision = 10;
    camera.pinchPrecision = 500;

    camera.attachControl(false);

    engine.runRenderLoop(engineRenderLoop);

    if (props.model) {
      addModelToScene(props.model.path);
    }
  }
}

onUpdated(onUpdatedHandler);
onMounted(onMountedHandler);
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
