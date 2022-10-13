<script setup lang="ts">
import { inject, ref } from 'vue';
import type { Ref } from 'vue';

const activeTab = inject('activeTab') as Ref<string>;
const tabs = ref<string[]>(['General', 'Texture', 'Vertex']);

const switchTab = (tabIdentifier: string) => {
  activeTab.value = tabIdentifier.toLowerCase();
};
</script>

<template>
  <div class="flex flex-row items-center">
    <div
      v-for="(tab, index) in tabs"
      :key="index"
      class="flex border border-[#cacaca] flex-1 items-center justify-center text-[rgb(170, 170, 170)] cursor-pointer"
      :class="{ 'bg-[#2c3e50] text-white border-[#2c3e50] relative after:absolute after:top-[-3px] after:bg-[#2c3e50] after:h-[2px] after:w-[calc(100% + 2px)] after:left-[-1px] after:rounded-t-sm': activeTab === tab.toLowerCase() }"
      @click="switchTab(tab)"
    >
      {{ tab }}
    </div>
  </div>
</template>
