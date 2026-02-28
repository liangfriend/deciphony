<script lang="ts" setup>
// 符杠：四边形，侧边垂直（平行于小节），上下边沿斜率；根据 vDom.startPoint/endPoint 与 special.beam.lines 绘制
import {computed} from 'vue';
import type {VDom} from '@/types/common';

const props = defineProps<{
  vDom: VDom;
}>();

const beam = computed(() => props.vDom.special?.beam);

/** 每条符杠为四边形；按 lines[].type、centerX、scaleX 计算 x 范围；scaleX 表示从 centerX 向外的缩放，默认 1 */
const quads = computed(() => {
  const b = beam.value;
  const { startPoint, endPoint } = props.vDom;
  if (!b || !startPoint || !endPoint) return [];
  const { lines, centerX, direction, thickness = 1.5 } = b;
  const left = startPoint;
  const right = endPoint;
  const fullW = right.x - left.x;
  const fullDy = right.y - left.y;
  const scaleX = (s: number | undefined) => s ?? 1;

  return lines.map((spec, i) => {
    if (spec.type === 'none') return null;
    const s = scaleX(spec.scaleX);
    let x0: number, x1: number;
    if (spec.type === 'left') {
      if (centerX <= left.x) return null;
      x0 = centerX - s * (centerX - left.x);
      x1 = centerX;
    } else if (spec.type === 'right') {
      if (centerX >= right.x) return null;
      x0 = centerX;
      x1 = centerX + s * (right.x - centerX);
    } else {
      x0 = centerX - s * (centerX - left.x);
      x1 = centerX + s * (right.x - centerX);
    }
    const t0 = fullW === 0 ? 0 : (x0 - left.x) / fullW;
    const t1 = fullW === 0 ? 1 : (x1 - left.x) / fullW;
    const y0 = left.y + fullDy * t0;
    const y1 = left.y + fullDy * t1;
    const dy = i * (thickness + thickness);
    if (direction === 'up') {
      return `M ${x0} ${y0 + dy} L ${x1} ${y1 + dy} L ${x1} ${y1 + dy + thickness} L ${x0} ${y0 + dy + thickness} Z`;
    } else {
      return `M ${x0} ${y0 - dy} L ${x1} ${y1 - dy} L ${x1} ${y1 - dy - thickness} L ${x0} ${y0 - dy - thickness} Z`;
    }
  }).filter((d): d is string => d != null);
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
