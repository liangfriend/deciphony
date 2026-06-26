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
const thickness = computed(() => style.value?.thickness ?? 1);
const arrowWidth = computed(() => style.value?.arrowWidth ?? 8);

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
  return `M ${x1} ${y1} L ${tipX} ${tipY} L ${x2} ${y2}`;
}

const shapes = computed(() => {
  const s = props.vDom.startPoint;
  const e = props.vDom.endPoint;
  const t = thickness.value;
  const minY = Math.min(s.y, e.y);
  const maxY = Math.max(s.y, e.y);
  const headLen = arrowWidth.value * 0.55;
  const headHalfW = arrowWidth.value * 0.4;
  const dx = e.x - s.x;
  const dy = e.y - s.y;
  return {
    shaft: {
      x: s.x - t / 2,
      y: minY,
      width: t,
      height: maxY - minY,
    },
    head: arrowHeadPath(e.x, e.y, dx, dy, headLen, headHalfW),
  };
});
</script>

<template>
  <g>
    <rect
      :x="shapes.shaft.x"
      :y="shapes.shaft.y"
      :width="shapes.shaft.width"
      :height="shapes.shaft.height"
      :fill="strokeColor"
      stroke="none"
    />
    <path
      :d="shapes.head"
      fill="none"
      :stroke="strokeColor"
      :stroke-width="thickness"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </g>
</template>
