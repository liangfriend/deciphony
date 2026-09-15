<script lang="ts" setup>
/**
 * 演唱测评：其多列 → mergeGrandStaff 单行曲谱 + tune-judge 瀑布流
 */
import {computed, onBeforeUnmount, onMounted, reactive, ref} from 'vue'
import musicScoreVue from '@deciphony/renderer'
import type {MusicScore} from '@deciphony/renderer'
import {mergeGrandStaff} from '@deciphony/extensions/score-util'
import {getDrPlaySequence} from '@deciphony/extensions/dr-play'
import {
  activeContext,
  clearData,
  closeTuneJudge,
  getScoreSnapshot,
  loadSequence,
  pause,
  play,
  playMap,
  playedMap,
  setBpm,
  setProgressCallback,
  startTuneJudge,
} from '@deciphony/tune-judge'
import type {Sequence, TuneJudgeScoreSnapshot} from '@deciphony/tune-judge'
import sampleScore from './data/其多列'

const MIDI_LO = 36
const MIDI_HI = 84
const ROW_H = 8
const PX_PER_UNIT = 0.4

/** 单行复谱表（原地 merge，先 clone） */
const musicScore = reactive(
  mergeGrandStaff(structuredClone(sampleScore) as MusicScore),
) as MusicScore

const bpm = computed(() => musicScore.bpm ?? 120)

function toJudgeSequence(score: MusicScore): Sequence {
  return getDrPlaySequence(score)
    .filter((it) => it.midi > 0)
    .map((it) => ({
      midi: it.midi,
      playTime: it.playTime,
      duration: it.real_duration ?? it.duration,
      data: {note_id: it.note_id},
    }))
}

const judgeSeq = computed(() => toJudgeSequence(musicScore))

const trackHeight = (MIDI_HI - MIDI_LO + 1) * ROW_H
const pianoRollMidis = computed(() => {
  const a: number[] = []
  for (let m = MIDI_HI; m >= MIDI_LO; m--) a.push(m)
  return a
})

const maxPlayUnit = computed(() =>
  judgeSeq.value.reduce((m, n) => Math.max(m, n.playTime + n.duration), 0),
)
const timelineWidthPx = computed(() => Math.ceil(maxPlayUnit.value * PX_PER_UNIT) + 48)

type TrackBar = {midi: number; start: number; end: number}
type PlayedLayer = 'raw' | 'fixed' | 'absorbed'

const emptyScoreSnap = (): TuneJudgeScoreSnapshot => ({
  real: {pitchScore: 0, rhythmScore: 0, completenessScore: 0},
  total: {pitchScore: 0, rhythmScore: 0, completenessScore: 0},
})

const scoreSnap = ref<TuneJudgeScoreSnapshot>(emptyScoreSnap())
const playedTrackMode = ref<PlayedLayer>('fixed')
const isDetecting = ref(false)
const status = ref('就绪：点击开始检测（需麦克风权限）')
const liveMidi = ref<number | null>(null)
const detectStartTimeMs = ref(0)
const nowMs = ref(performance.now())
let rafId = 0

const playMapState = ref<Map<number, number[][]>>(new Map())
const playedMapsByLayer = ref<Record<PlayedLayer, Map<number, number[][]>>>({
  raw: new Map(),
  fixed: new Map(),
  absorbed: new Map(),
})

function cloneMap(src: Map<number, number[][]>): Map<number, number[][]> {
  return new Map([...src.entries()].map(([k, arr]) => [k, arr.map((s) => [s[0]!, s[1]!])]))
}

function mapToBars(mp: Map<number, number[][]>): TrackBar[] {
  const bars: TrackBar[] = []
  for (const [midi, segs] of mp.entries()) {
    if (midi < MIDI_LO || midi > MIDI_HI) continue
    for (const seg of segs) {
      if (!seg || seg.length < 2) continue
      bars.push({midi, start: seg[0]!, end: seg[1]!})
    }
  }
  return bars
}

const playBars = computed(() => mapToBars(playMapState.value))
const playedBars = computed(() => mapToBars(playedMapsByLayer.value[playedTrackMode.value]))

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

function secondsToUnit256(seconds: number, bpmVal: number): number {
  return (seconds * 64 * bpmVal) / 60
}

const progressUnit = computed(() => {
  if (!isDetecting.value || detectStartTimeMs.value <= 0) return 0
  const elapsedSec = (nowMs.value - detectStartTimeMs.value) / 1000
  return Math.max(0, secondsToUnit256(elapsedSec, bpm.value))
})
const progressX = computed(() => progressUnit.value * PX_PER_UNIT)

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

function barStyle(bar: TrackBar): Record<string, string> {
  return {
    left: `${bar.start * PX_PER_UNIT}px`,
    width: `${Math.max(1, (bar.end - bar.start) * PX_PER_UNIT)}px`,
    top: `${(MIDI_HI - bar.midi) * ROW_H}px`,
    height: `${ROW_H}px`,
  }
}

function tick(): void {
  if (!isDetecting.value) return
  nowMs.value = performance.now()
  rafId = requestAnimationFrame(tick)
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

function reloadSequence(): void {
  setBpm(bpm.value)
  loadSequence(judgeSeq.value)
  syncPlayMapFromJudge()
  syncPlayedMapsFromJudge()
  scoreSnap.value = getScoreSnapshot()
}

onMounted(() => {
  reloadSequence()
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

async function onStart(): Promise<void> {
  if (isDetecting.value) return
  try {
    reloadSequence()
    startTuneJudge()
    await activeContext()
    detectStartTimeMs.value = performance.now()
    nowMs.value = detectStartTimeMs.value
    isDetecting.value = true
    status.value = '检测中…'
    await play()
    cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(tick)
  } catch (e) {
    isDetecting.value = false
    status.value = e instanceof Error ? e.message : String(e)
  }
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
  status.value = '已停止'
}

function onClear(): void {
  clearData()
  syncPlayedMapsFromJudge()
  scoreSnap.value = getScoreSnapshot()
  status.value = '已清空已唱数据'
}

onBeforeUnmount(() => {
  setProgressCallback(() => {
    /* teardown */
  })
  cancelAnimationFrame(rafId)
  pause()
  closeTuneJudge()
})
</script>

<template>
  <div class="tj-page">
    <header class="tj-header">
      <h1 class="tj-title">演唱测评 · tune-judge</h1>
      <p class="tj-sub">
        曲谱「其多列」经 <code>mergeGrandStaff</code> 展成单行复谱表；下方为标准轨 + 已唱瀑布流。
      </p>
    </header>

    <section class="tj-score">
      <h2 class="tj-h2">单行曲谱</h2>
      <div class="tj-score-wrap">
        <musicScoreVue :data="musicScore"/>
      </div>
    </section>

    <section class="tj-waterfall">
      <div class="tj-waterfall-head">
        <h2 class="tj-h2">演唱瀑布流</h2>
        <div class="tj-layer" role="radiogroup" aria-label="已唱轨显示层">
          <span class="tj-layer-label">已唱轨</span>
          <label><input v-model="playedTrackMode" type="radio" value="raw"/> raw</label>
          <label><input v-model="playedTrackMode" type="radio" value="fixed"/> fixed</label>
          <label><input v-model="playedTrackMode" type="radio" value="absorbed"/> absorbed</label>
        </div>
      </div>
      <div class="tj-scroll">
        <div
          class="tj-roll"
          :style="{width: `${timelineWidthPx}px`, height: `${trackHeight}px`}"
        >
          <div
            v-for="midi in pianoRollMidis"
            :key="midi"
            class="tj-row"
            :style="{top: `${(MIDI_HI - midi) * ROW_H}px`, height: `${ROW_H}px`}"
          >
            <span v-if="midi % 12 === 0" class="tj-row-label">{{ midi }}</span>
          </div>
          <div
            v-for="(bar, idx) in playBars"
            :key="`play-${idx}`"
            class="tj-note"
            :style="barStyle(bar)"
          />
          <div
            v-for="(bar, idx) in playedBars"
            :key="`played-${idx}`"
            class="tj-note tj-note--played"
            :style="barStyle(bar)"
          />
          <div class="tj-playhead" :style="{left: `${progressX}px`}">
            <div class="tj-playhead-line"/>
            <div
              v-show="pitchDotVisible"
              class="tj-pitch-dot"
              :style="{top: `${pitchDotTop}px`}"
            />
          </div>
        </div>
      </div>
    </section>

    <footer class="tj-bar">
      <div class="tj-actions">
        <button type="button" class="tj-btn tj-btn--primary" :disabled="isDetecting" @click="onStart">
          开始检测
        </button>
        <button type="button" class="tj-btn" :disabled="!isDetecting" @click="onStop">停止</button>
        <button type="button" class="tj-btn" @click="onClear">清空已唱</button>
        <span class="tj-meta">BPM {{ bpm }} · 音符 {{ judgeSeq.length }} · {{ status }}</span>
      </div>
      <div class="tj-scores" aria-live="polite">
        <div class="tj-score-cell">
          <span class="tj-score-label">音准</span>
          <span
            >{{ scoreSnap.real.pitchScore }} / {{ scoreSnap.total.pitchScore }} ·
            {{ pitchScorePct }}%</span
          >
        </div>
        <div class="tj-score-cell">
          <span class="tj-score-label">节奏</span>
          <span
            >{{ scoreSnap.real.rhythmScore }} / {{ scoreSnap.total.rhythmScore }} ·
            {{ rhythmScorePct }}%</span
          >
        </div>
        <div class="tj-score-cell">
          <span class="tj-score-label">完整</span>
          <span
            >{{ scoreSnap.real.completenessScore }} / {{ scoreSnap.total.completenessScore }} ·
            {{ completenessScorePct }}%</span
          >
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.tj-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100vh;
  padding: 12px 16px 20px;
  box-sizing: border-box;
  background: #f5f7fa;
  color: #303133;
}

.tj-header {
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 8px;
}

.tj-title {
  margin: 0;
  font-size: 16px;
}

.tj-sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: #909399;
}

.tj-sub code {
  font-size: 11px;
}

.tj-h2 {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
}

.tj-score-wrap {
  overflow: auto;
  max-height: 280px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fff;
  padding: 8px;
}

.tj-waterfall {
  flex: 1;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tj-waterfall-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.tj-waterfall-head .tj-h2 {
  margin: 0;
}

.tj-layer {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #606266;
}

.tj-layer-label {
  color: #909399;
}

.tj-scroll {
  flex: 1;
  min-height: 180px;
  overflow: auto;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #1e1e24;
}

.tj-roll {
  position: relative;
  margin: 8px;
}

.tj-row {
  position: absolute;
  left: 0;
  right: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  box-sizing: border-box;
}

.tj-row-label {
  position: absolute;
  left: 2px;
  top: 0;
  font-size: 9px;
  color: #71717a;
  line-height: 8px;
}

.tj-note {
  position: absolute;
  border-radius: 2px;
  background: rgba(64, 158, 255, 0.55);
  box-sizing: border-box;
}

.tj-note--played {
  background: rgba(103, 194, 58, 0.75);
}

.tj-playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 0;
  z-index: 3;
  pointer-events: none;
}

.tj-playhead-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  margin-left: -1px;
  background: #f56c6c;
}

.tj-pitch-dot {
  position: absolute;
  left: 0;
  width: 10px;
  height: 10px;
  margin: -5px 0 0 -5px;
  border-radius: 50%;
  background: #e6a23c;
  box-shadow: 0 0 0 2px rgba(230, 162, 60, 0.35);
}

.tj-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fff;
}

.tj-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.tj-btn {
  font-size: 12px;
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #f5f7fa;
  cursor: pointer;
}

.tj-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tj-btn--primary {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
}

.tj-meta {
  font-size: 12px;
  color: #909399;
}

.tj-scores {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  color: #606266;
}

.tj-score-cell {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.tj-score-label {
  font-weight: 600;
  color: #303133;
}
</style>
