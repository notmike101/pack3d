<script setup lang="ts">
import { inject } from 'vue';
import type { Ref } from 'vue';

const doBasis: Ref<boolean> = inject('doBasis')!;
const resamplingFilter: Ref<string> = inject('resamplingFilter')!;
const textureResolutionWidth: Ref<number> = inject('textureResolutionWidth')!;
const textureResolutionHeight: Ref<number> = inject('textureResolutionHeight')!;
const doResize: Ref<boolean> = inject('doResize')!;
const basisMethod: Ref<string> = inject('basisMethod')!;
const pngFormatFilter: Ref<string> = inject('pngFormatFilter')!;
const etc1sQuality: Ref<number> = inject('etc1sQuality')!;
const etc1sResizeNPOT: Ref<boolean> = inject('etc1sResizeNPOT')!;
const uastcLevel: Ref<number> = inject('uastcLevel')!;
const uastcResizeNPOT: Ref<boolean> = inject('uastcResizeNPOT')!;

const updateBasisMethod = (method: string): void => {
  if (doBasis.value === true) {
    basisMethod.value = method;
  }
};

const updateResamplingFilter = (value: string): void => {
  if (doBasis.value === true) {
    resamplingFilter.value = value;
  }
};

const updatePNGFormatFilter = (value: string): void => {
  if (doBasis.value === true) {
    pngFormatFilter.value = value;
  }
};
</script>

<template>
  <fieldset>
    <legend>Texture Resize Options</legend>
    <div class="input-group">
      <label for="doResize">Enable Texture Resize</label>
      <input type="checkbox" id="doResize" v-model="doResize" />
    </div>
    <div class="input-group">
      <label for="resamplingFilter">Resampling Filter</label>
      <div class="radio-select">
        <div
          v-for="(identifier, key) in ['lanczos3', 'lanczos2']"
          :key="key"
          class="item"
          :class="{ active: resamplingFilter === identifier.toLowerCase(), disabled: doResize === false }"
          @click="updateResamplingFilter(identifier.toLowerCase())"
        >
          {{ identifier }}
        </div>
      </div>
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
  <fieldset>
    <legend>Texture Compression Options</legend>
    <div class="input-group">
      <label for="doBasis">Enable Texture Compression</label>
      <input type="checkbox" id="doBasis" v-model="doBasis" />
    </div>
    <div class="input-group">
      <label for="basisMethod">Method</label>
      <div class="radio-select">
        <div
          v-for="(identifier, key) in ['PNG', 'ETC1S', 'UASTC']"
          :key="key"
          class="item"
          :class="{ active: basisMethod === identifier.toLowerCase(), disabled: doBasis === false }"
          @click="updateBasisMethod(identifier.toLowerCase())"
        >
          {{ identifier }}
        </div>
      </div>
    </div>
    <template v-if="basisMethod === 'png'">
      <div v-if="basisMethod === 'png'" class="input-group">
        <label for="pngFormatFilter">Format Filter</label>
        <div class="radio-select">
          <div
            v-for="(identifier, key) in ['JPEG', 'PNG', 'ALL']"
            :key="key"
            class="item"
            :class="{ active: pngFormatFilter === identifier.toLowerCase(), disabled: doBasis === false }"
            @click="updatePNGFormatFilter(identifier.toLowerCase())"
          >
            {{ identifier }}
          </div>
        </div>
      </div>
    </template>
    <template v-if="basisMethod === 'etc1s'">
      <div class="input-group">
        <label for="etc1sQuality">Quality</label>
        <input :disabled="doBasis === false" id="etc1sQuality" type="number" min="1" max="255" step="1" v-model="etc1sQuality" />
      </div>
      <div class="input-group">
        <label for="etc1sResizeNPOT">Resize NPOT</label>
        <input :disabled="doBasis === false" type="checkbox" id="etc1sResizeNPOT" v-model="etc1sResizeNPOT" />
      </div>
    </template>
    <template v-if="basisMethod === 'uastc'">
      <div class="input-group">
        <label for="uastcLevel">Level</label>
        <select :disabled="doBasis === false" v-model="uastcLevel" id="uastcLevel">
          <option value="0">Fastest</option>
          <option value="1">Faster</option>
          <option value="2">Default</option>
          <option value="3">Slow</option>
          <option value="4">Very Slow</option>
        </select>
      </div>
      <div class="input-group">
        <label for="uastcResizeNPOT">Resize NPOT</label>
        <input :disabled="doBasis === false" type="checkbox" id="uastcResizeNPOT" v-model="uastcResizeNPOT" />
      </div>
    </template>
  </fieldset>
</template>
