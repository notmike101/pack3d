<script setup lang="ts">
import { inject } from 'vue';
import InputGroup from '@/components/InputGroup.vue';
import CheckboxInput from '@/components/Inputs/CheckboxInput.vue';
import RadioInput from '@/components/Inputs/RadioInput.vue';
import SelectInput from '@/components/Inputs/SelectInput.vue';
import NumberInput from '@/components/Inputs/NumberInput.vue';

import type { IPackOptions } from 'types';

const packOptions = inject('packOptions') as IPackOptions;
</script>

<template>
  <fieldset class="p-[5px] m-[5px] relative border first-of-type:mt-[6px]">
    <legend class="font-bold">Texture Resize Options</legend>

    <InputGroup identifier="doResize" label="Resize Textures">
      <CheckboxInput v-model="packOptions.doResize" identifier="doResize" />
    </InputGroup>
    <InputGroup identifier="resamplingFilter" label="Resampling Filter">
      <RadioInput
        v-model="packOptions.resamplingFilter"
        :options="['lanczos3', 'lanczos2']"
        :disable="packOptions.doResize === false"
      />
    </InputGroup>
    <InputGroup identifier="textureResolution" label="Texture Resolution">
      <div class="flex flex-row items-center">
        <SelectInput
          v-model="packOptions.textureResolutionWidth"
          :disable="packOptions.doResize === false"
          identifier="textureResolution"
          :options="[
            { label: '128', value: 128 },
            { label: '256', value: 256 },
            { label: '512', value: 512 },
            { label: '1024', value: 1024 },
            { label: '2048', value: 2048 },
            { label: '4096', value: 4096 }
          ]"
        />
        <span class="py-0 px-[2px]">x</span>
        <SelectInput
          v-model="packOptions.textureResolutionHeight"
          :disable="packOptions.doResize === false"
          identifier="textureResolution"
          :options="[
            { label: '128', value: 128 },
            { label: '256', value: 256 },
            { label: '512', value: 512 },
            { label: '1024', value: 1024 },
            { label: '2048', value: 2048 },
            { label: '4096', value: 4096 }
          ]"
        />
      </div>
    </InputGroup>
  </fieldset>
  <fieldset class="p-[5px] m-[5px] relative border first-of-type:mt-[6px]">
    <legend class="font-bold">Texture Compression Options</legend>

    <InputGroup identifier="doBasis" label="Enable Texture Compression">
      <CheckboxInput identifier="doBasis" v-model="packOptions.doBasis" />
    </InputGroup>
    <InputGroup identifier="basisMethod" label="Method">
      <RadioInput
        v-model="packOptions.basisMethod"
        :options="['PNG', 'ETC1S', 'UASTC']"
        identifier="basisMethod"
        :disable="packOptions.doBasis === false"
      />
    </InputGroup>
    <template v-if="packOptions.basisMethod === 'PNG'">
      <InputGroup v-if="packOptions.basisMethod === 'PNG'" identifier="pngFormatFilter" label="Format Filter">
        <RadioInput
          v-model="packOptions.pngFormatFilter"
          :options="['JPEG', 'PNG', 'ALL']"
          identifier="pngFormatFilter"
          :disable="packOptions.doBasis === false"
        />
      </InputGroup>
    </template>
    <template v-if="packOptions.basisMethod === 'ETC1S'">
      <InputGroup identifier="etc1sQuality" label="Quality">
        <NumberInput
          v-model="packOptions.etc1sQuality"
          :disable="packOptions.doBasis === false"
          identifier="etc1sQuality"
          :min="1"
          :max="255"
        />
      </InputGroup>
      <InputGroup identifier="etc1sResizeNPOT" label="Resize NPOT">
        <CheckboxInput
          v-model="packOptions.etc1sResizeNPOT"
          :disable="packOptions.doBasis === false"
          identifier="etc1sResizeNPOT"
        />
      </InputGroup>
    </template>
    <template v-if="packOptions.basisMethod === 'UASTC'">
      <InputGroup identifier="uastcLevel" label="Level">
        <SelectInput
          v-model="packOptions.uastcLevel"
          :disable="packOptions.doBasis === false"
          :options="[
            { label: 'Fastest', value: 0 },
            { label: 'Fast', value: 1 },
            { label: 'Default', value: 2 },
            { label: 'Slow', value: 3 },
            { label: 'Very Slow', value: 4 },
          ]"
        />
      </InputGroup>
      <InputGroup identifier="uastcResizeNPOT" label="Resize NPOT">
        <CheckboxInput
          v-model="packOptions.uastcResizeNPOT"
          :disable="packOptions.doBasis === false"
        />
      </InputGroup>
    </template>
  </fieldset>
</template>
