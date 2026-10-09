<script lang="ts" setup>
import {computed, toRef} from 'vue';
import {HairpinTypeEnum, MusicScoreTypeEnum} from '@/enums/musicScoreEnum';
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

const style = computed(() => props.vDom.special?.hairpin);
const thickness = computed(() => style.value?.thickness ?? 1.5);
const type = computed(() => style.value?.type ?? HairpinTypeEnum.Crescendo_hairpin);
const isLine = computed(() =>
  type.value === HairpinTypeEnum.Crescendo_line || type.value === HairpinTypeEnum.Diminuendo_line,
);

const FONT_SIZE = 12;
/** 斜体衬线下 cresc. / dim. 的近似字宽，用于虚线起点 */
const TEXT = {
  [HairpinTypeEnum.Crescendo_line]: {label: 'cresc.', w: 30},
  [HairpinTypeEnum.Diminuendo_line]: {label: 'dim.', w: 22},
} as const;

/** start/end 的 y 为楔形 / 虚线中线 */
const geom = computed(() => {
  const s = props.vDom.startPoint;
  const e = props.vDom.endPoint;
  const y = (s.y + e.y) / 2;
  const left = Math.min(s.x, e.x);
  const right = Math.max(s.x, e.x);
  const half = (style.value?.height ?? 12) / 2;
  const t = type.value;
  if (t === HairpinTypeEnum.Crescendo_line || t === HairpinTypeEnum.Diminuendo_line) {
    const text = TEXT[t];
    return {
      text: {x: left, y, label: text.label},
      dash: {x1: left + text.w + 4, x2: Math.max(left + text.w + 4, right), y},
      wedge: '',
    };
  }
  const wedge = t === HairpinTypeEnum.Crescendo_hairpin
    ? `M${right} ${y - half}L${left} ${y}L${right} ${y + half}`
    : `M${left} ${y - half}L${right} ${y}L${left} ${y + half}`;
  return {text: null, dash: null, wedge};
});
</script>

<template>
  <g>
    <template v-if="isLine && geom.text && geom.dash">
      <text
        :x="geom.text.x"
        :y="geom.text.y"
        :fill="strokeColor"
        :font-size="FONT_SIZE"
        dominant-baseline="middle"
        font-family="serif"
        font-style="italic"
        text-anchor="start"
      >{{ geom.text.label }}</text>
      <line
        :x1="geom.dash.x1"
        :x2="geom.dash.x2"
        :y1="geom.dash.y"
        :y2="geom.dash.y"
        :stroke="strokeColor"
        :stroke-width="thickness"
        stroke-dasharray="4 3"
        stroke-linecap="round"
      />
    </template>
    <path
      v-else
      :d="geom.wedge"
      :stroke="strokeColor"
      :stroke-width="thickness"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </g>
</template>
