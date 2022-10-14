<script setup lang="ts">
interface Props {
  name: string;
  size: number;
}

const props: Props = defineProps<Props>();

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return bytes + ' Bytes';
  if (bytes < 1048576) return (bytes / 1024).toFixed(3) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + ' MB';

  return (bytes / 1073741824).toFixed(3) + ' GB';
};
</script>

<template>
  <div class="absolute bg-black/70 text-left p-[5px] text-white">
    <p class="m-0 p-0">File Name: {{ props.name }}</p>
    <p class="m-0 p-0">File Size: {{ formatBytes(props.size) }}</p>
  </div>
</template>
