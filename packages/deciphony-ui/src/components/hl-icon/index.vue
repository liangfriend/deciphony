<!-- src/components/hl-icon/index.vue -->
<script setup lang="ts">
import { onMounted } from 'vue';

defineOptions({
  name: 'HlIcon' // 给组件一个全局 name
});
// 批量引入 svg 原始内容
const modules = import.meta.glob('../../assets/svg/hl-icon/*.svg', { as: 'raw', eager: true });

// 整理成 { 文件名: svg字符串 } 形式
const icons: Record<string, string> = {};
for (const path in modules) {
  // 取文件名（不带扩展名）
  const match = path.match(/\/([^/]+)\.svg$/);
  if (match) {
    icons[match[1]] = modules[path] as string;
  }
}
onMounted(() => {});

const props = withDefaults(
  defineProps<{
    name: string;
    size?: number | string;
    color?: string;
  }>(),
  {
    size: '1rem',
    color: '#000'
  }
);
function getSvgBlob() {
  const svgContent = icons[props.name];
  return new Blob([svgContent], { type: 'image/svg+xml' });
}

defineExpose({ getSvgBlob });
</script>

<template>
  <div class="hl-icon" :style="{ width: size, height: size, color: color }" v-html="icons[name]" />
</template>

<style scoped>
.hl-icon {
  display: inline-block;
  vertical-align: middle;
}
.hl-icon svg {
  width: 100%;
  height: 100%;
}
</style>
