<script setup lang="ts">
import { inject } from 'vue';
import InputGroup from '@/components/InputGroup.vue';
import CheckboxInput from '@/components/Inputs/CheckboxInput.vue';

import type { Ref } from 'vue';

const doDedupe = inject('doDedupe') as Ref<boolean>;
const doReorder = inject('doReorder') as Ref<boolean>;
const doWeld = inject('doWeld') as Ref<boolean>;
const doInstancing = inject('doInstancing') as Ref<boolean>;
</script>

<template>
  <fieldset class="p-[5px] m-[5px] relative border first-of-type:mt-[6px]">
    <legend class="font-bold">General Options</legend>

    <InputGroup identifier="doDedupe" label="Deduplicate Vertices">
      <CheckboxInput v-model="doDedupe" identifier="doDedupe" />
    </InputGroup>
    <InputGroup identifier="doReorder" label="Reorder Vertices">
      <CheckboxInput v-model="doReorder" identifier="doReorder" />
    </InputGroup>
    <InputGroup identifier="doWeld" label="Weld Vertices">
      <CheckboxInput v-model="doWeld" identifier="doWeld" />
    </InputGroup>
    <InputGroup identifier="doInstancing" label="Use Instancing">
      <CheckboxInput v-model="doInstancing" identifier="doInstancing" />
    </InputGroup>
  </fieldset>
</template>
