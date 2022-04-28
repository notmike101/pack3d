<!--
/**
 * Licensed Materials - Property of Michael Orozco
 * (C) Copyright Michael Orozco 2022
 */
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import BabylonScene from './components/BabylonScene.vue';
import { ipcRenderer } from 'electron';
import path from 'path';

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

const activeTab = ref<string>('general');
const inputFile = ref<File | null>(null);
const outputFile = ref<File | null>(null);
const doDedupe = ref<boolean>(false);
const doReorder = ref<boolean>(false);
const doWeld = ref<boolean>(false);
const doInstancing = ref<boolean>(false);
const doResize = ref<boolean>(false);
const doBasis = ref<boolean>(false);
const doDraco = ref<boolean>(false);
const resamplingFilter = ref<string>('lanczos3');
const textureResolutionWidth = ref<number>(1024);
const textureResolutionHeight = ref<number>(1024);
const vertexCompressionMethod = ref<string>('edgebreaker');
const quantizationVolume = ref<string>('mesh');
const quantizationColor = ref<number>(8);
const quantizationGeneric = ref<number>(12);
const quantizationNormal = ref<number>(10);
const quantizationPosition = ref<number>(14);
const quantizationTexcoord = ref<number>(12);
const encodeSpeed = ref<number>(5);
const decodeSpeed = ref<number>(5);
const outputPath = ref<string>('');
const errorMessage = ref<string>('');
const isProcessing = ref<boolean>(false);
const inputFileSize = ref<number>(0);
const outputFileSize = ref<number>(0);
const cameraPosition = ref<CameraPosition | null>(null);
const logs = ref([] as string[]);
let errorMessageTimeout: ReturnType<typeof setTimeout> | null = null;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' Bytes';
  if (bytes < 1048576) return (bytes / 1024).toFixed(3) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + ' MB';

  return (bytes / 1073741824).toFixed(3) + ' GB';
}

function addLog(data: any): void {
  logs.value.unshift('(' + Number(performance.now()).toFixed(0) + 'ms) ' + data);
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
        outputFile.value = null;
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
    doInstancing: doInstancing.value,
    doResize: doResize.value,
    doBasis: doBasis.value,
    doDraco: doDraco.value,
    resamplingFilter: resamplingFilter.value,
    textureResolutionWidth: textureResolutionWidth.value,
    textureResolutionHeight: textureResolutionHeight.value,
    vertexCompressionMethod: vertexCompressionMethod.value,
    quantizationVolume: quantizationVolume.value,
    quantizationColor: quantizationColor.value,
    quantizationGeneric: quantizationGeneric.value,
    quantizationNormal: quantizationNormal.value,
    quantizationPosition: quantizationPosition.value,
    quantizationTexcoord: quantizationTexcoord.value,
    encodeSpeed: encodeSpeed.value,
    decodeSpeed: decodeSpeed.value,
    outputPath: outputPath.value,
  });

  outputFileSize.value = 0;
  isProcessing.value = true;
  
  addLog('Requesting pack for ' + inputFile.value?.path);
}

function updateCameraPosition(event: CameraPosition) {
  cameraPosition.value = event;
}

function onPackSuccess(event: Event, data: any): void {
  console.log(data);
  isProcessing.value = false;
  outputFile.value = data.file;
  outputFileSize.value = data.file.binary.byteLength;

  addLog('Packing successful. Reduced file size by ' + (100 - (outputFileSize.value / inputFileSize.value) * 100).toFixed(2) + '%.');
}

function onPackError(event: Event, data: any): void {
  errorMessage.value = data.error.message;
  isProcessing.value = false;

  addLog('Error: ' + data.error.message);
}

function onPackSizeReport(event: Event, data: any): void {
  addLog(`Action ${data.action} reduced file size by ${(100 - (data.endSize / data.startSize) * 100).toFixed(2)}%.`);
}

function onLoggingEvent(event: Event, data: any): void {
  addLog(`[${data.verbosity}] ${data.text}`);
}

function errorWatcher(): void {
  if (errorMessageTimeout) {
    clearTimeout(errorMessageTimeout);
  }

  if (errorMessage.value) {
    errorMessageTimeout = setTimeout(() => {
      errorMessage.value = '';
    }, 5000);
  }
}

function switchTab(tabIdentifier: string): void {
  activeTab.value = tabIdentifier;
}

watch(errorMessage, errorWatcher);
ipcRenderer.on('logging', onLoggingEvent);
ipcRenderer.on('pack-success', onPackSuccess);
ipcRenderer.on('pack-error', onPackError);
ipcRenderer.on('pack-sizereport', onPackSizeReport);
</script>

<template>
  <div class="wrapper" @drop="drop" @dragover="dragover" style="flex-direction: row">
    <aside v-if="inputFile">
      <h1 class="file-name">Options</h1>
      <div class="tabs">
        <div class="tab" :class="{ active: activeTab === 'general' }" @click="switchTab('general')">General</div>
        <div class="tab" :class="{ active: activeTab === 'texture' }" @click="switchTab('texture')">Texture</div>
        <div class="tab" :class="{ active: activeTab === 'vertex' }" @click="switchTab('vertex')">Vertex</div>
      </div>
      <div class="top-options">
        <fieldset v-if="activeTab === 'general'">
          <legend>General Options</legend>
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
            <input type="checkbox" id="doInstancing" v-model="doInstancing" />
            <label for="doInstancing">Instancing</label>
          </div>
        </fieldset>
        <fieldset v-if="activeTab === 'texture'">
          <legend>Texture Resize Options</legend>
          <div class="input-group">
            <label for="doResize">Enable Texture Resize</label>
            <input type="checkbox" id="doResize" v-model="doResize" />
          </div>
          <div class="input-group">
            <label for="resamplingFilter">Resampling Filter</label>
            <select :disabled="doResize === false" id="resamplingFilter" v-model="resamplingFilter">
              <option value="lanczos3">lanczos3</option>
              <option value="lanczos2">lanczos2</option>
            </select>
          </div>
          <div class="input-group">
            <label for="textureResolution">Texture Resolution</label>
            <div style="display: flex; flex-direction: row;align-items: center">
              <select :disabled="doResize === false" id="textureResolution" v-model="textureResolutionWidth">
                <option :value="128">128</option>
                <option :value="256">256</option>
                <option :value="512">512</option>
                <option :value="1024">1024</option>
                <option :value="2048">2048</option>
                <option :value="4096">4096</option>
              </select>
              <span style="padding: 0 2px">x</span>
              <select :disabled="doResize === false" id="textureResolution" v-model="textureResolutionHeight">
                <option :value="128">128</option>
                <option :value="256">256</option>
                <option :value="512">512</option>
                <option :value="1024">1024</option>
                <option :value="2048">2048</option>
                <option :value="4096">4096</option>
              </select>
            </div>
          </div>
        </fieldset>
        <fieldset v-if="activeTab === 'texture'">
          <legend>Texture Compression Options</legend>
          <div class="input-group">
            <label for="doBasis">Enable Texture Compression</label>
            <input type="checkbox" id="doBasis" v-model="doBasis" />
          </div>
          <div class="input-group">
            <label for="basisMethod">Method</label>
            <div style="display: flex; flex-direction: row;align-items: center;">
              <div style="border: 1px solid black;color: white;background-color: #2c3e50;padding: 0 5px;">ETC1S</div>
              <div style="border: 1px solid black;padding: 0 5px">UASTC</div>
            </div>
          </div>
        </fieldset>
        <fieldset v-if="activeTab === 'vertex'">
          <legend>Vertex Compression Options</legend>
          <div class="input-group">
            <label for="doDraco">Enable Draco</label>
            <input type="checkbox" id="doDraco" v-model="doDraco" />
          </div>
          <div class="input-group">
            <label for="vertexCompressionMethod">Method</label>
            <select :disabled="doDraco === false" id="vertexCompressionMethod" v-model="vertexCompressionMethod">
              <option value="edgebreaker">edgebreaker</option>
              <option value="sequential">sequential</option>
            </select>
          </div>
          <fieldset>
            <legend>Quantization</legend>
            <div class="input-group">
              <label for="quantizationVolume">Volume</label>
              <select :disabled="doDraco === false" v-model="quantizationVolume" id="quantizationVolume">
                <option value="mesh">Mesh</option>
                <option value="scene">Scene</option>
              </select>
            </div>
            <div class="input-group">
              <label for="quantizationColor">Color Bits</label>
              <input type="number" :disabled="doDraco === false" v-model="quantizationColor" id="quantizationColor">
            </div>
            <div class="input-group">
              <label for="quantizationGeneric">Other Bits</label>
              <input type="number" :disabled="doDraco === false" v-model="quantizationGeneric" id="quantizationGeneric">
            </div>
            <div class="input-group">
              <label for="quantizationNormal">Normal Bits</label>
              <input type="number" :disabled="doDraco === false" v-model="quantizationNormal" id="quantizationNormal">
            </div>
            <div class="input-group">
              <label for="quantizationPosition">Position Bits</label>
              <input type="number" :disabled="doDraco === false" v-model="quantizationPosition" id="quantizationPosition">
            </div>
            <div class="input-group">
              <label for="quantizationTexcoord">Texcord Bits</label>
              <input type="number" :disabled="doDraco === false" v-model="quantizationTexcoord" id="quantizationTexcoord">
            </div>
          </fieldset>
          <fieldset>
            <legend>Speed</legend>
            <div class="input-group">
              <label for="encodeSpeed">Encode</label>
              <input type="number" min="1" max="10" :disabled="doDraco === false" v-model="encodeSpeed" id="encodeSpeed">
            </div>
            <div class="input-group">
              <label for="decodeSpeed">Decode</label>
              <input type="number" min="1" max="10" :disabled="doDraco === false" v-model="decodeSpeed" id="decodeSpeed">
            </div>
          </fieldset>
        </fieldset>
      </div>
      <div class="bottom-options">
        <button class="do-pack-button" :class="{ disabled: isProcessing === true }" @click="doPack">
          <span v-if="isProcessing === false">Pack</span>
          <span v-if="isProcessing === true">Processing...</span>
        </button>
      </div>
    </aside>
    <main v-if="inputFile">
      <div style="display: flex; flex-direction: column;flex: 1;">
        <div style="display: flex; flex-direction: row;flex: 1;overflow: hidden;">
          <div class="canvas-container">
            <BabylonScene :model="inputFile" :camera-position="cameraPosition" @camera-move="updateCameraPosition" />
            <div class="canvas-container-info">
              <p>File Name: {{ inputFile.name }}</p>
              <p>File Size: {{ formatBytes(inputFileSize) }}</p>
            </div>
          </div>
          <div v-if="outputFile" class="canvas-container">
            <BabylonScene :model="outputFile" :camera-position="cameraPosition" @camera-move="updateCameraPosition" v-if="outputFile" />
            <div class="canvas-container-info">
              <p>File Name: {{ outputFile.name }}</p>
              <p>File Size: {{ formatBytes(outputFileSize) }}</p>
            </div>
          </div>
        </div>
        <footer class="log">
          <div class="log-content">
            <p v-for="log in logs">{{ log }}</p>
          </div>
        </footer>
      </div>
    </main>
    <main v-if="!inputFile">
      <p class="drop-notice">Drop File Into Window To Begin Editing</p>
    </main>
    <div v-if="errorMessage" class="error-message">
      <p><span style="font-weight: bold">Error:</span> {{ errorMessage }}</p>
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
    display: flex;
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
$font-size: 12px;

.wrapper {
  display: flex;
  flex-direction: row;
  flex: 1;
  user-select: none;
  overflow: hidden;

  .log {
    flex: 0 0 150px;
    text-align: left;
    background-color: #f0f0f0;
    border-top: 1px solid black;
    padding: 5px;
    overflow: auto;
    display: block;

    p {
      padding: 0;
      margin: 0;
      font-family: monospace;
      font-size: $font-size;
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
    flex: 0 0 250px;
    background-color: #ecf0f1;
    border-right: 1px solid #bdc3c7;
    word-break: break-word;
    text-align: left;
    display: flex;
    flex-direction: column;

    .tabs {
      display: flex;
      flex-direction: row;
      align-items: center;
      
      .tab {
        display: flex;
        border: 1px solid #cacaca;
        flex: 1;
        align-items: center;
        justify-content: center;
        color:rgb(170, 170, 170);
        cursor: pointer;
        font-size: $font-size;

        &.active {
          background-color: #2c3e50;
          color: white;
          border: 1px solid #2c3e50;
          position: relative;

          &:after {
            position: absolute;
            top: -3px;
            background-color: #2c3e50;
            content: ' ';
            height: 2px;
            width: calc(100% + 2px);
            left: -1px;
            border-radius: 5px 5px 0 0;
          }
        }
      }
    }

    h1 {
      margin: 0;
      padding: 4px 0 2px 0;
      text-align: center;
      font-size: $font-size;
      background-color: transparent;
    }

    .top-options {
      margin-bottom: auto;
      display: flex;
      flex-direction: column;
      font-size: $font-size;    
    }

    .bottom-options {
      margin-top: auto;
      display: flex;
      flex-direction: column;
      border-top: 1px solid black;
    }

    fieldset {
      padding: 5px;
      margin: 5px;
      position: relative;
      border-width: 1px;

      &:first-of-type {
        margin-top: 6px;
      }

      legend {
        font-weight: bold;
        font-size: $font-size;
      }
    }

    .input-group {
      display: flex;
      padding: 1px 2px;
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
        padding: 0;
        flex: 2;
        font-size: $font-size;
      }

      select {
        padding: 1px;
        margin: 0;
        font-size: $font-size;
      }

      input {
        font-size: $font-size;
        &[type="checkbox"] {
          cursor: pointer;
        }

        &[type="text"],
        &[type="number"] {
          width: calc(100% - 2px);
          padding: 1px;
          margin: 0;
          flex: 1;

          &:disabled {
            color: rgb(170, 170, 170);
          }
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
      font-size: $font-size;
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
      flex: 1;
      // flex: 0 0 50%;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      max-width: 100%;
      max-height: 100%;

      .canvas-container-info {
        position: absolute;
        background-color: rgba(0, 0, 0, 0.7);
        font-size: $font-size;
        text-align: left;
        padding: 5px;
        color: white;

        p {
          margin: 0;
          padding: 0;
        }
      }

      .canvas-container-header {
        border-bottom: 1px solid black;
        margin: 0;
        padding: 3px 0;
        font-size: $font-size;
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
        font-size: $font-size;
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
