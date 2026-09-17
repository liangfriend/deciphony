<script lang="ts" setup>
import {computed, ref} from 'vue'
import {MusicScoreTypeEnum} from '@deciphony/renderer'
import {
  FLATTEN_HEAD_W,
  FLATTEN_LINE_GAP,
  FLATTEN_STAFF_PAD_Y,
  FLATTEN_STEM_LENGTH,
  MAX_SYNC_SECONDS,
} from '../constants'
import {writePassTime} from '../flattenSlots'
import type {FlattenStaffRow} from '../types'
import SimpleNote from './SimpleNote.vue'

const props = withDefaults(
  defineProps<{
    rows: FlattenStaffRow[]
    pxPerSecond: number
    timePropName: string
    /** 轴宽（10min * px） */
    axisWidth: number
    playheadX: number
    /** 版本戳：外部改 data 后递增以刷新 */
    revision: number
    /** 曲谱类型：简谱用数字皮肤、不画五线 */
    scoreType?: MusicScoreTypeEnum
  }>(),
  {
    scoreType: MusicScoreTypeEnum.StandardStaff,
  },
)

const emit = defineEmits<{
  timeChange: []
}>()

const isNumber = computed(
  () => props.scoreType === MusicScoreTypeEnum.NumberNotation,
)

const staffInnerH = 4 * FLATTEN_LINE_GAP
/** 简谱行高：数字 + 减时线 + 八度点留白 */
const numberInnerH = 56
const rowInnerH = computed(() => (isNumber.value ? numberInnerH : staffInnerH))
const rowH = computed(
  () =>
    rowInnerH.value +
    FLATTEN_STAFF_PAD_Y * 2 +
    (isNumber.value ? 0 : FLATTEN_STEM_LENGTH * 0.35),
)

const totalH = computed(() => Math.max(rowH.value, props.rows.length * rowH.value))

function staffTopInRow(): number {
  return FLATTEN_STAFF_PAD_Y
}

function slotBox(slot: FlattenStaffRow['slots'][number]) {
  const x = (slot.time ?? 0) * props.pxPerSecond
  if (isNumber.value) {
    const w = FLATTEN_HEAD_W + 24
    const h = numberInnerH + 16
    const y = FLATTEN_STAFF_PAD_Y - 8
    return {x, y, w, h}
  }
  const w = FLATTEN_HEAD_W + 16
  const h = staffInnerH + FLATTEN_STEM_LENGTH + 8
  const y = FLATTEN_STAFF_PAD_Y - FLATTEN_STEM_LENGTH - 4
  return {x, y, w, h}
}

// —— 拖拽 ——
const draggingKey = ref<string | null>(null)
let dragStartClientX = 0
let dragStartTime = 0

function onPointerDown(ev: PointerEvent, slot: FlattenStaffRow['slots'][number]) {
  ev.preventDefault()
  const target = ev.currentTarget as Element
  target.setPointerCapture(ev.pointerId)
  draggingKey.value = slot.flattenKey
  dragStartClientX = ev.clientX
  dragStartTime = slot.time ?? 0
}

function onPointerMove(ev: PointerEvent, slot: FlattenStaffRow['slots'][number]) {
  if (draggingKey.value !== slot.flattenKey) return
  const dx = ev.clientX - dragStartClientX
  const next = dragStartTime + dx / props.pxPerSecond
  writePassTime(slot.slotRef, props.timePropName, slot.passIndex, next)
  slot.time = Math.min(MAX_SYNC_SECONDS, Math.max(0, next))
}

function onPointerUp(ev: PointerEvent, slot: FlattenStaffRow['slots'][number]) {
  if (draggingKey.value !== slot.flattenKey) return
  const target = ev.currentTarget as Element
  try {
    target.releasePointerCapture(ev.pointerId)
  } catch {
    /* noop */
  }
  draggingKey.value = null
  emit('timeChange')
}

const _rev = computed(() => props.revision)

defineExpose({
  rowHeight: rowH,
})
</script>

<template>
  <svg
    class="dr-to-flatten"
    :height="totalH"
    :width="axisWidth"
    :viewBox="`0 0 ${axisWidth} ${totalH}`"
  >
    <g
      v-for="(row, ri) in rows"
      :key="row.key + '-' + _rev"
      :transform="`translate(0, ${ri * rowH})`"
    >
      <!-- 五线（仅线谱） -->
      <template v-if="!isNumber">
        <line
          v-for="li in 5"
          :key="li"
          :x1="0"
          :x2="axisWidth"
          :y1="staffTopInRow() + (li - 1) * FLATTEN_LINE_GAP"
          :y2="staffTopInRow() + (li - 1) * FLATTEN_LINE_GAP"
          stroke="#c0c4cc"
          stroke-width="1"
        />
        <line
          :x1="0.5"
          :x2="0.5"
          :y1="staffTopInRow()"
          :y2="staffTopInRow() + staffInnerH"
          stroke="#909399"
          stroke-width="1.5"
        />
        <line
          :x1="axisWidth - 0.5"
          :x2="axisWidth - 0.5"
          :y1="staffTopInRow()"
          :y2="staffTopInRow() + staffInnerH"
          stroke="#909399"
          stroke-width="1.5"
        />
      </template>
      <!-- 简谱：一条参考基线 -->
      <template v-else>
        <line
          :x1="0"
          :x2="axisWidth"
          :y1="staffTopInRow() + numberInnerH / 2"
          :y2="staffTopInRow() + numberInnerH / 2"
          stroke="#e4e7ed"
          stroke-width="1"
        />
      </template>

      <g
        v-for="slot in row.slots"
        :key="slot.flattenKey"
        class="dr-to-flatten__slot"
        :transform="`translate(${(slot.time ?? 0) * pxPerSecond}, 0)`"
        @pointerdown="onPointerDown($event, slot)"
        @pointermove="onPointerMove($event, slot)"
        @pointerup="onPointerUp($event, slot)"
        @pointercancel="onPointerUp($event, slot)"
      >
        <rect
          class="dr-to-flatten__hit"
          :height="slotBox(slot).h"
          :width="slotBox(slot).w"
          :x="0"
          :y="slotBox(slot).y"
          fill="rgba(64, 158, 255, 0.12)"
          stroke="rgba(64, 158, 255, 0.65)"
          stroke-width="1"
          rx="2"
        />
        <g :transform="`translate(4, 0)`">
          <SimpleNote
            :chronaxie="slot.chronaxie"
            :is-rest="slot.isRest"
            :octave-dots="slot.octaveDots"
            :regions="slot.regions"
            :score-type="scoreType"
            :staff-top="staffTopInRow()"
            :syllables="slot.syllables"
          />
        </g>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.dr-to-flatten {
  display: block;
  background: #fff;
}

.dr-to-flatten__slot {
  cursor: grab;
  touch-action: none;
}

.dr-to-flatten__slot:active {
  cursor: grabbing;
}
</style>
