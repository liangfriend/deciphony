<script lang="ts" setup>
import {computed, toRef} from 'vue';
import {ArpeggioTypeEnum, MusicScoreTypeEnum} from '@/enums/musicScoreEnum';
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
const thickness = computed(() => style.value?.thickness ?? 1.5);
const arrowWidth = computed(() => style.value?.arrowWidth ?? 8);
const showArrow = computed(() => style.value?.arrow !== false);
const isStraight = computed(() => style.value?.type === ArpeggioTypeEnum.Staright);

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

const KAPPA = 0.5522847498;

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
  const usableHead = withArrow ? headLen : 0;

  if (isStraight.value) {
    const half = thickness.value / 2;
    let px = -uy;
    let py = ux;
    const shaftLen = Math.max(total - (withArrow ? usableHead * 0.5 : 0), 0);
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
  }

  // 垂直于走向、朝屏幕右侧的一侧为「右半椭圆」
  let px = -uy;
  let py = ux;
  if (px < 0 || (px === 0 && py < 0)) {
    px = -px;
    py = -py;
  }

  const nominalRa = arrowWidth.value * 0.36;
  const rv = arrowWidth.value * 0.2;
  const shift = nominalRa * 0.6;

  const bodyLen = Math.max(total - (withArrow ? usableHead * 0.5 : 0), shift + 1);
  const n = Math.max(1, Math.round((bodyLen - shift) / (2 * nominalRa)));
  const pitch = (bodyLen - shift) / n;
  const ra = pitch / 2;
  const du = uy >= 0 ? shift : -shift;
  const start = du < 0 ? shift : 0;

  const pt = (u: number, v: number) =>
    `${s.x + ux * u + px * v} ${s.y + uy * u + py * v}`;
  const ka = KAPPA * ra;
  const kv = KAPPA * rv;

  let d = '';
  for (let i = 0; i < n; i++) {
    const a = start + i * pitch;
    const b = a + du;
    d += `M ${pt(a, 0)}`
      + ` C ${pt(a, kv)} ${pt(a + ra - ka, rv)} ${pt(a + ra, rv)}`
      + ` C ${pt(a + ra + ka, rv)} ${pt(a + 2 * ra, kv)} ${pt(a + 2 * ra, 0)}`
      + ` L ${pt(b + 2 * ra, 0)}`
      + ` C ${pt(b + 2 * ra, -kv)} ${pt(b + ra + ka, -rv)} ${pt(b + ra, -rv)}`
      + ` C ${pt(b + ra - ka, -rv)} ${pt(b, -kv)} ${pt(b, 0)}`
      + ' Z ';
  }

  return {
    shaft: d,
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
