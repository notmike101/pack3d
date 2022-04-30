<script setup lang="ts">
import './styles.scss';

import { ref, watch, provide } from 'vue'
import BabylonScene from './components/BabylonScene.vue';
import TitleBar from './components/TitleBar.vue';
import DropFileInput from './components/DropFileInput.vue';
import GeneralOptions from './components/Tabs/GeneralOptions.vue';
import TextureOptions from './components/Tabs/TextureOptions.vue';
import VertexCompressionOptions from './components/Tabs/VertexCompressionOptions.vue';
import FileInfo from './components/FileInfo.vue';
import Log from './components/Log.vue';
import Tabs from './components/Tabs/Tabs.vue';
import ErrorMessage from './components/ErrorMessage.vue';
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
const doDedupe = ref<boolean>(true);
const doReorder = ref<boolean>(true);
const doWeld = ref<boolean>(true);
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
const basisMethod = ref<string>('png');
const pngFormatFilter = ref<string>('all');
const etc1sQuality = ref<number>(128);
const etc1sResizeNPOT = ref<boolean>(true);
const uastcLevel = ref<number>(2);
const uastcResizeNPOT = ref<boolean>(true);
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

        break;
      }
    }
  }

  addLog('Added file: ' + inputFile.value?.path);
}

function dragover(event: DragEvent): void {
  event.preventDefault();
}

function doPack(): void {
  ipcRenderer.send('request-pack', {
    file: inputFile.value?.path,
    doDedupe: doDedupe.value,
    doReorder: doReorder.value,
    doWeld: doWeld.value,
    doInstancing: doInstancing.value,
    doBasis: doBasis.value,
    resamplingFilter: resamplingFilter.value,
    textureResolutionWidth: textureResolutionWidth.value,
    textureResolutionHeight: textureResolutionHeight.value,
    doResize: doResize.value,
    basisMethod: basisMethod.value,
    pngFormatFilter: pngFormatFilter.value,
    etc1sQuality: etc1sQuality.value,
    etc1sResizeNPOT: etc1sResizeNPOT.value,
    uastcLevel: uastcLevel.value,
    uastcResizeNPOT: uastcResizeNPOT.value,
    doDraco: doDraco.value,
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
  // cameraPosition.value = null;
  
  addLog('Requesting pack for ' + inputFile.value?.path);
}

function updateCameraPosition(event: CameraPosition): void {
  console.log('app.updateCameraPosition', event);
  cameraPosition.value = event;
}

function onPackSuccess(event: Event, data: any): void {
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

watch(errorMessage, errorWatcher);

// Tabs
provide('activeTab', activeTab);

// Error message
provide('errorMessage', errorMessage);

// General
provide('doDedupe', doDedupe);
provide('doReorder', doReorder);
provide('doWeld', doWeld);
provide('doInstancing', doInstancing);

// Texture
provide('doBasis', doBasis);
provide('resamplingFilter', resamplingFilter);
provide('textureResolutionWidth', textureResolutionWidth);
provide('textureResolutionHeight', textureResolutionHeight);
provide('doResize', doResize);
provide('basisMethod', basisMethod);
provide('pngFormatFilter', pngFormatFilter);
provide('etc1sQuality', etc1sQuality);
provide('etc1sResizeNPOT', etc1sResizeNPOT);
provide('uastcLevel', uastcLevel);
provide('uastcResizeNPOT', uastcResizeNPOT);

// Vertex
provide('doDraco', doDraco);
provide('vertexCompressionMethod', vertexCompressionMethod);
provide('quantizationVolume', quantizationVolume);
provide('quantizationColor', quantizationColor);
provide('quantizationGeneric', quantizationGeneric);
provide('quantizationNormal', quantizationNormal);
provide('quantizationPosition', quantizationPosition);
provide('quantizationTexcoord', quantizationTexcoord);
provide('encodeSpeed', encodeSpeed);
provide('decodeSpeed', decodeSpeed);

// Logger
provide('logs', logs);

// BabylonScene
provide('cameraPosition', cameraPosition);

ipcRenderer.on('logging', onLoggingEvent);
ipcRenderer.on('pack-success', onPackSuccess);
ipcRenderer.on('pack-error', onPackError);
ipcRenderer.on('pack-sizereport', onPackSizeReport);
</script>

<template>
  <div class="wrapper" @drop="drop" @dragover="dragover" style="flex-direction: column;">
    <TitleBar />
    <div class="wrapper">
      <aside v-if="inputFile">
        <h1 class="file-name">Options</h1>
        <Tabs />
        <div class="top-options">
          <GeneralOptions v-if="activeTab === 'general'" />
          <TextureOptions v-if="activeTab === 'texture'" />
          <VertexCompressionOptions v-if="activeTab === 'vertex'" />
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
              <BabylonScene :model="inputFile" @camera-move="updateCameraPosition" />
              <FileInfo :name="inputFile.name" :size="inputFileSize" />
            </div>
            <div v-if="outputFile" class="canvas-container">
              <template v-if="isProcessing === false">
                <BabylonScene v-if="outputFile" :model="outputFile" @camera-move="updateCameraPosition" />
                <FileInfo :name="outputFile.name" :size="outputFileSize" />
              </template>
              <template v-if="isProcessing === true">
                <p style="margin: auto;display: flex;flex: 1;align-items: center;justify-content: center;">Processing...</p>
              </template>
            </div>
          </div>
          <Log />
        </div>
      </main>
      <DropFileInput v-if="!inputFile" />
      <ErrorMessage />
    </div>
  </div>
</template>

<style lang="scss">
$general-font-size: 12px;

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
  flex-wrap: wrap;

  aside {
    flex: 0 0 250px;
    background-color: #ecf0f1;
    word-break: break-word;
    text-align: left;
    display: flex;
    flex-direction: column;
    padding: 0 1px;
    max-height: 100%;

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
    max-height: 100%;

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
    }
  }
}
</style>
