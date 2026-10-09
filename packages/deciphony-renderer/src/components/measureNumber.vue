<script lang="ts" setup>
// 小节号：父级 translate 定位，局部 (0,0)-(w,h) 内水平、垂直居中
import {computed} from 'vue';
import type {VDom} from '@/types/common';
import {measureNumberText} from '@/render/measureNumber';

const props = defineProps<{
  vDom: VDom;
}>();

const w = computed(() => props.vDom.w);
const h = computed(() => props.vDom.h);
const text = computed(() => {
  const mn = props.vDom.special?.measureNumber;
  return mn ? measureNumberText(mn.number, mn.bracket) : '';
});
</script>

<template>
  <rect :height="h" :width="w" fill="transparent" x="0" y="0"/>
  <text
      :font-size="h"
      :x="w / 2"
      :y="h / 2"
      dominant-baseline="central"
      fill="#000000"
      text-anchor="middle"
  >{{ text }}
  </text>
</template>
