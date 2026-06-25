<template>
  <div class="container">
    <div class="left">
      <music-score :data="musicScoreData" :slot-config="{'g-r':{w:50},'g-l':{w:50}}"
                   skin-name="default"
                   @renderMusicScore="renderMusicScore"/>
    </div>
    <div v-if="true" class="right">
      <textarea
        :value="jsonText"
        class="json-editor"
        spellcheck="false"
        @input="onJsonInput"
      />
      <p v-if="parseError" class="error">{{ parseError }}</p>
    </div>
    <div v-else class="right">
      <button @click="fourth">四分音符</button>
      <button @click="whole">全音符</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {ref} from 'vue'
import MusicScore from 'deciphony-renderer'
import data from './data/其多列简谱'

const initialData = JSON.parse(JSON.stringify(data))
const musicScoreData = ref(initialData)
const jsonText = ref(JSON.stringify(initialData, null, 2))
const parseError = ref('')

function onJsonInput(e: Event) {
  const raw = (e.target as HTMLTextAreaElement).value
  jsonText.value = raw
  parseError.value = ''
  try {
    musicScoreData.value = JSON.parse(raw)
  } catch (err) {
    parseError.value = err instanceof Error ? err.message : 'JSON 解析错误'
  }
}

function fourth() {
  console.log('开始渲染', Date.now())
  const note = musicScoreData.value.grandStaffs[0].staves[0].measures[0].notes[0]
  if (note.notesInfo?.[0]) note.notesInfo[0].chronaxie = 64
}

function renderMusicScore() {
  console.log('js执行结束时间', Date.now())
  const js = Date.now()
  setTimeout(() => {
    console.log('页面重绘所需时间', Date.now() - js)
  })

}

function whole() {
  console.log('开始渲染', Date.now())
  const note = musicScoreData.value.grandStaffs[0].staves[0].measures[0].notes[0]
  if (note.notesInfo?.[0]) note.notesInfo[0].chronaxie = 256
}
</script>

<style scoped>
.container {
  display: flex;
  gap: 16px;
  height: 100vh;
}

.left {
  flex: 1;
}

.right {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.json-editor {
  width: 100%;
  flex: 1;
  min-height: 0;
  font-family: ui-monospace, monospace;
  font-size: 13px;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
}

.error {
  color: #c00;
  font-size: 12px;
  margin-top: 8px;
}
</style>
