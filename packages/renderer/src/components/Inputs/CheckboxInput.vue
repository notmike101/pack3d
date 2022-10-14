<script lang="ts" setup>
import { ref, watch, inject } from 'vue';

interface Props {
  identifier?: string;
  modelValue: boolean;
  disabled?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue']);
const state = ref<boolean>(props.modelValue);
const identifier = inject('identifier', props.identifier ?? '');


const stateWatcher = (newState: boolean) => {
  emit('update:modelValue', newState);
};

watch(state, stateWatcher);
</script>

<template>
  <input type="checkbox" :id="identifier" class="cursor-pointer" v-model="state" :disabled="props.disabled" />
</template>
