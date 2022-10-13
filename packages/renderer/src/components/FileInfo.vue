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
  <div class="canvas-container-info">
    <p>File Name: {{ props.name }}</p>
    <p>File Size: {{ formatBytes(props.size) }}</p>
  </div>
</template>

<style lang="scss" scoped>
$font-size: 12px;

.canvas-container-info {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.7);
  font-size: $font-size;
  text-align: left;
  padding: 5px;
  color: white;

  p {
    margin: 0;
    padding: 0;
  }
}
</style>
