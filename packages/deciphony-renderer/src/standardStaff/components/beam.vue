<script lang="ts" setup>
// 符杠：根据 vDom.special.beam 在绝对坐标下绘制多条连接线（8 分一条，16 分两条…）
import {computed} from 'vue';
import type {VDom} from '@/types/common';

const props = defineProps<{
  vDom: VDom;
}>();

const beam = computed(() => props.vDom.special?.beam);
const lines = computed(() => {
  const b = beam.value;
  if (!b) return [];
  const {left, right, lineCount, spacing, direction} = b;
  const out: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const sign = direction === 'up' ? 1 : -1;
  for (let i = 0; i < lineCount; i++) {
    const dy = i * spacing * sign;
    out.push({
      x1: left.x,
      y1: left.y + dy,
      x2: right.x,
      y2: right.y + dy,
    });
  }
  return out;
});
</script>

<template>
  <g v-if="beam" class="beam">
    <line
        v-for="(l, i) in lines"
        :key="i"
        :stroke-width="vDom.special.beam.thickness"
        :x1="l.x1"
        :x2="l.x2"
        :y1="l.y1"
        :y2="l.y2"
        stroke="currentColor"
        vector-effect="non-scaling-stroke"
    />
  </g>
</template>

<style scoped>
</style>
