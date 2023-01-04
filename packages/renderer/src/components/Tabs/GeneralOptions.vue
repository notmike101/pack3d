<script setup lang="ts">
import { inject } from 'vue';
import InputGroup from '@/components/InputGroup.vue';
import CheckboxInput from '@/components/Inputs/CheckboxInput.vue';

import type { IPackOptions } from 'types';

const packOptions = inject('packOptions') as IPackOptions;
</script>

<template>
  <fieldset class="p-[5px] m-[5px] relative border first-of-type:mt-[6px]">
    <legend class="font-bold">General Options</legend>

    <InputGroup identifier="doDedupe" label="Deduplicate Vertices">
      <CheckboxInput v-model="packOptions.doDedupe" identifier="doDedupe" />
    </InputGroup>
    <InputGroup identifier="doReorder" label="Reorder Vertices">
      <CheckboxInput v-model="packOptions.doReorder" identifier="doReorder" />
    </InputGroup>
    <InputGroup identifier="doWeld" label="Weld Vertices">
      <CheckboxInput v-model="packOptions.doWeld" identifier="doWeld" />
    </InputGroup>
    <InputGroup identifier="doInstancing" label="Use Instancing">
      <CheckboxInput v-model="packOptions.doInstancing" identifier="doInstancing" />
    </InputGroup>
  </fieldset>
</template>
