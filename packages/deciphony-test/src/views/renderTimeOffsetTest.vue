<script lang="ts" setup>
import {computed, onBeforeUnmount, reactive, ref} from 'vue'
import musicScoreVue from '@deciphony/renderer'
import {APlayer, startJPlayer} from '@deciphony/player'
import {
  TimeOffsetEditor,
  buildFlattenStaffRows,
  collectHighlightIdsAtTime,
  createNotePassMap,
  resetNotePassMap,
  DEFAULT_TIME_PROP,
} from '@deciphony/extensions/dr-time-offset'
import {drPlayHighlight} from '@deciphony/extensions/dr-play-highlight'
import sampleScore from './data/其多列'

const musicScore = reactive(structuredClone(sampleScore))
const audioUrl = ref('')
const timePropName = ref(DEFAULT_TIME_PROP)
const pxPerSecond = ref(80)
const sampleRate = ref(44100)

const musicScoreRef = ref<{
  findElementByVDom: (node: import('@deciphony/renderer').VDom) => SVGElement | null
} | null>(null)

const playHighlight = drPlayHighlight({
  findElementByVDom: (node) => musicScoreRef.value?.findElementByVDom(node) ?? null,
  getBpm: () => musicScore.bpm ?? 120,
})
const extensions = [playHighlight]

const status = ref('')
let bottomPlayer: APlayer | null = null
const bottomPlaying = ref(false)
let lastHighlightIds: string[] = []
/** 原谱播放：各 note/rest 当前第几遍 */
const notePassMap = createNotePassMap()

const syncRevision = ref(0)
const flattenRows = computed(() => {
  void syncRevision.value
  return buildFlattenStaffRows(musicScore, timePropName.value)
})

function onEditorChange() {
  syncRevision.value++
}

async function onPickAudio(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    audioUrl.value = String(reader.result || '')
    status.value = `已载入音频 ${file.name}`
  }
  reader.readAsDataURL(file)
}

function applyHighlightIds(ids: string[]) {
  const prev = new Set(lastHighlightIds)
  const next = new Set(ids)
  for (const id of prev) {
    if (!next.has(id)) playHighlight.removeNoteHighlight(id)
  }
  for (const id of next) {
    if (!prev.has(id)) playHighlight.addNoteHighlight(id)
  }
  lastHighlightIds = ids
}

function syncBottomHighlight(current: number) {
  applyHighlightIds(collectHighlightIdsAtTime(flattenRows.value, current, notePassMap))
}

function ensureBottomPlayer() {
  if (!bottomPlayer) {
    startJPlayer()
    bottomPlayer = new APlayer()
    bottomPlayer.onEnd = () => {
      bottomPlaying.value = false
      applyHighlightIds([])
      resetNotePassMap(notePassMap)
    }
  }
  return bottomPlayer
}

async function bottomPlay() {
  if (!audioUrl.value) {
    status.value = '请先上传音频'
    return
  }
  if (!timePropName.value.trim()) {
    status.value = '请填写时间属性名'
    return
  }
  const pl = ensureBottomPlayer()
  pl.onProgress = (current) => syncBottomHighlight(current)
  await pl.setAudio(audioUrl.value)
  bottomPlaying.value = true
  await pl.play()
  status.value = '下方伴奏播放中'
}

function bottomStop() {
  bottomPlayer?.pause()
  bottomPlaying.value = false
  applyHighlightIds([])
  resetNotePassMap(notePassMap)
  status.value = '下方已停止'
}

onBeforeUnmount(() => {
  bottomPlayer?.dispose()
  bottomPlayer = null
  playHighlight.handlePlaybackStop()
})
</script>

<template>
  <div class="to-test">
    <header class="to-test__bar">
      <h1 class="to-test__title">谱音同步 dr-time-offset</h1>
      <p class="to-test__hint">
        上：TimeOffsetEditor（内置 APlayer）。下：原谱 + dr-play-highlight + 独立 APlayer。
      </p>
      <div class="to-test__row">
        <label>
          时间属性
          <input v-model="timePropName" class="to-test__input" type="text"/>
        </label>
        <label>
          px/s
          <input v-model.number="pxPerSecond" class="to-test__input to-test__input--sm" min="20" type="number"/>
        </label>
        <label>
          采样率
          <input v-model.number="sampleRate" class="to-test__input to-test__input--sm" type="number"/>
        </label>
        <label class="to-test__file">
          选择音频
          <input accept="audio/*" type="file" @change="onPickAudio"/>
        </label>
        <button type="button" @click="bottomPlay">下方播放</button>
        <button type="button" @click="bottomStop">下方停止</button>
      </div>
      <p v-if="status" class="to-test__status">{{ status }}</p>
    </header>

    <section class="to-test__panel">
      <h2 class="to-test__h2">谱音同步编辑</h2>
      <TimeOffsetEditor
        :audio-url="audioUrl"
        :music-score="musicScore"
        :px-per-second="pxPerSecond"
        :sample-rate="sampleRate"
        :time-prop-name="timePropName"
        @change="onEditorChange"
      />
    </section>

    <section class="to-test__panel">
      <h2 class="to-test__h2">原谱预览 + 伴奏高亮</h2>
      <musicScoreVue
        ref="musicScoreRef"
        :data="musicScore"
        :extensions="extensions"
      />
    </section>
  </div>
</template>

<style scoped>
.to-test {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px 16px 32px;
  box-sizing: border-box;
  min-height: 100vh;
}

.to-test__bar {
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 10px;
}

.to-test__title {
  margin: 0;
  font-size: 16px;
}

.to-test__hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: #909399;
}

.to-test__row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 10px;
}

.to-test__row label {
  font-size: 12px;
  color: #606266;
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.to-test__input {
  width: 120px;
  padding: 4px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.to-test__input--sm {
  width: 72px;
}

.to-test__file {
  font-size: 12px;
  padding: 4px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #f5f7fa;
  cursor: pointer;
}

.to-test__file input {
  display: none;
}

.to-test__row button {
  font-size: 12px;
  padding: 4px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #f5f7fa;
  cursor: pointer;
}

.to-test__status {
  margin: 8px 0 0;
  font-size: 12px;
  color: #606266;
}

.to-test__panel {
  min-width: 0;
}

.to-test__h2 {
  margin: 0 0 8px;
  font-size: 14px;
}

.to-test__panel :deep(.dr-play-highlight) {
  filter: drop-shadow(0 0 4px rgba(255, 64, 64, 0.95)) brightness(1.18) saturate(1.35);
}
</style>
