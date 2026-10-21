<script lang="ts" setup>
/**
 * 和弦图编辑器：props.chord 为当前 tabChord（原地 mutate）。
 */
import {computed, ref, watch} from 'vue'
import {Chord} from '@deciphony/renderer'
import type {Barre, tabChord} from '@deciphony/renderer'
import StringStateForm from './StringStateForm.vue'
import {CHORD_DEFAULTS, CHORD_PREVIEW_SCALE_DEFAULT} from '../constants'
import {createDefaultBarre, createSampleFChord} from '../chordFactory'
import type {ChordBuilderDisabledField} from '../types'

const props = withDefaults(
  defineProps<{
    /** 当前和弦对象（原地改字段） */
    chord: tabChord
    /** 预览放大倍数，仅展示 */
    previewScale?: number
    /**
     * 禁用字段列表；出现的字段对应输入/按钮不可改。
     * 如 `['name','width','height','stringCount','barres']`
     */
    disabled?: ChordBuilderDisabledField[]
  }>(),
  {
    previewScale: CHORD_PREVIEW_SCALE_DEFAULT,
    disabled: () => [],
  },
)

const disabledSet = computed(() => {
  const raw = props.disabled
  if (Array.isArray(raw)) return new Set(raw)
  return new Set<ChordBuilderDisabledField>()
})

function isDisabled(field: ChordBuilderDisabledField): boolean {
  return disabledSet.value.has(field)
}

const emit = defineEmits<{
  /** 弦数等结构调整后可选通知宿主 */
  change: []
}>()

const scale = ref(props.previewScale)
watch(
  () => props.previewScale,
  (v) => {
    scale.value = v
  },
)

const previewDisplayW = computed(() => Math.round(props.chord.width * scale.value))
const previewDisplayH = computed(() => Math.round(props.chord.height * scale.value))
const tuningText = ref((props.chord.tuning ?? []).join(','))

watch(
  () => props.chord.tuning,
  (tuning) => {
    tuningText.value = (tuning ?? []).join(',')
  },
  {deep: true},
)

watch(tuningText, (raw) => {
  if (isDisabled('tuning')) return
  props.chord.tuning = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as tabChord['tuning']
  emit('change')
})

watch(
  () => props.chord.stringCount,
  (n) => {
    const states = props.chord.stringStates
    if (!Array.isArray(states)) props.chord.stringStates = []
    if (props.chord.stringStates.length < n) {
      props.chord.stringStates = [
        ...props.chord.stringStates,
        ...Array.from({length: n - props.chord.stringStates.length}, () => ({
          finger: -1 as const,
          text: '',
        })),
      ]
    } else if (props.chord.stringStates.length > n) {
      props.chord.stringStates = props.chord.stringStates.slice(0, n)
    }
    if (!Array.isArray(props.chord.barres)) props.chord.barres = []
    for (const barre of props.chord.barres) {
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
    emit('change')
  },
)

function onStringStatesUpdate(next: tabChord['stringStates']) {
  props.chord.stringStates = next
  emit('change')
}

function addBarre() {
  if (isDisabled('barres')) return
  if (!Array.isArray(props.chord.barres)) props.chord.barres = []
  props.chord.barres.push(createDefaultBarre(props.chord.stringCount))
  emit('change')
}

function addFullBarreExample() {
  if (isDisabled('loadSample')) return
  const sample = createSampleFChord()
  Object.assign(props.chord, sample)
  emit('change')
}

function removeBarre(index: number) {
  if (isDisabled('barres')) return
  props.chord.barres.splice(index, 1)
  emit('change')
}

function getBarreTextRaw(barre: Barre): string {
  return (barre.text ?? []).join(',')
}

function setBarreTextRaw(barre: Barre, raw: string) {
  if (isDisabled('barres')) return
  const n = props.chord.stringCount
  const parts = raw.split(',').map((s) => s.trim())
  barre.text = Array.from({length: n}, (_, i) => parts[i] ?? '')
  emit('change')
}

function isBarreRangeValid(barre: Barre): boolean {
  const n = props.chord.stringCount
  if (barre.startStringNumber > barre.endStringNumber) return false
  if (barre.startStringNumber < 0 || barre.endStringNumber < 0) return false
  if (barre.startStringNumber >= n || barre.endStringNumber >= n) return false
  return true
}
</script>

<template>
  <div class="chord-builder">
    <div class="chord-builder__scale-bar">
      <label class="chord-builder__scale-control">
        <span>预览缩放 / Preview scale</span>
        <input
          v-model.number="scale"
          type="range"
          min="1"
          max="10"
          step="0.5"
          :disabled="isDisabled('previewScale')"
        />
        <strong>{{ scale }}×</strong>
      </label>
      <span class="chord-builder__scale-hint">
        曲谱尺寸 {{ chord.width }}×{{ chord.height }}；
        预览 {{ previewDisplayW }}×{{ previewDisplayH }} px
      </span>
    </div>

    <div class="chord-builder__body">
      <div class="chord-builder__preview">
        <h2 class="chord-builder__title">和弦图预览 / Chord Preview</h2>
        <div class="chord-builder__preview-box">
          <svg
            :width="previewDisplayW"
            :height="previewDisplayH"
            :viewBox="`0 0 ${chord.width} ${chord.height}`"
            xmlns="http://www.w3.org/2000/svg"
            overflow="visible"
          >
            <Chord :chord="chord"/>
          </svg>
        </div>
      </div>

      <div class="chord-builder__editor">
        <h2 class="chord-builder__title">编辑 / Edit</h2>
        <div class="chord-builder__toolbar">
          <label class="chord-builder__field">
            <span>名称 / Name</span>
            <input v-model="chord.name" type="text" :disabled="isDisabled('name')"/>
          </label>
          <label class="chord-builder__field">
            <span>宽度 / Width</span>
            <input
              v-model.number="chord.width"
              type="number"
              min="20"
              :disabled="isDisabled('width')"
            />
          </label>
          <label class="chord-builder__field">
            <span>高度 / Height</span>
            <input
              v-model.number="chord.height"
              type="number"
              min="20"
              :disabled="isDisabled('height')"
            />
          </label>
          <label class="chord-builder__field">
            <span>弦数 / Strings</span>
            <input
              v-model.number="chord.stringCount"
              type="number"
              min="1"
              max="8"
              :disabled="isDisabled('stringCount')"
            />
          </label>
          <label class="chord-builder__field">
            <span>品数 / Frets</span>
            <input
              v-model.number="chord.fretCount"
              type="number"
              min="1"
              max="8"
              :disabled="isDisabled('fretCount')"
            />
          </label>
          <label class="chord-builder__field">
            <span>起始品 / Base fret</span>
            <input
              v-model.number="chord.baseFret"
              type="number"
              min="0"
              :disabled="isDisabled('baseFret')"
            />
          </label>
          <label class="chord-builder__field">
            <span>文字字号 / Text size</span>
            <input
              v-model.number="chord.textSize"
              type="number"
              min="8"
              :disabled="isDisabled('textSize')"
            />
          </label>
          <label class="chord-builder__field">
            <span>名称字号 / Name size</span>
            <input
              v-model.number="chord.nameSize"
              type="number"
              min="8"
              :disabled="isDisabled('nameSize')"
            />
          </label>
          <label class="chord-builder__field chord-builder__field--wide">
            <span>调弦（逗号分隔）/ Tuning (comma-separated)</span>
            <input v-model="tuningText" type="text" :disabled="isDisabled('tuning')"/>
          </label>
        </div>

        <StringStateForm
          :model-value="chord.stringStates"
          :string-count="chord.stringCount"
          :disabled="isDisabled('stringStates')"
          @update:model-value="onStringStatesUpdate"
        />

        <div class="chord-builder__barre">
          <div class="chord-builder__barre-header">
            <h3 class="chord-builder__subtitle">横按 / Barres</h3>
            <div class="chord-builder__barre-actions">
              <button type="button" :disabled="isDisabled('barres')" @click="addBarre">
                添加横按
              </button>
              <button
                type="button"
                :disabled="isDisabled('loadSample')"
                @click="addFullBarreExample"
              >
                全按示例 (F)
              </button>
            </div>
          </div>
          <p v-if="!chord.barres?.length" class="chord-builder__empty">暂无横按，点击「添加横按」</p>
          <div v-for="(barre, idx) in chord.barres" :key="idx" class="chord-builder__barre-item">
            <div class="chord-builder__barre-item-head">
              <span class="chord-builder__barre-label">#{{ idx + 1 }}</span>
              <button
                type="button"
                class="chord-builder__btn-danger"
                :disabled="isDisabled('barres')"
                @click="removeBarre(idx)"
              >
                删除
              </button>
            </div>
            <div class="chord-builder__barre-fields">
              <label class="chord-builder__field">
                <span>相对品 / Fret</span>
                <input
                  v-model.number="barre.fret"
                  type="number"
                  min="0"
                  :disabled="isDisabled('barres')"
                />
              </label>
              <label class="chord-builder__field">
                <span>起始弦（细）/ Start string</span>
                <input
                  v-model.number="barre.startStringNumber"
                  type="number"
                  min="0"
                  :disabled="isDisabled('barres')"
                />
              </label>
              <label class="chord-builder__field">
                <span>结束弦（粗）/ End string</span>
                <input
                  v-model.number="barre.endStringNumber"
                  type="number"
                  min="0"
                  :disabled="isDisabled('barres')"
                />
              </label>
              <label class="chord-builder__field chord-builder__field--wide">
                <span>文字（逗号分隔，下标=弦索引）/ Text (comma-separated, by string index)</span>
                <input
                  :value="getBarreTextRaw(barre)"
                  type="text"
                  placeholder="例: 1,1,1,1,1,1"
                  :disabled="isDisabled('barres')"
                  @input="setBarreTextRaw(barre, ($event.target as HTMLInputElement).value)"
                />
              </label>
            </div>
            <p v-if="!isBarreRangeValid(barre)" class="chord-builder__warn">
              start &gt; end 或索引越界，渲染时该条横按无效
            </p>
          </div>
        </div>

        <p class="chord-builder__hint">
          stringStates：索引 0=1弦(右)。finger 为 <code>'o'</code> 空弦、<code>'x'</code> 闷音、
          <code>-1</code> 不显示；数字为相对品（0=第 baseFret+1 品），text 为按位圆点文字。
          barres：<code>{ fret, text[], startStringNumber, endStringNumber }</code>。
          默认框体 {{ CHORD_DEFAULTS.width }}×{{ CHORD_DEFAULTS.height }}。
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chord-builder {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  height: 100%;
  box-sizing: border-box;
}

.chord-builder__scale-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
}

.chord-builder__scale-control {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  white-space: nowrap;
}

.chord-builder__scale-control input[type='range'] {
  width: 160px;
}

.chord-builder__scale-hint {
  font-size: 12px;
  color: #666;
}

.chord-builder__body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 20px;
}

.chord-builder__preview,
.chord-builder__editor {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.chord-builder__title {
  margin: 0 0 12px;
  font-size: 16px;
}

.chord-builder__subtitle {
  margin: 0;
  font-size: 14px;
}

.chord-builder__preview-box {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fafafa;
  overflow: visible;
}

.chord-builder__preview-box svg {
  display: block;
  max-width: 100%;
  max-height: 100%;
}

.chord-builder__toolbar {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.chord-builder__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.chord-builder__field--wide {
  grid-column: 1 / -1;
}

.chord-builder__field input {
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.chord-builder__field input:disabled,
.chord-builder__scale-control input:disabled,
.chord-builder__barre-actions button:disabled,
.chord-builder__btn-danger:disabled {
  background: #f0f0f0;
  color: #999;
  cursor: not-allowed;
}

.chord-builder__barre {
  margin-bottom: 12px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
}

.chord-builder__barre-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.chord-builder__barre-actions {
  display: flex;
  gap: 6px;
}

.chord-builder__barre-actions button {
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}

.chord-builder__empty {
  margin: 0;
  font-size: 12px;
  color: #888;
}

.chord-builder__barre-item {
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background: #fafafa;
}

.chord-builder__barre-item:last-child {
  margin-bottom: 0;
}

.chord-builder__barre-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.chord-builder__barre-label {
  font-size: 12px;
  font-weight: 600;
}

.chord-builder__btn-danger {
  padding: 2px 8px;
  font-size: 11px;
  color: #c00;
  border: 1px solid #e0a0a0;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

.chord-builder__barre-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.chord-builder__warn {
  margin: 6px 0 0;
  font-size: 11px;
  color: #c60;
}

.chord-builder__hint {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.chord-builder__hint code {
  font-size: 11px;
}
</style>
