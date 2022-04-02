<script setup lang="ts">
import { ref, watch } from 'vue'
import path from 'path';
import BabylonScene from './components/BabylonScene.vue';
import { ipcRenderer } from 'electron';

const inputFile = ref<File | null>(null);
const outputFile = ref<File | null>(null);
const doDedupe = ref<boolean>(false);
const doReorder = ref<boolean>(false);
const doWeld = ref<boolean>(false);
const doResize = ref<boolean>(false);
const doBasis = ref<boolean>(false);
const doDraco = ref<boolean>(false);
const outputPath = ref<string>('');
const errorMessage = ref<string>('');
const isProcessing = ref<boolean>(false);
const inputFileSize = ref<number>(0);
const outputFileSize = ref<number>(0);
const logs = ref([] as string[]);
let errorMessageTimeout: ReturnType<typeof setTimeout> | null = null;

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' Bytes';
  if (bytes < 1048576) return (bytes / 1024).toFixed(3) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + ' MB';

  return (bytes / 1073741824).toFixed(3) + ' GB';
}

function addLog(data: any) {
  logs.value.unshift('(' + Number(performance.now()).toFixed(0) + ') ' + data);
}

function drop(event: DragEvent): void {
  event.preventDefault();
  event.stopPropagation();

  const droppedFiles: FileList | undefined = event.dataTransfer?.files;

  if (droppedFiles) {
    for (let i: number = 0; i < droppedFiles.length; i++) {
      const file: File | null = droppedFiles.item(i);

      if (file) {
        inputFile.value = file;
        outputPath.value = path.dirname(file.path);
        inputFileSize.value = file.size;
      }
    }
  }

  addLog('Added file: ' + inputFile.value?.path);
}

function dragover(event: DragEvent): void {
  event.preventDefault();
}

function doPack() {
  ipcRenderer.send('request-pack', {
    file: inputFile.value?.path,
    doDedupe: doDedupe.value,
    doReorder: doReorder.value,
    doWeld: doWeld.value,
    doResize: doResize.value,
    doBasis: doBasis.value,
    doDraco: doDraco.value,
    outputPath: outputPath.value,
  });

  outputFileSize.value = 0;
  isProcessing.value = true;
  
  addLog('Requesting pack for ' + inputFile.value?.path);
}

watch(errorMessage, () => {
  if (errorMessageTimeout) {
    clearTimeout(errorMessageTimeout);
  }

  if (errorMessage.value) {
    errorMessageTimeout = setTimeout(() => {
      errorMessage.value = '';
    }, 5000);
  }
});

ipcRenderer.on('pack-success', (event: Event, data: any): void => {
  isProcessing.value = false;
  outputFile.value = data.file;
  outputFileSize.value = data.file.binary.length;

  addLog('Packing successful. Reduced file size by ' + (100 - (data.file.binary.length / inputFileSize.value) * 100).toFixed(2) + '%.');
});

ipcRenderer.on('pack-error', (event: Event, data: any): void => {
  errorMessage.value = data.error.message;
  isProcessing.value = false;

  addLog('Error: ' + data.error.message);
});

ipcRenderer.on('pack-sizereport', (event: Event, data: any): void => {
  addLog(`Action ${data.action} reduced file size by ${(100 - (data.endSize / data.startSize) * 100).toFixed(2)}%.`);
});

</script>

<template>
  <div class="wrapper" @drop="drop" @dragover="dragover" style="flex-direction: column">
    <div class="wrapper">
      <aside v-if="inputFile">
        <h1 class="file-name">Options</h1>
        <div class="top-options">
          <div class="input-group">
            <input type="checkbox" id="doDedupe" v-model="doDedupe" />
            <label for="doDedupe">Dedupe</label>
          </div>
          <div class="input-group">
            <input type="checkbox" id="doReorder" v-model="doReorder" />
            <label for="doReorder">Reorder</label>
          </div>
          <div class="input-group">
            <input type="checkbox" id="doWeld" v-model="doWeld" />
            <label for="doWeld">Weld</label>
          </div>
          <div class="input-group">
            <input type="checkbox" id="doResize" v-model="doResize" />
            <label for="doResize">Resize</label>
          </div>
          <div class="input-group">
            <input type="checkbox" id="doBasis" v-model="doBasis" />
            <label for="doBasis">Basisu</label>
          </div>
          <div class="input-group">
            <input type="checkbox" id="doDraco" v-model="doDraco" />
            <label for="doDraco">Draco</label>
          </div>
        </div>
        <div class="bottom-options">
          <div class="input-group col" style="margin-top: auto;">
            <label for="outputPath">Output Path</label>
            <input type="text" id="outputPath" v-model="outputPath" />
          </div>
          <button class="do-pack-button" :class="{ disabled: isProcessing === true }" @click="doPack">
            <span v-if="isProcessing === false">Pack</span>
            <span v-if="isProcessing === true">Processing...</span>
          </button>
        </div>
      </aside>
      <main v-if="inputFile">
        <div class="canvas-container">
          <p class="canvas-container-header">Input File</p>
          <BabylonScene :model="inputFile" />
          <div class="file-info">
            <p>File Size: {{ formatBytes(inputFileSize) }}</p>
          </div>
        </div>
        <div class="canvas-container">
          <p class="canvas-container-header">Output File</p>
          <template v-if="outputFile">
            <BabylonScene :model="outputFile" v-if="outputFile" />
            <div class="file-info">
              <p>File Size: {{ formatBytes(outputFileSize) }}</p>
            </div>
          </template>
          <p v-if="!outputFile && isProcessing === false" class="action-needed-notice">Click "Pack" to display the output preview</p>
          <div v-if="!outputFile && isProcessing === true" class="spinner"></div>
        </div>
      </main>
      <main v-if="!inputFile">
        <p class="drop-notice">Drop File Into Window To Begin Editing</p>
      </main>
      <div v-if="errorMessage" class="error-message">
        <p><span style="font-weight: bold">Error:</span> {{ errorMessage }}</p>
      </div>
    </div>
    <div class="log">
      <div class="log-content">
        <p v-for="log in logs">{{ log }}</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
body {
  margin: 0;
  padding: 0;
  height: 100vh;
  overflow: hidden;

  #app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    height: 100%;
    width: 100%;
  }

  @keyframes spinner {
    0% {
      transform: translate3d(-50%, -50%, 0) rotate(0deg);
    }
    100% {
      transform: translate3d(-50%, -50%, 0) rotate(360deg);
    }
  }
}
</style>

<style lang="scss" scoped>
$default-font-size: 0.9em;

.wrapper {
  display: flex;
  flex-direction: row;
  height: 100%;
  user-select: none;
  overflow: hidden;

  .log {
    height: 250px;
    text-align: left;
    background-color: #f0f0f0;
    border-top: 1px solid black;
    padding: 5px;
    overflow: auto;

    p {
      padding: 0;
      margin: 0;
    }
  }

  .error-message {
    position: absolute;
    top: 5px;
    left: 50%;
    width: 95%;
    background-color: rgb(255 84 84);
    color: white;
    text-align: center;
    transform: translateX(-50%);
    border-radius: 5px;

    p {
      text-align: center;
      padding: 0;
      margin: 5px 0;
    }
  }

  aside {
    width: 250px;
    min-width: 250px;
    background-color: #ecf0f1;
    border-right: 1px solid #bdc3c7;
    word-break: break-word;
    text-align: left;
    height: 100%;
    display: flex;
    flex-direction: column;

    h1 {
      margin: 0 0 5px 0;
      padding: 15px 5px;
      border-bottom: 1px solid black;
      text-align: center;
      font-size: 1.5em;
    }

    .top-options {
      margin-bottom: auto;
      display: flex;
      flex-direction: column;
    }

    .bottom-options {
      margin-top: auto;
      display: flex;
      flex-direction: column;
    }

    .input-group {
      display: flex;
      padding: 5px;
      flex-direction: row;
      align-items: center;
      width: calc(100% - 10px);

      &.col {
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        width: 100%;
      }

      label {
        display: inline-block;
        cursor: pointer;
        font-size: $default-font-size;
        flex: 1;
      }

      input {
        &[type="checkbox"] {
          cursor: pointer;
        }

        &[type="text"] {
          width: calc(100% - 18px);
          padding: 3px;
          margin: 0;
        }
      }
    }

    .do-pack-button {
      margin-top: auto;
      width: 100%;
      border: 0 ;
      background-color: #3498db;
      color: #fefefe;
      padding: 10px 0;
      font-size: $default-font-size;
      cursor: pointer;

      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }
    }
  }

  main {
    display: flex;
    flex: 1;
    flex-direction: row;
    width: 100%;
    max-width: 100%;
    overflow: hidden;

    .drop-notice {
      margin: auto;
      font-size: 2em;
      font-weight: bold;
    }

    .action-needed-notice {
      margin: auto;
      font-size: 1.5em;
      font-weight: bold;
    }

    .canvas-container {
      width: 50%;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;

      .canvas-container-header {
        border-bottom: 1px solid black;
        margin: 0;
        padding: 5px 0;
        font-size: $default-font-size;
        background-color: #ecf0f1;
      }

      &:first-of-type {
        border-right: 1px solid #bdc3c7;
      }

      .spinner {
        &::before {
          animation: 1.5s linear infinite spinner;
          animation-play-state: inherit;
          border: solid 5px #cfd0d1;
          border-bottom-color: #1c87c9;
          border-radius: 50%;
          content: "";
          height: 40px;
          width: 40px;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%,);
          will-change: transform;
        }
      }

      canvas {
        outline: none;
        user-select: none;
        -webkit-tap-highlight-color:  rgba(255, 255, 255, 0);
      }

      .file-info {
        font-size: $default-font-size;
        padding: 10px 0;

        p {
          margin: 0;
          padding: 0;
        }
      }
    }
  }
}
</style>
