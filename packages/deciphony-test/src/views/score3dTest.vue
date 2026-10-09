<script lang="ts" setup>
import type {MusicScore} from '@deciphony/renderer'
import {Score3D, type Score3DBounds, type Score3DCameraState, type Score3DExpose} from '@deciphony/extensions/dr-score3d'
import {drTitle} from '@deciphony/extensions/dr-title'
import {musicXmlFileToMusicScore} from '@deciphony/extensions/dr-musicxml-transfer'
import {computed, ref, shallowRef} from 'vue'
import qdl from './data/其多列'
import qdlNumber from './data/其多列简谱'
import {buildDrumSample} from './data/drumSample'

const SAMPLES: {key: string; label: string; build: () => MusicScore}[] = [
  {key: 'staff', label: '其多列（五线谱）', build: () => qdl as unknown as MusicScore},
  {key: 'number', label: '其多列（简谱）', build: () => qdlNumber as unknown as MusicScore},
  {key: 'drum', label: '鼓谱示例', build: buildDrumSample},
]

const sampleKey = ref('staff')
const uploaded = shallowRef<MusicScore | null>(null)
const score = computed<MusicScore>(() => uploaded.value ?? SAMPLES.find((s) => s.key === sampleKey.value)!.build())

const background = ref('#1f2228')
const showPaper = ref(true)
const paperColor = ref('#ffffff')
const depth = ref(2)
const useColor = ref(false)
const color = ref('#222222')
const showTitle = ref(true)
const fov = ref(45)
const focus = ref(0)
const message = ref('')

const viewRef = ref<Score3DExpose | null>(null)
const bounds = ref<Score3DBounds | null>(null)
const cameraText = ref('')

const paper = computed(() => showPaper.value ? {color: paperColor.value} : false)
const extensions = computed(() => showTitle.value ? [drTitle()] : [])

function onBuilt(b: Score3DBounds) {
  bounds.value = b
  refreshCamera()
}

function refreshCamera() {
  const c: Score3DCameraState | undefined = viewRef.value?.getCamera()
  if (!c) return
  const f = (v: {x: number; y: number; z: number}) => `(${v.x.toFixed(0)}, ${v.y.toFixed(0)}, ${v.z.toFixed(0)})`
  cameraText.value = `position ${f(c.position)}  target ${f(c.target)}  fov ${c.fov.toFixed(0)}`
}

function presetSide() {
  const b = bounds.value
  if (!b) return
  const h = b.max.y - b.min.y
  const cy = (b.max.y + b.min.y) / 2
  viewRef.value?.setCamera({
    position: {x: b.min.x - h * 1.2, y: cy + h * 0.4, z: h * 0.9},
    target: {x: b.min.x + h * 3, y: cy, z: 0},
  }, {duration: 800})
}

function presetTop() {
  const b = bounds.value
  if (!b) return
  const h = b.max.y - b.min.y
  const cy = (b.max.y + b.min.y) / 2
  const x = b.min.x + h * 1.5
  viewRef.value?.setCamera({position: {x, y: cy + h * 2.2, z: h * 1.1}, target: {x, y: cy, z: 0}}, {duration: 800})
}

function applyFov() {
  viewRef.value?.setCamera({fov: fov.value}, {duration: 300})
}

function applyFocus() {
  const b = bounds.value
  if (!b) return
  viewRef.value?.focusX(b.min.x + (b.max.x - b.min.x) * focus.value / 100, {duration: 300})
}

function screenshot() {
  const url = viewRef.value?.toDataURL('image/png')
  if (!url) return
  const a = document.createElement('a')
  a.href = url
  a.download = 'score3d.png'
  a.click()
}

async function onFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const {musicScore, warnings} = await musicXmlFileToMusicScore(file)
    uploaded.value = musicScore
    message.value = warnings.length ? `已导入，${warnings.length} 条警告` : '已导入'
  } catch (reason) {
    message.value = reason instanceof Error ? reason.message : String(reason)
  }
}

function useSample() {
  uploaded.value = null
  message.value = ''
}
</script>

<template>
  <main class="score3d-test">
    <section class="toolbar">
      <label>曲谱
        <select v-model="sampleKey" @change="useSample">
          <option v-for="s in SAMPLES" :key="s.key" :value="s.key">{{ s.label }}</option>
        </select>
      </label>
      <label>MusicXML <input accept=".xml,.musicxml,.mxl" type="file" @change="onFile"/></label>
      <label>背景 <input v-model="background" type="color"/></label>
      <label><input v-model="showPaper" type="checkbox"/> 纸张</label>
      <label v-if="showPaper">纸色 <input v-model="paperColor" type="color"/></label>
      <label>厚度 <input v-model.number="depth" max="12" min="0" step="1" type="range"/> {{ depth }}</label>
      <label><input v-model="useColor" type="checkbox"/> 覆盖符号色</label>
      <label v-if="useColor"><input v-model="color" type="color"/></label>
      <label><input v-model="showTitle" type="checkbox"/> 标题</label>
      <span v-if="message" class="message">{{ message }}</span>
    </section>
    <section class="toolbar">
      <button @click="viewRef?.resetCamera({duration: 800})">默认视角</button>
      <button @click="viewRef?.fitView({duration: 800})">正视全谱</button>
      <button @click="presetSide">从左沿谱看</button>
      <button @click="presetTop">俯视</button>
      <label>fov <input v-model.number="fov" max="100" min="15" step="1" type="range" @change="applyFov"/> {{ fov }}</label>
      <label>移到 <input v-model.number="focus" max="100" min="0" step="1" type="range" @input="applyFocus"/> {{ focus }}%</label>
      <button @click="refreshCamera">读取相机</button>
      <button @click="screenshot">截图</button>
      <span class="hint">{{ cameraText }}</span>
    </section>
    <div class="stage">
      <Score3D
          ref="viewRef"
          :background="background"
          :color="useColor ? color : undefined"
          :depth="depth"
          :extensions="extensions"
          :music-score="score"
          :paper="paper"
          @built="onBuilt"
      />
    </div>
    <p class="hint">左键拖动旋转，右键拖动平移，滚轮缩放。世界坐标：x = 曲谱 x，y = −曲谱 y，z 朝向观察者。</p>
  </main>
</template>

<style scoped>
.score3d-test {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100vh;
  padding: 12px;
  box-sizing: border-box;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.stage {
  flex: 1;
  min-height: 0;
  border: 1px solid #ddd;
}

.hint {
  color: #666;
  font-size: 12px;
}

.message {
  color: #e6a23c;
}
</style>
