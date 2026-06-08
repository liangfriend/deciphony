<script lang="ts" setup>
import musicScoreVue from 'deciphony-renderer'
import type {MusicScore} from 'deciphony-renderer'
import {reactive, ref} from 'vue'
import initialData from './data/其多列'
import {getXmlJson, musicScoreToXml, xmlToMusicScore} from './dr-extensions/dr-musicxml-transfer'

const musicScoreData = reactive(JSON.parse(JSON.stringify(initialData)) as MusicScore)

const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFileName = ref('')
const statusMessage = ref('')
const statusType = ref<'info' | 'success' | 'error'>('info')
const exportedXmlPreview = ref('')
const isBusy = ref(false)

function setStatus(message: string, type: 'info' | 'success' | 'error' = 'info') {
  statusMessage.value = message
  statusType.value = type
}

function triggerFileSelect() {
  fileInputRef.value?.click()
}

function resetFileInput() {
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = file.name
  anchor.click()
  URL.revokeObjectURL(url)
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  selectedFileName.value = file.name
  exportedXmlPreview.value = ''
  isBusy.value = true
  setStatus(`正在解析 ${file.name}…`)

  try {
    const xmlJson = await getXmlJson(file)
    if (!xmlJson) {
      setStatus('未读取到 XML 内容', 'error')
      return
    }
    const score = xmlToMusicScore(xmlJson)
    musicScoreData.grandStaffs = score.grandStaffs
    musicScoreData.affiliatedSymbols = score.affiliatedSymbols
    musicScoreData.title = score.title
    musicScoreData.author = score.author
    musicScoreData.type = score.type
    musicScoreData.width = score.width
    musicScoreData.height = score.height
    musicScoreData.topSpaceHeight = score.topSpaceHeight
    if (score.bpm != null) musicScoreData.bpm = score.bpm
    const gs = score.grandStaffs.length
    const staves = score.grandStaffs[0]?.staves.length ?? 0
    const measures = score.grandStaffs[0]?.staves[0]?.measures.length ?? 0
    setStatus(`已导入：${file.name}（${gs} 复谱表，${staves} 单谱表，${measures} 小节）`, 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : '导入失败'
    setStatus(message, 'error')
  } finally {
    isBusy.value = false
    resetFileInput()
  }
}

async function handleExportXml() {
  exportedXmlPreview.value = ''
  isBusy.value = true
  setStatus('正在导出 MusicXML…')

  try {
    const file = musicScoreToXml(musicScoreData)
    exportedXmlPreview.value = await file.text()
    downloadFile(file)
    setStatus(`已导出：${file.name}`, 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : '导出失败'
    setStatus(message, 'error')
  } finally {
    isBusy.value = false
  }
}
</script>

<template>
  <div class="xml-test">
    <div class="xml-test__score">
      <musicScoreVue
          :data="musicScoreData"
          :slot-config="{'g-r':{w:50},'g-l':{w:50}}"
          skin-name="default"
      />
    </div>

    <aside class="xml-test__panel">
      <h3 class="xml-test__title">MusicXML 转换</h3>
      <p class="xml-test__desc">左侧为当前曲谱预览；右侧用于导入 / 导出 MusicXML（转换逻辑待实现）。</p>

      <section class="xml-test__section">
        <h4 class="xml-test__section-title">导入 MusicXML</h4>
        <input
            ref="fileInputRef"
            accept=".xml,.musicxml,text/xml,application/xml"
            class="xml-test__file-input"
            type="file"
            @change="handleFileChange"
        />
        <button
            class="xml-test__btn"
            :disabled="isBusy"
            type="button"
            @click="triggerFileSelect"
        >
          选择文件上传
        </button>
        <p v-if="selectedFileName" class="xml-test__file-name">最近选择：{{ selectedFileName }}</p>
      </section>

      <section class="xml-test__section">
        <h4 class="xml-test__section-title">导出 MusicXML</h4>
        <button
            class="xml-test__btn xml-test__btn--primary"
            :disabled="isBusy"
            type="button"
            @click="handleExportXml"
        >
          导出当前曲谱 (musicScoreToXml)
        </button>
      </section>

      <p
          v-if="statusMessage"
          class="xml-test__status"
          :class="`xml-test__status--${statusType}`"
      >
        {{ statusMessage }}
      </p>

      <section v-if="exportedXmlPreview" class="xml-test__section">
        <h4 class="xml-test__section-title">导出预览</h4>
        <textarea
            class="xml-test__preview"
            readonly
            :value="exportedXmlPreview"
        />
      </section>
    </aside>
  </div>
</template>

<style scoped>
.xml-test {
  display: flex;
  align-items: flex-start;
  height: 100%;
  gap: 16px;
}

.xml-test__score {
  flex: 1;
  min-width: 0;
  overflow: auto;
}

.xml-test__panel {
  width: 280px;
  flex-shrink: 0;
  padding: 16px;
  border-left: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.xml-test__title {
  margin: 0;
  font-size: 16px;
}

.xml-test__desc {
  margin: 0;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.xml-test__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.xml-test__section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.xml-test__file-input {
  display: none;
}

.xml-test__btn {
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  transition: background-color 0.15s;
  text-align: left;
}

.xml-test__btn:hover:not(:disabled) {
  background: #f2f2f2;
}

.xml-test__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.xml-test__btn--primary {
  border-color: #409eff;
  color: #409eff;
}

.xml-test__btn--primary:hover:not(:disabled) {
  background: #ecf5ff;
}

.xml-test__file-name {
  margin: 0;
  font-size: 12px;
  color: #888;
  word-break: break-all;
}

.xml-test__status {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  padding: 8px 10px;
  border-radius: 6px;
}

.xml-test__status--info {
  background: #f4f4f5;
  color: #606266;
}

.xml-test__status--success {
  background: #f0f9eb;
  color: #67c23a;
}

.xml-test__status--error {
  background: #fef0f0;
  color: #f56c6c;
}

.xml-test__preview {
  width: 100%;
  min-height: 160px;
  max-height: 320px;
  resize: vertical;
  padding: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  line-height: 1.4;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  box-sizing: border-box;
}
</style>
