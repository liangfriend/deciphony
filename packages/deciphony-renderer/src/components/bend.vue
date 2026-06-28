<script lang="ts" setup>
/**
 * 由两个首尾相连的三次贝塞尔曲线构成；每段末端有箭头（方向由起终点 y 判断，向上 y 减小）。
 *
 * 推弦 1～2 个阶段（period_one / period_two），高度常量见 TAB_6_BEND_*_RATIO × measureHeight。
 *
 * BendTypeEnum 几何（SVG：向上 = y 减小）：
 * - Bend：仅阶段1，音符中心 → (slotEndX, noteCenterY - h1)
 * - BendRelease：阶段1向上到 (midX, noteCenterY - h1)；阶段2向下到 (slotEndX, noteCenterY)
 * - Prebend：仅阶段1，音符中心 x 不变，(noteCenterX, noteCenterY - h1)
 * - PrebendRelease：阶段1同 Prebend；阶段2到 (slotEndX, noteCenterY)
 * - PrebendBend：阶段1同 Prebend；阶段2继续向上到 (slotEndX, periodOneEnd.y - h2)
 *
 * 控制点：
 * - 预推弦阶段（竖直）：cp.x = start.x；cp.y 为起终点 y 的 1/3、2/3
 * - 普通推弦向上：cp1 (midX, startY)，cp2 (endX, startY)
 * - 普通推弦向下：cp 同样贴在起点水平线 cp1 (midX, startY)，cp2 (endX, startY)，再落到下方 end
 *
 * 阶段2：仅当数据含 periodTwo 时渲染；向上段同阶段1，向下段用上述向下控制点。
 *
 * 标注：各阶段终点上方 relativeTextPoint（默认 -textOffset）；semitone 2→full，其余 x/4。
 */
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

type Period = NonNullable<VDom['special']['bend']>['period_one'];

const bendData = computed(() => props.vDom.special?.bend);
const thickness = computed(() => bendData.value?.thickness ?? 1);

function cubicPath(period: Period): string {
  const s = period.relativeStartPoint;
  const e = period.relativeEndPoint;
  const c1 = period.relativeStartControlPoint;
  const c2 = period.relativeEndControlPoint;
  return `M ${s.x} ${s.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${e.x} ${e.y}`;
}

function arrowHeadPath(period: Period, headLen: number, headHalfW: number): string {
  const s = period.relativeStartPoint;
  const e = period.relativeEndPoint;
  const pointsDown = e.y >= s.y;
  if (pointsDown) {
    return `M ${e.x - headHalfW} ${e.y - headLen} L ${e.x} ${e.y} L ${e.x + headHalfW} ${e.y - headLen}`;
  }
  return `M ${e.x - headHalfW} ${e.y + headLen} L ${e.x} ${e.y} L ${e.x + headHalfW} ${e.y + headLen}`;
}

const periods = computed(() => {
  const b = bendData.value;
  if (!b) return [];
  const out: Period[] = [b.period_one];
  if (b.period_two) out.push(b.period_two);
  return out;
});

const shapes = computed(() => {
  const t = thickness.value;
  const headLen = Math.max(t * 4, 4);
  const headHalfW = Math.max(t * 2.5, 3);
  return periods.value.map((period) => ({
    path: cubicPath(period),
    arrow: arrowHeadPath(period, headLen, headHalfW),
    textX: period.relativeEndPoint.x + (period.relativeTextPoint?.x ?? 0),
    textY: period.relativeEndPoint.y + (period.relativeTextPoint?.y ?? 0),
    label: period.text ?? '',
  }));
});
</script>

<template>
  <g v-if="bendData">
    <template v-for="(shape, i) in shapes" :key="i">
      <path
        :d="shape.path"
        fill="none"
        :stroke="strokeColor"
        :stroke-width="thickness"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        :d="shape.arrow"
        fill="none"
        :stroke="strokeColor"
        :stroke-width="thickness"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <text
        v-if="shape.label"
        :x="shape.textX"
        :y="shape.textY"
        :fill="strokeColor"
        text-anchor="middle"
        dominant-baseline="auto"
        font-size="10"
        font-weight="600"
      >{{ shape.label }}
      </text>
    </template>
  </g>
</template>
