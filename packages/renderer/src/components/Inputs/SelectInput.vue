<script lang="ts" setup>
import { ref, watch, inject } from 'vue';

interface Props {
  identifier?: string;
  modelValue: any;
  disable?: boolean;
  options: { label: string, value: any }[];
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue']);
const state = ref<any>(props.modelValue);
const identifier = inject('identifier', props.identifier ?? '');


const stateWatcher = (newState: any) => {
  emit('update:modelValue', newState);
};

watch(state, stateWatcher);
</script>

<template>
  <select :disabled="props.disable ?? false" :id="identifier" class="p-px m-0" v-model="state">
    <option v-for="{ label, value } in props.options" :key="`${label}_${value}`" :value="value">{{ label }}</option>
  </select>
</template>
