<script setup lang="ts">
interface IProps {
  isProcessing: boolean;
}

const props = defineProps<IProps>();
const emit = defineEmits(['click']);
</script>

<template>
  <div class="mt-auto flex flex-col">
    <button class="mt-auto w-full border-0 bg-[#3498db] text-white px-0 py-[10px] cursor-pointer" :class="{ 'opacity-50 cursor-not-allowed pointer-events-none': props.isProcessing === true }" @click="emit('click')">
      <span>{{ props.isProcessing ? 'Packing...' : 'Pack' }}</span>
    </button>
  </div>
</template>
