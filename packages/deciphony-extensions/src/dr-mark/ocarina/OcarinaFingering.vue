<script lang="ts" setup>
import {computed} from 'vue'
import type {OcarinaHolePattern, OcarinaModel} from '../types'
import {OCARINA_SHAPES, type OcarinaHole} from './geometry'

/** 陶笛指法图（单张）：原点 = 顶部中心，吹口朝下；背面拇指孔画在机身底部左右两侧 */
const props = withDefaults(defineProps<{
  model: OcarinaModel
  holes: OcarinaHolePattern
  color?: string
}>(), {color: '#303133'})

const shape = computed(() => OCARINA_SHAPES[props.model])

type HoleView = OcarinaHole & {state: 'closed' | 'open' | 'half'}

function stateOf(c: string | undefined): HoleView['state'] {
  return c === 'x' ? 'closed' : c === 'h' ? 'half' : 'open'
}

const holeViews = computed((): HoleView[] =>
  [...shape.value.front, ...shape.value.back].map((h, i) => ({...h, state: stateOf(props.holes[i])})))

const bodyPath = computed(() => {
  const {outline, w, bodyH: h} = shape.value
  const rx = w / 2
  if (outline === 'triangle') {
    const k = 3
    return [
      `M ${-k * 0.6} ${k}`,
      `Q 0 0 ${k * 0.6} ${k}`,
      `L ${rx - 2.5} ${h - 4}`,
      `Q ${rx + 0.5} ${h} ${rx - 4} ${h}`,
      `L ${-rx + 4} ${h}`,
      `Q ${-rx - 0.5} ${h} ${-rx + 2.5} ${h - 4}`,
      'Z',
    ].join(' ')
  }
  const ry = h / 2
  return `M ${-rx} ${ry} A ${rx} ${ry} 0 1 0 ${rx} ${ry} A ${rx} ${ry} 0 1 0 ${-rx} ${ry} Z`
})

/** 吹口：底边中心向下的圆角口 */
const mouthPath = computed(() => {
  const {bodyH: top, mouthW, mouthH} = shape.value
  const m = mouthW / 2
  const bottom = top + mouthH
  return `M ${-m} ${top - 0.4} L ${-m} ${bottom - 1.4} Q ${-m} ${bottom} ${-m + 1.4} ${bottom} L ${m - 1.4} ${bottom} Q ${m} ${bottom} ${m} ${bottom - 1.4} L ${m} ${top - 0.4}`
})

function halfPath(h: OcarinaHole): string {
  return `M ${h.x} ${h.y - h.r} A ${h.r} ${h.r} 0 0 0 ${h.x} ${h.y + h.r} Z`
}
</script>

<template>
  <g class="dr-mark-ocarina">
    <path :d="bodyPath" :stroke="color" fill="none" stroke-linejoin="round" stroke-width="0.9"/>
    <path :d="mouthPath" :stroke="color" fill="none" stroke-width="0.9"/>
    <template v-for="(hole, i) in holeViews" :key="i">
      <path v-if="hole.state === 'half'" :d="halfPath(hole)" :fill="color"/>
      <circle
        :cx="hole.x"
        :cy="hole.y"
        :fill="hole.state === 'closed' ? color : 'none'"
        :r="hole.r"
        :stroke="color"
        stroke-width="0.8"
      />
    </template>
  </g>
</template>
