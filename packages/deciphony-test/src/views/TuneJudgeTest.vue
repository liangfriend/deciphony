<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  activeContext,
  clearData,
  closeTuneJudge,
  getJudgeConfig,
  getScoreSnapshot,
  loadSequence,
  playMap,
  playedMap,
  pause,
  play,
  setJudgeConfig,
  setProgressCallback,
  startTuneJudge,
} from '@jsh/tune-judge'
import type { Sequence, TuneJudgeScoreSnapshot } from '@jsh/tune-judge'

/** 与 packages/tune-judge/test/main.ts 中预设一致，Unit256 */
const happyBirthday: Sequence = [
  { midi: 60, playTime: 0, duration: 64 },
  { midi: 60, playTime: 64, duration: 64 },
  { midi: 62, playTime: 128, duration: 128 },
  { midi: 60, playTime: 256, duration: 128 },
  { midi: 65, playTime: 384, duration: 128 },
  { midi: 64, playTime: 512, duration: 256 },
  { midi: 60, playTime: 768, duration: 64 },
  { midi: 60, playTime: 832, duration: 64 },
  { midi: 62, playTime: 896, duration: 128 },
  { midi: 60, playTime: 1024, duration: 128 },
  { midi: 67, playTime: 1152, duration: 128 },
  { midi: 65, playTime: 1280, duration: 256 },
  { midi: 60, playTime: 1536, duration: 64 },
  { midi: 60, playTime: 1600, duration: 64 },
  { midi: 72, playTime: 1664, duration: 128 },
  { midi: 69, playTime: 1792, duration: 128 },
  { midi: 65, playTime: 1920, duration: 128 },
  { midi: 64, playTime: 2048, duration: 128 },
  { midi: 62, playTime: 2176, duration: 256 },
  { midi: 70, playTime: 2432, duration: 64 },
  { midi: 70, playTime: 2496, duration: 64 },
  { midi: 69, playTime: 2560, duration: 128 },
  { midi: 65, playTime: 2688, duration: 128 },
  { midi: 67, playTime: 2816, duration: 128 },
  { midi: 65, playTime: 2944, duration: 256 },
]

/** 卷帘纵轴只画这一段，避免 1–128 时中音区挤在底部 */
const MIDI_LO = 0
const MIDI_HI = 100
const ROW_H = 10
const BPM = 120

/** 横轴：每单位 256 分音符占多少像素 */
const PX_PER_UNIT = 0.35

const trackHeight = (MIDI_HI - MIDI_LO + 1) * ROW_H

/** 从高到低一行一个 midi，供模板 v-for（不能用 `in MIDI_HI`，会漏 0 且与 LO 无关） */
const pianoRollMidis = computed(() => {
  const a: number[] = []
  for (let m = MIDI_HI; m >= MIDI_LO; m--) a.push(m)
  return a
})

const maxPlayUnit = computed(() =>
  happyBirthday.reduce(
    (m: number, n: (typeof happyBirthday)[number]) => Math.max(m, n.playTime + n.duration),
    0,
  ),
)

const timelineWidthPx = computed(() => Math.ceil(maxPlayUnit.value * PX_PER_UNIT) + 48)

const emptyScoreSnap = (): TuneJudgeScoreSnapshot => ({
  real: { pitchScore: 0, rhythmScore: 0, completenessScore: 0 },
  total: { pitchScore: 0, rhythmScore: 0, completenessScore: 0 },
})

const scoreSnap = ref<TuneJudgeScoreSnapshot>(emptyScoreSnap())

function ratioPct(real: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.round((real / total) * 1000) / 10)
}

const pitchScorePct = computed(() =>
  ratioPct(scoreSnap.value.real.pitchScore, scoreSnap.value.total.pitchScore),
)
const rhythmScorePct = computed(() =>
  ratioPct(scoreSnap.value.real.rhythmScore, scoreSnap.value.total.rhythmScore),
)
const completenessScorePct = computed(() =>
  ratioPct(scoreSnap.value.real.completenessScore, scoreSnap.value.total.completenessScore),
)

/** 本页维护的检测起点（不用 tune-judge 内部的 startTime） */
const detectStartTimeMs = ref(0)
const isDetecting = ref(false)
let rafId = 0
const nowMs = ref(performance.now())

function secondsToUnit256(seconds: number, bpm: number): number {
  return (seconds * 64 * bpm) / 60
}

const progressUnit = computed(() => {
  if (!isDetecting.value || detectStartTimeMs.value <= 0) return 0
  const elapsedSec = (nowMs.value - detectStartTimeMs.value) / 1000
  return Math.max(0, secondsToUnit256(elapsedSec, BPM))
})

const progressX = computed(() => progressUnit.value * PX_PER_UNIT)

/** 当前演唱音高（来自 tune-judge 的 progress） */
const liveMidi = ref<number | null>(null)

const pitchDotTop = computed(() => {
  if (liveMidi.value == null) return 0
  const m = Math.min(MIDI_HI, Math.max(MIDI_LO, liveMidi.value))
  return (MIDI_HI - m) * ROW_H + ROW_H / 2
})

const pitchDotVisible = computed(
  () =>
    isDetecting.value &&
    liveMidi.value != null &&
    liveMidi.value >= MIDI_LO &&
    liveMidi.value <= MIDI_HI,
)

function tick(): void {
  if (!isDetecting.value) return
  nowMs.value = performance.now()
  rafId = requestAnimationFrame(tick)
}

type TrackBar = { midi: number; start: number; end: number }

type PlayedLayer = 'raw' | 'fixed' | 'absorbed'

/** 仅影响钢琴卷帘上「已唱」条用哪一层渲染；得分仍由 tune-judge 使用 absorbed */
const playedTrackMode = ref<PlayedLayer>('fixed')

/** 显示判分范围滑块与谱面三色范围带（得分面板始终显示） */
const showJudgeRangeUi = ref(true)

const playMapState = ref<Map<number, number[][]>>(new Map())
/** 三层快照，便于切换显示而不改判分逻辑 */
const playedMapsByLayer = ref<Record<PlayedLayer, Map<number, number[][]>>>({
  raw: new Map(),
  fixed: new Map(),
  absorbed: new Map(),
})

function cloneMap(src: Map<number, number[][]>): Map<number, number[][]> {
  return new Map([...src.entries()].map(([k, arr]) => [k, arr.map((s) => [s[0], s[1]])]))
}

function mapToBars(mp: Map<number, number[][]>): TrackBar[] {
  const bars: TrackBar[] = []
  for (const [midi, segs] of mp.entries()) {
    if (midi < MIDI_LO || midi > MIDI_HI) continue
    for (const seg of segs) {
      if (!seg || seg.length < 2) continue
      bars.push({ midi, start: seg[0], end: seg[1] })
    }
  }
  return bars
}

const playBars = computed(() => mapToBars(playMapState.value))
const playedBars = computed(() => mapToBars(playedMapsByLayer.value[playedTrackMode.value]))

/** 与 judge 同步，用于滑块与 playMap 上三层范围示意 */
const judgePitchElasticity = ref(2)
const judgeRhythmRange = ref(16)
const judgeCompletenessRange = ref(0)

function syncJudgeConfigUi(): void {
  const c = getJudgeConfig()
  judgePitchElasticity.value = c.pitchScoreElasticity
  judgeRhythmRange.value = c.rhythmScoreRange
  judgeCompletenessRange.value = c.completenessScoreRange
}

function onPitchElasticityInput(): void {
  setJudgeConfig({ pitchScoreElasticity: judgePitchElasticity.value })
}

function onRhythmRangeInput(): void {
  setJudgeConfig({ rhythmScoreRange: judgeRhythmRange.value })
}

function onCompletenessRangeInput(): void {
  setJudgeConfig({ completenessScoreRange: judgeCompletenessRange.value })
}

/** 音准吸附：谱面条纵向 ±N 个半音（与 judge 中 pitchScoreElasticity 一致） */
function pitchHintStyle(bar: TrackBar): Record<string, string> {
  const el = judgePitchElasticity.value
  const topPx = (MIDI_HI - bar.midi - el) * ROW_H
  const h = Math.max(ROW_H, (2 * el + 1) * ROW_H)
  return {
    left: `${bar.start * PX_PER_UNIT}px`,
    width: `${Math.max(1, (bar.end - bar.start) * PX_PER_UNIT)}px`,
    top: `${topPx}px`,
    height: `${h}px`,
  }
}

/** 节奏：起音时刻 playTime 左右各 R（Unit256），与 judge 窗口一致 */
function rhythmHintStyle(bar: TrackBar): Record<string, string> {
  const r = judgeRhythmRange.value
  const w = Math.max(1, 2 * r * PX_PER_UNIT)
  return {
    left: `${(bar.start - r) * PX_PER_UNIT}px`,
    width: `${w}px`,
    top: `${(MIDI_HI - bar.midi) * ROW_H}px`,
    height: `${ROW_H}px`,
  }
}

/** 完整：音符起止两侧各 C（Unit256） */
function completenessHintStyle(bar: TrackBar): Record<string, string> {
  const c = judgeCompletenessRange.value
  const dur = bar.end - bar.start
  const w = Math.max(1, (dur + 2 * c) * PX_PER_UNIT)
  return {
    left: `${(bar.start - c) * PX_PER_UNIT}px`,
    width: `${w}px`,
    top: `${(MIDI_HI - bar.midi) * ROW_H}px`,
    height: `${ROW_H}px`,
  }
}

function barStyle(bar: TrackBar): Record<string, string> {
  return {
    left: `${bar.start * PX_PER_UNIT}px`,
    width: `${Math.max(1, (bar.end - bar.start) * PX_PER_UNIT)}px`,
    top: `${(MIDI_HI - bar.midi) * ROW_H}px`,
    height: `${ROW_H}px`,
  }
}

function syncPlayMapFromJudge(): void {
  playMapState.value = cloneMap(playMap)
}

function syncPlayedMapsFromJudge(): void {
  playedMapsByLayer.value = {
    raw: cloneMap(playedMap.raw),
    fixed: cloneMap(playedMap.fixed),
    absorbed: cloneMap(playedMap.absorbed),
  }
}

onMounted(() => {
  loadSequence(happyBirthday)
  syncJudgeConfigUi()
  scoreSnap.value = getScoreSnapshot()
  syncPlayMapFromJudge()
  syncPlayedMapsFromJudge()
  setProgressCallback((data) => {
    playedMapsByLayer.value = {
      raw: cloneMap(data.playedMap.raw),
      fixed: cloneMap(data.playedMap.fixed),
      absorbed: cloneMap(data.playedMap.absorbed),
    }
    scoreSnap.value = getScoreSnapshot()
    if (isDetecting.value) {
      liveMidi.value = data.realMidi > 0 ? data.realMidi : null
    }
  })
})

function onClearData(): void {
  clearData()
  syncPlayedMapsFromJudge()
  scoreSnap.value = getScoreSnapshot()
}

async function onStart(): Promise<void> {
  if (isDetecting.value) return
  startTuneJudge()
  await activeContext()
  detectStartTimeMs.value = performance.now()
  nowMs.value = detectStartTimeMs.value
  isDetecting.value = true
  await play()
  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(tick)
}

function onStop(): void {
  liveMidi.value = null
  isDetecting.value = false
  scoreSnap.value = getScoreSnapshot()
  cancelAnimationFrame(rafId)
  rafId = 0
  detectStartTimeMs.value = 0
  pause()
  closeTuneJudge()
}

onUnmounted(() => {
  setProgressCallback(() => {
    /* teardown */
  })
  cancelAnimationFrame(rafId)
  pause()
  closeTuneJudge()
})
</script>

<template>
  <div class="page">
    <div class="toolbar">
      <button type="button" class="btn primary" :disabled="isDetecting" @click="onStart">
        开始检测
      </button>
      <button type="button" class="btn" :disabled="!isDetecting" @click="onStop">停止</button>
      <button type="button" class="btn warn" @click="onClearData">清空已唱</button>
      <label class="judge-ui-switch">
        <span class="judge-ui-switch-label">判分范围</span>
        <input
          v-model="showJudgeRangeUi"
          type="checkbox"
          class="judge-ui-switch-input"
          role="switch"
          :aria-checked="showJudgeRangeUi"
        />
        <span class="judge-ui-switch-track" aria-hidden="true" />
      </label>
      <span class="meta">BPM {{ BPM }} · 四分音符=64（Unit256）</span>
    </div>

    <div class="score-panel" aria-live="polite">
      <div class="score-title">得分（来自 tune-judge）</div>
      <div class="score-grid">
        <div class="score-cell">
          <span class="score-label">音准</span>
          <span class="score-val"
            >{{ scoreSnap.real.pitchScore }} / {{ scoreSnap.total.pitchScore }}（256 单位）·
            {{ pitchScorePct }}%</span
          >
        </div>
        <div class="score-cell">
          <span class="score-label">节奏</span>
          <span class="score-val"
            >{{ scoreSnap.real.rhythmScore }} / {{ scoreSnap.total.rhythmScore }} ·
            {{ rhythmScorePct }}%</span
          >
        </div>
        <div class="score-cell">
          <span class="score-label">完整</span>
          <span class="score-val"
            >{{ scoreSnap.real.completenessScore }} / {{ scoreSnap.total.completenessScore }} ·
            {{ completenessScorePct }}%</span
          >
        </div>
      </div>
    </div>

    <div class="track-layer-bar" role="radiogroup" aria-label="已唱轨显示层">
      <span class="track-layer-label">已唱轨</span>
      <label class="track-layer-opt">
        <input v-model="playedTrackMode" type="radio" name="played-layer" value="raw" />
        raw
      </label>
      <label class="track-layer-opt">
        <input v-model="playedTrackMode" type="radio" name="played-layer" value="fixed" />
        fixed
      </label>
      <label class="track-layer-opt">
        <input v-model="playedTrackMode" type="radio" name="played-layer" value="absorbed" />
        absorbed
      </label>
      <span class="track-layer-hint">得分始终按 absorbed 计算</span>
    </div>

    <div
      v-show="showJudgeRangeUi"
      class="config-panel"
      aria-label="tune-judge 判分范围（实时生效）"
    >
      <div class="config-title">
        判分范围 <span class="config-sub">setJudgeConfig · 与谱面条对照</span>
      </div>
      <div class="config-sliders">
        <label class="config-row pitch-row">
          <span class="config-key">pitchScoreElasticity</span>
          <span class="config-val">{{ judgePitchElasticity }}</span>
          <span class="config-desc">半音 · 纵向琥珀带（吸附命中区）</span>
          <input
            v-model.number="judgePitchElasticity"
            type="range"
            min="0"
            max="12"
            step="1"
            class="config-range"
            @input="onPitchElasticityInput"
          />
        </label>
        <label class="config-row rhythm-row">
          <span class="config-key">rhythmScoreRange</span>
          <span class="config-val">{{ judgeRhythmRange }}</span>
          <span class="config-desc">Unit256 · 起音点左右青色带</span>
          <input
            v-model.number="judgeRhythmRange"
            type="range"
            min="0"
            max="128"
            step="1"
            class="config-range"
            @input="onRhythmRangeInput"
          />
        </label>
        <label class="config-row complete-row">
          <span class="config-key">completenessScoreRange</span>
          <span class="config-val">{{ judgeCompletenessRange }}</span>
          <span class="config-desc">Unit256 · 音符两侧紫色带</span>
          <input
            v-model.number="judgeCompletenessRange"
            type="range"
            min="0"
            max="128"
            step="1"
            class="config-range"
            @input="onCompletenessRangeInput"
          />
        </label>
      </div>
    </div>

    <div class="scroll-x">
      <div
        class="roll"
        :style="{
          width: `${timelineWidthPx}px`,
          height: `${trackHeight}px`,
        }"
      >
        <div
          v-for="midi in pianoRollMidis"
          :key="midi"
          class="row"
          :style="{ top: `${(MIDI_HI - midi) * ROW_H}px`, height: `${ROW_H}px` }"
        >
          <span class="row-label">{{ midi }}</span>
        </div>

        <template v-if="showJudgeRangeUi">
          <div
            v-for="(bar, idx) in playBars"
            :key="`hint-c-${idx}`"
            class="roll-hint roll-hint--completeness"
            :style="completenessHintStyle(bar)"
          />
          <div
            v-for="(bar, idx) in playBars"
            :key="`hint-r-${idx}`"
            class="roll-hint roll-hint--rhythm"
            :style="rhythmHintStyle(bar)"
          />
          <div
            v-for="(bar, idx) in playBars"
            :key="`hint-p-${idx}`"
            class="roll-hint roll-hint--pitch"
            :style="pitchHintStyle(bar)"
          />
        </template>

        <div
          v-for="(bar, idx) in playBars"
          :key="`play-${idx}`"
          class="note"
          :style="barStyle(bar)"
        />
        <div
          v-for="(bar, idx) in playedBars"
          :key="`played-${idx}`"
          class="note played"
          :style="barStyle(bar)"
        />

        <div class="playhead" :style="{ left: `${progressX}px` }">
          <div class="playhead-line" />
          <div v-show="pitchDotVisible" class="pitch-dot" :style="{ top: `${pitchDotTop}px` }" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 16px;
  color: #e4e4e7;
  background: #0c0c0f;
  min-height: 100%;
  box-sizing: border-box;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.meta {
  font-size: 13px;
  color: #a1a1aa;
}
.judge-ui-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  color: #d4d4d8;
}
.judge-ui-switch-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.judge-ui-switch-track {
  position: relative;
  width: 40px;
  height: 22px;
  flex-shrink: 0;
  border-radius: 11px;
  background: #3f3f46;
  transition: background 0.15s ease;
}
.judge-ui-switch-track::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fafafa;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  transition: transform 0.15s ease;
}
.judge-ui-switch-input:checked + .judge-ui-switch-track {
  background: #22c55e;
}
.judge-ui-switch-input:checked + .judge-ui-switch-track::after {
  transform: translateX(18px);
}
.judge-ui-switch-input:focus-visible + .judge-ui-switch-track {
  outline: 2px solid #a78bfa;
  outline-offset: 2px;
}
.score-panel {
  margin-bottom: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #27272a;
  background: #121215;
}
.score-title {
  font-size: 12px;
  color: #a1a1aa;
  margin-bottom: 8px;
}
.score-grid {
  display: grid;
  gap: 6px;
  font-size: 13px;
}
.score-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
}
.score-label {
  min-width: 40px;
  color: #d4d4d8;
  font-weight: 500;
}
.score-val {
  color: #86efac;
  font-variant-numeric: tabular-nums;
}
.track-layer-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px 18px;
  margin-bottom: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #27272a;
  background: #141417;
  font-size: 13px;
}
.track-layer-label {
  color: #a1a1aa;
  margin-right: 4px;
}
.track-layer-opt {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #e4e4e7;
  user-select: none;
}
.track-layer-opt input {
  accent-color: #22c55e;
}
.track-layer-hint {
  font-size: 12px;
  color: #71717a;
  margin-left: auto;
}
.config-panel {
  margin-bottom: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #27272a;
  background: #121215;
}
.config-title {
  font-size: 12px;
  color: #a1a1aa;
  margin-bottom: 8px;
}
.config-sub {
  font-weight: 400;
  color: #71717a;
}
.config-sliders {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.config-row {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto auto;
  gap: 4px 12px;
  align-items: center;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #27272a;
  background: #16161a;
}
.config-row.pitch-row {
  border-color: rgba(245, 158, 11, 0.45);
}
.config-row.rhythm-row {
  border-color: rgba(34, 211, 238, 0.4);
}
.config-row.complete-row {
  border-color: rgba(192, 132, 252, 0.45);
}
.config-key {
  grid-column: 1;
  grid-row: 1;
  font-size: 12px;
  font-weight: 600;
  color: #e4e4e7;
  font-family: ui-monospace, monospace;
}
.config-val {
  grid-column: 2;
  grid-row: 1;
  justify-self: end;
  font-size: 12px;
  color: #d4d4d8;
  font-variant-numeric: tabular-nums;
  min-width: 2ch;
}
.config-desc {
  grid-column: 1 / -1;
  grid-row: 2;
  font-size: 11px;
  color: #71717a;
}
.config-range {
  grid-column: 1 / -1;
  grid-row: 3;
  width: 100%;
  min-width: 0;
}
.pitch-row .config-range {
  accent-color: #f59e0b;
}
.rhythm-row .config-range {
  accent-color: #22d3ee;
}
.complete-row .config-range {
  accent-color: #c084fc;
}
.roll-hint {
  position: absolute;
  box-sizing: border-box;
  pointer-events: none;
  border-radius: 2px;
}
.roll-hint--completeness {
  z-index: 1;
  background: rgba(192, 132, 252, 0.14);
  border: 1px dashed rgba(192, 132, 252, 0.55);
  box-shadow: 0 0 0 1px rgba(192, 132, 252, 0.12);
}
.roll-hint--rhythm {
  z-index: 2;
  background: rgba(34, 211, 238, 0.16);
  border: 1px solid rgba(34, 211, 238, 0.5);
}
.roll-hint--pitch {
  z-index: 3;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.45);
  box-shadow:
    0 0 0 1px rgba(245, 158, 11, 0.08),
    inset 0 0 12px rgba(245, 158, 11, 0.15);
}
.btn {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #3f3f46;
  background: #27272a;
  color: #fafafa;
  cursor: pointer;
  font-size: 14px;
}
.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.btn.primary {
  background: #22c55e;
  border-color: #16a34a;
  color: #052e16;
}
.btn.warn {
  border-color: #b45309;
  background: #b45309;
  color: #fff7ed;
}
.btn.warn:hover:not(:disabled) {
  background: #c2410c;
}
.scroll-x {
  overflow-x: auto;
  overflow-y: hidden;
  border: 1px solid #27272a;
  border-radius: 10px;
  background: #18181b;
}
.roll {
  position: relative;
  margin-left: 40px;
  overflow: hidden;
}
.row {
  position: absolute;
  left: 0;
  right: 0;
  box-sizing: border-box;
  border-bottom: 1px solid #27272a;
  pointer-events: none;
}
.row-label {
  position: absolute;
  left: -36px;
  width: 32px;
  text-align: right;
  font-size: 9px;
  line-height: 10px;
  color: #52525b;
  font-variant-numeric: tabular-nums;
}
.note {
  position: absolute;
  box-sizing: border-box;
  border-radius: 2px;
  background: rgba(59, 130, 246, 0.55);
  border: 1px solid rgba(147, 197, 253, 0.7);
  pointer-events: none;
  z-index: 5;
}
.note.played {
  background: rgba(30, 64, 175, 0.9);
  border-color: rgba(37, 99, 235, 0.95);
  z-index: 6;
}
.note.rest {
  display: none;
}
.playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 0;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 8;
}
.playhead-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  margin-left: -1px;
  background: #ef4444;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.6);
}
.pitch-dot {
  position: absolute;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fafafa;
  border: 2px solid #ef4444;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
  transform: translate(-50%, -50%);
  z-index: 5;
}
</style>
