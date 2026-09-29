<script lang="ts" setup>
// 仅接收 vDom，连音线信息已在 vDom.startPoint / endPoint / special.slur 中
import {computed, toRef} from 'vue';
import {MusicScoreTypeEnum, SlurTypeEnum} from '@/enums/musicScoreEnum';
import type {Skin, VDom} from '@/types/common';
import {useGeometrySkinColor} from './useGeometrySkinColor';
import {
  isNumberNotationSlur,
  numberNotationSlurGeom,
  numberNotationSlurPathD,
} from '@/render/slurGeom';

const props = defineProps<{
  vDom: VDom;
  notationType?: MusicScoreTypeEnum;
  skin?: Skin;
}>();

const fillColor = useGeometrySkinColor(
  toRef(props, 'vDom'),
  toRef(props, 'skin'),
  toRef(props, 'notationType'),
);

const SLUR_LABEL: Record<SlurTypeEnum, string> = {
  [SlurTypeEnum.H]: 'H',
  [SlurTypeEnum.S]: 'S',
  [SlurTypeEnum.P]: 'P',
  [SlurTypeEnum.HP]: 'HP',
};

const isJianpu = computed(() => isNumberNotationSlur(props.notationType));

// 两条二次贝塞尔曲线围成月牙形；控制点 = 默认中点上方 + relativeControlPoint
const geom = computed(() => {
  const s = props.vDom.startPoint;
  const e = props.vDom.endPoint;
  const slur = props.vDom.special?.slur;
  const thickness = slur?.thickness != null ? slur.thickness : 4;
  const relCtrl = slur?.relativeControlPoint ?? {x: 0, y: 0};
  const defaultCx = (s.x + e.x) / 2;
  const defaultCy = Math.min(s.y, e.y) - Math.max(8, Math.abs(e.x - s.x) * 0.2);
  const cx = defaultCx + relCtrl.x;
  const cy = defaultCy + relCtrl.y;
  const cy2 = cy + thickness;
  return {s, e, slur, cx, cy, cy2};
});

const jianpuGeom = computed(() =>
  isJianpu.value ? numberNotationSlurGeom(props.vDom) : null,
);

const pathD = computed(() => {
  if (jianpuGeom.value) {
    return numberNotationSlurPathD(jianpuGeom.value);
  }
  const {s, e, cx, cy, cy2} = geom.value;
  return `M ${s.x} ${s.y} Q ${cx} ${cy} ${e.x} ${e.y} Q ${cx} ${cy2} ${s.x} ${s.y} Z`;
});

const slurLabel = computed(() => {
  const type = geom.value.slur?.type;
  if (!type) return null;
  return SLUR_LABEL[type] ?? type.toUpperCase();
});

const textPos = computed(() => {
  if (jianpuGeom.value) {
    const g = jianpuGeom.value;
    const relText = geom.value.slur?.relativeTextPoint ?? {x: 0, y: 0};
    return {
      x: (g.x0 + g.x1) / 2 + relText.x,
      y: g.yTop + relText.y,
    };
  }
  const {cx, cy, slur} = geom.value;
  const relText = slur?.relativeTextPoint ?? {x: 0, y: 0};
  return {
    x: cx + relText.x,
    y: cy + relText.y,
  };
});
</script>

<template>
  <g>
    <!-- 简谱：两端圆弧 + 中间横线，圆角端点 -->
    <path
      v-if="jianpuGeom"
      :key="pathD"
      :d="pathD"
      fill="none"
      :stroke="fillColor"
      :stroke-width="jianpuGeom.thickness"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      v-else
      :key="pathD"
      :d="pathD"
      :fill="fillColor"
      stroke="none"
    />
    <text
      v-if="slurLabel"
      :fill="fillColor"
      :x="textPos.x"
      :y="textPos.y"
      dominant-baseline="middle"
      font-size="10"
      font-weight="bold"
      text-anchor="middle"
    >{{ slurLabel }}
    </text>
  </g>
</template>

<style scoped>
</style>
