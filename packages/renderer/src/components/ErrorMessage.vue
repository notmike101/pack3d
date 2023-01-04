<script setup lang="ts">
import { inject } from 'vue';

import type { Ref } from 'vue';

const errorMessage = inject('errorMessage') as Ref<string>;

const dismissErrorMessage = () => {
  errorMessage.value = '';
};
</script>

<template>
  <div v-if="errorMessage !== ''" class="absolute bg-red-500/95 top-[30px] left-1/2 w-[95%] bg-[rgb(255, 84, 84)] rounded-sm -translate-x-1/2 drop-shadow-lg flex flex-row items-center px-2 my-1">
    <span class="text-white font-bold">Error:</span>
    <span class="text-white ml-0.5">{{ errorMessage }}</span>
    <span class="text-white text-[0.5rem] bg-transparent border border-white rounded-sm ml-auto p-0.5 cursor-pointer" @click="dismissErrorMessage">DISMISS</span>
  </div>
</template>
