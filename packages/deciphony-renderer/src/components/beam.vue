<script lang="ts" setup>
// 符杠：四边形，侧边垂直（平行于小节），上下边沿斜率；根据 vDom.startPoint/endPoint 与 special.beam.lines 绘制
import {computed} from 'vue';
import type {VDom} from '@/types/common';

const props = defineProps<{
  vDom: VDom;
}>();

const beam = computed(() => props.vDom.special?.beam);

/** 每条符杠为四边形，lines 为 {}[] 时整段画满 */
const quads = computed(() => {
  const b = beam.value;
  const { startPoint, endPoint } = props.vDom;
  if (!b || !startPoint || !endPoint) return [];
  const { lines, direction, thickness = 1.5 } = b;
  const left = startPoint;
  const right = endPoint;
  const fullDy = right.y - left.y;

  return lines.map((_, i) => {
    const dy = i * (thickness + thickness);
    if (direction === 'up') {
      return `M ${left.x} ${left.y + dy} L ${right.x} ${right.y + dy} L ${right.x} ${right.y + dy + thickness} L ${left.x} ${left.y + dy + thickness} Z`;
    } else {
      return `M ${left.x} ${left.y - dy} L ${right.x} ${right.y - dy} L ${right.x} ${right.y - dy - thickness} L ${left.x} ${left.y - dy - thickness} Z`;
    }
  });
});
</script>

<template>
  <path
      v-for="(d, i) in quads"
      :key="i"
      :d="d"
      fill="currentColor"
  />
</template>

<style scoped>
</style>
