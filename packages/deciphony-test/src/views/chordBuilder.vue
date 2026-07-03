<template>
  <div class="page">
    <div class="preview-scale-bar">
      <label class="scale-control">
        <span>预览缩放</span>
        <input
          v-model.number="previewScale"
          type="range"
          min="1"
          max="10"
          step="0.5"
        />
        <strong>{{ previewScale }}×</strong>
      </label>
      <span class="scale-hint">
        JSON 为曲谱实际尺寸（框体 {{ chordData.width }}×{{ chordData.height }}）；
        预览 {{ previewDisplayW }}×{{ previewDisplayH }} px，不参与导出
      </span>
    </div>
    <div class="page-body">
    <div class="preview">
      <h2 class="section-title">和弦图预览</h2>
      <div class="preview-box">
        <svg
          :width="previewDisplayW"
          :height="previewDisplayH"
          :viewBox="`0 0 ${chordData.width} ${chordData.height}`"
          xmlns="http://www.w3.org/2000/svg"
          overflow="visible"
        >
          <Chord :chord="chordData" />
        </svg>
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
          <input v-model.number="chordData.width" type="number" min="20" />
        </label>
        <label class="field">
          <span>height</span>
          <input v-model.number="chordData.height" type="number" min="20" />
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
        <label class="field">
          <span>textSize</span>
          <input v-model.number="chordData.textSize" type="number" min="8" />
        </label>
        <label class="field">
          <span>nameSize</span>
          <input v-model.number="chordData.nameSize" type="number" min="8" />
        </label>
        <label class="field field-wide">
          <span>tuning（逗号分隔）</span>
          <input v-model="tuningText" type="text" />
        </label>
      </div>

      <StringStateForm v-model="chordData.stringStates" :string-count="chordData.stringCount" />

      <div class="barre-section">
        <div class="barre-header">
          <h3 class="subsection-title">横按 barres</h3>
          <div class="barre-actions">
            <button type="button" @click="addBarre">添加横按</button>
            <button type="button" @click="addFullBarreExample">全按示例 (F)</button>
          </div>
        </div>
        <p v-if="!chordData.barres.length" class="barre-empty">暂无横按，点击「添加横按」</p>
        <div
          v-for="(barre, idx) in chordData.barres"
          :key="idx"
          class="barre-item"
        >
          <div class="barre-item-head">
            <span class="barre-label">#{{ idx + 1 }}</span>
            <button type="button" class="btn-danger" @click="removeBarre(idx)">删除</button>
          </div>
          <div class="barre-fields">
            <label class="field">
              <span>fret（相对品）</span>
              <input v-model.number="barre.fret" type="number" min="0" />
            </label>
            <label class="field">
              <span>start（细弦索引）</span>
              <input v-model.number="barre.startStringNumber" type="number" min="0" />
            </label>
            <label class="field">
              <span>end（粗弦索引）</span>
              <input v-model.number="barre.endStringNumber" type="number" min="0" />
            </label>
            <label class="field field-wide">
              <span>text（逗号分隔，下标=弦索引）</span>
              <input
                :value="getBarreTextRaw(barre)"
                type="text"
                placeholder="例: 1,1,1,1,1,1"
                @input="setBarreTextRaw(barre, ($event.target as HTMLInputElement).value)"
              />
            </label>
          </div>
          <p v-if="!isBarreRangeValid(barre)" class="barre-warn">
            start &gt; end 或索引越界，渲染时该条横按无效
          </p>
        </div>
      </div>

      <p class="hint">
        stringStates：索引 0=1弦(右)。finger 为 <code>'o'</code> 空弦、<code>'x'</code> 闷音、
        <code>-1</code> 不显示；数字为相对品（0=第 baseFret+1 品），text 为按位圆点文字。
        barres：<code>{ fret, text[], startStringNumber, endStringNumber }</code>；弦索引与 stringStates 一致（0=1弦/细/右）。
        start=细弦，end=粗弦；渲染时 clamp 到 <code>0..stringCount-1</code>；<code>start &gt; end</code> 则整条无效。
        width / height 为框体尺寸，默认 {{ CHORD_DEFAULTS.width }}×{{ CHORD_DEFAULTS.height }}；
        textSize {{ CHORD_DEFAULTS.textSize }}；nameSize {{ CHORD_DEFAULTS.nameSize }}；fretCount {{ CHORD_DEFAULTS.fretCount }}。
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
  </div>
</template>

<script lang="ts" setup>
import {computed, ref, watch} from 'vue'
import {Chord, NoteName} from 'deciphony-renderer'
import type {Barre, tabChord} from 'deciphony-renderer'
import StringStateForm from './chordBuilder/StringStateForm.vue'
import {CHORD_DEFAULTS, CHORD_PREVIEW_SCALE_DEFAULT} from './chordBuilder/constants'

function createDefaultBarre(stringCount: number): Barre {
  const end = Math.max(0, stringCount - 1)
  return {
    fret: 0,
    startStringNumber: 0,
    endStringNumber: end,
    text: Array.from({length: stringCount}, () => '1'),
  }
}

function createSampleFChord(): tabChord {
  const stringCount = CHORD_DEFAULTS.stringCount
  return {
    id: 'sample-f',
    width: CHORD_DEFAULTS.width,
    height: CHORD_DEFAULTS.height,
    stringCount,
    name: 'F',
    fretCount: CHORD_DEFAULTS.fretCount,
    baseFret: 0,
    textSize: CHORD_DEFAULTS.textSize,
    nameSize: CHORD_DEFAULTS.nameSize,
    barres: [createDefaultBarre(stringCount)],
    tuning: [NoteName.E, NoteName.A, NoteName.D, NoteName.G, NoteName.B, NoteName.E],
    stringStates: [
      {finger: 0, text: '1'},
      {finger: 0, text: '1'},
      {finger: 1, text: '2'},
      {finger: 2, text: '3'},
      {finger: 3, text: '4'},
      {finger: 0, text: '1'},
    ],
    relativeX: 0,
    relativeY: 0,
    relativeW: 1,
    relativeH: 1,
  }
}

function createSampleChord(): tabChord {
  return {
    id: 'sample-c',
    width: CHORD_DEFAULTS.width,
    height: CHORD_DEFAULTS.height,
    stringCount: CHORD_DEFAULTS.stringCount,
    name: 'C',
    fretCount: CHORD_DEFAULTS.fretCount,
    baseFret: 0,
    textSize: CHORD_DEFAULTS.textSize,
    nameSize: CHORD_DEFAULTS.nameSize,
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
const previewScale = ref(CHORD_PREVIEW_SCALE_DEFAULT)
const previewDisplayW = computed(() => Math.round(chordData.value.width * previewScale.value))
const previewDisplayH = computed(() => Math.round(chordData.value.height * previewScale.value))
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

watch(
  () => chordData.value.stringCount,
  (n) => {
    const states = chordData.value.stringStates
    if (states.length < n) {
      chordData.value.stringStates = [
        ...states,
        ...Array.from({length: n - states.length}, () => ({finger: -1 as const, text: ''})),
      ]
    } else if (states.length > n) {
      chordData.value.stringStates = states.slice(0, n)
    }
    for (const barre of chordData.value.barres) {
      if (barre.endStringNumber >= n) barre.endStringNumber = Math.max(0, n - 1)
      if (barre.startStringNumber >= n) barre.startStringNumber = Math.max(0, n - 1)
      if (barre.text.length < n) {
        barre.text = [
          ...barre.text,
          ...Array.from({length: n - barre.text.length}, () => ''),
        ]
      } else if (barre.text.length > n) {
        barre.text = barre.text.slice(0, n)
      }
    }
  },
)

function onJsonInput(e: Event) {
  const raw = (e.target as HTMLTextAreaElement).value
  jsonText.value = raw
  parseError.value = ''
  try {
    syncingFromJson.value = true
    const parsed = JSON.parse(raw) as tabChord
    if (!parsed.barres) parsed.barres = []
    if (!parsed.stringStates) parsed.stringStates = []
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

function addBarre() {
  chordData.value.barres.push(createDefaultBarre(chordData.value.stringCount))
}

function addFullBarreExample() {
  chordData.value = createSampleFChord()
  parseError.value = ''
}

function removeBarre(index: number) {
  chordData.value.barres.splice(index, 1)
}

function getBarreTextRaw(barre: Barre): string {
  return (barre.text ?? []).join(',')
}

function setBarreTextRaw(barre: Barre, raw: string) {
  const n = chordData.value.stringCount
  const parts = raw.split(',').map((s) => s.trim())
  barre.text = Array.from({length: n}, (_, i) => parts[i] ?? '')
}

function isBarreRangeValid(barre: Barre): boolean {
  const n = chordData.value.stringCount
  if (barre.startStringNumber > barre.endStringNumber) return false
  if (barre.startStringNumber < 0 || barre.endStringNumber < 0) return false
  if (barre.startStringNumber >= n || barre.endStringNumber >= n) return false
  return true
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100vh;
  padding: 16px;
  box-sizing: border-box;
}

.page-body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 20px;
}

.preview-scale-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
}

.scale-control {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  white-space: nowrap;
}

.scale-control input[type='range'] {
  width: 160px;
}

.scale-hint {
  font-size: 12px;
  color: #666;
}

.preview,
.editor {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
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
  overflow: visible;
}

.preview-box svg {
  display: block;
  max-width: 100%;
  max-height: 100%;
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

.barre-section {
  margin-bottom: 12px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
}

.barre-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.subsection-title {
  margin: 0;
  font-size: 14px;
}

.barre-actions {
  display: flex;
  gap: 6px;
}

.barre-actions button {
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}

.barre-empty {
  margin: 0;
  font-size: 12px;
  color: #888;
}

.barre-item {
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background: #fafafa;
}

.barre-item:last-child {
  margin-bottom: 0;
}

.barre-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.barre-label {
  font-size: 12px;
  font-weight: 600;
}

.btn-danger {
  padding: 2px 8px;
  font-size: 11px;
  color: #c00;
  border: 1px solid #e0a0a0;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

.barre-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.barre-warn {
  margin: 6px 0 0;
  font-size: 11px;
  color: #c60;
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
