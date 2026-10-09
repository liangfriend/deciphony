<script lang="ts" setup>
import {computed} from 'vue'
import type {FluteFingering} from '../types'
import {
  FLUTE_FINGERING_H,
  FLUTE_FRAME_PAD,
  FLUTE_FRAME_RADIUS,
  FLUTE_FRAME_W,
  FLUTE_HOLE_GAP,
  FLUTE_HOLE_R,
  FLUTE_REGISTER_H,
} from './constants'

/** 一个笛子指法图：原点 = 顶部中心；圆角矩形内上方小圆点表示超吹层级，下面 6 孔从吹孔侧往下 */
const props = withDefaults(defineProps<{
  fingering: FluteFingering
  color?: string
}>(), {color: '#303133'})

const holes = computed(() => [...props.fingering.holes].slice(0, 6).map((c, i) => ({
  state: c === 'x' ? 'closed' : c === 'h' ? 'half' : 'open',
  cy: FLUTE_FRAME_PAD + FLUTE_REGISTER_H + FLUTE_HOLE_R + i * FLUTE_HOLE_GAP,
})))

const registerDots = computed(() => {
  const n = props.fingering.register
  const gap = 4
  return Array.from({length: n}, (_, i) => (i - (n - 1) / 2) * gap)
})

const r = FLUTE_HOLE_R
const halfPath = (cy: number) => `M 0 ${cy - r} A ${r} ${r} 0 0 0 0 ${cy + r} Z`
</script>

<template>
  <g class="dr-mark-flute">
    <rect
      :height="FLUTE_FINGERING_H"
      :rx="FLUTE_FRAME_RADIUS"
      :stroke="color"
      :width="FLUTE_FRAME_W"
      :x="-FLUTE_FRAME_W / 2"
      fill="none"
      stroke-width="0.8"
      y="0"
    />
    <circle
      v-for="(x, i) in registerDots"
      :key="`reg-${i}`"
      :cx="x"
      :cy="FLUTE_FRAME_PAD + FLUTE_REGISTER_H / 2 - 0.5"
      :fill="color"
      r="1.3"
    />
    <template v-for="(hole, i) in holes" :key="i">
      <path v-if="hole.state === 'half'" :d="halfPath(hole.cy)" :fill="color"/>
      <circle
        :cy="hole.cy"
        :fill="hole.state === 'closed' ? color : 'none'"
        :r="r"
        :stroke="color"
        cx="0"
        stroke-width="1"
      />
    </template>
  </g>
</template>
