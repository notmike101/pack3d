<script setup lang="ts">
import '@babylonjs/loaders/gLTF';
import '@babylonjs/core/Helpers/sceneHelpers';
import '@babylonjs/core/Loading/loadingScreen';
import '@babylonjs/core/Engines/Extensions/engine.views';

import { onMounted, onUnmounted, ref } from 'vue';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { ISceneLoaderPlugin, ISceneLoaderPluginAsync, SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import type { Ref } from 'vue';
import type { GLTFFileLoader } from '@babylonjs/loaders/glTF/glTFFileLoader';

interface Props {
  model: File;
}

const props = defineProps<Props>();
const canvas: Ref<HTMLCanvasElement | null> = ref(null);

let engine: Engine | null = null;
let scene: Scene | null = null;
let camera: ArcRotateCamera | null = null;

onUnmounted((): void => {
  if (engine) {
    engine.dispose();
  }
});

onMounted((): void => {  
  if (canvas.value) {
    canvas.value.style.width = '100%';
    canvas.value.style.height = '100%';

    engine = new Engine(canvas.value);
    scene = new Scene(engine);
    camera = new ArcRotateCamera('camera', 0, 1, 2, Vector3.Zero(), scene);

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
