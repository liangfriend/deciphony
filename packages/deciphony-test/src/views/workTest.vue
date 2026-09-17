<script lang="ts" setup>
import SJWPDF, {
  DrawToolEnum,
  Page,
  type ElementContextMenuItem,
  type ElementContextMenuPayload,
  type SJW,
  type SjwMode,
} from '@deciphony/work'
import {computed, nextTick, onMounted, reactive, ref} from 'vue'
import mockSjw from './data/mockSjw'
import sampleScore from './data/其多列'
import imgXiDuo from '../assets/resources/xiDuoChuan.jpg'
import imgVue from '../assets/resources/vue.svg'
import audioSample from '../assets/resources/sample-3s.mp3'
import piano from '../assets/toneColor/accoustic_grand_piano.json'
import demoSjwUrl from '../assets/未命名作品.sjw?url'

const data = reactive(structuredClone(mockSjw) as SJW)
const pageIndex = ref(0)
const mode = ref<SjwMode>('edit')
const thumbScale = 0.12
const pdfRef = ref<InstanceType<typeof SJWPDF> | null>(null)
const assetNames = ref<string[]>([])
const status = ref('')
const toneReady = ref(false)
/** 曲谱 NPlayer 音量 0～1 */
const scoreVolume = ref(1)
/** 演示：先 loadAsset 再用 id 添加 */
const lastLoadedAssetId = ref('')

const contextMenu = ref<ElementContextMenuItem[]>([])

function onBeforeContextMenu(ctx: ElementContextMenuPayload) {
  if (ctx.kind === 'score') {
    contextMenu.value = [
      {
        text: '查看目标信息',
        callback: (p) => {
          const v = p.vocalPerformance
          const a = p.accompaniment
          status.value =
            `右键曲谱 · id=${p.score?.id}` +
            ` · 范唱=${v ? `${v.name}(${v.src})` : '无'}` +
            ` · 伴奏=${a ? `${a.name}(${a.src})` : '无'}`
        },
      },
      {
        text: '复制曲谱 id',
        callback: (p) => {
          const id = p.score?.id ?? ''
          void navigator.clipboard?.writeText(id)
          status.value = `已复制 id：${id}`
        },
      },
    ]
    return
  }
  contextMenu.value = [
    {
      text: '查看目标信息',
      callback: (p) => {
        if (p.element) {
          status.value = `右键 ${p.element.type} · id=${p.element.id} · page=${p.pageIndex} · mode=${p.mode}`
        }
      },
    },
    {
      text: '复制元素 id',
      callback: (p) => {
        const id = p.element?.id ?? ''
        void navigator.clipboard?.writeText(id)
        status.value = `已复制 id：${id}`
      },
    },
  ]
}

const pages = computed(() => data.pages)
const currentPage = computed(() => data.pages[pageIndex.value] ?? null)

onMounted(async () => {
  await nextTick()
  const pdf = pdfRef.value
  if (!pdf) return
  try {
    const res = await fetch(demoSjwUrl)
    const blob = await res.blob()
    const loaded = await pdf.loadSjw(blob)
    Object.assign(data, structuredClone(loaded))
    pageIndex.value = 0
    refreshAssets()
    status.value = `已加载 未命名作品.sjw · 页 ${data.pages.length} · 资源 ${assetNames.value.length}`
  } catch (e) {
    status.value = e instanceof Error ? e.message : String(e)
    if (!(currentPage.value?.scores?.length)) {
      pdf.addScore({
        x: 40,
        y: 80,
        musicScore: structuredClone(sampleScore),
      })
    }
  }
  await pdf.addToneColor('piano', piano as Record<number, string>)
  pdf.setToneColorName('piano')
  applyScoreVolume()
  toneReady.value = true
  if (!status.value) status.value = '已加载 piano 音色；可播放 scores[0]'
  else status.value += '；已加载 piano 音色'
})

function selectPage(index: number) {
  pageIndex.value = index
}

function toggleMode() {
  mode.value = mode.value === 'edit' ? 'show' : 'edit'
  status.value = `已切换为${mode.value === 'edit' ? '编辑' : '展示'}模式`
}

function onPageSizeInput(field: 'width' | 'height', ev: Event) {
  const page = currentPage.value
  if (!page) return
  const n = Number((ev.target as HTMLInputElement).value)
  if (!Number.isFinite(n) || n <= 0) return
  page[field] = Math.round(n)
}

function refreshAssets() {
  assetNames.value =
    pdfRef.value?.listAssets().map((a) => `${a.name} → ${a.id}`) ?? []
}

function resolveThumb(src: string | undefined): string {
  if (!src) return ''
  return pdfRef.value?.resolveSrc(src) || src
}

async function urlToFile(url: string, filename: string): Promise<File> {
  const res = await fetch(url)
  const blob = await res.blob()
  return new File([blob], filename, {type: blob.type || undefined})
}

/** FromFile：内部 loadAsset + 放置 */
async function addDemoImage() {
  const pdf = pdfRef.value
  if (!pdf) return
  const file = await urlToFile(imgXiDuo, 'xiDuoChuan.jpg')
  const {assetId, name} = await pdf.addImageFromFile({
    x: 60,
    y: 160,
    file,
    name: 'xiDuoChuan.jpg',
  })
  lastLoadedAssetId.value = assetId
  refreshAssets()
  status.value = `addImageFromFile：${name} → ${assetId}`
}

/** 先 loadAsset，再按 id 添加（宿主自定义缓存） */
async function addDemoSvg() {
  const pdf = pdfRef.value
  if (!pdf) return
  const file = await urlToFile(imgVue, 'vue.svg')
  const {id, name} = pdf.loadAsset(file, 'vue.svg')
  lastLoadedAssetId.value = id
  await pdf.addImage({
    x: 420,
    y: 160,
    assetId: id,
  })
  refreshAssets()
  status.value = `loadAsset + addImage(id)：${name} → ${id}`
}

async function addDemoAudio() {
  const pdf = pdfRef.value
  if (!pdf) return
  const file = await urlToFile(audioSample, 'sample-3s.mp3')
  const {assetId, name} = pdf.addAudioFromFile({
    x: 60,
    y: 400,
    file,
    name: 'sample-3s.mp3',
  })
  lastLoadedAssetId.value = assetId
  refreshAssets()
  status.value = `addAudioFromFile：${name} → ${assetId}`
}

async function setDemoBackground() {
  const pdf = pdfRef.value
  if (!pdf) return
  const file = await urlToFile(imgXiDuo, 'xiDuoChuan.jpg')
  const {assetId, name} = pdf.setBackgroundFromFile(file, 'bg-xiDuo.jpg')
  lastLoadedAssetId.value = assetId
  refreshAssets()
  status.value = `背景：${name} → ${assetId}`
}

function clearDemoBackground() {
  pdfRef.value?.clearBackground()
  status.value = '已清除背景'
}

function setBackgroundByLastId() {
  const pdf = pdfRef.value
  if (!pdf || !lastLoadedAssetId.value) {
    status.value = '请先载入资源'
    return
  }
  try {
    pdf.setBackground(lastLoadedAssetId.value)
    status.value = `按 id 设背景：${lastLoadedAssetId.value}`
  } catch (e) {
    status.value = e instanceof Error ? e.message : String(e)
  }
}

function addDemoScore() {
  const pdf = pdfRef.value
  if (!pdf) return
  const id = pdf.addScore({
    x: 40,
    y: 520,
    musicScore: structuredClone(sampleScore),
  })
  status.value = `已添加曲谱 ${id}（框尺寸=${sampleScore.width}×${sampleScore.height}）`
}

function handleAddPage() {
  const pdf = pdfRef.value
  if (!pdf) return
  const {index} = pdf.addPage()
  pageIndex.value = index
  status.value = `已添加第 ${index + 1} 页`
}

function handleInsertPage() {
  const pdf = pdfRef.value
  if (!pdf) return
  const {index} = pdf.insertPage(pageIndex.value)
  pageIndex.value = index
  status.value = `已在当前位置插入第 ${index + 1} 页`
}

function handleRemovePage() {
  const pdf = pdfRef.value
  if (!pdf) return
  const removing = pageIndex.value
  const ok = pdf.removePage(removing)
  if (!ok) {
    status.value = pages.value.length <= 1 ? '至少保留一页' : '删除失败'
    return
  }
  if (pageIndex.value >= data.pages.length) {
    pageIndex.value = Math.max(0, data.pages.length - 1)
  }
  status.value = `已删除原第 ${removing + 1} 页，当前第 ${pageIndex.value + 1} 页`
}

async function handlePlay() {
  const pdf = pdfRef.value
  if (!pdf) return
  try {
    await pdf.play(0)
    status.value = '播放曲谱 MIDI scores[0]'
  } catch (e) {
    status.value = e instanceof Error ? e.message : String(e)
  }
}

async function handlePlayAccompaniment() {
  const pdf = pdfRef.value
  if (!pdf) return
  try {
    await pdf.playAccompaniment(0)
    status.value = '播放伴奏 scores[0]（互斥停曲谱/范唱）'
  } catch (e) {
    status.value = e instanceof Error ? e.message : String(e)
  }
}

async function handlePlayVocal() {
  const pdf = pdfRef.value
  if (!pdf) return
  try {
    await pdf.playVocal(0)
    status.value = '播放范唱 scores[0]（互斥停曲谱/伴奏）'
  } catch (e) {
    status.value = e instanceof Error ? e.message : String(e)
  }
}

function handlePause() {
  pdfRef.value?.pause()
  status.value = '已暂停'
}

function handleStop() {
  pdfRef.value?.stop()
  status.value = '已停止'
}

function applyScoreVolume() {
  const player = pdfRef.value?.getPlayer()
  if (!player) return
  player.volume = scoreVolume.value
}

function onScoreVolumeInput(ev: Event) {
  const v = Number((ev.target as HTMLInputElement).value)
  scoreVolume.value = Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1
  applyScoreVolume()
}

function checkAssets() {
  const pdf = pdfRef.value
  if (!pdf) return
  const lines = pdf.listAssets().map((a) => {
    const used = pdf.isAssetUsed(a.id)
    const usages = pdf.findAssetUsages(a.id)
    return `${a.name}(${a.id}) · used=${used} · refs=${usages.length}`
  })
  status.value = lines.length ? lines.join(' | ') : '缓存为空'
  refreshAssets()
}

async function exportDemo() {
  const pdf = pdfRef.value
  if (!pdf) return
  await pdf.exportSjw(`${data.name || 'courseware'}.sjw`)
  status.value = '已导出 .sjw'
}

async function onImportSjw(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !pdfRef.value) return
  const loaded = await pdfRef.value.loadSjw(file)
  Object.assign(data, structuredClone(loaded))
  pageIndex.value = 0
  refreshAssets()
  status.value = `已加载 ${file.name}，资源 ${assetNames.value.length} 个`
}

function onLoaded(payload: {data: SJW}) {
  Object.assign(data, structuredClone(payload.data))
  pageIndex.value = 0
  refreshAssets()
}

function startDrawSession() {
  const pdf = pdfRef.value
  if (!pdf) return
  pdf.startDraw()
  pdf.setTool(DrawToolEnum.Pen, {color: '#222222', lineWidth: 3})
  status.value = '绘制中：笔'
}

function usePen() {
  pdfRef.value?.setTool(DrawToolEnum.Pen, {color: '#222222', lineWidth: 3})
  status.value = '工具：笔'
}

function useEraser() {
  pdfRef.value?.setTool(DrawToolEnum.Eraser, {lineWidth: 24})
  status.value = '工具：橡皮'
}

function endDrawSession() {
  pdfRef.value?.endDraw()
  status.value = '已结束绘制'
}

function clearPageDrawings() {
  pdfRef.value?.clearDrawings()
  status.value = '已清空笔迹'
}
</script>

<template>
  <div class="work-test">
    <header class="work-test__bar">
      <h1 class="work-test__title">@deciphony/work 资源 / 导出测试</h1>
      <p class="work-test__hint">
        资源：loadAsset（id+自定义名）；放置用 id 或 *FromFile。背景为图片 src。
      </p>
      <div class="work-test__actions">
        <button type="button" @click="toggleMode">
          {{ mode === 'edit' ? '切到展示模式' : '切到编辑模式' }}
        </button>
        <button :disabled="!toneReady" type="button" @click="handlePlay">曲谱播放</button>
        <button :disabled="!toneReady" type="button" @click="handlePlayAccompaniment">伴奏播放</button>
        <button :disabled="!toneReady" type="button" @click="handlePlayVocal">范唱播放</button>
        <button type="button" @click="handlePause">暂停</button>
        <button type="button" @click="handleStop">停止</button>
        <button type="button" @click="addDemoImage">添加图片(FromFile)</button>
        <button type="button" @click="addDemoSvg">添加SVG(先load再id)</button>
        <button type="button" @click="addDemoAudio">添加音频(FromFile)</button>
        <button type="button" @click="setDemoBackground">设背景(FromFile)</button>
        <button type="button" @click="setBackgroundByLastId">按上次id设背景</button>
        <button type="button" @click="clearDemoBackground">清背景</button>
        <button type="button" @click="addDemoScore">添加曲谱</button>
        <button type="button" @click="startDrawSession">开始绘制</button>
        <button type="button" @click="usePen">笔</button>
        <button type="button" @click="useEraser">橡皮</button>
        <button type="button" @click="endDrawSession">结束绘制</button>
        <button type="button" @click="clearPageDrawings">清空笔迹</button>
        <button type="button" @click="checkAssets">检测资源引用</button>
        <button type="button" @click="exportDemo">导出 sjw</button>
        <label class="work-test__volume">
          音量
          <input
            :value="scoreVolume"
            max="1"
            min="0"
            step="0.01"
            type="range"
            @input="onScoreVolumeInput"
          />
          <span>{{ scoreVolume.toFixed(2) }}</span>
        </label>
        <label class="work-test__import">
          导入 sjw
          <input accept=".sjw,application/zip" type="file" @change="onImportSjw"/>
        </label>
        <label v-if="currentPage" class="work-test__size">
          宽
          <input
            :value="currentPage.width"
            min="1"
            step="1"
            type="number"
            @input="onPageSizeInput('width', $event)"
          />
        </label>
        <label v-if="currentPage" class="work-test__size">
          高
          <input
            :value="currentPage.height"
            min="1"
            step="1"
            type="number"
            @input="onPageSizeInput('height', $event)"
          />
        </label>
      </div>
      <p v-if="status" class="work-test__status">{{ status }}</p>
      <p v-if="assetNames.length" class="work-test__assets">
        缓存：{{ assetNames.join(', ') }}
      </p>
    </header>

    <div class="work-test__stage">
      <aside class="work-test__thumbs">
        <div class="work-test__meta">
          <div class="work-test__name">{{ data.name }}</div>
          <div class="work-test__author">{{ data.author }}</div>
          <div class="work-test__page-ops">
            <button type="button" @click="handleAddPage">+ 页</button>
            <button type="button" @click="handleInsertPage">插入</button>
            <button type="button" @click="handleRemovePage">删除</button>
          </div>
        </div>
        <button
          v-for="(page, index) in pages"
          :key="page.id"
          class="work-test__thumb"
          :class="{'work-test__thumb--active': index === pageIndex}"
          type="button"
          @click="selectPage(index)"
        >
          <div
            class="work-test__thumb-frame"
            :style="{
              width: `${page.width * thumbScale}px`,
              height: `${page.height * thumbScale}px`,
            }"
          >
            <img
              v-if="page.thumbnail"
              class="work-test__thumb-img"
              :alt="page.id"
              :src="resolveThumb(page.thumbnail)"
            />
            <div
              v-else
              class="work-test__thumb-inner"
              :style="{
                width: `${page.width}px`,
                height: `${page.height}px`,
                transform: `scale(${thumbScale})`,
              }"
            >
              <Page
                :page="page"
                thumbnail
                :resolve-src="(src) => pdfRef?.resolveSrc(src) || src"
              />
            </div>
          </div>
          <span class="work-test__thumb-label">{{ index + 1 }}</span>
        </button>
      </aside>

      <div class="work-test__content">
        <SJWPDF
          ref="pdfRef"
          :context-menu="contextMenu"
          :data="data"
          :mode="mode"
          :page-index="pageIndex"
          @before-context-menu="onBeforeContextMenu"
          @loaded="onLoaded"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.work-test {
  display: flex;
  flex-direction: column;
  height: 100vh;
  box-sizing: border-box;
}

.work-test__bar {
  flex: 0 0 auto;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
}

.work-test__title {
  margin: 0;
  font-size: 16px;
}

.work-test__hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: #909399;
}

.work-test__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.work-test__actions button,
.work-test__import {
  font-size: 12px;
  padding: 4px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #f5f7fa;
  cursor: pointer;
}

.work-test__import {
  display: inline-flex;
  align-items: center;
}

.work-test__volume {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;
}

.work-test__volume input[type='range'] {
  width: 100px;
  vertical-align: middle;
}

.work-test__import input {
  display: none;
}

.work-test__size {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;
}

.work-test__size input {
  width: 88px;
  padding: 4px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-sizing: border-box;
}

.work-test__status,
.work-test__assets {
  margin: 8px 0 0;
  font-size: 12px;
  color: #606266;
  word-break: break-all;
}

.work-test__stage {
  flex: 1;
  min-height: 0;
  display: flex;
}

.work-test__thumbs {
  flex: 0 0 160px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  overflow: auto;
  border-right: 1px solid #e4e7ed;
  background: #fafafa;
  box-sizing: border-box;
}

.work-test__meta {
  padding: 4px 2px 8px;
}

.work-test__name {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  word-break: break-all;
}

.work-test__author {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.work-test__page-ops {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.work-test__page-ops button {
  font-size: 11px;
  padding: 2px 6px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

.work-test__thumb {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
}

.work-test__thumb:hover {
  background: #f5f7fa;
}

.work-test__thumb--active {
  border-color: #409eff;
  background: #ecf5ff;
}

.work-test__thumb-frame {
  position: relative;
  overflow: hidden;
  background: #fff;
  border: 1px solid #dcdfe6;
}

.work-test__thumb-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.work-test__thumb-inner {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: top left;
  pointer-events: none;
}

.work-test__thumb-label {
  font-size: 12px;
  color: #606266;
}

.work-test__content {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
</style>
