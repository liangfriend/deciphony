<script lang="ts" setup>
import type {MusicScore, VDom} from '@deciphony/renderer'
import {DR_ROW_VDOMS_KEY} from '@deciphony/renderer'
import {computed, inject, unref, type MaybeRef, type Ref} from 'vue'
import {resolveInstrumentName} from '../instrumentNameFields'
import type {InstrumentNameAlign} from '../types'

const props = withDefaults(
  defineProps<{
    node: VDom
    musicScore: MusicScore
    defaultInstrument?: MaybeRef<string>
    /** 小节 id → 小节 vDom（五线区域），用于纵向对齐 */
    measureVDomMap: Ref<Map<string, VDom>> | Map<string, VDom>
    fontSize?: number
    align?: InstrumentNameAlign
    /** 文本与曲谱（插槽右缘）的间距 */
    gap?: MaybeRef<number>
    padding?: number
  }>(),
  {
    defaultInstrument: '',
    fontSize: 14,
    align: 'right',
    gap: 6,
    padding: 6,
  },
)

defineOptions({inheritAttrs: false})

const staff = computed(() => props.node.slotData?.singleStaff ?? null)

const lines = computed(() => {
  const name = resolveInstrumentName(staff.value, unref(props.defaultInstrument) ?? '')
  return name ? name.split('\n') : []
})

const lineHeight = computed(() => props.fontSize * 1.2)

/** 所在复谱表的节点：有就只在本行里找小节，别的行重排时本插槽不跟着重算 */
const rowVDoms = inject<Ref<VDom[]> | null>(DR_ROW_VDOMS_KEY, null)

/** 相对插槽顶部的五线中心；找不到小节时取插槽中心 */
const centerY = computed(() => {
  const firstMeasureId = staff.value?.measures[0]?.id
  const measure = !firstMeasureId
    ? undefined
    : rowVDoms
      ? rowVDoms.value.find((n) => n.tag === 'measure' && n.targetId === firstMeasureId)
      : unref(props.measureVDomMap).get(firstMeasureId)
  if (measure) return measure.y + measure.h / 2 - props.node.y
  return props.node.h / 2
})

const firstLineY = computed(() => centerY.value - ((lines.value.length - 1) * lineHeight.value) / 2)

const gap = computed(() => Math.max(0, unref(props.gap) ?? 0))

/** 可用区间 [padding, w - gap] 内对齐 */
const textX = computed(() => {
  const right = props.node.w - gap.value
  if (props.align === 'left') return props.padding
  if (props.align === 'center') return (props.padding + right) / 2
  return right
})

const textAnchor = computed(() => {
  if (props.align === 'left') return 'start'
  if (props.align === 'center') return 'middle'
  return 'end'
})
</script>

<template>
  <g v-if="lines.length" class="dr-instrument-name-slot">
    <text
      v-for="(line, i) in lines"
      :key="i"
      class="dr-instrument-name-slot__text"
      :font-size="fontSize"
      :text-anchor="textAnchor"
      :x="textX"
      :y="firstLineY + i * lineHeight"
      dominant-baseline="central"
    >{{ line }}</text>
  </g>
</template>

<style scoped>
.dr-instrument-name-slot__text {
  fill: #303133;
  user-select: none;
}
</style>
