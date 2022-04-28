<script setup lang="ts">
import { inject } from 'vue';

const doDedupe = inject('doDedupe');
const doReorder = inject('doReorder');
const doWeld = inject('doWeld');
const doInstancing = inject('doInstancing');
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
