<script setup lang="ts">
import { ipcRenderer } from 'electron';
import { inject } from 'vue';

const logs = inject('logs');
</script>

<template>
  <footer class="log">
    <div class="log-content">
      <p v-for="log in logs">{{ log }}</p>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
$font-size: 12px;

.log {
  flex: 0 0 150px;
  text-align: left;
  background-color: #f0f0f0;
  border-top: 1px solid black;
  padding: 5px;
  overflow: auto;
  display: block;

  p {
    padding: 0;
    margin: 0;
    font-family: monospace;
    font-size: $font-size;
  }
}
</style>