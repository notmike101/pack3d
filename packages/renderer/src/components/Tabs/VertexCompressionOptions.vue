<script setup lang="ts">
import { inject } from 'vue';
import InputGroup from '@/components/InputGroup.vue';
import CheckboxInput from '@/components/Inputs/CheckboxInput.vue';
import RadioInput from '@/components/Inputs/RadioInput.vue';
import NumberInput from '@/components/Inputs/NumberInput.vue';

import type { Ref } from 'vue';

const doDraco = inject('doDraco') as Ref<boolean>;
const vertexCompressionMethod = inject('vertexCompressionMethod') as Ref<string>;
const quantizationVolume = inject('quantizationVolume') as Ref<string>;
const quantizationColor = inject('quantizationColor') as Ref<number>;
const quantizationGeneric = inject('quantizationGeneric') as Ref<number>;
const quantizationNormal = inject('quantizationNormal') as Ref<number>;
const quantizationPosition = inject('quantizationPosition') as Ref<number>;
const quantizationTexcoord = inject('quantizationTexcoord') as Ref<number>;
const encodeSpeed = inject('encodeSpeed') as Ref<number>;
const decodeSpeed = inject('decodeSpeed') as Ref<number>;
</script>

<template>
  <fieldset class="p-[5px] m-[5px] relative border first-of-type:mt-[6px]">
    <legend class="font-bold">Vertex Compression Options</legend>

    <InputGroup identifier="doDraco" label="Enable Draco Compression">
      <CheckboxInput identifier="doDraco" v-model="doDraco" />
    </InputGroup>
    <InputGroup label="Method" :disable-hover-pointer="true">
      <RadioInput :options="['edgebreaker', 'sequential']" v-model="vertexCompressionMethod" :disable="doDraco === false" />
    </InputGroup>
  </fieldset>

  <fieldset class="p-[5px] m-[5px] relative border first-of-type:mt-[6px]">
    <legend class="font-bold">Quantization</legend>

    <InputGroup identifier="quantizationVolume" label="Volume" :disable-hover-pointer="true">
      <RadioInput :options="['mesh', 'scene']" v-model="quantizationVolume" :disable="doDraco === false" :min="0" />
    </InputGroup>
    <InputGroup identifier="quantizationColor" label="Color Bits">
      <NumberInput v-model="quantizationColor" :disable="doDraco === false" :min="0" />
    </InputGroup>
    <InputGroup identifier="quantizationGeneric" label="Generic Bits">
      <NumberInput v-model="quantizationGeneric" :disable="doDraco === false" :min="0" />
    </InputGroup>
    <InputGroup identifier="quantizationNormal" label="Normal Bits">
      <NumberInput v-model="quantizationNormal" :disable="doDraco === false" :min="0" />
    </InputGroup>
    <InputGroup identifier="quantizationPosition" label="Position Bits">
      <NumberInput v-model="quantizationPosition" :disable="doDraco === false" :min="0" />
    </InputGroup>
    <InputGroup identifier="quantizationTexcord" label="Texcord Bits">
      <NumberInput v-model="quantizationTexcoord" :disable="doDraco === false" :min="0" />
    </InputGroup>
  </fieldset>

  <fieldset class="p-[5px] m-[5px] relative border first-of-type:mt-[6px]">
    <legend class="font-bold">Speed</legend>

    <InputGroup identifier="encodeSpeed" label="Encode">
      <NumberInput identifier="encodeSpeed" v-model="encodeSpeed" :disable="doDraco === false" :min="1" :max="10" />
    </InputGroup>
    <InputGroup identifier="decodeSpeed" label="Decode">
      <NumberInput identifier="decodeSpeed" v-model="decodeSpeed" :disable="doDraco === false" :min="1" :max="10" />
    </InputGroup>
  </fieldset>
</template>
