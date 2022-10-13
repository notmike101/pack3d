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
  <div class="tabs">
    <div
      v-for="(tab, index) in tabs"
      :key="index"
      class="tab"
      :class="{ active: activeTab === tab.toLowerCase() }"
      @click="switchTab(tab)"
    >
      {{ tab }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
$font-size: 12px;

.tabs {
  display: flex;
  flex-direction: row;
  align-items: center;
  
  .tab {
    display: flex;
    border: 1px solid #cacaca;
    flex: 1;
    align-items: center;
    justify-content: center;
    color:rgb(170, 170, 170);
    cursor: pointer;
    font-size: $font-size;

    &.active {
      background-color: #2c3e50;
      color: white;
      border: 1px solid #2c3e50;
      position: relative;

      &:after {
        position: absolute;
        top: -3px;
        background-color: #2c3e50;
        content: ' ';
        height: 2px;
        width: calc(100% + 2px);
        left: -1px;
        border-radius: 5px 5px 0 0;
      }
    }
  }
}
</style>