<script lang="ts" setup>
import musicScoreVue from '@deciphony/renderer'
import type {MusicScore, VDom} from '@deciphony/renderer'
import {activeContext, NPlayer, PlaySequence, startJPlayer} from '@deciphony/player'
import {getDrPlaySequence} from '@deciphony/extensions/dr-play'
import {drPlayHighlight} from '@deciphony/extensions/dr-play-highlight'
import {
  midiFileToMusicScore,
  midiToMusicScore,
  musicScoreToMidi,
  musicScoreToMidiFile,
  parseMidi,
  type MidiToMusicScoreOptions,
} from '@deciphony/extensions/dr-midi-transfer'
import {computed, onBeforeUnmount, onMounted, ref, shallowRef} from 'vue'
import piano from '../assets/toneColor/accoustic_grand_piano.json'
import staffSample from './data/其多列'
import numberSample from './data/其多列简谱'
import huaZhiWu from './data/花之舞.json'

const samples: {label: string; score: MusicScore}[] = [
  {label: '其多列（五线谱）', score: staffSample},
  {label: '其多列（简谱）', score: numberSample},
  {label: '花之舞', score: huaZhiWu as unknown as MusicScore},
]

const sampleIndex = ref(0)
const musicScore = shallowRef<MusicScore>(structuredClone(samples[0]!.score))
const sourceLabel = ref(samples[0]!.label)
const warnings = ref<string[]>([])
const error = ref('')
const midiInfo = ref('')

const quantize = ref<8 | 16 | 32>(16)
const splitStaff = ref<'auto' | 'none'>('auto')
const measuresPerLine = ref(4)
const includeDrums = ref(false)

const importOptions = computed<MidiToMusicScoreOptions>(() => ({
  quantize: quantize.value,
  splitStaff: splitStaff.value,
  measuresPerLine: measuresPerLine.value,
  includeDrums: includeDrums.value,
}))

const musicScoreRef = ref<{findElementByVDom: (node: VDom) => SVGElement | null} | null>(null)
const playHighlight = drPlayHighlight({
  findElementByVDom: (node) => musicScoreRef.value?.findElementByVDom(node) ?? null,
  getBpm: () => musicScore.value.bpm || 120,
  getBeatUnit: () => musicScore.value.beatUnit || 4,
  getRate: () => 1,
})
const extensions = [playHighlight]
let nplayer: NPlayer | null = null

function describeMidi(bytes: Uint8Array): string {
  const data = parseMidi(bytes)
  const noteCount = data.tracks.reduce((sum, t) => sum + t.notes.length, 0)
  const tempo = data.tempos[0] ? Math.round(60_000_000 / data.tempos[0].microsecondsPerQuarter) : 120
  const ts = data.timeSignatures[0]
  return `format ${data.format} · ${data.tracks.length} 轨 · ${noteCount} 个音 · ${tempo} qpm`
    + (ts ? ` · ${ts.numerator}/${ts.denominator}` : '')
    + ` · ${(bytes.length / 1024).toFixed(1)} KB`
}

function toPlaySequence(score: MusicScore): PlaySequence {
  let curPlayTime = -Infinity
  const playSeq: PlaySequence = getDrPlaySequence(score).map((it) => {
    const start = curPlayTime !== it.playTime
    curPlayTime = it.playTime
    return {
      id: it.note_id,
      midi: it.real_duration === 0 ? 0 : it.midi,
      duration: it.real_duration ? it.real_duration : it.duration,
      playTime: it.playTime,
      toneColor: it.toneColor ?? 'piano',
      data: {note_id: it.note_id, duration: it.duration, realDuration: it.real_duration, playTime: it.playTime, start},
      end: false,
    }
  })
  if (playSeq.length) playSeq[playSeq.length - 1]!.end = true
  return playSeq
}

function setScore(score: MusicScore, label: string, nextWarnings: string[] = []): void {
  handleStop()
  musicScore.value = score
  sourceLabel.value = label
  warnings.value = nextWarnings
  error.value = ''
  nplayer?.setPlaySequence(toPlaySequence(score))
}

function loadSample(): void {
  const sample = samples[sampleIndex.value]!
  midiInfo.value = ''
  setScore(structuredClone(sample.score), sample.label)
}

function exportMidi(): void {
  try {
    const file = musicScoreToMidiFile(musicScore.value)
    midiInfo.value = describeMidi(musicScoreToMidi(musicScore.value))
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    link.click()
    URL.revokeObjectURL(url)
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason)
  }
}

async function onMidiFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    midiInfo.value = describeMidi(new Uint8Array(await file.arrayBuffer()))
    const result = await midiFileToMusicScore(file, importOptions.value)
    setScore(result.musicScore, `导入：${file.name}`, result.warnings)
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason)
  }
}

/** 当前曲谱 → MIDI → 曲谱，直接看转换效果 */
function roundTrip(): void {
  try {
    const bytes = musicScoreToMidi(musicScore.value)
    midiInfo.value = describeMidi(bytes)
    const result = midiToMusicScore(bytes, {...importOptions.value, title: musicScore.value.title ?? ''})
    setScore(result.musicScore, `往返：${sourceLabel.value}`, result.warnings)
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason)
  }
}

onMounted(async () => {
  startJPlayer()
  nplayer = new NPlayer({checkTime: 50, checkDuration: 500})
  await nplayer.addToneColor('piano', piano)
  nplayer.setPlaySequence(toPlaySequence(musicScore.value))
  nplayer.onProgressStart = (_progress, data) => playHighlight.handleProgressStart(data)
  nplayer.onEnd = () => playHighlight.handlePlaybackEnd()
})

onBeforeUnmount(() => {
  playHighlight.handlePlaybackStop()
  nplayer?.dispose()
  nplayer = null
})

async function handlePlay(): Promise<void> {
  if (!nplayer) return
  await activeContext()
  nplayer.bpm = musicScore.value.bpm || 120
  nplayer.beatUnit = musicScore.value.beatUnit || 4
  await nplayer.play()
}

function handlePause(): void {
  nplayer?.pause()
  playHighlight.handlePlaybackPause()
}

function handleStop(): void {
  nplayer?.stop()
  playHighlight.handlePlaybackStop()
}
</script>

<template>
  <main class="midi-test">
    <aside class="panel">
      <h1>MIDI ↔ MusicScore</h1>

      <section>
        <h3>示例曲谱</h3>
        <select v-model.number="sampleIndex">
          <option v-for="(s, i) in samples" :key="s.label" :value="i">{{ s.label }}</option>
        </select>
        <button type="button" @click="loadSample">载入</button>
      </section>

      <section>
        <h3>导出</h3>
        <button class="primary" type="button" @click="exportMidi">当前曲谱 → 下载 .mid</button>
        <button type="button" @click="roundTrip">曲谱 → MIDI → 曲谱（往返）</button>
      </section>

      <section>
        <h3>导入</h3>
        <label class="file">
          <span>选择 .mid / .midi</span>
          <input accept=".mid,.midi,audio/midi" type="file" @change="onMidiFileChange">
        </label>
        <label class="control">
          量化
          <select v-model.number="quantize">
            <option :value="8">八分音符</option>
            <option :value="16">十六分音符</option>
            <option :value="32">三十二分音符</option>
          </select>
        </label>
        <label class="control">
          高/低音拆分
          <select v-model="splitStaff">
            <option value="auto">自动</option>
            <option value="none">不拆</option>
          </select>
        </label>
        <label class="control">
          每行小节数
          <input v-model.number="measuresPerLine" min="1" max="12" type="number">
        </label>
        <label class="control">
          <span>包含打击乐（通道 10）</span>
          <input v-model="includeDrums" type="checkbox">
        </label>
      </section>

      <section>
        <h3>播放</h3>
        <div class="row">
          <button type="button" @click="handlePlay">播放</button>
          <button type="button" @click="handlePause">暂停</button>
          <button type="button" @click="handleStop">停止</button>
        </div>
      </section>

      <div class="summary">当前：{{ sourceLabel }}</div>
      <div v-if="midiInfo" class="summary">MIDI：{{ midiInfo }}</div>
      <p v-if="error" class="error">{{ error }}</p>
      <ul v-if="warnings.length" class="warnings">
        <li v-for="w in warnings" :key="w">{{ w }}</li>
      </ul>
    </aside>

    <section class="score">
      <musicScoreVue
        ref="musicScoreRef"
        :key="musicScore.id"
        :data="musicScore"
        :extensions="extensions"
        skin-name="default"
      />
    </section>
  </main>
</template>

<style scoped>
.midi-test {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  min-height: 100vh;
  color: #252525;
  background: #f4f6f8;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: white;
  border-right: 1px solid #dfe4ea;
}

.panel section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

h1 {
  margin: 0;
  font-size: 20px;
}

h3 {
  margin: 0;
  font-size: 14px;
  color: #4a5360;
}

.row {
  display: flex;
  gap: 8px;
}

.row button {
  flex: 1;
}

.file {
  padding: 10px;
  border: 1px dashed #8b98a8;
  border-radius: 6px;
  font-size: 13px;
}

.file input {
  display: block;
  width: 100%;
  margin-top: 6px;
}

.control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
}

.control input[type='number'] {
  width: 64px;
}

button, select, input[type='number'] {
  min-height: 32px;
}

button {
  cursor: pointer;
  background: white;
  border: 1px solid #d0d0d0;
  border-radius: 5px;
}

button:hover {
  background: #f2f2f2;
}

.primary {
  color: white;
  background: #306fe8;
  border-color: #306fe8;
}

.primary:hover {
  background: #2a61cc;
}

.summary {
  color: #67717e;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-all;
}

.error {
  margin: 0;
  color: #c83232;
}

.warnings {
  margin: 0;
  padding-left: 20px;
  color: #9b6500;
  font-size: 13px;
}

.score {
  padding: 24px;
  overflow: auto;
}

.score :deep(svg) {
  background: white;
  box-shadow: 0 2px 10px rgb(0 0 0 / 10%);
}

:deep(.dr-play-highlight) {
  filter: drop-shadow(0 0 4px rgba(255, 64, 64, 0.95)) brightness(1.18) saturate(1.35);
}
</style>
