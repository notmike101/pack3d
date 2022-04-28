<script setup lang="ts">
import { inject } from 'vue';
import type { Ref } from 'vue';

const logs: Ref<[]> = inject('logs');
</script>

<template>
  <footer class="log">
    <div class="log-content">
      <p v-for="log in logs">
        <span style="font-weight: bold;">{{ log.split(' ')[0] }}</span>
        <span>{{ log.replace(log.split(' ')[0], '') }}</span>
      </p>
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