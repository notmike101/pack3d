<script setup lang="ts">
import { inject, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';

const logs: Ref<[]> = inject('logs')!;
const logString: ComputedRef<string> = computed((): string => logs.value.join('\n'));
</script>

<template>
  <footer class="log">
    <textarea>{{ logString }}</textarea>
  </footer>
</template>

<style lang="scss" scoped>
$font-size: 12px;

.log {
  flex: 0 0 150px;
  text-align: left;
  background-color: #f0f0f0;
  border-top: 1px solid black;
  overflow: auto;
  display: block;
  max-height: 150px;

  textarea {
    display: block;
    padding: 5px;
    margin: 0;
    outline: 0;
    border: 0;
    resize: none;
    width: calc(100% - 10px);
    height: calc(100% - 10px);
  }
}
</style>