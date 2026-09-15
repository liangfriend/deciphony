<script lang="ts" setup>
import {computed, onBeforeUnmount, ref, watch} from 'vue'
import {MusicScoreTypeEnum, type MusicScore} from '@deciphony/renderer'
import {APlayer, startJPlayer} from '@deciphony/player'
import {autoAlignTimeOffsets} from '../autoAlign'
import {
  DEFAULT_PX_PER_SECOND,
  DEFAULT_TIME_PROP,
  FLATTEN_LINE_GAP,
  FLATTEN_STAFF_PAD_Y,
  FLATTEN_STEM_LENGTH,
  MAX_SYNC_SECONDS,
  WAVEFORM_HEIGHT,
} from '../constants'
import {decodeAudioForWaveform} from '../decodeAudio'
import {buildFlattenStaffRows, validateFlattenStaffLayout} from '../flattenSlots'
import type {TimeOffsetAction} from '../types'
import FlattenScore from './FlattenScore.vue'
import WaveformCanvas from './WaveformCanvas.vue'

const props = withDefaults(
  defineProps<{
    audioUrl: string
    musicScore: MusicScore
    pxPerSecond?: number
    sampleRate?: number
    timePropName?: string
    actions?: TimeOffsetAction[]
  }>(),
  {
    pxPerSecond: DEFAULT_PX_PER_SECOND,
    timePropName: DEFAULT_TIME_PROP,
    actions: () => [],
  },
)

const emit = defineEmits<{
  /** 时间属性被自动对齐或拖拽修改 */
  change: []
}>()

const px = computed(() => props.pxPerSecond || DEFAULT_PX_PER_SECOND)
const timeProp = computed(() => props.timePropName || DEFAULT_TIME_PROP)
const axisWidth = computed(() => MAX_SYNC_SECONDS * px.value)

const peaks = ref<Float32Array>(new Float32Array(0))
const audioDuration = ref(0)
const playheadSec = ref(0)
const playing = ref(false)
const revision = ref(0)
const loadError = ref('')

const scoreLayoutError = computed(() => validateFlattenStaffLayout(props.musicScore))

const rows = computed(() => {
  void revision.value
  if (scoreLayoutError.value) return []
  return buildFlattenStaffRows(props.musicScore, timeProp.value)
})

const playheadX = computed(() => playheadSec.value * px.value)
const playheadLabel = computed(() => `${playheadSec.value.toFixed(2)}s`)
/** 波形只画实际音频时长（上限 10min），避免整轴空白巨大 canvas */
const waveWidth = computed(() => {
  const dur = audioDuration.value > 0 ? Math.min(audioDuration.value, MAX_SYNC_SECONDS) : 0
  return Math.max(1, Math.ceil(dur * px.value))
})
const flattenRowH = computed(() => {
  if (props.musicScore.type === MusicScoreTypeEnum.NumberNotation) {
    return 56 + FLATTEN_STAFF_PAD_Y * 2
  }
  return 4 * FLATTEN_LINE_GAP + FLATTEN_STAFF_PAD_Y * 2 + FLATTEN_STEM_LENGTH * 0.35
})
const playheadH = computed(
  () =>
    WAVEFORM_HEIGHT +
    Math.max(scoreLayoutError.value ? 0 : 1, rows.value.length) * flattenRowH.value,
)

/** 前奏时间（秒），重置对齐时加到理论时间上 */
const introOffsetSec = ref(0)

const scrubbing = ref(false)
const scrollRef = ref<HTMLElement | null>(null)

let player: APlayer | null = null

function ensurePlayer() {
  if (!player) {
    startJPlayer()
    player = new APlayer()
    player.onProgress = (current) => {
      playheadSec.value = Math.min(MAX_SYNC_SECONDS, current)
      scrollPlayheadToCenter()
    }
    player.onEnd = () => {
      playing.value = false
      if (player) playheadSec.value = Math.min(MAX_SYNC_SECONDS, player.duration || playheadSec.value)
    }
  }
  return player
}

function scrollPlayheadToCenter() {
  const el = scrollRef.value
  if (!el || !playing.value) return
  const x = playheadSec.value * px.value
  const next = x - el.clientWidth / 2
  el.scrollLeft = Math.max(0, Math.min(next, el.scrollWidth - el.clientWidth))
}

async function loadAudio(url: string) {
  loadError.value = ''
  peaks.value = new Float32Array(0)
  audioDuration.value = 0
  if (!url) return
  try {
    const {buffer, peaks: p, duration} = await decodeAudioForWaveform(url, props.sampleRate)
    peaks.value = p
    audioDuration.value = duration
    const pl = ensurePlayer()
    pl.stop()
    await pl.setAudio(buffer)
    playheadSec.value = 0
    playing.value = false
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : String(e)
  }
}

watch(
  () => [props.audioUrl, props.sampleRate] as const,
  ([url]) => {
    void loadAudio(url)
  },
  {immediate: true},
)

function bump() {
  revision.value++
  emit('change')
}

function handleAutoAlign() {
  autoAlignTimeOffsets(props.musicScore, timeProp.value, 4, introOffsetSec.value)
  bump()
}

async function handlePlay() {
  const pl = ensurePlayer()
  if (!props.audioUrl) return
  playing.value = true
  // 从当前指针位置继续（暂停后恢复）
  if (Math.abs(pl.current - playheadSec.value) > 0.01) {
    try {
      pl.current = playheadSec.value
    } catch {
      /* playing 中不可设 current */
    }
  }
  await pl.play()
  scrollPlayheadToCenter()
}

/** 停止 = 暂停：指针保持当前位置 */
function handleStop() {
  if (!player) return
  player.pause()
  playing.value = false
  playheadSec.value = Math.min(MAX_SYNC_SECONDS, player.current)
}

/** 重置：指针回 0（不改 slot 时间） */
function handleResetPlayhead() {
  if (playing.value) {
    player?.pause()
    playing.value = false
  }
  if (player) {
    try {
      player.current = 0
    } catch {
      player.stop()
    }
  }
  playheadSec.value = 0
}

// —— 停止时可拖指针 seek ——
function clientXToSec(clientX: number): number {
  const el = scrollRef.value
  if (!el) return 0
  const rect = el.getBoundingClientRect()
  const x = clientX - rect.left + el.scrollLeft
  return Math.min(MAX_SYNC_SECONDS, Math.max(0, x / px.value))
}

function onPlayheadPointerDown(ev: PointerEvent) {
  if (playing.value) return
  scrubbing.value = true
  ;(ev.currentTarget as Element).setPointerCapture(ev.pointerId)
  playheadSec.value = clientXToSec(ev.clientX)
}

function onPlayheadPointerMove(ev: PointerEvent) {
  if (!scrubbing.value || playing.value) return
  playheadSec.value = clientXToSec(ev.clientX)
}

function onPlayheadPointerUp(ev: PointerEvent) {
  if (!scrubbing.value) return
  scrubbing.value = false
  try {
    ;(ev.currentTarget as Element).releasePointerCapture(ev.pointerId)
  } catch {
    /* noop */
  }
  const pl = ensurePlayer()
  pl.current = playheadSec.value
}

onBeforeUnmount(() => {
  player?.dispose()
  player = null
})

defineExpose({
  autoAlign: handleAutoAlign,
  play: handlePlay,
  stop: handleStop,
  resetPlayhead: handleResetPlayhead,
  getPlayheadSec: () => playheadSec.value,
})
</script>

<template>
  <div class="dr-time-offset">
    <div ref="scrollRef" class="dr-time-offset__scroll">
      <div class="dr-time-offset__axis" :style="{width: `${axisWidth}px`}">
        <WaveformCanvas :peaks="peaks" :width="waveWidth || axisWidth"/>
        <FlattenScore
          v-if="!scoreLayoutError"
          :axis-width="axisWidth"
          :playhead-x="playheadX"
          :px-per-second="px"
          :revision="revision"
          :rows="rows"
          :score-type="musicScore.type"
          :time-prop-name="timeProp"
          @time-change="bump"
        />
        <!-- 跨波形+展平谱的播放指针 -->
        <div
          class="dr-time-offset__playhead"
          :class="{'dr-time-offset__playhead--disabled': playing}"
          :style="{left: `${playheadX}px`, height: `${playheadH}px`}"
          @pointerdown="onPlayheadPointerDown"
          @pointermove="onPlayheadPointerMove"
          @pointerup="onPlayheadPointerUp"
          @pointercancel="onPlayheadPointerUp"
        >
          <span class="dr-time-offset__playhead-label">{{ playheadLabel }}</span>
        </div>
      </div>
    </div>

    <p v-if="scoreLayoutError" class="dr-time-offset__err">{{ scoreLayoutError }}</p>
    <p v-if="loadError" class="dr-time-offset__err">{{ loadError }}</p>

    <div class="dr-time-offset__bar">
      <button
        v-for="(act, i) in actions"
        :key="i"
        class="dr-time-offset__btn"
        type="button"
        @click="act.onClick"
      >
        {{ act.label }}
      </button>
      <input
        v-model.number="introOffsetSec"
        class="dr-time-offset__intro"
        type="number"
        min="0"
        step="0.01"
        placeholder="前奏时间"
      />
      <button class="dr-time-offset__btn" type="button" @click="handleAutoAlign">重置对齐</button>
      <button class="dr-time-offset__btn" type="button" @click="handlePlay">播放</button>
      <button class="dr-time-offset__btn" type="button" @click="handleStop">停止</button>
      <button class="dr-time-offset__btn" type="button" @click="handleResetPlayhead">重置</button>
      <span class="dr-time-offset__meta">
        t={{ playheadSec.toFixed(2) }}s · {{ timeProp }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.dr-time-offset {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.dr-time-offset__scroll {
  overflow: auto;
  border: 1px solid #e4e7ed;
  background: #fff;
  max-height: 420px;
}

.dr-time-offset__axis {
  position: relative;
}

.dr-time-offset__playhead {
  position: absolute;
  top: 0;
  width: 2px;
  margin-left: -1px;
  background: #f56c6c;
  cursor: ew-resize;
  z-index: 5;
  touch-action: none;
}

.dr-time-offset__playhead-label {
  position: absolute;
  top: 0;
  left: 6px;
  white-space: nowrap;
  font-size: 11px;
  line-height: 1.2;
  color: #f56c6c;
  font-variant-numeric: tabular-nums;
  pointer-events: none;
  user-select: none;
}

.dr-time-offset__playhead--disabled {
  cursor: default;
  pointer-events: none;
}

.dr-time-offset__bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.dr-time-offset__intro {
  width: 96px;
  font-size: 12px;
  padding: 4px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.dr-time-offset__btn {
  font-size: 12px;
  padding: 4px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #f5f7fa;
  cursor: pointer;
}

.dr-time-offset__btn:hover {
  background: #ecf5ff;
  border-color: #b3d8ff;
}

.dr-time-offset__meta {
  font-size: 12px;
  color: #909399;
}

.dr-time-offset__err {
  margin: 0;
  font-size: 12px;
  color: #f56c6c;
}
</style>
