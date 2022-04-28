<script setup lang="ts">
import { inject } from 'vue';
import type { Ref } from 'vue';

const doDraco: Ref<boolean> = inject('doDraco')!;
const vertexCompressionMethod: Ref<string> = inject('vertexCompressionMethod')!;
const quantizationVolume: Ref<string> = inject('quantizationVolume')!;
const quantizationColor: Ref<number> = inject('quantizationColor')!;
const quantizationGeneric: Ref<number> = inject('quantizationGeneric')!;
const quantizationNormal: Ref<number> = inject('quantizationNormal')!;
const quantizationPosition: Ref<number> = inject('quantizationPosition')!;
const quantizationTexcoord: Ref<number> = inject('quantizationTexcoord')!;
const encodeSpeed: Ref<number> = inject('encodeSpeed')!;
const decodeSpeed: Ref<number> = inject('decodeSpeed')!;

function updateVertexCompressionMethod(value: string): void {
  if (doDraco.value === true) {
    vertexCompressionMethod.value = value;
  }
}

function updateQuantizationVolume(value: string): void {
  if (doDraco.value === true) {
    quantizationVolume.value = value;
  }
}
</script>

<template>
  <fieldset>
    <legend>Vertex Compression Options</legend>
    <div class="input-group">
      <label for="doDraco">Enable Draco</label>
      <input type="checkbox" id="doDraco" v-model="doDraco" />
    </div>
    <div class="input-group">
      <label for="vertexCompressionMethod">Method</label>
      <div class="radio-select">
        <div
          v-for="(identifier, key) in ['edgebreaker', 'sequential']"
          :key="key"
          class="item"
          :class="{ active: vertexCompressionMethod === identifier.toLowerCase(), disabled: doDraco === false }"
          @click="updateVertexCompressionMethod(identifier.toLowerCase())"
        >
          {{ identifier }}
        </div>
      </div>
    </div>
    <fieldset>
      <legend>Quantization</legend>
      <div class="input-group">
        <label for="quantizationVolume">Volume</label>
        <div class="radio-select">
          <div
            v-for="(identifier, key) in ['Mesh', 'Scene']"
            :key="key"
            class="item"
            :class="{ active: quantizationVolume === identifier.toLowerCase(), disabled: doDraco === false }"
            @click="updateQuantizationVolume(identifier.toLowerCase())"
          >
            {{ identifier }}
          </div>
        </div>
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
</template>
