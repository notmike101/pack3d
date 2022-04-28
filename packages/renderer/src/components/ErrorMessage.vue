<script setup lang="ts">
import { inject } from 'vue';
import type { Ref } from 'vue';

const errorMessage: Ref<string> = inject('errorMessage')!;
</script>

<template>
  <div v-if="errorMessage" class="error-message">
    <p>
      <span style="font-weight: bold">Error:</span>
      {{ errorMessage }}
    </p>
  </div>
</template>

<style lang="scss" scoped>
.error-message {
  position: absolute;
  top: 30px;
  left: 50%;
  width: 95%;
  background-color: rgb(255 84 84);
  color: white;
  text-align: center;
  transform: translateX(-50%);
  border-radius: 5px;

  p {
    text-align: center;
    padding: 0;
    margin: 5px 0;
  }
}
</style>