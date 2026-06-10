<script lang="ts" setup>
// props 传入 VDom；x/y/w/h 已在 renderVolta 中叠加 data.volta.relativeX/Y/W/H，父级 translate 定位，局部 (0,0) 绘制
import {computed, toRef} from 'vue';
import {MusicScoreTypeEnum} from '@/enums/musicScoreEnum';
import type {Skin, VDom} from '@/types/common';
import {useGeometrySkinColor} from './useGeometrySkinColor';

const props = defineProps<{
  vDom: VDom;
  notationType?: MusicScoreTypeEnum;
  skin?: Skin;
}>();

const lineColor = useGeometrySkinColor(
    toRef(props, 'vDom'),
    toRef(props, 'skin'),
    toRef(props, 'notationType'),
);

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
  <line v-if="!openLeft" :x1="0.5" :x2="0.5" :y1="0" :y2="h" :stroke="lineColor" stroke-width="1"/>
  <!-- 顶部横线 -->
  <line :x1="0" :x2="w" :y1="0.5" :y2="0.5" :stroke="lineColor" stroke-width="1"/>
  <!-- 右侧竖线 -->
  <line v-if="!openRight" :x1="w-0.5" :x2="w-0.5" :y1="0" :y2="h" :stroke="lineColor" stroke-width="1"/>
  <text
      v-if="labelText"
      :y="h - 10"
      dominant-baseline="auto"
      :fill="lineColor"
      font-size="10"
      x="6"
  >{{ labelText }}
  </text>
</template>

<style scoped>
</style>
