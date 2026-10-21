<script setup lang="ts">
import {computed, ref, shallowRef} from 'vue'
import {
  ClSheet,
  createClSheet,
  parseChordLyrics,
  stringifyChordLyrics,
} from '@deciphony/cl-sheet'
import type {ClSheetData, ClSheetMode, ClSheetSelection} from '@deciphony/cl-sheet'

const SAMPLES: Record<string, {title: string; author: string; text: string}> = {
  jasmine: {
    title: '茉莉花',
    author: '江苏民歌',
    text: [
      '[C]好一朵美丽的[Am]茉莉[C]花',
      '[F]好一朵美丽的[C]茉莉[G]花',
      '[C]芬芳美[Am]丽满枝[Em]桠',
      '[F]又香又[C]白人人[G]夸',
      '[Am]让我来将[Em]你摘[F]下',
      '[C]送给[G]别人[C]家',
      '[F]茉莉[C]花呀{#e6553a}[G7]{#e6553a,u}茉{#e6553a,u}莉[C]花{u} {u} {u} {red}[C]{u} ',
    ].join('\n'),
  },
  twinkle: {
    title: 'Twinkle, Twinkle, Little Star',
    author: 'Traditional',
    text: [
      '[C]Twinkle, twinkle, [F]little [C]star,',
      '[F]How I [C]wonder [G7]what you [C]are.',
      '[C]Up a[F]bove the [C]world so [G]high,',
      '[C]Like a [F]diamond [C]in the [G]sky.',
      '',
      '[C] [F] [G7] [C]',
    ].join('\n'),
  },
  empty: {title: '未命名', author: '', text: ''},
}

const FONTS = [
  {label: '默认', value: ''},
  {label: '宋体', value: 'SimSun, "Songti SC", serif'},
  {label: '楷体', value: 'KaiTi, "Kaiti SC", serif'},
  {label: '黑体', value: '"Microsoft YaHei", "PingFang SC", sans-serif'},
  {label: 'Georgia', value: 'Georgia, serif'},
]

const sheetRef = ref<InstanceType<typeof ClSheet> | null>(null)
const mode = ref<ClSheetMode>('edit')
const sampleKey = ref('jasmine')
const fontSize = ref(20)
const lineGap = ref(14)
const color = ref('#222222')
const chordColor = ref('#1d6fd8')
const data = ref<ClSheetData>(loadSample('jasmine'))
const version = ref(0)
const selection = shallowRef<ClSheetSelection | null>(null)
const logs = ref<string[]>([])

function loadSample(key: string): ClSheetData {
  const s = SAMPLES[key]!
  return createClSheet({
    title: s.title,
    author: s.author,
    width: 560,
    height: 460,
    fontFamily: '',
    lyrics: parseChordLyrics(s.text),
    data: {sample: key},
  })
}

function switchSample() {
  data.value = loadSample(sampleKey.value)
  bracketText.value = stringifyChordLyrics(data.value.lyrics)
  log(`载入示例 ${sampleKey.value}`)
}

function log(text: string) {
  const time = new Date().toLocaleTimeString()
  logs.value = [`${time}  ${text}`, ...logs.value].slice(0, 40)
}

function onChange() {
  version.value++
  bracketText.value = stringifyChordLyrics(data.value.lyrics)
  log('change')
}

function onSelectionChange(s: ClSheetSelection | null) {
  selection.value = s
  log(s ? `选中 第${s.lineIndex + 1}行 第${s.index + 1}个「${s.lyric.text}」` : '取消选中')
}

// —— 新加内容的默认颜色（走组件暴露的 setAddColors） ——

const addLyricColor = ref('')
const addChordColor = ref('')

function syncAddColors() {
  const colors = sheetRef.value?.getAddColors()
  addLyricColor.value = colors?.lyric ?? ''
  addChordColor.value = colors?.chord ?? ''
}

function setAddColor(kind: 'lyric' | 'chord', e: Event) {
  sheetRef.value?.setAddColors({[kind]: (e.target as HTMLInputElement).value})
  syncAddColors()
}

function clearAddColors() {
  sheetRef.value?.setAddColors({lyric: null, chord: null})
  syncAddColors()
}

// —— 方括号文本互转 ——

const bracketText = ref(stringifyChordLyrics(data.value.lyrics))

function importBracket() {
  data.value.lyrics = parseChordLyrics(bracketText.value)
  version.value++
  log('从方括号文本导入')
}

const json = computed(() => {
  void version.value
  return JSON.stringify(data.value, null, 2)
})

function copyJson() {
  navigator.clipboard?.writeText(json.value)
  log('已复制 JSON')
}
</script>

<template>
  <div class="cl-test">
    <div class="cl-test__bar">
      <label>
        模式
        <select v-model="mode">
          <option value="show">展示</option>
          <option value="edit">编辑</option>
        </select>
      </label>
      <label>
        示例
        <select v-model="sampleKey" @change="switchSample">
          <option value="jasmine">茉莉花（中文）</option>
          <option value="twinkle">Twinkle（英文）</option>
          <option value="empty">空白</option>
        </select>
      </label>
      <label>宽 <input v-model.number="data.width" type="range" min="240" max="900"> {{ data.width }}</label>
      <label>高 <input v-model.number="data.height" type="range" min="200" max="800"> {{ data.height }}</label>
      <label>字号 <input v-model.number="fontSize" type="range" min="12" max="36"> {{ fontSize }}</label>
      <label>行距 <input v-model.number="lineGap" type="range" min="0" max="40"> {{ lineGap }}</label>
      <label>
        字体
        <select v-model="data.fontFamily">
          <option v-for="f in FONTS" :key="f.label" :value="f.value">{{ f.label }}</option>
        </select>
      </label>
      <label>歌词色 <input v-model="color" type="color"></label>
      <label>和弦色 <input v-model="chordColor" type="color"></label>
      <label>
        新字色
        <input :value="addLyricColor || '#000000'" type="color" @input="setAddColor('lyric', $event)">
      </label>
      <label>
        新和弦色
        <input :value="addChordColor || '#000000'" type="color" @input="setAddColor('chord', $event)">
      </label>
      <button @click="clearAddColors">清除新增色（{{ addLyricColor || '无' }} / {{ addChordColor || '无' }}）</button>
    </div>

    <div class="cl-test__main">
      <div class="cl-test__stage">
        <div class="cl-test__head">
          <input v-model="data.title" class="cl-test__title" placeholder="标题（宿主自己画）">
          <input v-model="data.author" class="cl-test__author" placeholder="作者">
        </div>
        <ClSheet
          ref="sheetRef"
          :class="{'cl-test__sheet--edit': mode === 'edit'}"
          :data="data"
          :mode="mode"
          :font-size="fontSize"
          :line-gap="lineGap"
          :color="color"
          :chord-color="chordColor"
          @change="onChange"
          @selection-change="onSelectionChange"
        />
        <p class="cl-test__tips" v-if="mode === 'edit'">
          点字：选中并选和弦、颜色、下划线（← → ↑ ↓ 切换，Delete 删除和弦，Esc 取消）·
          双击 / Enter：改整行文字（Enter 拆行，行首 Backspace 合并，可粘贴多行；行尾要放和弦就打空格）·
          拖动和弦换位置（按住 Ctrl 复制）· 文本里 {颜色} 写在 [和弦] 前是和弦色、写在字前是歌词色，{u} 下划线
        </p>
      </div>

      <div class="cl-test__side">
        <section>
          <h4>选中</h4>
          <div v-if="selection" class="cl-test__sel">
            第 {{ selection.lineIndex + 1 }} 行第 {{ selection.index + 1 }} 个：「{{ selection.lyric.text }}」
            和弦 {{ selection.lyric.chord?.text ?? '无' }}
            <button @click="sheetRef?.clearSelection()">取消选中</button>
          </div>
          <div v-else class="cl-test__muted">无（编辑模式下点字）</div>
        </section>

        <section>
          <h4>
            方括号文本
            <button @click="importBracket">导入到曲谱</button>
          </h4>
          <textarea v-model="bracketText" rows="9" spellcheck="false"/>
        </section>

        <section>
          <h4>
            数据 JSON
            <button @click="copyJson">复制</button>
          </h4>
          <pre class="cl-test__json">{{ json }}</pre>
        </section>

        <section>
          <h4>事件</h4>
          <div class="cl-test__log">
            <div v-for="(l, i) in logs" :key="i">{{ l }}</div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cl-test {
  padding: 16px;
  font: 13px/1.5 system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #303133;
}

.cl-test__bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fafafa;
}

.cl-test__bar label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.cl-test__bar input[type='range'] {
  width: 90px;
}

.cl-test__main {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.cl-test__stage {
  flex: none;
}

.cl-test__head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 6px;
}

.cl-test__title {
  border: none;
  font-size: 22px;
  font-weight: 600;
  outline: none;
}

.cl-test__author {
  border: none;
  color: #909399;
  outline: none;
  text-align: right;
}

.cl-test__sheet--edit {
  box-shadow: inset 0 0 0 1px #dcdfe6;
}

.cl-test__tips {
  max-width: 560px;
  margin: 8px 0 0;
  color: #909399;
  font-size: 12px;
}

.cl-test__side {
  flex: 1;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cl-test__side h4 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 6px;
}

.cl-test__side textarea {
  box-sizing: border-box;
  width: 100%;
  font: 13px/1.5 Consolas, monospace;
}

.cl-test__json {
  max-height: 220px;
  margin: 0;
  padding: 8px;
  overflow: auto;
  border-radius: 4px;
  background: #f5f7fa;
  font-size: 11px;
}

.cl-test__log {
  max-height: 160px;
  overflow: auto;
  font: 12px/1.6 Consolas, monospace;
  color: #606266;
}

.cl-test__muted {
  color: #b1b3b8;
}

.cl-test__sel button {
  margin-left: 8px;
}
</style>
