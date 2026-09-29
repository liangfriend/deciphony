<script lang="ts" setup>
import {computed, toRef} from 'vue';
import {MusicScoreTypeEnum} from '@/enums/musicScoreEnum';
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

const style = computed(() => props.vDom.special?.strumming);
const thickness = computed(() => style.value?.thickness ?? 1.5);
const arrowWidth = computed(() => style.value?.arrowWidth ?? 8);
const showArrow = computed(() => style.value?.arrow !== false);

function arrowHeadPath(
  tipX: number,
  tipY: number,
  dirX: number,
  dirY: number,
  headLen: number,
  headHalfW: number,
): string {
  const len = Math.hypot(dirX, dirY) || 1;
  const ux = dirX / len;
  const uy = dirY / len;
  const px = -uy;
  const py = ux;
  const bx = tipX - ux * headLen;
  const by = tipY - uy * headLen;
  const x1 = bx + px * headHalfW;
  const y1 = by + py * headHalfW;
  const x2 = bx - px * headHalfW;
  const y2 = by - py * headHalfW;
  return `M ${x1} ${y1} L ${tipX} ${tipY} L ${x2} ${y2} Z`;
}

const shapes = computed(() => {
  const s = props.vDom.startPoint;
  const e = props.vDom.endPoint;
  const dx = e.x - s.x;
  const dy = e.y - s.y;
  const total = Math.hypot(dx, dy) || 1;
  const ux = dx / total;
  const uy = dy / total;
  const headLen = arrowWidth.value * 0.7;
  const headHalfW = arrowWidth.value * 0.5;
  const withArrow = showArrow.value;
  const half = thickness.value / 2;
  let px = -uy;
  let py = ux;
  const shaftLen = Math.max(total - (withArrow ? headLen * 0.5 : 0), 0);
  const ex = s.x + ux * shaftLen;
  const ey = s.y + uy * shaftLen;
  const shaft =
    `M ${s.x + px * half} ${s.y + py * half}`
    + ` L ${ex + px * half} ${ey + py * half}`
    + ` L ${ex - px * half} ${ey - py * half}`
    + ` L ${s.x - px * half} ${s.y - py * half} Z`;
  return {
    shaft,
    head: withArrow ? arrowHeadPath(e.x, e.y, ux, uy, headLen, headHalfW) : '',
  };
});
</script>

<template>
  <g>
    <path
      :key="shapes.shaft"
      :d="shapes.shaft"
      :fill="strokeColor"
      stroke="none"
    />
    <path
      v-if="shapes.head"
      :key="shapes.head"
      :d="shapes.head"
      :fill="strokeColor"
      stroke="none"
    />
  </g>
</template>
