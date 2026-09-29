<script lang="ts" setup>
import {computed, toRef} from 'vue';
import {MusicScoreTypeEnum, PedalTypeEnum} from '@/enums/musicScoreEnum';
import type {Skin, VDom} from '@/types/common';
import {useGeometrySkinColor} from './useGeometrySkinColor';

const props = defineProps<{
  vDom: VDom;
  notationType?: MusicScoreTypeEnum;
  skin?: Skin;
}>();

const strokeColor = useGeometrySkinColor(
  toRef(props, 'vDom'),
  toRef(props, 'skin'),
  toRef(props, 'notationType'),
);

const style = computed(() => props.vDom.special?.pedal);
const thickness = computed(() => style.value?.thickness ?? 1.5);
const type = computed(() => style.value?.type ?? PedalTypeEnum.Normal);

/** 占位：按下端「Ped.」+ 底横线 + 抬起端「*」 */
const geom = computed(() => {
  void type.value;
  const s = props.vDom.startPoint;
  const e = props.vDom.endPoint;
  const y = (s.y + e.y) / 2;
  const left = Math.min(s.x, e.x);
  const right = Math.max(s.x, e.x);
  const gap = 14;
  return {
    lineY: y,
    lineX1: left + gap,
    lineX2: Math.max(left + gap, right - gap),
    startText: {x: s.x, y: y - 2},
    endText: {x: e.x, y: y + 4},
  };
});
</script>

<template>
  <g>
    <text
      :x="geom.startText.x"
      :y="geom.startText.y"
      :fill="strokeColor"
      dominant-baseline="auto"
      font-family="serif"
      font-size="11"
      font-style="italic"
      text-anchor="middle"
    >Ped.</text>
    <line
      :x1="geom.lineX1"
      :x2="geom.lineX2"
      :y1="geom.lineY"
      :y2="geom.lineY"
      :stroke="strokeColor"
      :stroke-width="thickness"
      stroke-linecap="round"
    />
    <text
      :x="geom.endText.x"
      :y="geom.endText.y"
      :fill="strokeColor"
      dominant-baseline="auto"
      font-family="serif"
      font-size="14"
      text-anchor="middle"
    >*</text>
  </g>
</template>
