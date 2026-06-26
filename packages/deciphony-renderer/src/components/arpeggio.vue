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

const style = computed(() => props.vDom.special?.arpeggio);
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
  const dx = e.x - s.x;
  const dy = e.y - s.y;
  const total = Math.hypot(dx, dy) || 1;
  const ux = dx / total;
  const uy = dy / total;
  // 波动方向（与走向垂直）
  const px = -uy;
  const py = ux;

  const headLen = arrowWidth.value * 0.55;
  const headHalfW = arrowWidth.value * 0.4;
  // 波浪振幅与单个半波长度（决定弯曲程度与波数）
  const amplitude = arrowWidth.value * 0.45;
  const segment = arrowWidth.value * 0.9;

  // 箭杆止于箭头基部，给箭头留出空间
  const shaftLen = Math.max(total - headLen, 0);
  const baseX = s.x + ux * shaftLen;
  const baseY = s.y + uy * shaftLen;

  const n = Math.max(2, Math.round(shaftLen / segment));
  const step = shaftLen / n;

  let d = `M ${s.x} ${s.y}`;
  for (let i = 0; i < n; i++) {
    const sign = i % 2 === 0 ? 1 : -1;
    const x0 = s.x + ux * step * i;
    const y0 = s.y + uy * step * i;
    const x1 = s.x + ux * step * (i + 1);
    const y1 = s.y + uy * step * (i + 1);
    const cx = (x0 + x1) / 2 + px * sign * amplitude;
    const cy = (y0 + y1) / 2 + py * sign * amplitude;
    d += ` Q ${cx} ${cy} ${x1} ${y1}`;
  }

  return {
    shaft: d,
    head: arrowHeadPath(e.x, e.y, ux, uy, headLen, headHalfW),
    baseX,
    baseY,
  };
});
</script>

<template>
  <g>
    <path
      :key="shapes.shaft"
      :d="shapes.shaft"
      fill="none"
      :stroke="strokeColor"
      :stroke-width="thickness"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      :key="shapes.head"
      :d="shapes.head"
      fill="none"
      :stroke="strokeColor"
      :stroke-width="thickness"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </g>
</template>
