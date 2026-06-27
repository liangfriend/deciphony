<template>
  <div class="page">
    <div class="preview">
      <h2 class="section-title">和弦图预览</h2>
      <div class="preview-box">
        <Chord :chord="chordData" />
      </div>
    </div>
    <div class="editor">
      <h2 class="section-title">编辑</h2>
      <div class="toolbar">
        <label class="field">
          <span>name</span>
          <input v-model="chordData.name" type="text" />
        </label>
        <label class="field">
          <span>width</span>
          <input v-model.number="chordData.width" type="number" min="40" />
        </label>
        <label class="field">
          <span>height</span>
          <input v-model.number="chordData.height" type="number" min="48" />
        </label>
        <label class="field">
          <span>stringCount</span>
          <input v-model.number="chordData.stringCount" type="number" min="1" max="8" />
        </label>
        <label class="field">
          <span>fretCount</span>
          <input v-model.number="chordData.fretCount" type="number" min="1" max="8" />
        </label>
        <label class="field">
          <span>baseFret</span>
          <input v-model.number="chordData.baseFret" type="number" min="0" />
        </label>
        <label class="field field-wide">
          <span>tuning（逗号分隔）</span>
          <input v-model="tuningText" type="text" />
        </label>
      </div>
      <p class="hint">
        stringStates：索引 0=1弦(右)。finger 为 <code>'o'</code> 空弦、<code>'x'</code> 闷音、
        <code>-1</code> 不显示；数字为相对品（0=第 baseFret+1 品），text 为按位圆点文字。
        barres：<code>{ fret, text[], startStringNumber, endStringNumber }</code>；弦索引与 stringStates 一致（0=1弦/细/右）。
        start=细弦，end=粗弦；渲染时 clamp 到 <code>0..stringCount-1</code>；<code>start &gt; end</code> 则整条无效。
        视觉弦序：左 6 弦 → 右 1 弦。
      </p>
      <textarea
        v-model="jsonText"
        class="json-editor"
        spellcheck="false"
        @input="onJsonInput"
      />
      <p v-if="parseError" class="error">{{ parseError }}</p>
      <div class="actions">
        <button type="button" @click="copyJson">复制 JSON</button>
        <button type="button" @click="resetSample">重置示例</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {ref, watch} from 'vue'
import {Chord, NoteName} from 'deciphony-renderer'
import type {tabChord} from 'deciphony-renderer'

function createSampleChord(): tabChord {
  return {
    id: 'sample-c',
    width: 60,
    height: 78,
    stringCount: 6,
    name: 'C',
    fretCount: 4,
    baseFret: 0,
    barres: [],
    tuning: [NoteName.E, NoteName.A, NoteName.D, NoteName.G, NoteName.B, NoteName.E],
    stringStates: [
      {finger: 'o', text: ''},
      {finger: 0, text: '1'},
      {finger: 'o', text: ''},
      {finger: 1, text: '2'},
      {finger: 2, text: '3'},
      {finger: 'x', text: ''},
    ],
    relativeX: 0,
    relativeY: 0,
    relativeW: 1,
    relativeH: 1,
  }
}

const chordData = ref<tabChord>(createSampleChord())
const jsonText = ref(JSON.stringify(chordData.value, null, 2))
const parseError = ref('')
const tuningText = ref(chordData.value.tuning.join(','))
const syncingFromJson = ref(false)

watch(
  chordData,
  (val) => {
    if (syncingFromJson.value) return
    jsonText.value = JSON.stringify(val, null, 2)
    tuningText.value = val.tuning.join(',')
  },
  {deep: true},
)

watch(tuningText, (raw) => {
  chordData.value.tuning = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as tabChord['tuning']
})

function onJsonInput(e: Event) {
  const raw = (e.target as HTMLTextAreaElement).value
  jsonText.value = raw
  parseError.value = ''
  try {
    syncingFromJson.value = true
    const parsed = JSON.parse(raw) as tabChord
    chordData.value = parsed
    tuningText.value = (parsed.tuning ?? []).join(',')
  } catch (err) {
    parseError.value = err instanceof Error ? err.message : 'JSON 解析错误'
  } finally {
    syncingFromJson.value = false
  }
}

function copyJson() {
  void navigator.clipboard.writeText(jsonText.value)
}

function resetSample() {
  chordData.value = createSampleChord()
  parseError.value = ''
}
</script>

<style scoped>
.page {
  display: flex;
  gap: 20px;
  height: 100vh;
  padding: 16px;
  box-sizing: border-box;
}

.preview,
.editor {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.section-title {
  margin: 0 0 12px;
  font-size: 16px;
}

.preview-box {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fafafa;
}

.toolbar {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.field-wide {
  grid-column: 1 / -1;
}

.field input {
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.hint {
  margin: 0 0 8px;
  font-size: 12px;
  color: #666;
}

.hint code {
  font-size: 11px;
}

.json-editor {
  flex: 1;
  min-height: 280px;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  resize: vertical;
}

.error {
  color: #c00;
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.actions button {
  padding: 6px 12px;
  cursor: pointer;
}
</style>
