<script lang="ts" setup>
// 仅接收 vDom，连音线信息已在 vDom.startPoint / endPoint / special.slur 中
import {computed, toRef} from 'vue';
import {MusicScoreTypeEnum} from '@/enums/musicScoreEnum';
import type {Skin, VDom} from '@/types/common';
import {useGeometrySkinColor} from './useGeometrySkinColor';

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

// 两条二次贝塞尔曲线围成月牙形：起点→控制点→终点，下弧 终点→控制点'→起点；控制点 = 默认中点上方 + special.slur.relativeControlPoint 偏移，厚度来自 special.slur
const pathD = computed(() => {
  const s = props.vDom.startPoint;
  const e = props.vDom.endPoint;
  const slur = props.vDom.special?.slur;
  const thickness = slur?.thickness != null ? slur?.thickness : 4;
  const relCtrl = slur?.relativeControlPoint ?? {x: 0, y: 0};
  const defaultCx = (s.x + e.x) / 2;
  const defaultCy = Math.min(s.y, e.y) - Math.max(8, Math.abs(e.x - s.x) * 0.2);
  const cx = defaultCx + relCtrl.x;
  const cy = defaultCy + relCtrl.y;
  const cy2 = cy + thickness;
  return `M ${s.x} ${s.y} Q ${cx} ${cy} ${e.x} ${e.y} Q ${cx} ${cy2} ${s.x} ${s.y} Z`;
});
</script>

<template>
  <path
    :key="pathD"
    :d="pathD"
    :fill="fillColor"
    stroke="none"
  />
</template>

<style scoped>
</style>
