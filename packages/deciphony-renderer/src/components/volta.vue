<script lang="ts" setup>
// props 传入 VDom；x/y/w/h 已在 renderVolta 中叠加 data.volta.relativeX/Y/W/H，父级 translate 定位，局部 (0,0) 绘制
import {computed} from 'vue';
import type {VDom} from '@/types/common';

const props = defineProps<{
  vDom: VDom;
}>();

// 反复房子：左侧竖线 + 顶边 + 右侧竖线 + 可选序号（如 1. 2.），在局部 (0,0)-(w,h) 内绘制
const w = computed(() => props.vDom.w);
const h = computed(() => props.vDom.h);
const voltaData = computed(() => props.vDom.special?.volta ?? {});
/** openLeft/openRight 为 true 时隐藏对应侧竖线（开放该侧） */
const openLeft = computed(() => Boolean(voltaData.value.openLeft));
const openRight = computed(() => Boolean(voltaData.value.openRight));
const labelText = computed(() => String(voltaData.value.text ?? ''));
</script>

<template>
  <!-- 左侧竖线 -->
  <line v-if="!openLeft" :x1="0.5" :x2="0.5" :y1="0" :y2="h" stroke="currentColor" stroke-width="1"/>
  <!-- 顶部横线 -->
  <line :x1="0" :x2="w" :y1="0.5" :y2="0.5" stroke="currentColor" stroke-width="1"/>
  <!-- 右侧竖线 -->
  <line v-if="!openRight" :x1="w-0.5" :x2="w-0.5" :y1="0" :y2="h" stroke="currentColor" stroke-width="1"/>
  <text
      v-if="labelText"
      :y="h - 10"
      dominant-baseline="auto"
      fill="currentColor"
      font-size="10"
      x="6"
  >{{ labelText }}
  </text>
</template>

<style scoped>
</style>
