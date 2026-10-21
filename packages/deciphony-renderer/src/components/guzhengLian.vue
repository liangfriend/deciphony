<script lang="ts" setup>
/**
 * 古筝连续指法（双 slot 附属 guzheng_lian），start/end 的 y 为符号带中线：
 * 起点画固定大小的符号，后接虚线到终点。
 * - 连托：矩形无上边；连劈：矩形无下边；
 * - 其余：对应单音指法符号。
 * 线条没有面积，最底下垫一个透明 rect 作为点击区。
 */
import {computed, toRef} from 'vue';
import {GuzhengLianTypeEnum, MusicScoreTypeEnum} from '@/enums/musicScoreEnum';
import type {Skin, VDom} from '@/types/common';
import {GUZHENG_GLYPHS, GUZHENG_STROKE_WIDTH} from '@/skins/guzhengGlyphs';
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

/** 起点符号与虚线的间距 */
const GLYPH_GAP = 1.5;
const HIT_PAD = 3;

/** 连托 / 连劈 起点的缺边矩形（坐标约定同 GUZHENG_GLYPHS） */
const BRACKET_GLYPHS: Partial<Record<GuzhengLianTypeEnum, {d: string; w: number; h: number}>> = {
  [GuzhengLianTypeEnum.Tuo]: {d: 'M1.5 1.5V8.5H8.5V1.5', w: 10, h: 10},
  [GuzhengLianTypeEnum.Pi]: {d: 'M1.5 8.5V1.5H8.5V8.5', w: 10, h: 10},
};

const GLYPH_KEY: Partial<Record<GuzhengLianTypeEnum, string>> = {
  [GuzhengLianTypeEnum.Mo]: 'guzheng_mo',
  [GuzhengLianTypeEnum.Tiao]: 'guzheng_tiao',
  [GuzhengLianTypeEnum.Gou]: 'guzheng_gou',
  [GuzhengLianTypeEnum.Ti]: 'guzheng_ti1',
  [GuzhengLianTypeEnum.Da]: 'guzheng_da',
  [GuzhengLianTypeEnum.Zhai]: 'guzheng_zhai',
};

const geom = computed(() => {
  const s = props.vDom.startPoint;
  const e = props.vDom.endPoint;
  const y = (s.y + e.y) / 2;
  const left = Math.min(s.x, e.x);
  const right = Math.max(s.x, e.x);
  const type = props.vDom.special?.guzhengLian?.type ?? GuzhengLianTypeEnum.Tuo;
  const glyph = BRACKET_GLYPHS[type]
      ?? GUZHENG_GLYPHS[GLYPH_KEY[type] ?? 'guzheng_mo'];
  // 符号盒左右各留 1.5 的描边余量：可见笔画从 left 起
  const gx = left - 1.5;
  const gy = y - glyph.h / 2;
  const dashX1 = gx + glyph.w + GLYPH_GAP;
  return {
    glyph: {d: glyph.d, transform: `translate(${gx} ${gy})`},
    dash: {x1: dashX1, x2: Math.max(dashX1, right), y},
    hit: {x: gx - HIT_PAD, y: gy - HIT_PAD, w: Math.max(dashX1, right) - gx + HIT_PAD * 2, h: glyph.h + HIT_PAD * 2},
  };
});
</script>

<template>
  <g>
    <rect :x="geom.hit.x" :y="geom.hit.y" :width="geom.hit.w" :height="geom.hit.h" fill="transparent" stroke="none"/>
    <path
      :d="geom.glyph.d"
      :transform="geom.glyph.transform"
      :stroke="strokeColor"
      :stroke-width="GUZHENG_STROKE_WIDTH"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <line
      :x1="geom.dash.x1"
      :x2="geom.dash.x2"
      :y1="geom.dash.y"
      :y2="geom.dash.y"
      :stroke="strokeColor"
      :stroke-width="GUZHENG_STROKE_WIDTH"
      stroke-dasharray="4 3"
    />
  </g>
</template>
