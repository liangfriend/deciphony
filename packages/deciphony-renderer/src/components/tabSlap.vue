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

const rect = computed(() => {
  const s = props.vDom.startPoint;
  const e = props.vDom.endPoint;
  return {
    x: s.x,
    y: s.y,
    width: Math.max(0, e.x - s.x),
    height: Math.max(0, e.y - s.y),
  };
});
</script>

<template>
  <rect
    :x="rect.x"
    :y="rect.y"
    :width="rect.width"
    :height="rect.height"
    fill="none"
    :stroke="strokeColor"
    stroke-width="1"
  />
</template>
