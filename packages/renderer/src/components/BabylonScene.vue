<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Ref } from 'vue';

function createScene(canvas: HTMLCanvasElement) {
  const engine: Engine = new Engine(canvas);
  const scene: Scene = new Scene(engine);
  const camera: FreeCamera = new FreeCamera('camera1', new Vector3(0, 5, -10), scene);
  const box: Mesh = MeshBuilder.CreateBox('box', { size: 2 }, scene);
  const material = new StandardMaterial('box-material', scene);

  new HemisphericLight('light', Vector3.Up(), scene);
  
  material.diffuseColor = Color3.Blue();
  box.material = material;

  camera.setTarget(Vector3.Zero());
  
  engine.runRenderLoop((): void => {
    scene.render();
  });
}

const props = defineProps({
  name: String,
  width: String,
  height: String,
});

const canvas: Ref<HTMLCanvasElement | null> = ref(null);

onMounted((): void => {  
  if (canvas.value) {
    canvas.value.style.width = '100%';
    canvas.value.style.height = '100%';

    createScene(canvas.value);
  }
});
</script>

<template>
  <canvas ref="canvas"></canvas>
</template>
