<script setup lang="ts">
import { inject } from 'vue';

const activeTab = inject('activeTab');

function switchTab(tabIdentifier: string): void {
  activeTab.value = tabIdentifier;
}
</script>

<template>
  <div class="tabs">
    <div class="tab" :class="{ active: activeTab === 'general' }" @click="switchTab('general')">General</div>
    <div class="tab" :class="{ active: activeTab === 'texture' }" @click="switchTab('texture')">Texture</div>
    <div class="tab" :class="{ active: activeTab === 'vertex' }" @click="switchTab('vertex')">Vertex</div>
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