<script setup lang="ts">
import { inject } from 'vue';
import type { Ref } from 'vue';

const doDedupe = inject('doDedupe') as Ref<boolean>;
const doReorder = inject('doReorder') as Ref<boolean>;
const doWeld = inject('doWeld') as Ref<boolean>;
const doInstancing = inject('doInstancing') as Ref<boolean>;
</script>

<template>
  <fieldset>
    <legend>General Options</legend>
    <div class="input-group">
      <input type="checkbox" id="doDedupe" v-model="doDedupe" />
      <label for="doDedupe">Dedupe</label>
    </div>
    <div class="input-group">
      <input type="checkbox" id="doReorder" v-model="doReorder" />
      <label for="doReorder">Reorder</label>
    </div>
    <div class="input-group">
      <input type="checkbox" id="doWeld" v-model="doWeld" />
      <label for="doWeld">Weld</label>
    </div>
    <div class="input-group">
      <input type="checkbox" id="doInstancing" v-model="doInstancing" />
      <label for="doInstancing">Instancing</label>
    </div>
  </fieldset>
</template>
