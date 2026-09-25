<script lang="ts" setup>
import {ref, watch} from 'vue'
import {
  ChordBuilder,
  createSampleCChord,
  createSampleFChord,
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

function loadC() {
  chord.value = createSampleCChord()
  parseError.value = ''
}

function loadF() {
  chord.value = createSampleFChord()
  parseError.value = ''
}
</script>

<template>
  <div class="chord-builder-test">
    <header class="chord-builder-test__header">
      <h1>ChordBuilder Demo</h1>
      <p>编辑 <code>@deciphony/extensions/chord-builder</code> 的 <code>tabChord</code>，下方同步 JSON。</p>
      <div class="chord-builder-test__samples">
        <button type="button" @click="loadC">示例 C</button>
        <button type="button" @click="loadF">示例 F（含横按）</button>
      </div>
    </header>

    <ChordBuilder :chord="chord" />

    <div class="chord-builder-test__json">
      <textarea
        class="chord-builder-test__editor"
        spellcheck="false"
        :value="jsonText"
        @input="onJsonInput"
      />
      <p v-if="parseError" class="chord-builder-test__error">{{ parseError }}</p>
      <div class="chord-builder-test__actions">
        <button type="button" @click="copyJson">复制 JSON</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chord-builder-test {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100vh;
  padding: 16px;
  box-sizing: border-box;
}

.chord-builder-test__header h1 {
  margin: 0 0 4px;
  font-size: 18px;
}

.chord-builder-test__header p {
  margin: 0 0 8px;
  font-size: 13px;
  color: #606266;
}

.chord-builder-test__samples {
  display: flex;
  gap: 8px;
}

.chord-builder-test > :nth-child(2) {
  flex: 1;
  min-height: 0;
}

.chord-builder-test__json {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 36vh;
}

.chord-builder-test__editor {
  flex: 1;
  min-height: 160px;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  resize: vertical;
}

.chord-builder-test__error {
  margin: 0;
  font-size: 12px;
  color: #f56c6c;
}

.chord-builder-test__actions,
.chord-builder-test__samples {
  display: flex;
  gap: 8px;
}

button {
  padding: 6px 12px;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
}

button:hover {
  border-color: #409eff;
  color: #409eff;
}
</style>
