<script setup lang="ts">
import { inject } from 'vue';
import InputGroup from '@/components/InputGroup.vue';
import CheckboxInput from '@/components/Inputs/CheckboxInput.vue';
import RadioInput from '@/components/Inputs/RadioInput.vue';
import SelectInput from '@/components/Inputs/SelectInput.vue';
import NumberInput from '@/components/Inputs/NumberInput.vue';

import type { Ref } from 'vue';

const doBasis = inject('doBasis') as Ref<boolean>;
const resamplingFilter = inject('resamplingFilter') as Ref<string>;
const textureResolutionWidth = inject('textureResolutionWidth') as Ref<number>;
const textureResolutionHeight = inject('textureResolutionHeight') as Ref<number>;
const doResize = inject('doResize') as Ref<boolean>;
const basisMethod = inject('basisMethod') as Ref<string>;
const pngFormatFilter = inject('pngFormatFilter') as Ref<string>;
const etc1sQuality = inject('etc1sQuality') as Ref<number>;
const etc1sResizeNPOT = inject('etc1sResizeNPOT') as Ref<boolean>;
const uastcLevel = inject('uastcLevel') as Ref<number>;
const uastcResizeNPOT = inject('uastcResizeNPOT') as Ref<boolean>;

const updateBasisMethod = (method: string) => {
  if (doBasis.value === true) {
    basisMethod.value = method;
  }
};

const updateResamplingFilter = (value: string) => {
  if (doBasis.value === true) {
    resamplingFilter.value = value;
  }
};

const updatePNGFormatFilter = (value: string) => {
  if (doBasis.value === true) {
    pngFormatFilter.value = value;
  }
};
</script>

<template>
  <fieldset class="p-[5px] m-[5px] relative border first-of-type:mt-[6px]">
    <legend class="font-bold">Texture Resize Options</legend>

    <InputGroup identifier="doResize" label="Resize Textures">
      <CheckboxInput v-model="doResize" identifier="doResize" />
    </InputGroup>
    <InputGroup identifier="resamplingFilter" label="Resampling Filter">
      <RadioInput :options="['lanczos3', 'lanczos2']" v-model="resamplingFilter" :disable="doResize === false" />
    </InputGroup>
    <InputGroup identifier="textureResolution" label="Texture Resolution">
      <div class="flex flex-row items-center">
        <SelectInput :disable="doResize === false" identifier="textureResolution" v-model="textureResolutionWidth" :options="[
          { label: '128', value: 128 },
          { label: '256', value: 256 },
          { label: '512', value: 512 },
          { label: '1024', value: 1024 },
          { label: '2048', value: 2048 },
          { label: '4096', value: 4096 }
        ]" />
        <span class="py-0 px-[2px]">x</span>
        <SelectInput :disable="doResize === false" identifier="textureResolution" v-model="textureResolutionHeight" :options="[
          { label: '128', value: 128 },
          { label: '256', value: 256 },
          { label: '512', value: 512 },
          { label: '1024', value: 1024 },
          { label: '2048', value: 2048 },
          { label: '4096', value: 4096 }
        ]" />
      </div>
    </InputGroup>
  </fieldset>
  <fieldset class="p-[5px] m-[5px] relative border first-of-type:mt-[6px]">
    <legend class="font-bold">Texture Compression Options</legend>

    <InputGroup identifier="doBasis" label="Enable Texture Compression">
      <CheckboxInput identifier="doBasis" v-model="doBasis" />
    </InputGroup>
    <InputGroup identifier="basisMethod" label="Method">
      <RadioInput :options="['PNG', 'ETC1S', 'UASTC']" identifier="basisMethod" v-model="basisMethod" :disable="doBasis === false" />
    </InputGroup>
    <template v-if="basisMethod === 'PNG'">
      <InputGroup v-if="basisMethod === 'PNG'" identifier="pngFormatFilter" label="Format Filter">
        <RadioInput :options="['JPEG', 'PNG', 'ALL']" identifier="pngFormatFilter" v-model="pngFormatFilter" :disable="doBasis === false" />
      </InputGroup>
    </template>
    <template v-if="basisMethod === 'ETC1S'">
      <InputGroup identifier="etc1sQuality" label="Quality">
        <NumberInput :disable="doBasis === false" identifier="etc1sQuality" v-model="etc1sQuality" :min="1" :max="255" />
      </InputGroup>
      <InputGroup identifier="etc1sResizeNPOT" label="Resize NPOT">
        <CheckboxInput :disable="doBasis === false" identifier="etc1sResizeNPOT" v-model="etc1sResizeNPOT" />
      </InputGroup>
    </template>
    <template v-if="basisMethod === 'UASTC'">
      <InputGroup identifier="uastcLevel" label="Level">
        <SelectInput :disable="doBasis === false" v-model="uastcLevel" :options="[
          { label: 'Fastest', value: 0 },
          { label: 'Fast', value: 1 },
          { label: 'Default', value: 2 },
          { label: 'Slow', value: 3 },
          { label: 'Very Slow', value: 4 },
        ]" />
      </InputGroup>
      <InputGroup identifier="uastcResizeNPOT" label="Resize NPOT">
        <CheckboxInput :disable="doBasis === false" v-model="uastcResizeNPOT" />
      </InputGroup>
    </template>
  </fieldset>
</template>
