<script lang="ts" setup>
// 仅接收 vDom，连音线信息已在 vDom.startPoint / endPoint / special.slur 中
import {computed, toRef} from 'vue';
import {MusicScoreTypeEnum, SlurTypeEnum} from '@/enums/musicScoreEnum';
import type {Skin, VDom} from '@/types/common';
import {useGeometrySkinColor} from './useGeometrySkinColor';
import {
  isNumberNotationSlur,
  isSplitSlur,
  numberNotationSlurGeom,
  numberNotationSlurPathD,
  numberNotationSplitSlurGeom,
  slurBulgeSign,
  slurDefaultControlPoint,
  splitSlurGeom,
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

// 两条二次贝塞尔曲线围成月牙形；控制点 = 默认控制点（按 direction 在两端上方 / 下方）+ relativeControlPoint
const geom = computed(() => {
  const s = props.vDom.startPoint;
  const e = props.vDom.endPoint;
  const slur = props.vDom.special?.slur;
  const thickness = slur?.thickness != null ? slur.thickness : 4;
  const relCtrl = slur?.relativeControlPoint ?? {x: 0, y: 0};
  const def = slurDefaultControlPoint(props.vDom);
  const cx = def.x + relCtrl.x;
  const cy = def.y + relCtrl.y;
  // 内侧曲线往符头方向收 thickness
  const cy2 = cy - slurBulgeSign(props.vDom) * thickness;
  return {s, e, slur, cx, cy, cy2};
});

const isSplit = computed(() => isSplitSlur(props.vDom));

const jianpuGeom = computed(() =>
  isJianpu.value && !isSplit.value ? numberNotationSlurGeom(props.vDom) : null,
);

/** 起止不在同一单谱表：两段，controlPoint 不参与 */
const splitGeom = computed(() => {
  if (!isSplit.value) return null;
  return isJianpu.value
    ? {...numberNotationSplitSlurGeom(props.vDom), stroke: true}
    : {...splitSlurGeom(props.vDom), thickness: 0, stroke: false};
});

/** 简谱（整段 / 分段）用描边 */
const strokeWidth = computed(() => {
  if (splitGeom.value) return splitGeom.value.stroke ? splitGeom.value.thickness : null;
  return jianpuGeom.value ? jianpuGeom.value.thickness : null;
});

const pathD = computed(() => {
  if (splitGeom.value) return splitGeom.value.d;
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
  const relTextPoint = geom.value.slur?.relativeTextPoint ?? {x: 0, y: 0};
  if (splitGeom.value) {
    return {
      x: splitGeom.value.apex.x + relTextPoint.x,
      y: splitGeom.value.apex.y + relTextPoint.y,
    };
  }
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
      v-if="strokeWidth != null"
      :key="pathD"
      :d="pathD"
      fill="none"
      :stroke="fillColor"
      :stroke-width="strokeWidth"
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
