<script setup lang="ts">
import { inject } from 'vue';
import type { Ref } from 'vue';

const errorMessage = inject('errorMessage') as Ref<string>;
</script>

<template>
  <div v-if="errorMessage" class="absolute bg-red-500/90 top-[30px] left-1/2 w-[95%] bg-[rgb(255, 84, 84)] text-white text-center rounded-sm -translate-x-1/2">
    <p class="text-center p-o mx-0 my-[5px]">
      <span class="font-bold">Error:</span>
      {{ errorMessage }}
    </p>
  </div>
</template>
