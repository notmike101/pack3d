<script lang="ts" setup>
import { ref, watch } from 'vue';

interface Props {
  modelValue: string;
  options: string[];
  disable?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue']);
const state = ref<string>(props.modelValue);

const stateWatcher = (newValue: string) => {
  emit('update:modelValue', newValue);
};

const optionClick = (option: string) => {
  if (props.disable !== true) {
    state.value = option;
  }
}

watch(state, stateWatcher);
</script>

<template>
  <div class="flex flex-row items-center outline outline-[#2c3e50] outline-1 rounded-sm mb-[3px]">
    <div
      v-for="(option, index) in options"
      :key="index"
      class="px-[2px] py-px leading-none cursor-pointer border-r border-r-[#2c3e50] first-of-type:rounded-tl-sm first-of-type:rounded-bl-sm last-of-type:border-r-0 last-of-type:rounded-tr-sm last-of-type:rounded-br-sm"
      :class="{
        'text-white bg-[#2c3e50]': state.toLowerCase() === option.toLowerCase(),
        'text-slate-500 bg-opacity-10 text-opacity-50': props.disable === true
      }"
      @click="optionClick(option)"
    >
      <span>{{ option }}</span>
    </div>
  </div>
</template>
