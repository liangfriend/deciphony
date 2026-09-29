<script lang="ts" setup>
import musicScoreVue from '@deciphony/renderer'
import {
  musicScoreToQuickNumberNotation,
  quickNumberNotationToMusicScore,
  type QuickTextToMusicScoreOptions,
} from '@deciphony/extensions/dr-quick-numberNotation'
import {computed, onBeforeUnmount, ref, watch} from 'vue'
import numberSample from './data/其多列简谱'

const SAMPLE_TEXT = [
  '5. 4. <7. >6. .5(.6) | .7 .5 .5/ 5- |4',
  '',
  '[1/2/]3 3/ 2/ <1, >2/ | 3(5) 0 .1- |2',
  '1 1 5. 5. | 6.(1) 6. 5.- |2',
].join('\n')
const INPUT_DEBOUNCE_MS = 200

/** 输入框内容 */
const text = ref(SAMPLE_TEXT)
/** 防抖后真正参与转换的文本 */
const committedText = ref(SAMPLE_TEXT)
const meta = ref<QuickTextToMusicScoreOptions>({title: '快速打谱'})

let debounceTimer: ReturnType<typeof setTimeout> | undefined

function commitText(value: string): void {
  clearTimeout(debounceTimer)
  text.value = value
  committedText.value = value
}

function onInput(): void {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    committedText.value = text.value
  }, INPUT_DEBOUNCE_MS)
}

onBeforeUnmount(() => clearTimeout(debounceTimer))

const parsed = computed(() => quickNumberNotationToMusicScore(committedText.value, meta.value))

const reverse = computed(() => {
  try {
    return musicScoreToQuickNumberNotation(parsed.value.musicScore)
  } catch (reason) {
    return {text: '', warnings: [reason instanceof Error ? reason.message : String(reason)]}
  }
})

/** 往返校验：手动触发，文本变了就作废 */
const roundTripStable = ref<boolean | null>(null)
watch(parsed, () => {
  roundTripStable.value = null
})

function checkRoundTrip(): void {
  const again = musicScoreToQuickNumberNotation(
    quickNumberNotationToMusicScore(reverse.value.text, meta.value).musicScore,
  )
  roundTripStable.value = again.text === reverse.value.text
}

function loadSampleText(): void {
  meta.value = {title: '快速打谱'}
  commitText(SAMPLE_TEXT)
}

function loadSampleScore(): void {
  const {title, keySignature, timeSignature, bpm} = numberSample
  meta.value = {
    ...(title ? {title} : {}),
    ...(keySignature ? {keySignature} : {}),
    ...(timeSignature ? {timeSignature} : {}),
    ...(bpm ? {bpm} : {}),
  }
  commitText(musicScoreToQuickNumberNotation(numberSample).text)
}
</script>

<template>
  <main class="quick-test">
    <aside class="panel">
      <h1>简谱快速打谱</h1>
      <textarea v-model="text" class="editor" spellcheck="false" @input="onInput"/>
      <div class="row">
        <button type="button" @click="loadSampleText">示例文本</button>
        <button type="button" @click="loadSampleScore">其多列简谱 → 文本</button>
      </div>

      <h3>曲谱 → 文本</h3>
      <pre class="output" data-testid="reverse-text">{{ reverse.text }}</pre>
      <div class="row">
        <button type="button" @click="checkRoundTrip">往返校验</button>
      </div>
      <div class="summary" data-testid="round-trip">
        往返稳定：{{ roundTripStable === null ? '未校验' : roundTripStable ? '是' : '否' }}
        · 连音线 {{ parsed.musicScore.affiliatedSymbols.length }} 条
      </div>

      <h3>警告</h3>
      <ul class="warnings" data-testid="warnings">
        <li v-for="w in [...parsed.warnings, ...reverse.warnings]" :key="w">{{ w }}</li>
      </ul>
    </aside>

    <section class="score">
      <musicScoreVue :data="parsed.musicScore" skin-name="default"/>
    </section>
  </main>
</template>

<style scoped>
.quick-test {
  display: grid;
  grid-template-columns: 420px minmax(0, 1fr);
  min-height: 100vh;
  color: #252525;
  background: #f4f6f8;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  background: white;
  border-right: 1px solid #dfe4ea;
}

h1 {
  margin: 0;
  font-size: 20px;
}

h3 {
  margin: 6px 0 0;
  font-size: 14px;
  color: #4a5360;
}

.editor {
  min-height: 180px;
  padding: 8px;
  font: 14px/1.6 Consolas, monospace;
  resize: vertical;
}

.row {
  display: flex;
  gap: 8px;
}

.row button {
  flex: 1;
  min-height: 32px;
  cursor: pointer;
}

.output {
  margin: 0;
  padding: 8px;
  font: 13px/1.6 Consolas, monospace;
  white-space: pre-wrap;
  word-break: break-all;
  background: #f6f8fa;
  border-radius: 4px;
}

.summary {
  color: #67717e;
  font-size: 13px;
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
</style>
