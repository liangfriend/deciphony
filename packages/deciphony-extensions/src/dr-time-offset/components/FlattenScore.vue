<script lang="ts" setup>
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {MusicScoreTypeEnum} from '@deciphony/renderer'
import {createAnchorWarp, type AnchorWarp} from '../anchorWarp'
import {
  FLATTEN_HEAD_W,
  FLATTEN_LINE_GAP,
  FLATTEN_LYRIC_H,
  FLATTEN_STAFF_PAD_Y,
  FLATTEN_STEM_LENGTH,
  MAX_SYNC_SECONDS,
} from '../constants'
import {
  FLATTEN_NUMBER_INNER_H,
  flattenRowLayout,
  flattenStaffRowHeight,
  writePassTime,
} from '../flattenSlots'
import type {FlattenSlotItem, FlattenStaffRow} from '../types'
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
  /** 锚定数量变化 */
  anchorsChange: [count: number]
}>()

const isNumber = computed(
  () => props.scoreType === MusicScoreTypeEnum.NumberNotation,
)

const staffInnerH = 4 * FLATTEN_LINE_GAP
const numberInnerH = FLATTEN_NUMBER_INNER_H
/** 一行（不含歌词带）的高度 */
const rowH = computed(() => flattenStaffRowHeight(isNumber.value))
const layout = computed(() => flattenRowLayout(props.rows, isNumber.value))
const totalH = computed(() => layout.value.total)
/** 歌词基线中心（行内 y） */
const lyricY = computed(() => rowH.value + FLATTEN_LYRIC_H / 2 - 4)

/** 歌词高亮底色宽度（按字数估算：中日韩 1em、其它 0.6em） */
function lyricBgWidth(text: string): number {
  let w = 0
  for (const ch of text) w += /[\u2e80-\uffff]/.test(ch) ? 14 : 8.4
  return w + 8
}

function staffTopInRow(): number {
  return FLATTEN_STAFF_PAD_Y
}

const slotBox = computed(() => {
  if (isNumber.value) {
    return {y: FLATTEN_STAFF_PAD_Y - 8, w: FLATTEN_HEAD_W + 24, h: numberInnerH + 16}
  }
  return {
    y: FLATTEN_STAFF_PAD_Y - FLATTEN_STEM_LENGTH - 4,
    w: FLATTEN_HEAD_W + 16,
    h: staffInnerH + FLATTEN_STEM_LENGTH + 8,
  }
})

/** 曲谱若不是响应式，拖动时 slot.time 改了也不会重绘；用它强制刷新 */
const tick = ref(0)

function slotX(slot: FlattenSlotItem): number {
  void tick.value
  return (slot.time ?? 0) * props.pxPerSecond
}

// —— 选中 / 锚定 ——
const selectedKey = ref<string | null>(null)
const anchors = ref<Set<string>>(new Set())

const selected = computed(() => {
  void tick.value
  const key = selectedKey.value
  if (!key) return null
  for (let ri = 0; ri < props.rows.length; ri++) {
    const slot = props.rows[ri]!.slots.find((s) => s.flattenKey === key)
    if (slot) return {slot, rowIndex: ri}
  }
  return null
})

const selectedTimeText = computed(() => {
  const t = selected.value?.slot.time
  return t == null ? '' : t.toFixed(2)
})

function toggleAnchor() {
  const key = selectedKey.value
  if (!key) return
  const next = new Set(anchors.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  anchors.value = next
  emit('anchorsChange', next.size)
}

function clearAnchors() {
  if (!anchors.value.size) return
  anchors.value = new Set()
  emit('anchorsChange', 0)
}

function clearSelection() {
  selectedKey.value = null
}

// —— 移动（拖动与输入共用：锚定时按 anchorWarp 等比移动） ——
type MoveSession = {
  warp: AnchorWarp
  slots: Map<string, FlattenSlotItem>
}

function beginMove(pivot: FlattenSlotItem): MoveSession {
  const slots = new Map<string, FlattenSlotItem>()
  const items: {key: string; time: number}[] = []
  for (const row of props.rows) {
    for (const s of row.slots) {
      slots.set(s.flattenKey, s)
      if (s.time != null && s.flattenKey !== pivot.flattenKey) items.push({key: s.flattenKey, time: s.time})
    }
  }
  if (pivot.time == null) {
    // 尚未写时间的音符只动它自己
    return {warp: createAnchorWarp([], new Set(), pivot.flattenKey, 0), slots}
  }
  items.push({key: pivot.flattenKey, time: pivot.time})
  return {warp: createAnchorWarp(items, anchors.value, pivot.flattenKey, pivot.time), slots}
}

function applyMove(session: MoveSession, next: number) {
  for (const [key, t] of session.warp.apply(next)) {
    const slot = session.slots.get(key)
    if (!slot || slot.time === t) continue
    slot.time = writePassTime(slot.slotRef, props.timePropName, slot.passIndex, t)
  }
  tick.value++
}

// —— 拖拽 ——
const draggingKey = ref<string | null>(null)
let dragStartClientX = 0
let dragStartTime = 0
let dragSession: MoveSession | null = null

function onPointerDown(ev: PointerEvent, slot: FlattenSlotItem) {
  ev.preventDefault()
  ev.stopPropagation()
  const target = ev.currentTarget as Element
  try {
    target.setPointerCapture(ev.pointerId)
  } catch {
    /* noop */
  }
  selectedKey.value = slot.flattenKey
  draggingKey.value = slot.flattenKey
  dragStartClientX = ev.clientX
  dragStartTime = slot.time ?? 0
  dragSession = beginMove(slot)
}

function onPointerMove(ev: PointerEvent, slot: FlattenSlotItem) {
  if (draggingKey.value !== slot.flattenKey || !dragSession) return
  const dx = ev.clientX - dragStartClientX
  if (dx === 0 && slot.time == null) return
  applyMove(dragSession, Math.min(MAX_SYNC_SECONDS, Math.max(0, dragStartTime + dx / props.pxPerSecond)))
}

function onPointerUp(ev: PointerEvent, slot: FlattenSlotItem) {
  if (draggingKey.value !== slot.flattenKey) return
  const target = ev.currentTarget as Element
  try {
    target.releasePointerCapture(ev.pointerId)
  } catch {
    /* noop */
  }
  const moved = ev.clientX !== dragStartClientX
  draggingKey.value = null
  dragSession = null
  if (moved) emit('timeChange')
}

function onTimeInput(ev: Event) {
  const sel = selected.value
  if (!sel) return
  const input = ev.target as HTMLInputElement
  const value = Number(input.value)
  if (!Number.isFinite(value)) {
    input.value = selectedTimeText.value
    return
  }
  applyMove(beginMove(sel.slot), Math.min(MAX_SYNC_SECONDS, Math.max(0, value)))
  input.value = selectedTimeText.value
  emit('timeChange')
}

function onKeydown(ev: KeyboardEvent) {
  if (ev.key === 'Escape') clearSelection()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

/** 换曲谱 / 换时间属性时清掉选中与锚定 */
watch(() => props.timePropName, () => {
  clearSelection()
  clearAnchors()
})

const _rev = computed(() => props.revision)

defineExpose({
  rowHeight: rowH,
  clearAnchors,
  clearSelection,
  getAnchors: () => [...anchors.value],
})
</script>

<template>
  <div class="dr-to-flatten-wrap" :style="{width: `${axisWidth}px`, height: `${totalH}px`}">
    <svg
      class="dr-to-flatten"
      :height="totalH"
      :width="axisWidth"
      :viewBox="`0 0 ${axisWidth} ${totalH}`"
      @pointerdown="clearSelection"
    >
      <g
        v-for="(row, ri) in rows"
        :key="row.key + '-' + _rev"
        :transform="`translate(0, ${layout.tops[ri] ?? 0})`"
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
          :class="{
            'dr-to-flatten__slot--anchor': anchors.has(slot.flattenKey),
            'dr-to-flatten__slot--selected': selectedKey === slot.flattenKey,
          }"
          :transform="`translate(${slotX(slot)}, 0)`"
          @pointerdown="onPointerDown($event, slot)"
          @pointermove="onPointerMove($event, slot)"
          @pointerup="onPointerUp($event, slot)"
          @pointercancel="onPointerUp($event, slot)"
        >
          <rect
            class="dr-to-flatten__hit"
            :height="slotBox.h"
            :width="slotBox.w"
            :x="0"
            :y="slotBox.y"
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
          <g v-if="slot.lyric" class="dr-to-flatten__lyric">
            <rect
              v-if="selectedKey === slot.flattenKey"
              class="dr-to-flatten__lyric-bg"
              :height="FLATTEN_LYRIC_H - 4"
              :width="lyricBgWidth(slot.lyric)"
              :x="slotBox.w / 2 - lyricBgWidth(slot.lyric) / 2"
              :y="lyricY - (FLATTEN_LYRIC_H - 4) / 2"
              rx="3"
            />
            <text
              class="dr-to-flatten__lyric-text"
              dominant-baseline="central"
              text-anchor="middle"
              :x="slotBox.w / 2"
              :y="lyricY"
            >{{ slot.lyric }}</text>
          </g>
        </g>
      </g>
    </svg>

    <!-- 选中音符：上方时间输入 + 锚定 -->
    <div
      v-if="selected"
      class="dr-to-flatten__pop"
      :style="{
        left: `${slotX(selected.slot)}px`,
        top: `${(layout.tops[selected.rowIndex] ?? 0) + slotBox.y}px`,
      }"
      @pointerdown.stop
    >
      <input
        :value="selectedTimeText"
        class="dr-to-flatten__pop-input"
        min="0"
        :max="MAX_SYNC_SECONDS"
        placeholder="未同步"
        step="0.01"
        type="number"
        @change="onTimeInput"
      />
      <span class="dr-to-flatten__pop-unit">s</span>
      <button
        class="dr-to-flatten__pop-btn"
        :class="{'dr-to-flatten__pop-btn--on': anchors.has(selected.slot.flattenKey)}"
        type="button"
        @click="toggleAnchor"
      >
        {{ anchors.has(selected.slot.flattenKey) ? '取消锚定' : '锚定' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.dr-to-flatten-wrap {
  position: relative;
}

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

.dr-to-flatten__hit {
  fill: rgba(64, 158, 255, 0.12);
  stroke: rgba(64, 158, 255, 0.65);
  stroke-width: 1;
}

.dr-to-flatten__slot--anchor .dr-to-flatten__hit {
  fill: rgba(230, 162, 60, 0.28);
  stroke: #e6a23c;
  stroke-width: 2;
}

.dr-to-flatten__slot--selected .dr-to-flatten__hit {
  stroke: #1d6fd8;
  stroke-width: 2;
}

.dr-to-flatten__slot--anchor.dr-to-flatten__slot--selected .dr-to-flatten__hit {
  stroke: #c47f12;
}

.dr-to-flatten__lyric-text {
  font-size: 13px;
  fill: #303133;
  user-select: none;
}

.dr-to-flatten__lyric-bg {
  fill: #1d6fd8;
}

.dr-to-flatten__slot--selected .dr-to-flatten__lyric-text {
  fill: #fff;
  font-weight: 600;
}

.dr-to-flatten__pop {
  position: absolute;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 4px;
  transform: translateY(calc(-100% - 4px));
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  white-space: nowrap;
}

.dr-to-flatten__pop-input {
  width: 72px;
  font-size: 12px;
  padding: 2px 4px;
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  font-variant-numeric: tabular-nums;
}

.dr-to-flatten__pop-unit {
  font-size: 12px;
  color: #909399;
}

.dr-to-flatten__pop-btn {
  font-size: 12px;
  padding: 2px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  background: #f5f7fa;
  cursor: pointer;
}

.dr-to-flatten__pop-btn--on {
  border-color: #e6a23c;
  background: #fdf6ec;
  color: #b88230;
}
</style>
