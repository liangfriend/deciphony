<script setup lang="ts">
/**
 * 和弦选择浮层：常用和弦 / 根音 + 类型 + 低音 / 手输（带全集补全）/ 和弦与歌词颜色。
 * 每次选择立刻 emit，不需要确认。
 */
import {computed, ref, useId, watch} from 'vue'
import type {ClChord} from '../types'
import {
  CHORD_ACCIDENTALS,
  CHORD_BASSES,
  CHORD_LETTERS,
  CHORD_QUALITIES,
  type ChordAccidental,
  type ChordParts,
  formatChord,
  normalizeChordText,
  parseChord,
} from '../chords'

const props = defineProps<{
  chord?: ClChord
  textColor?: string
  underline?: boolean
  defaultChordColor: string
  defaultTextColor: string
  common: readonly string[]
  all: readonly string[]
}>()

const emit = defineEmits<{
  change: [chord: ClChord | null]
  textColor: [color: string | undefined]
  underline: [value: boolean]
  close: []
}>()

let colorCtx: CanvasRenderingContext2D | null = null

/** `<input type=color>` 只认 #rrggbb：red / #fff / rgb() 先换算 */
function toHex(color: string): string {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color
  colorCtx ??= document.createElement('canvas').getContext('2d')
  if (!colorCtx) return '#000000'
  colorCtx.fillStyle = '#000000'
  colorCtx.fillStyle = color
  const value = String(colorCtx.fillStyle)
  return /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'
}

const listId = `cl-chords-${useId()}`
const ACCIDENTAL_LABEL: Record<ChordAccidental, string> = {'': '♮', '#': '♯', b: '♭'}

const letter = ref<ChordParts['letter'] | ''>('')
const accidental = ref<ChordAccidental>('')
const quality = ref<string | null>(null)
const bass = ref('')
const text = ref('')

watch(() => props.chord?.text, (value) => {
  const name = value ?? ''
  if (normalizeChordText(text.value) !== name) text.value = name
  const parts = parseChord(name)
  letter.value = parts?.letter ?? ''
  accidental.value = parts?.accidental ?? ''
  quality.value = parts ? parts.quality : null
  bass.value = parts?.bass ?? ''
}, {immediate: true})

const rootLabel = computed(() => (letter.value || 'C') + accidental.value)

function emitText(value: string) {
  const name = normalizeChordText(value)
  if (!name) {
    emit('change', null)
    return
  }
  emit('change', {text: name, ...(props.chord?.color ? {color: props.chord.color} : {})})
}

function emitParts() {
  if (!letter.value) return
  emitText(formatChord({
    letter: letter.value,
    accidental: accidental.value,
    quality: quality.value ?? '',
    bass: bass.value || undefined,
  }))
}

function pickLetter(value: ChordParts['letter']) {
  letter.value = value
  emitParts()
}

function pickAccidental(value: ChordAccidental) {
  accidental.value = value
  emitParts()
}

function pickQuality(value: string) {
  if (!letter.value) letter.value = 'C'
  quality.value = value
  emitParts()
}

/** 点按钮不抢焦点，键盘操作仍落在曲谱上；输入框 / 下拉 / 取色照常获得焦点 */
function keepFocus(e: MouseEvent) {
  if (!(e.target as HTMLElement).closest('input, select')) e.preventDefault()
}

function onChordColor(e: Event) {
  if (!props.chord) return
  emit('change', {...props.chord, color: (e.target as HTMLInputElement).value})
}

function resetChordColor() {
  if (!props.chord) return
  emit('change', {text: props.chord.text})
}
</script>

<template>
  <div class="cl-picker" @mousedown="keepFocus" @keydown.esc.stop="emit('close')">
    <div class="cl-picker__head">
      <input
        v-model="text"
        class="cl-picker__input"
        :list="listId"
        placeholder="和弦名，如 Am7、C/G"
        @input="emitText(text)"
        @keydown.enter.prevent="emit('close')"
      >
      <datalist :id="listId">
        <option v-for="c in all" :key="c" :value="c"/>
      </datalist>
      <button class="cl-picker__btn cl-picker__btn--danger" :disabled="!chord" @click="emit('change', null)">删除</button>
    </div>

    <div class="cl-picker__label">常用</div>
    <div class="cl-picker__grid">
      <button
        v-for="c in common"
        :key="c"
        class="cl-picker__chip"
        :class="{'is-active': chord?.text === c}"
        @click="emitText(c)"
      >{{ c }}</button>
    </div>

    <div class="cl-picker__label">根音</div>
    <div class="cl-picker__roots">
      <button
        v-for="l in CHORD_LETTERS"
        :key="l"
        class="cl-picker__chip"
        :class="{'is-active': letter === l}"
        @click="pickLetter(l)"
      >{{ l }}</button>
      <span class="cl-picker__sep"/>
      <button
        v-for="a in CHORD_ACCIDENTALS"
        :key="a || 'natural'"
        class="cl-picker__chip"
        :class="{'is-active': accidental === a}"
        @click="pickAccidental(a)"
      >{{ ACCIDENTAL_LABEL[a] }}</button>
    </div>

    <div class="cl-picker__label">类型</div>
    <div class="cl-picker__grid cl-picker__grid--quality">
      <button
        v-for="q in CHORD_QUALITIES"
        :key="q.value || 'major'"
        class="cl-picker__chip"
        :class="{'is-active': letter && quality === q.value}"
        :title="q.label"
        @click="pickQuality(q.value)"
      >{{ rootLabel + q.value }}</button>
    </div>

    <div class="cl-picker__line">
      <span class="cl-picker__label">低音</span>
      <select v-model="bass" class="cl-picker__select" :disabled="!letter" @change="emitParts">
        <option value="">无</option>
        <option v-for="b in CHORD_BASSES" :key="b" :value="b">/{{ b }}</option>
      </select>
    </div>

    <div class="cl-picker__line">
      <span class="cl-picker__label">和弦颜色</span>
      <input
        type="color"
        class="cl-picker__color"
        :value="toHex(chord?.color ?? defaultChordColor)"
        :disabled="!chord"
        @input="onChordColor"
      >
      <button class="cl-picker__btn" :disabled="!chord?.color" @click="resetChordColor">默认</button>
    </div>

    <div class="cl-picker__line">
      <span class="cl-picker__label">歌词颜色</span>
      <input
        type="color"
        class="cl-picker__color"
        :value="toHex(textColor ?? defaultTextColor)"
        @input="emit('textColor', ($event.target as HTMLInputElement).value)"
      >
      <button class="cl-picker__btn" :disabled="!textColor" @click="emit('textColor', undefined)">默认</button>
      <button
        class="cl-picker__btn"
        :disabled="!chord"
        title="歌词颜色改成和弦颜色"
        @click="emit('textColor', chord?.color ?? defaultChordColor)"
      >同步</button>
      <button
        class="cl-picker__btn cl-picker__btn--underline"
        :class="{'is-active': underline}"
        title="下划线"
        @click="emit('underline', !underline)"
      >U</button>
    </div>

    <div class="cl-picker__foot">
      <span class="cl-picker__hint">← → 切换字 · Delete 删除和弦 · Enter 改歌词</span>
      <button class="cl-picker__btn cl-picker__btn--primary" @click="emit('close')">完成</button>
    </div>
  </div>
</template>

<style scoped>
.cl-picker {
  width: 340px;
  box-sizing: border-box;
  padding: 10px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, .14);
  font: 12px/1.4 system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #303133;
  user-select: none;
}

.cl-picker__head {
  display: flex;
  gap: 6px;
}

.cl-picker__input {
  flex: 1;
  min-width: 0;
  height: 28px;
  padding: 0 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  outline: none;
}

.cl-picker__input:focus {
  border-color: #409eff;
}

.cl-picker__label {
  margin: 8px 0 4px;
  color: #909399;
}

.cl-picker__line .cl-picker__label {
  margin: 0;
}

.cl-picker__grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
}

.cl-picker__grid--quality {
  grid-template-columns: repeat(5, 1fr);
}

.cl-picker__roots {
  display: flex;
  gap: 4px;
}

.cl-picker__roots .cl-picker__chip {
  flex: 1;
}

.cl-picker__sep {
  width: 6px;
}

.cl-picker__chip {
  height: 24px;
  padding: 0 2px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #f7f8fa;
  font-size: 12px;
  color: #303133;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cl-picker__chip:hover {
  border-color: #a0cfff;
  background: #ecf5ff;
}

.cl-picker__chip.is-active {
  border-color: #409eff;
  background: #409eff;
  color: #fff;
}

.cl-picker__line {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}

.cl-picker__select {
  height: 24px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.cl-picker__color {
  width: 28px;
  height: 22px;
  padding: 0;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: none;
  cursor: pointer;
}

.cl-picker__btn {
  height: 24px;
  padding: 0 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
}

.cl-picker__head .cl-picker__btn {
  height: 28px;
}

.cl-picker__btn:disabled,
.cl-picker__color:disabled,
.cl-picker__select:disabled {
  opacity: .45;
  cursor: not-allowed;
}

.cl-picker__btn--danger:not(:disabled) {
  border-color: #fbc4c4;
  color: #f56c6c;
}

.cl-picker__btn--underline {
  text-decoration: underline;
  font-weight: 600;
}

.cl-picker__btn--underline.is-active {
  border-color: #409eff;
  background: #409eff;
  color: #fff;
}

.cl-picker__btn--primary {
  border-color: #409eff;
  background: #409eff;
  color: #fff;
}

.cl-picker__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}

.cl-picker__hint {
  color: #b1b3b8;
  font-size: 11px;
}
</style>
