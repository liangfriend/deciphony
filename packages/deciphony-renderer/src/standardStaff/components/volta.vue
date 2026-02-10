<script lang="ts" setup>
// props 传入 VDom，volta 的 x/y/w/h 已在父级 translate 中应用，此处在 0,0 为原点的局部坐标系内绘制
import {computed} from 'vue';
import type {VDom} from '@/types/common';

const props = defineProps<{
  vDom: VDom;
}>();

// 反复房子：左侧竖线 + 底边 + 可选序号（如 1. 2.），在局部 (0,0)-(w,h) 内绘制
const w = computed(() => props.vDom.w);
const h = computed(() => props.vDom.h);
</script>

<template>
  <!-- 左侧竖线 -->
  <line :x1="0.5" :x2="0.5" :y1="0" :y2="h" stroke="currentColor" stroke-width="1"/>
  <!-- 底边横线 -->
  <line :x1="0" :x2="w" :y1="0.5" :y2="0.5" stroke="currentColor" stroke-width="1"/>
  <!-- 可选：序号文字，可由 data.volta 扩展传入 label -->
  <text
      :y="h - 10"
      dominant-baseline="auto"
      fill="currentColor"
      font-size="10"
      x="6"
  >1.
  </text>
</template>

<style scoped>
/* 保证svg缩放时，线条不变*/
/*.volta line {
  vector-effect: non-scaling-stroke;
}*/
</style>
