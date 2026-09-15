<script lang="ts" setup>
import {ref, watch} from 'vue'
import {
  ChordBuilder,
  createSampleCChord,
} from '@deciphony/extensions/chord-builder'
import type {tabChord} from '@deciphony/renderer'

const chord = ref<tabChord>(createSampleCChord())
const jsonText = ref(JSON.stringify(chord.value, null, 2))
const parseError = ref('')
const syncingFromJson = ref(false)

watch(
  chord,
  (val) => {
    if (syncingFromJson.value) return
    jsonText.value = JSON.stringify(val, null, 2)
  },
  {deep: true},
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
    chord.value = parsed
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
  chord.value = createSampleCChord()
  parseError.value = ''
}
</script>

<template>
  <div class="page">
    <ChordBuilder :chord="chord"/>
    <div class="json-panel">
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

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100vh;
  padding: 16px;
  box-sizing: border-box;
}

.page > :first-child {
  flex: 1;
  min-height: 0;
}

.json-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 36vh;
}

.json-editor {
  flex: 1;
  min-height: 160px;
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
  margin: 0;
}

.actions {
  display: flex;
  gap: 8px;
}

.actions button {
  padding: 6px 12px;
  cursor: pointer;
}
</style>
