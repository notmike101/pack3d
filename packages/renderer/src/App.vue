<script setup lang="ts">
import { ref } from 'vue'
import BabylonScene from './components/BabylonScene.vue';

const activeFile = ref<File | null>(null);

function drop(event: DragEvent): void {
  event.preventDefault();
  event.stopPropagation();

  if (event.dataTransfer?.files) {
    const droppedFiles: FileList = event.dataTransfer.files;

    for (let i: number = 0; i < droppedFiles.length; i++) {
      const file: File | null = droppedFiles.item(i);

      if (file) {
        activeFile.value = file;
      }
    }
  }
}
</script>

<template>
  <div class="wrapper" @drop="drop">
    <aside>
      <p class="title">Drop File Into Window</p>
    </aside>
    <main>
      <div class="canvasContainer">
        <BabylonScene name="leftCanvas" />
      </div>
      <div class="canvasContainer">
        <BabylonScene name="rightCanvas" />
      </div>
    </main>
  </div>
</template>

<style lang="scss">
body {
  margin: 0;
  padding: 0;
  height: 100vh;

  #app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    height: 100%;
    width: 100%;
  }
}
</style>

<style lang="scss" scoped>
.wrapper {
  display: flex;
  flex-direction: row;
  height: 100%;

  aside {
    $width: 200px;

    width: $width;
    min-width: $width;
    background-color: #ecf0f1;
    border-right: 1px solid #bdc3c7;

    .title {
      margin: 0;
      padding: 10px 0;
      border-bottom: 1px solid black;
    }
  }

  main {
    display: flex;
    flex: 1;
    flex-direction: row;
    width: 100%;
    max-width: 100%;
    overflow: hidden;

    .canvasContainer {
      width: 50%;

      &:first-of-type {
        border-right: 1px solid #bdc3c7;
      }

      canvas {
        outline: none;
        user-select: none;
        -webkit-tap-highlight-color:  rgba(255, 255, 255, 0);
      }
    }
  }
}
</style>
