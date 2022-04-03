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

function pointerUpEventHandler() {
  isGrabbing.value = false;

  if (camera !== null) {
    emitCameraPosition();
  }
}

function pointerDownEventHandler() {
  isGrabbing.value = true;
}

function emitCameraPosition() {
  emit('cameraMove', {
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
  })
}

function pointerMoveEventHandler() {
  if (isGrabbing.value === true && camera !== null) {
    emitCameraPosition();
  }
}

onUpdated(() => {
  if (props.cameraPosition !== null && camera !== null) {
    const { target: newTarget, position: newPosition } = props.cameraPosition;

    camera.target = new Vector3(newTarget.x, newTarget.y, newTarget.z);
    camera.position = new Vector3(newPosition.x, newPosition.y, newPosition.z);
  }

  if (props.model?.path !== loadedModel) {
      const meshes = scene?.getActiveMeshes();
      
      meshes?.forEach((mesh) => {
        mesh.dispose();
      });

      loadedModel = props.model.path;

      SceneLoader.OnPluginActivatedObservable.addOnce((loader: ISceneLoaderPluginAsync | ISceneLoaderPlugin): void => {
        if (loader.name === 'gltf') {
          (loader as GLTFFileLoader).animationStartMode = 0;
        }
      });

      SceneLoader.Append(props.model.path);
    }
});

onMounted((): void => {  
  if (canvas.value) {  
    canvas.value.addEventListener('pointerup', pointerUpEventHandler);
    canvas.value.addEventListener('pointerdown', pointerDownEventHandler);
    canvas.value.addEventListener('pointermove', pointerMoveEventHandler);

    canvas.value.style.width = '100%';
    canvas.value.style.height = '100%';

    engine = new Engine(canvas.value);
    scene = new Scene(engine);

    camera = new ArcRotateCamera('camera', 0, 1, 2, Vector3.Zero(), scene);

    if (props.cameraPosition !== null) {
      const { target: newTarget, position: newPosition } = props.cameraPosition;

      camera.target = new Vector3(newTarget.x, newTarget.y, newTarget.z);
      camera.position = new Vector3(newPosition.x, newPosition.y, newPosition.z);
    } else {
      emitCameraPosition();
    }

    new HemisphericLight('light', Vector3.Up(), scene);

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

    engine.runRenderLoop((): void => {
      if (scene) {
        scene.render();
      }
    });

    SceneLoader.OnPluginActivatedObservable.addOnce((loader: ISceneLoaderPluginAsync | ISceneLoaderPlugin): void => {
      if (loader.name === 'gltf') {
        (loader as GLTFFileLoader).animationStartMode = 0;
      }
    });

    if (props.model) {
      loadedModel = props.model.path;

      SceneLoader.Append(props.model.path);
    }
  }
});
</script>

<template>
  <div class="canvas-wrapper">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<style lang="scss" scoped>
.canvas-wrapper {
  overflow: hidden;
  height: 100%;
  width: 100%;

  canvas {
    cursor: grab;
    width: 100%;
    height: 100%;
  }
}
</style>
