<script lang="ts" setup>
import {computed, toRef} from 'vue';
import {MusicScoreTypeEnum, PitchTypeEnum} from '@/enums/musicScoreEnum';
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

const style = computed(() => props.vDom.special?.pitch);
const thickness = computed(() => style.value?.thickness ?? 1.5);
const label = computed(() => style.value?.type ?? PitchTypeEnum['8va']);
/** up：虚线在顶；down：虚线在底 */
const direction = computed(() => style.value?.direction ?? 'up');

/**
 * start/end 的 y 为虚线高度。
 * pitch_down：文字与右侧竖线同高、在虚线上方；
 * pitch_up：文字与右侧竖线同高、在虚线下方。
 */
const geom = computed(() => {
  const s = props.vDom.startPoint;
  const e = props.vDom.endPoint;
  const lineY = (s.y + e.y) / 2;
  const left = Math.min(s.x, e.x);
  const right = Math.max(s.x, e.x);
  const tick = 10;
  const gap = 11;
  const down = direction.value === 'down';
  // 文字与右侧竖线同高；虚线在 down 时居底、up 时居顶
  const markY = down ? lineY - gap : lineY + gap;
  return {
    lineY,
    lineX1: left + 16,
    lineX2: Math.max(left + 16, right - 2),
    startText: {x: s.x, y: markY},
    endTick: {
      x1: e.x,
      x2: e.x,
      y1: markY - tick / 2,
      y2: markY + tick / 2,
    },
  };
});
</script>

<template>
  <g>
    <text
      :x="geom.startText.x"
      :y="geom.startText.y"
      :fill="strokeColor"
      dominant-baseline="middle"
      font-family="serif"
      font-size="11"
      font-style="italic"
      text-anchor="middle"
    >{{ label }}</text>
    <line
      :x1="geom.lineX1"
      :x2="geom.lineX2"
      :y1="geom.lineY"
      :y2="geom.lineY"
      :stroke="strokeColor"
      :stroke-width="thickness"
      stroke-dasharray="4 3"
      stroke-linecap="round"
    />
    <line
      :x1="geom.endTick.x1"
      :x2="geom.endTick.x2"
      :y1="geom.endTick.y1"
      :y2="geom.endTick.y2"
      :stroke="strokeColor"
      :stroke-width="thickness"
      stroke-linecap="round"
    />
  </g>
</template>
