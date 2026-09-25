<script lang="ts" setup>
import musicScoreVue from '@deciphony/renderer'
import type {MusicScore} from '@deciphony/renderer'
import {
  audioToScore,
  type AudioToScoreProgress,
  type AudioToScoreResult,
} from '@deciphony/extensions/audio-to-score'
import {computed, onBeforeUnmount, ref, shallowRef} from 'vue'

const source = shallowRef<Blob | null>(null)
const sourceName = ref('')
const audioUrl = ref('')
const result = shallowRef<AudioToScoreResult | null>(null)
const busy = ref(false)
const error = ref('')
const autoBpm = ref(true)
const fixedBpm = ref(120)
const quantize = ref<8 | 16 | 32>(16)
const progress = ref<AudioToScoreProgress>({stage: 'decode', progress: 0})

const musicScore = computed<MusicScore | null>(() => result.value?.musicScore ?? null)
const progressLabel = computed(() => {
  const stages = {decode: '解码', analyse: '分析音高', build: '生成曲谱'}
  return `${stages[progress.value.stage]} ${Math.round(progress.value.progress * 100)}%`
})

function setSource(blob: Blob, name: string): void {
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  source.value = blob
  sourceName.value = name
  audioUrl.value = URL.createObjectURL(blob)
  result.value = null
  error.value = ''
}

function onFileChange(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) setSource(file, file.name)
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
}

function demoWav(): Blob {
  const sampleRate = 44_100
  const melody = [
    {midi: 60, beats: 1},
    {midi: 62, beats: 1},
    {midi: 64, beats: 1},
    {midi: 67, beats: 1},
    {midi: 69, beats: 2},
    {midi: 67, beats: 1},
    {midi: 64, beats: 1},
  ]
  const beatSeconds = 0.5
  const gapSeconds = 0.035
  const samples: number[] = []
  for (const note of melody) {
    // 空隙包含在拍长内，确保测试旋律起点严格落在 120 BPM 网格上。
    const seconds = note.beats * beatSeconds - gapSeconds
    const length = Math.round(seconds * sampleRate)
    const frequency = 440 * 2 ** ((note.midi - 69) / 12)
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate
      const edge = Math.min(1, i / (sampleRate * 0.012), (length - i) / (sampleRate * 0.025))
      const fundamental = Math.sin(2 * Math.PI * frequency * t)
      const harmonic = 0.18 * Math.sin(2 * Math.PI * frequency * 2 * t)
      samples.push((fundamental + harmonic) * 0.55 * Math.max(0, edge))
    }
    for (let i = 0; i < gapSeconds * sampleRate; i++) samples.push(0)
  }

  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  writeAscii(view, 0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeAscii(view, 8, 'WAVE')
  writeAscii(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeAscii(view, 36, 'data')
  view.setUint32(40, samples.length * 2, true)
  samples.forEach((sample, index) => {
    view.setInt16(44 + index * 2, Math.max(-1, Math.min(1, sample)) * 0x7fff, true)
  })
  return new Blob([buffer], {type: 'audio/wav'})
}

async function useDemo(): Promise<void> {
  setSource(demoWav(), 'C大调单声部测试.wav')
  await transcribe()
}

async function transcribe(): Promise<void> {
  if (!source.value || busy.value) return
  busy.value = true
  error.value = ''
  result.value = null
  try {
    result.value = await audioToScore(source.value, {
      bpm: autoBpm.value ? 'auto' : fixedBpm.value,
      quantize: quantize.value,
      title: sourceName.value.replace(/\.[^.]+$/, '') || '音频转谱',
      onProgress: (state) => {
        progress.value = state
      },
    })
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason)
  } finally {
    busy.value = false
  }
}

function downloadSjJson(): void {
  if (!result.value) return
  const blob = new Blob(
    [JSON.stringify(result.value.musicScore, null, 2)],
    {type: 'application/json'},
  )
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${sourceName.value.replace(/\.[^.]+$/, '') || 'audio-score'}.json`
  link.click()
  URL.revokeObjectURL(url)
}

onBeforeUnmount(() => {
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
})
</script>

<template>
  <main class="audio-score-test">
    <aside class="panel">
      <h1>单声部音频 → SJ 五线谱</h1>
      <p class="description">
        浏览器端实验版。适合清晰哼唱或单音乐器，不支持和弦及完整混音。
      </p>

      <label class="file">
        <span>选择 WAV / MP3</span>
        <input accept="audio/*" type="file" @change="onFileChange">
      </label>
      <button type="button" :disabled="busy" @click="useDemo">
        生成并分析测试旋律
      </button>

      <audio v-if="audioUrl" :src="audioUrl" controls />
      <div v-if="sourceName" class="source-name">{{ sourceName }}</div>

      <label class="control">
        <input v-model="autoBpm" type="checkbox">
        自动估算 BPM
      </label>
      <label v-if="!autoBpm" class="control">
        BPM
        <input v-model.number="fixedBpm" min="20" max="400" type="number">
      </label>
      <label class="control">
        量化
        <select v-model.number="quantize">
          <option :value="8">八分音符</option>
          <option :value="16">十六分音符</option>
          <option :value="32">三十二分音符</option>
        </select>
      </label>

      <button
        class="primary"
        type="button"
        :disabled="!source || busy"
        @click="transcribe"
      >
        {{ busy ? progressLabel : '开始转谱' }}
      </button>
      <progress v-if="busy" :value="progress.progress" max="1" />
      <p v-if="error" class="error">{{ error }}</p>

      <template v-if="result">
        <div class="summary">
          BPM {{ result.bpm }} · 检出 {{ result.notes.length }} 个音 ·
          {{ result.duration.toFixed(2) }} 秒
        </div>
        <ul v-if="result.warnings.length" class="warnings">
          <li v-for="warning in result.warnings" :key="warning">{{ warning }}</li>
        </ul>
        <button type="button" @click="downloadSjJson">下载 SJ JSON</button>

        <details>
          <summary>识别音符</summary>
          <pre>{{ JSON.stringify(result.notes, null, 2) }}</pre>
        </details>
      </template>
    </aside>

    <section class="score">
      <musicScoreVue
        v-if="musicScore"
        :data="musicScore"
        skin-name="default"
      />
      <div v-else class="empty">选择音频，或使用内置测试旋律</div>
    </section>
  </main>
</template>

<style scoped>
.audio-score-test {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  min-height: 100vh;
  color: #252525;
  background: #f4f6f8;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 22px;
  background: white;
  border-right: 1px solid #dfe4ea;
}

h1 {
  margin: 0;
  font-size: 20px;
}

.description, .source-name, .summary {
  margin: 0;
  color: #67717e;
  font-size: 13px;
  line-height: 1.5;
}

.file {
  padding: 12px;
  border: 1px dashed #8b98a8;
  border-radius: 6px;
}

.file input {
  display: block;
  width: 100%;
  margin-top: 8px;
}

audio, progress {
  width: 100%;
}

.control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

button, select, input[type='number'] {
  min-height: 34px;
}

button {
  cursor: pointer;
}

.primary {
  color: white;
  background: #306fe8;
  border: 0;
  border-radius: 5px;
}

.primary:disabled {
  cursor: default;
  opacity: 0.55;
}

.error {
  color: #c83232;
}

.warnings {
  margin: 0;
  padding-left: 20px;
  color: #9b6500;
  font-size: 13px;
}

details pre {
  max-height: 260px;
  overflow: auto;
  font-size: 11px;
}

.score {
  padding: 24px;
  overflow: auto;
}

.score :deep(svg) {
  background: white;
  box-shadow: 0 2px 10px rgb(0 0 0 / 10%);
}

.empty {
  display: grid;
  min-height: 320px;
  place-items: center;
  color: #8a939f;
  background: white;
  border: 1px dashed #ccd3dc;
}

@media (max-width: 800px) {
  .audio-score-test {
    grid-template-columns: 1fr;
  }
}
</style>
