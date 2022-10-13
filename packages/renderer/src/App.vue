<script setup lang="ts">
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

import type { Vector3 } from '@babylonjs/core/Maths/math.vector';

interface CameraPosition {
  target: Vector3,
  position: Vector3,
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
const logs = ref<string[]>([]);
const errorMessageTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

const tabMap = {
  'general': GeneralOptions,
  'texture': TextureOptions,
  'vertex': VertexCompressionOptions,
};

const addLog = (data: any) => {
  logs.value.unshift('(' + Number(performance.now()).toFixed(0) + 'ms) ' + data);
};

const drop = (event: DragEvent) => {
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
};

const dragover = (event: DragEvent) => {
  event.preventDefault();
};

const doPack = () => {
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

  addLog('Requesting pack for ' + inputFile.value?.path);
};

const updateCameraPosition = (event: CameraPosition) => {
  cameraPosition.value = event;
};

const onPackSuccess = (event: Event, data: any) => {
  isProcessing.value = false;
  outputFile.value = data.file;
  outputFileSize.value = data.file.binary.byteLength;

  addLog('Packing successful. Reduced file size by ' + (100 - (outputFileSize.value / inputFileSize.value) * 100).toFixed(2) + '%.');
};

const onPackError = (event: Event, data: any) => {
  errorMessage.value = data.error.message;
  isProcessing.value = false;

  addLog('Error: ' + data.error.message);
};

const onPackSizeReport = (event: Event, data: any) => {
  addLog(`Action ${data.action} reduced file size by ${(100 - (data.endSize / data.startSize) * 100).toFixed(2)}%.`);
};

const onLoggingEvent = (event: Event, data: any) => {
  addLog(`[${data.verbosity}] ${data.text}`);
};

const errorWatcher = () => {
  if (errorMessageTimeout.value) {
    clearTimeout(errorMessageTimeout.value);
  }

  if (errorMessage.value) {
    errorMessageTimeout.value = setTimeout(() => {
      errorMessage.value = '';
    }, 5000);
  }
};

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
  <div @drop="drop" @dragover="dragover" class="flex flex-col flex-1 select-none overflow-hidden flex-wrap">
    <TitleBar />
    <div class="flex flex-row flex-1 select-none overflow-hidden flex-wrap">
      <aside v-if="inputFile" class="basis-[250px] bg-[#ecf0f1] break-words text-left flex flex-col p-0 max-h-full">
        <Tabs />
        <div class="mb-auto flex flex-col">
          <component :is="tabMap[activeTab]" />
        </div>
        <div class="mt-auto flex flex-col border-t border-t-black">
          <button class="mt-auto w-full border-0 bg-[#3498db] text-white px-0 py-[10px] cursor-pointer" :class="{ 'opacity-50 cursor-not-allowed pointer-events-none': isProcessing === true }" @click="doPack">
            <span>{{ isProcessing ? 'Packing...' : 'Pack' }}</span>
          </button>
        </div>
      </aside>
      <main v-if="inputFile" class="flex flex-row flex-1 overflow-hidden max-h-full">
        <div class="flex flex-col flex-1">
          <div class="flex flex-row flex-1 overflow-hidden">
            <div class="flex flex-1 flex-col relative overflow-hidden max-w-full max-h-full first-of-type:border-r first-of-type:border-r-[#bdc3c7]">
              <BabylonScene :model="inputFile" @camera-move="updateCameraPosition" />
              <FileInfo :name="inputFile.name" :size="inputFileSize" />
            </div>
            <div v-if="outputFile" class="flex flex-1 flex-col relative overflow-hidden max-w-full max-h-full first-of-type:border-r first-of-type:border-r-[#bdc3c7]">
              <template v-if="isProcessing === false">
                <BabylonScene v-if="outputFile" :model="outputFile" @camera-move="updateCameraPosition" />
                <FileInfo :name="outputFile.name" :size="outputFileSize" />
              </template>
              <template v-if="isProcessing === true">
                <p class="m-auto flex flex-1 items-center justify-center">Processing...</p>
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
