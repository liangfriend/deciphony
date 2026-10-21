<script lang="ts" setup>
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {MusicScoreTypeEnum, type MusicScore} from '@deciphony/renderer'
import {APlayer, startJPlayer} from '@deciphony/player'
import {autoAlignTimeOffsets} from '../autoAlign'
import {
  DEFAULT_PX_PER_SECOND,
  DEFAULT_TIME_PROP,
  MAX_PX_PER_SECOND,
  MAX_SYNC_SECONDS,
  MAX_WAVE_GAIN,
  MIN_PX_PER_SECOND,
  MIN_WAVE_GAIN,
  WAVE_PEAKS_PER_SECOND,
  WAVEFORM_HEIGHT,
} from '../constants'
import {decodeAudioForWaveform} from '../decodeAudio'
import {buildFlattenStaffRows, flattenRowLayout, validateFlattenStaffLayout} from '../flattenSlots'
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
    /** 几分音符为一拍（拍号分母）；自动对齐用，默认 4 */
    beatUnit?: number
    actions?: TimeOffsetAction[]
  }>(),
  {
    pxPerSecond: DEFAULT_PX_PER_SECOND,
    timePropName: DEFAULT_TIME_PROP,
    beatUnit: 4,
    actions: () => [],
  },
)

const emit = defineEmits<{
  /** 时间属性被自动对齐或拖拽修改 */
  change: []
}>()

function clampPx(v: number | undefined): number {
  const n = v && Number.isFinite(v) ? v : DEFAULT_PX_PER_SECOND
  return Math.min(MAX_PX_PER_SECOND, Math.max(MIN_PX_PER_SECOND, n))
}

/** 横向缩放（每秒像素）：初值取 prop，滑动条再改；prop 变化时同步 */
const zoomPx = ref(clampPx(props.pxPerSecond))
watch(() => props.pxPerSecond, (v) => (zoomPx.value = clampPx(v)))
const px = computed(() => zoomPx.value)
/** 波形振幅倍数 */
const waveGain = ref(1)
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
const playheadH = computed(() => {
  if (scoreLayoutError.value) return WAVEFORM_HEIGHT
  const isNumber = props.musicScore.type === MusicScoreTypeEnum.NumberNotation
  return WAVEFORM_HEIGHT + flattenRowLayout(rows.value, isNumber).total
})

/** 前奏时间（秒），重置对齐时加到理论时间上 */
const introOffsetSec = ref(0)

const scrubbing = ref(false)
const scrollRef = ref<HTMLElement | null>(null)
const flattenRef = ref<{clearAnchors: () => void; getAnchors: () => string[]} | null>(null)
const anchorCount = ref(0)

/** 滚动窗口（波形只画可见部分） */
const viewLeft = ref(0)
const viewWidth = ref(0)
function syncView() {
  const el = scrollRef.value
  if (!el) return
  viewLeft.value = el.scrollLeft
  viewWidth.value = el.clientWidth
}
let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  syncView()
  if (scrollRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(syncView)
    resizeObserver.observe(scrollRef.value)
  }
})

/** 缩放时保持视口中心对应的时间不动（播放中由跟随滚动接管） */
watch(px, async (next, prev) => {
  const el = scrollRef.value
  if (!el || !prev || playing.value) return
  const centerSec = (el.scrollLeft + el.clientWidth / 2) / prev
  await nextTick()
  el.scrollLeft = Math.max(0, centerSec * next - el.clientWidth / 2)
  syncView()
})

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
    const {buffer, peaks: p, duration} = await decodeAudioForWaveform(url, props.sampleRate, WAVE_PEAKS_PER_SECOND)
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

function clearAnchors() {
  flattenRef.value?.clearAnchors()
}

/** 点波形：指针移到该处；播放中直接跳过去继续播 */
async function seekTo(sec: number) {
  const t = Math.min(MAX_SYNC_SECONDS, Math.max(0, sec))
  playheadSec.value = t
  if (!player) return
  if (playing.value) {
    await player.seek(t)
  } else {
    player.current = t
  }
}

function handleAutoAlign() {
  autoAlignTimeOffsets(
    props.musicScore,
    timeProp.value,
    props.beatUnit > 0 ? props.beatUnit : 4,
    introOffsetSec.value,
  )
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
  resizeObserver?.disconnect()
  player?.dispose()
  player = null
})

defineExpose({
  autoAlign: handleAutoAlign,
  play: handlePlay,
  stop: handleStop,
  resetPlayhead: handleResetPlayhead,
  seek: seekTo,
  clearAnchors,
  getPlayheadSec: () => playheadSec.value,
})
</script>

<template>
  <div class="dr-time-offset">
    <div ref="scrollRef" class="dr-time-offset__scroll" @scroll.passive="syncView">
      <div class="dr-time-offset__axis" :style="{width: `${axisWidth}px`}">
        <WaveformCanvas
          :gain="waveGain"
          :peaks="peaks"
          :peaks-per-second="WAVE_PEAKS_PER_SECOND"
          :px-per-second="px"
          :view-left="viewLeft"
          :view-width="viewWidth"
          :width="waveWidth || axisWidth"
          @seek="seekTo"
        />
        <FlattenScore
          v-if="!scoreLayoutError"
          ref="flattenRef"
          :axis-width="axisWidth"
          :playhead-x="playheadX"
          :px-per-second="px"
          :revision="revision"
          :rows="rows"
          :score-type="musicScore.type"
          :time-prop-name="timeProp"
          @anchors-change="anchorCount = $event"
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
      <button v-if="anchorCount" class="dr-time-offset__btn" type="button" @click="clearAnchors">
        清除锚定（{{ anchorCount }}）
      </button>
      <label class="dr-time-offset__slider">
        波形高度
        <input v-model.number="waveGain" :max="MAX_WAVE_GAIN" :min="MIN_WAVE_GAIN" step="0.1" type="range"/>
        <span class="dr-time-offset__slider-val">{{ waveGain.toFixed(1) }}×</span>
      </label>
      <label class="dr-time-offset__slider">
        横向缩放
        <input v-model.number="zoomPx" :max="MAX_PX_PER_SECOND" :min="MIN_PX_PER_SECOND" step="5" type="range"/>
        <span class="dr-time-offset__slider-val">{{ zoomPx }} px/s</span>
      </label>
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

.dr-time-offset__slider {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;
}

.dr-time-offset__slider input {
  width: 120px;
}

.dr-time-offset__slider-val {
  min-width: 56px;
  color: #909399;
  font-variant-numeric: tabular-nums;
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
