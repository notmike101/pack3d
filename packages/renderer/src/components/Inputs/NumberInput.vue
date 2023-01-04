<script lang="ts" setup>
import { inject, ref, watch } from 'vue';

interface IProps {
  identifier?: string;
  modelValue: number;
  disable?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

const props = defineProps<IProps>();
const emit = defineEmits(['update:modelValue']);
const state = ref<number>(props.modelValue);
const identifier = inject('identifier', props.identifier ?? '');

const stateWatcher = (newState: number) => {
  emit('update:modelValue', newState);
};

watch(state, stateWatcher);
</script>

<template>
  <input type="number" :id="identifier" :min="props.min" :max="props.max" :step="props.step ?? 1" class="px-[2px] py-px w-[70px] leading-none border border-gray-300 disabled:bg-gray-100 disabled:text-slate-500" v-model="state" :disabled="props.disable ?? false" />
</template>
