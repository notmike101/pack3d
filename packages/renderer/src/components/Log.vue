<script setup lang="ts">
import { inject, computed } from 'vue';

import type { Ref } from 'vue';

const logs = inject('logs') as Ref<string[]>;
const logString = computed<string>(() => logs.value.join('\n'));
</script>

<template>
  <footer class="basis-[150px] text-left bg-[#f0f0f0] border-t border-t-black overflow-auto bloc max-h-[150px]">
    <textarea class="block p-[5px] m-0 outline-0 border-0 resize-none w-full h-full">{{ logString }}</textarea>
  </footer>
</template>
