<script lang="ts" setup>
// 符杠：四边形，侧边垂直（平行于小节），上下边沿斜率；根据 vDom.startPoint/endPoint 与 special.beam.lines 绘制
import {computed} from 'vue';
import type {VDom} from '@/types/common';

const props = defineProps<{
  vDom: VDom;
}>();

const beam = computed(() => props.vDom.special?.beam);

/** 每条符杠为四边形：左/右边垂直，上/下边沿起止点斜率 */
const quads = computed(() => {
  const b = beam.value;
  const {startPoint, endPoint} = props.vDom;
  if (!b || !startPoint || !endPoint) return [];
  const {lines, spacing, direction, thickness = 1.5} = b;
  const left = startPoint;
  const right = endPoint;
  // 第一条符杠 = 符杠位置(i=0)，第二条第三条往下排；视觉往下 = y 增加
  return lines.map((_, i) => {
    const dy = i * (thickness + thickness);
    if (direction === 'up') {
      // 上边在上：左上一右上一右下—左下
      return `M ${left.x} ${left.y + dy} L ${right.x} ${right.y + dy} L ${right.x} ${right.y + dy + thickness} L ${left.x} ${left.y + dy + thickness} Z`;
    } else {
      // 下边在下：左上—右上—右下—左下
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
