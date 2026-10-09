<script lang="ts" setup>
import {computed, toRef} from 'vue';
import {ArpeggioTypeEnum, MusicScoreTypeEnum} from '@/enums/musicScoreEnum';
import type {Skin, VDom} from '@/types/common';
import {bravuraLineGlyphs} from '@/skins/generated/bravuraLineGlyphs';
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

const G = bravuraLineGlyphs;
/** 波浪段中线到基线的距离：平移后中线落在琶音轴线上 */
const WIGGLE_CENTER_OFFSET = -(G.wiggleArpeggiatoUp.y1 + G.wiggleArpeggiatoUp.y2) / 2;
/** 向下箭头字形的箭头尖在包围盒左缘，平移到局部 x = 0 */
const DOWN_ARROW_TIP_X = G.wiggleArpeggiatoDownArrow.x1;

type Placed = { d: string; x: number };

/**
 * 波浪琶音：SMuFL wiggleArpeggiato* 为横向字形，沿「下 → 上」方向平铺后整体旋转（字形始终在轴线同一侧）。
 * 段数取最接近的整数，再沿轴向微缩放，使两端（含箭头尖）正好落在起止点。
 */
const wiggle = computed(() => {
  const s = props.vDom.startPoint;
  const e = props.vDom.endPoint;
  const arrowAtEnd = showArrow.value;
  const endIsUpper = e.y <= s.y;
  const from = endIsUpper ? s : e;
  const to = endIsUpper ? e : s;
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  if (length <= 0) return null;

  const seg = arrowAtEnd && !endIsUpper ? G.wiggleArpeggiatoDown : G.wiggleArpeggiatoUp;
  const glyphs: Placed[] = [];
  let natural: number;
  if (!arrowAtEnd) {
    const n = Math.max(1, Math.round(length / seg.advance));
    for (let i = 0; i < n; i++) glyphs.push({d: seg.d, x: i * seg.advance});
    natural = n * seg.advance;
  } else if (endIsUpper) {
    const arrow = G.wiggleArpeggiatoUpArrow;
    const n = Math.max(0, Math.round((length - arrow.x2) / seg.advance));
    for (let i = 0; i < n; i++) glyphs.push({d: seg.d, x: i * seg.advance});
    glyphs.push({d: arrow.d, x: n * seg.advance});
    natural = n * seg.advance + arrow.x2;
  } else {
    const arrow = G.wiggleArpeggiatoDownArrow;
    const arrowLen = arrow.advance - DOWN_ARROW_TIP_X;
    const n = Math.max(0, Math.round((length - arrowLen) / seg.advance));
    glyphs.push({d: arrow.d, x: -DOWN_ARROW_TIP_X});
    for (let i = 0; i < n; i++) glyphs.push({d: seg.d, x: arrowLen + i * seg.advance});
    natural = arrowLen + n * seg.advance;
  }
  const angle = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
  const sx = length / natural;
  return {
    transform: `translate(${from.x}, ${from.y}) rotate(${angle}) scale(${sx}, 1) translate(0, ${WIGGLE_CENTER_OFFSET})`,
    glyphs,
  };
});

/** 直线琶音：矩形杆 + 三角箭头 */
const straight = computed(() => {
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
  const px = -uy;
  const py = ux;
  const shaftLen = Math.max(total - (withArrow ? headLen * 0.5 : 0), 0);
  const ex = s.x + ux * shaftLen;
  const ey = s.y + uy * shaftLen;
  return {
    shaft:
      `M ${s.x + px * half} ${s.y + py * half}`
      + ` L ${ex + px * half} ${ey + py * half}`
      + ` L ${ex - px * half} ${ey - py * half}`
      + ` L ${s.x - px * half} ${s.y - py * half} Z`,
    head: withArrow ? arrowHeadPath(e.x, e.y, ux, uy, headLen, headHalfW) : '',
  };
});
</script>

<template>
  <g v-if="isStraight" :fill="strokeColor" stroke="none">
    <path :d="straight.shaft"/>
    <path v-if="straight.head" :d="straight.head"/>
  </g>
  <g v-else-if="wiggle" :fill="strokeColor" stroke="none" :transform="wiggle.transform">
    <path
      v-for="(g, i) in wiggle.glyphs"
      :key="i"
      :d="g.d"
      :transform="`translate(${g.x}, 0)`"
    />
  </g>
</template>
