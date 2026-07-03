<template>
  <div class="string-state-form">
    <div class="form-header">
      <h3 class="subsection-title">按弦 stringStates</h3>
      <span class="form-hint">索引 0=1弦(右/细) → {{ stringCount - 1 }}={{ stringCount }}弦(左/粗)</span>
    </div>
    <div class="string-rows">
      <div v-for="row in rows" :key="row.index" class="string-row">
        <span class="string-label">{{ row.index + 1 }}弦</span>
        <label class="field">
          <span>状态</span>
          <select :value="row.mode" @change="onModeChange(row.index, ($event.target as HTMLSelectElement).value)">
            <option value="none">不显示 (-1)</option>
            <option value="o">空弦 (o)</option>
            <option value="x">闷音 (x)</option>
            <option value="fret">按弦 (数字)</option>
          </select>
        </label>
        <label class="field">
          <span>相对品</span>
          <input
            :value="row.fretValue"
            type="number"
            min="0"
            :disabled="row.mode !== 'fret'"
            @input="onFretChange(row.index, ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label class="field">
          <span>text</span>
          <input
            :value="row.text"
            type="text"
            :disabled="row.mode !== 'fret'"
            @input="onTextChange(row.index, ($event.target as HTMLInputElement).value)"
          />
        </label>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed, watch} from 'vue'
import type {StringState} from 'deciphony-renderer'

type FingerMode = 'none' | 'o' | 'x' | 'fret'

const props = defineProps<{
  stringCount: number
  modelValue: StringState[]
}>()

const emit = defineEmits<{
  'update:modelValue': [StringState[]]
}>()

function createEmptyState(): StringState {
  return {finger: -1, text: ''}
}

function normalizeStates(states: StringState[], count: number): StringState[] {
  const next = states.slice(0, count).map((s) => ({
    finger: s?.finger ?? -1,
    text: s?.text ?? '',
  }))
  while (next.length < count) next.push(createEmptyState())
  return next
}

function getMode(state: StringState): FingerMode {
  if (state.finger === 'o') return 'o'
  if (state.finger === 'x') return 'x'
  if (state.finger === -1) return 'none'
  return 'fret'
}

const rows = computed(() => {
  const states = normalizeStates(props.modelValue, props.stringCount)
  return states.map((state, index) => {
    const mode = getMode(state)
    return {
      index,
      mode,
      fretValue: mode === 'fret' && typeof state.finger === 'number' ? state.finger : 0,
      text: state.text,
    }
  })
})

watch(
  () => props.stringCount,
  (count) => {
    const normalized = normalizeStates(props.modelValue, count)
    if (normalized.length !== props.modelValue.length
      || normalized.some((s, i) => s.finger !== props.modelValue[i]?.finger || s.text !== props.modelValue[i]?.text)) {
      emit('update:modelValue', normalized)
    }
  },
)

function patchState(index: number, patch: Partial<StringState>) {
  const next = normalizeStates(props.modelValue, props.stringCount)
  next[index] = {...next[index], ...patch}
  emit('update:modelValue', next)
}

function onModeChange(index: number, mode: string) {
  switch (mode as FingerMode) {
    case 'o':
      patchState(index, {finger: 'o', text: ''})
      break
    case 'x':
      patchState(index, {finger: 'x', text: ''})
      break
    case 'none':
      patchState(index, {finger: -1, text: ''})
      break
    case 'fret':
      patchState(index, {finger: 0, text: ''})
      break
  }
}

function onFretChange(index: number, raw: string) {
  const fret = Math.max(0, Number.parseInt(raw, 10) || 0)
  patchState(index, {finger: fret})
}

function onTextChange(index: number, text: string) {
  patchState(index, {text})
}
</script>

<style scoped>
.string-state-form {
  margin-bottom: 12px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
}

.form-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.subsection-title {
  margin: 0;
  font-size: 14px;
}

.form-hint {
  font-size: 11px;
  color: #888;
}

.string-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 220px;
  overflow-y: auto;
}

.string-row {
  display: grid;
  grid-template-columns: 44px repeat(3, minmax(0, 1fr));
  gap: 6px;
  align-items: end;
  padding: 6px;
  border: 1px solid #eee;
  border-radius: 4px;
  background: #fafafa;
}

.string-label {
  font-size: 12px;
  font-weight: 600;
  padding-bottom: 6px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.field input,
.field select {
  padding: 4px 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
}

.field input:disabled,
.field select:disabled {
  background: #f0f0f0;
  color: #999;
}
</style>
