<script lang="ts" setup>
import { provide, ref } from 'vue';

interface Props {
  identifier?: string;
  label: string;
  disableHoverPointer?: boolean;
}

const props = defineProps<Props>();

const identifier = ref<string>(props.identifier ?? '');
const label = ref<string>(props.label);
const disableHoverPointer = ref<boolean>(props.disableHoverPointer ?? true);

provide('identifier', identifier);
</script>

<template>
  <div class="flex py-px px-[2px] flex-row items-center justify-between w-full">
    <label :for="identifier" class="flex p-0 mb-px" :class="{ 'cursor-pointer': disableHoverPointer !== true }">{{ label }}</label>
    <slot></slot>
  </div>
</template>
