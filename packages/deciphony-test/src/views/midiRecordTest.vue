<script lang="ts" setup>
import musicScoreVue, {TimeSignatureTypeEnum} from '@deciphony/renderer'
import type {MusicScore} from '@deciphony/renderer'
import {
  connectWebMidi,
  createMidiRecorder,
  type MidiRecordAppendEvent,
  type MidiRecorder,
  type WebMidiConnection,
} from '@deciphony/extensions/dr-midi-record'
import {computed, onBeforeUnmount, ref, shallowRef} from 'vue'

const TIME_OPTIONS = ['2_4', '3_4', '4_4', '6_8'] as const
/** 电脑键盘兜底：A 行白键 C4 起，W 行黑键；Z / X 降 / 升八度 */
const KEY_MAP: Record<string, number> = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15, ';': 16,
}

const bpm = ref(90)
const time = ref<(typeof TIME_OPTIONS)[number]>('4_4')
const measuresPerLine = ref(4)
const chordWindowMs = ref(60)
const quantize = ref<4 | 8 | 16 | 32>(16)
const beatSnap = ref(0.2)
const latencyMs = ref(0)
const startDelayBeats = ref(0)
const startOnFirstNote = ref(true)

const score = shallowRef<MusicScore | null>(null)
const version = ref(0)
const logs = ref<string[]>([])
const devices = ref<string[]>([])
const midiError = ref('')
const recording = ref(false)
const octave = ref(4)

let recorder: MidiRecorder | null = null
let midi: WebMidiConnection | null = null
const keyDown = new Map<string, number>()

const view = computed(() => {
  void version.value
  return score.value ? {...score.value} : null
})

function onAppend(e: MidiRecordAppendEvent) {
  const where = e.pieces.map((p) => `行${p.grandStaffIndex + 1}·小节${p.measureIndex + 1}·#${p.slotIndex}`).join(' → ')
  const what = e.kind === 'rest' ? '休止' : e.midis.join(' ')
  logs.value = [`${e.staffIndex === 0 ? '高音' : '低音'} ${what}  @${e.onset} 长${e.duration}  ${where}${e.tieIds.length ? '  (延音线)' : ''}`, ...logs.value].slice(0, 80)
  version.value++
}

async function start() {
  recorder?.dispose()
  logs.value = []
  recorder = createMidiRecorder({
    bpm: bpm.value,
    timeSignature: TimeSignatureTypeEnum[time.value],
    measuresPerLine: measuresPerLine.value,
    chordWindowMs: chordWindowMs.value,
    quantize: quantize.value,
    beatSnap: beatSnap.value,
    latencyMs: latencyMs.value,
    startDelayMs: (startDelayBeats.value * 60000) / bpm.value,
    startOnFirstNote: startOnFirstNote.value,
    title: 'MIDI 录制',
    onAppend,
  })
  score.value = recorder.start()
  version.value++
  recording.value = true
  if (!midi) {
    try {
      midi = await connectWebMidi(recorder, {onDevicesChange: (list) => (devices.value = list.map((d) => d.name))})
      midiError.value = ''
    } catch (reason) {
      midiError.value = reason instanceof Error ? reason.message : String(reason)
    }
  } else {
    midi.disconnect()
    midi = await connectWebMidi(recorder, {onDevicesChange: (list) => (devices.value = list.map((d) => d.name))})
  }
}

function stop() {
  if (!recorder) return
  score.value = recorder.stop()
  version.value++
  recording.value = false
}

function onKeyDown(event: KeyboardEvent) {
  if (!recorder || !recording.value || event.repeat || event.target instanceof HTMLInputElement) return
  const key = event.key.toLowerCase()
  if (key === 'z') octave.value = Math.max(1, octave.value - 1)
  if (key === 'x') octave.value = Math.min(7, octave.value + 1)
  const offset = KEY_MAP[key]
  if (offset == null) return
  const note = (octave.value + 1) * 12 + offset
  keyDown.set(key, note)
  recorder.noteOn(note, 90, event.timeStamp)
}

function onKeyUp(event: KeyboardEvent) {
  const note = keyDown.get(event.key.toLowerCase())
  if (note == null) return
  keyDown.delete(event.key.toLowerCase())
  recorder?.noteOff(note, event.timeStamp)
}

window.addEventListener('keydown', onKeyDown)
window.addEventListener('keyup', onKeyUp)
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  midi?.disconnect()
  recorder?.dispose()
})
</script>

<template>
  <main class="midi-record">
    <section class="toolbar">
      <label>BPM <input v-model.number="bpm" :disabled="recording" max="240" min="30" type="number"/></label>
      <label>拍号
        <select v-model="time" :disabled="recording">
          <option v-for="t in TIME_OPTIONS" :key="t" :value="t">{{ t.replace('_', '/') }}</option>
        </select>
      </label>
      <label>每行小节 <input v-model.number="measuresPerLine" :disabled="recording" max="8" min="1" type="number"/></label>
      <label>和弦窗口 ms <input v-model.number="chordWindowMs" :disabled="recording" max="200" min="0" type="number"/></label>
      <label>最小音符
        <select v-model.number="quantize" :disabled="recording">
          <option v-for="q in [4, 8, 16, 32]" :key="q" :value="q">{{ q }} 分</option>
        </select>
      </label>
      <label>拍点吸附 <input v-model.number="beatSnap" :disabled="recording" max="0.5" min="0" step="0.05" type="number"/></label>
      <label>延迟补偿 ms <input v-model.number="latencyMs" :disabled="recording" max="300" min="0" type="number"/></label>
      <label>预备拍 <input v-model.number="startDelayBeats" :disabled="recording" max="8" min="0" type="number"/></label>
      <label><input v-model="startOnFirstNote" :disabled="recording" type="checkbox"/> 从第一个音开始计时</label>
      <button v-if="!recording" @click="start">开始录制</button>
      <button v-else @click="stop">结束录制</button>
      <span class="hint">MIDI：{{ midiError || devices.join('、') || '无设备' }}；键盘 A–; 弹奏，Z/X 八度（当前 C{{ octave }}）</span>
    </section>
    <section class="body">
      <div class="score">
        <musicScoreVue v-if="view" :data="view" skin-name="default"/>
      </div>
      <ol class="log">
        <li v-for="(line, i) in logs" :key="i">{{ line }}</li>
      </ol>
    </section>
  </main>
</template>

<style scoped>
.midi-record {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  padding: 12px;
  box-sizing: border-box;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.toolbar input[type='number'] {
  width: 64px;
}

.hint {
  color: #666;
  font-size: 12px;
}

.body {
  display: flex;
  flex: 1;
  gap: 12px;
  min-height: 0;
}

.score {
  flex: 1;
  overflow: auto;
  border: 1px solid #ddd;
}

.log {
  width: 360px;
  margin: 0;
  overflow: auto;
  font-family: monospace;
  font-size: 12px;
}
</style>
