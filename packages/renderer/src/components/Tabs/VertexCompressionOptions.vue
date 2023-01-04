<script setup lang="ts">
import { inject } from 'vue';
import InputGroup from '@/components/InputGroup.vue';
import CheckboxInput from '@/components/Inputs/CheckboxInput.vue';
import RadioInput from '@/components/Inputs/RadioInput.vue';
import NumberInput from '@/components/Inputs/NumberInput.vue';

import type { IPackOptions } from 'types';

const packOptions = inject('packOptions') as IPackOptions;
</script>

<template>
  <fieldset class="p-[5px] m-[5px] relative border first-of-type:mt-[6px]">
    <legend class="font-bold">Vertex Compression Options</legend>

    <InputGroup identifier="doDraco" label="Enable Draco Compression">
      <CheckboxInput identifier="doDraco" v-model="packOptions.doDraco" />
    </InputGroup>
    <InputGroup label="Method" :disable-hover-pointer="true">
      <RadioInput
        v-model="packOptions.vertexCompressionMethod"
        :options="['edgebreaker', 'sequential']"
        :disable="packOptions.doDraco === false"
      />
    </InputGroup>
  </fieldset>

  <fieldset class="p-[5px] m-[5px] relative border first-of-type:mt-[6px]">
    <legend class="font-bold">Quantization</legend>

    <InputGroup identifier="quantizationVolume" label="Volume" :disable-hover-pointer="true">
      <RadioInput
        v-model="packOptions.quantizationVolume"
        :options="['mesh', 'scene']"
        :disable="packOptions.doDraco === false"
        :min="0"
      />
    </InputGroup>
    <InputGroup identifier="quantizationColor" label="Color Bits">
      <NumberInput
        v-model="packOptions.quantizationColor"
        :disable="packOptions.doDraco === false"
        :min="0"
      />
    </InputGroup>
    <InputGroup identifier="quantizationGeneric" label="Generic Bits">
      <NumberInput
        v-model="packOptions.quantizationGeneric"
        :disable="packOptions.doDraco === false"
        :min="0"
      />
    </InputGroup>
    <InputGroup identifier="quantizationNormal" label="Normal Bits">
      <NumberInput
        v-model="packOptions.quantizationNormal"
        :disable="packOptions.doDraco === false"
        :min="0"
      />
    </InputGroup>
    <InputGroup identifier="quantizationPosition" label="Position Bits">
      <NumberInput
        v-model="packOptions.quantizationPosition"
        :disable="packOptions.doDraco === false"
        :min="0"
      />
    </InputGroup>
    <InputGroup identifier="quantizationTexcord" label="Texcord Bits">
      <NumberInput
        v-model="packOptions.quantizationTexCoord"
        :disable="packOptions.doDraco === false"
        :min="0"
      />
    </InputGroup>
  </fieldset>

  <fieldset class="p-[5px] m-[5px] relative border first-of-type:mt-[6px]">
    <legend class="font-bold">Speed</legend>

    <InputGroup identifier="encodeSpeed" label="Encode">
      <NumberInput
        v-model="packOptions.encodeSpeed"
        identifier="encodeSpeed"
        :disable="packOptions.doDraco === false"
        :min="1"
        :max="10"
      />
    </InputGroup>
    <InputGroup identifier="decodeSpeed" label="Decode">
      <NumberInput
        v-model="packOptions.decodeSpeed"
        identifier="decodeSpeed"
        :disable="packOptions.doDraco === false"
        :min="1"
        :max="10"
      />
    </InputGroup>
  </fieldset>
</template>
