<script lang="ts" setup>
import {computed} from 'vue'
import type {XiaoFingering, XiaoModel} from '../types'
import {
  XIAO_FRAME_PAD,
  XIAO_FRAME_RADIUS,
  XIAO_FRAME_W,
  XIAO_FRONT_HOLES,
  XIAO_HOLE_R,
  XIAO_LOW_HOLE_SIDE,
  XIAO_REGISTER_H,
  XIAO_SIDE_OFFSET,
  xiaoFingeringHeight,
  xiaoHoleY,
} from './constants'

/**
 * 箫指法图：原点 = 顶部中心；圆角矩形内上方小圆点 = 超吹层级。
 * 背孔画在正面最上一孔之上并左偏；八孔箫最下一孔（第一孔）也左偏。
 */
const props = withDefaults(defineProps<{
  model: XiaoModel
  fingering: XiaoFingering
  color?: string
}>(), {color: '#303133'})

type HoleState = 'closed' | 'open' | 'half'

function stateOf(c: string | undefined): HoleState {
  return c === 'x' ? 'closed' : c === 'h' ? 'half' : 'open'
}

const h = computed(() => xiaoFingeringHeight(props.model))

const holes = computed(() => {
  const front = XIAO_FRONT_HOLES[props.model]
  const lowSide = XIAO_LOW_HOLE_SIDE[props.model]
  return Array.from({length: front + 1}, (_, row) => ({
    state: stateOf(props.fingering.holes[row]),
    cx: row === 0 || (lowSide && row === front) ? -XIAO_SIDE_OFFSET : 0,
    cy: xiaoHoleY(row),
  }))
})

const registerDots = computed(() => {
  const n = props.fingering.register
  const gap = 4
  return Array.from({length: n}, (_, i) => (i - (n - 1) / 2) * gap)
})

const r = XIAO_HOLE_R
const halfPath = (cx: number, cy: number) => `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} Z`
</script>

<template>
  <g class="dr-mark-xiao">
    <rect
      :height="h"
      :rx="XIAO_FRAME_RADIUS"
      :stroke="color"
      :width="XIAO_FRAME_W"
      :x="-XIAO_FRAME_W / 2"
      fill="none"
      stroke-width="0.8"
      y="0"
    />
    <circle
      v-for="(x, i) in registerDots"
      :key="`reg-${i}`"
      :cx="x"
      :cy="XIAO_FRAME_PAD + XIAO_REGISTER_H / 2 - 0.5"
      :fill="color"
      r="1.2"
    />
    <template v-for="(hole, i) in holes" :key="i">
      <path v-if="hole.state === 'half'" :d="halfPath(hole.cx, hole.cy)" :fill="color"/>
      <circle
        :cx="hole.cx"
        :cy="hole.cy"
        :fill="hole.state === 'closed' ? color : 'none'"
        :r="r"
        :stroke="color"
        stroke-width="0.9"
      />
    </template>
  </g>
</template>
