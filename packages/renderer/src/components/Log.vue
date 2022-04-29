<script setup lang="ts">
import { inject, ref, watch } from 'vue';
import type { Ref } from 'vue';

const logs: Ref<[]> = inject('logs')!;
const logString: Ref<string> = ref<string>('');

watch(logs, () => {
  logString.value = logs.value.join('\n');
});

function getLogTimestamp(log: string): string {
  return log.split(' ')[0];
}

function getLogMessage(log: string): string {
  return log.replace(getLogTimestamp(log), '').trim();
}
</script>

<template>
  <footer class="log">
    <textarea>{{ logs.map((log: string) => log.trim()).join('\n') }}</textarea>
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

  p {
    padding: 0;
    margin: 0;
    font-family: monospace;
    font-size: $font-size;
  }
}
</style>