<script lang="ts" setup>
// 鼓谱长休止符小节数：父级 translate 定位，局部 (0,0)-(w,h) 内居中绘制；颜色取 LongRestNumber 占位皮肤
import {computed, toRef} from 'vue';
import {MusicScoreTypeEnum} from '@/enums/musicScoreEnum';
import type {Skin, VDom} from '@/types/common';
import {useGeometrySkinColor} from './useGeometrySkinColor';

const props = defineProps<{
  vDom: VDom;
  notationType?: MusicScoreTypeEnum;
  skin?: Skin;
}>();

const color = useGeometrySkinColor(
    toRef(props, 'vDom'),
    toRef(props, 'skin'),
    toRef(props, 'notationType'),
);

const w = computed(() => props.vDom.w);
const h = computed(() => props.vDom.h);
const text = computed(() => String(props.vDom.special?.longRestNumber?.count ?? ''));
</script>

<template>
  <rect :height="h" :width="w" fill="transparent" x="0" y="0"/>
  <text
      :fill="color"
      :font-size="h"
      :x="w / 2"
      :y="h / 2"
      dominant-baseline="central"
      font-weight="bold"
      text-anchor="middle"
  >{{ text }}
  </text>
</template>
