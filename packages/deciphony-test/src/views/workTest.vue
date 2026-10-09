<script lang="ts" setup>
import SJWPDF, {
  DrawToolEnum,
  Page,
  type ElementContextMenuItem,
  type ElementContextMenuPayload,
  type ScoreRangeChangePayload,
  type SJW,
  type SjwMode,
  type SjwSelection,
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
  pdfRef.value?.endDraw()
  status.value = `已切换为${mode.value === 'edit' ? '编辑' : '展示'}模式（mode=${mode.value}）`
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

function pickRecorderMime(): string {
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
  for (const t of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t
  }
  return ''
}

async function makeDemoVideoFile(): Promise<File> {
  const mime = pickRecorderMime()
  if (!mime) throw new Error('当前浏览器无法录制演示视频，请用「添加视频文件」')
  const w = 480
  const h = 270
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const g = canvas.getContext('2d')
  if (!g) throw new Error('无法创建画布')
  const stream = canvas.captureStream(30)
  const rec = new MediaRecorder(stream, {mimeType: mime})
  const chunks: Blob[] = []
  rec.ondataavailable = (ev) => {
    if (ev.data.size) chunks.push(ev.data)
  }
  const file = await new Promise<File>((resolve, reject) => {
    rec.onerror = () => reject(new Error('录制演示视频失败'))
    rec.onstop = () => {
      const blob = new Blob(chunks, {type: mime.split(';')[0]})
      resolve(new File([blob], 'demo-video.webm', {type: blob.type}))
    }
    rec.start()
    const t0 = performance.now()
    const tick = () => {
      const t = (performance.now() - t0) / 1000
      g.fillStyle = `hsl(${(t * 90) % 360}, 62%, 42%)`
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#fff'
      g.font = '36px sans-serif'
      g.fillText('SJW 视频', 28, 120)
      g.font = '22px sans-serif'
      g.fillText(`${t.toFixed(1)}s`, 28, 160)
      if (t < 2.2) requestAnimationFrame(tick)
      else rec.stop()
    }
    tick()
  })
  stream.getTracks().forEach((tr) => tr.stop())
  return file
}

async function addDemoVideo() {
  const pdf = pdfRef.value
  if (!pdf) return
  try {
    status.value = '正在生成演示视频…'
    const file = await makeDemoVideoFile()
    const {assetId, name} = await pdf.addVideoFromFile({
      x: 80,
      y: 220,
      file,
      name: 'demo-video.webm',
    })
    lastLoadedAssetId.value = assetId
    refreshAssets()
    status.value = `addVideoFromFile：${name} → ${assetId}`
  } catch (e) {
    status.value = e instanceof Error ? e.message : String(e)
  }
}

async function onAddVideoFile(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  const pdf = pdfRef.value
  if (!file || !pdf) return
  try {
    const {assetId, name} = await pdf.addVideoFromFile({
      x: 80,
      y: 220,
      file,
      name: file.name,
    })
    lastLoadedAssetId.value = assetId
    refreshAssets()
    status.value = `addVideoFromFile：${name} → ${assetId}`
  } catch (e) {
    status.value = e instanceof Error ? e.message : String(e)
  }
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

const rangeSelecting = ref(false)

function toggleRangeSelect() {
  const pdf = pdfRef.value
  if (!pdf) return
  if (rangeSelecting.value) {
    pdf.endRangeSelect()
    rangeSelecting.value = false
    status.value = '已结束选段'
    return
  }
  const score = pdf.getPage()?.scores?.[0]
  if (!score) {
    status.value = '当前页没有曲谱'
    return
  }
  pdf.startRangeSelect(score.id)
  rangeSelecting.value = true
  status.value = '选段中：点音符设起点，再点设终点，第三次重设起点'
}

function onSelectionChange(sel: SjwSelection) {
  status.value = !sel
    ? '未选中'
    : sel.kind === 'score'
      ? `选中曲谱 ${sel.score.id}`
      : `选中${sel.element.type} ${sel.element.id}`
}

function onRangeChange(payload: ScoreRangeChangePayload) {
  const short = (id: string | null) => (id ? id.slice(0, 8) : '—')
  status.value = `选段 scores[${payload.scoreIndex}]：起点 ${short(payload.startNoteId)}，终点 ${short(payload.endNoteId)}`
}

async function handlePlayRange() {
  const pdf = pdfRef.value
  const range = pdf?.getRangeSelect()
  if (!pdf || !range) return
  const scoreIndex = pdf.getPage()?.scores?.findIndex((s) => s.id === range.scoreId) ?? 0
  try {
    await pdf.play(scoreIndex, {range})
    status.value = '选段播放'
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

async function exportImagesDemo() {
  const pdf = pdfRef.value
  if (!pdf) return
  const blob = await pdf.exportImages({
    filename: `${data.name || 'courseware'}-图片`,
    onProgress: (done: number, total: number) => (status.value = `导出图片 ${done}/${total}`),
  })
  status.value = `已导出图片 zip（${(blob.size / 1024).toFixed(0)} KB）`
}

async function exportPdfDemo() {
  const pdf = pdfRef.value
  if (!pdf) return
  const blob = await pdf.exportPdf({
    filename: data.name || 'courseware',
    onProgress: (done: number, total: number) => (status.value = `导出 PDF ${done}/${total}`),
  })
  status.value = `已导出 PDF（${(blob.size / 1024).toFixed(0)} KB）`
}

/** 当前页最后一张图片裁左上 1/4，最后一份曲谱裁上半 */
async function cropDemo() {
  const pdf = pdfRef.value
  const page = pdf?.getPage()
  if (!pdf || !page) return
  const img = [...(page.elements ?? [])].reverse().find((e) => e.type === 'image')
  const score = page.scores?.[page.scores.length - 1]
  const done: string[] = []
  if (img && img.type === 'image') {
    const w = img.naturalWidth ?? img.width
    const h = img.naturalHeight ?? img.height
    const rect = await pdf.cropImage(img.id, {startX: 0, startY: 0, endX: w / 2, endY: h / 2})
    done.push(`图片 ${JSON.stringify(rect)}`)
  }
  if (score) {
    const {width, height} = score.musicScore
    const rect = pdf.cropScore(score.id, {startX: 0, startY: 0, endX: width, endY: height / 2})
    done.push(`曲谱 ${JSON.stringify(rect)}`)
  }
  status.value = done.length ? `已裁剪：${done.join('；')}` : '当前页没有图片或曲谱'
}

function clearCropDemo() {
  const pdf = pdfRef.value
  const page = pdf?.getPage()
  if (!pdf || !page) return
  const ids = [...(page.elements ?? []).filter((e) => e.type === 'image'), ...(page.scores ?? [])].map((e) => e.id)
  const n = ids.filter((id) => pdf.clearCrop(id)).length
  status.value = `已取消 ${n} 个裁剪`
}

async function toggleCropMode() {
  const pdf = pdfRef.value
  if (!pdf) return
  if (pdf.getCropTarget()) {
    pdf.endCrop()
    return
  }
  try {
    await pdf.startCrop()
    status.value = '裁剪模式：拖四角裁剪，Esc / Enter 或点空白退出'
  } catch (e) {
    status.value = e instanceof Error ? e.message : String(e)
  }
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
  if (mode.value !== 'show' && mode.value !== 'edit') return
  pdf.startDraw()
  pdf.setTool(DrawToolEnum.Pen, {color: '#e11d48', lineWidth: 3})
  void nextTick(() => {
    const ok = pdf.isDrawing()
    status.value = !ok
      ? '绘制会话未启动（请检查 mode）'
      : mode.value === 'show'
        ? '展示标注中：笔（不保存，应挡住文本拖拽）'
        : '编辑绘制中：笔'
  })
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
  status.value = mode.value === 'show' ? '已结束展示标注' : '已结束绘制'
}

function clearPageDrawings() {
  pdfRef.value?.clearDrawings()
  status.value =
    mode.value === 'show' ? '已清空教学标注' : '已清空持久笔迹'
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
        <button type="button" @click="toggleRangeSelect">{{ rangeSelecting ? '结束选段' : '开启选段' }}</button>
        <button :disabled="!toneReady || !rangeSelecting" type="button" @click="handlePlayRange">选段播放</button>
        <button type="button" @click="addDemoImage">添加图片(FromFile)</button>
        <button type="button" @click="addDemoSvg">添加SVG(先load再id)</button>
        <button type="button" @click="addDemoAudio">添加音频(FromFile)</button>
        <button type="button" @click="addDemoVideo">添加演示视频</button>
        <label class="work-test__import">
          添加视频文件
          <input accept="video/*" type="file" @change="onAddVideoFile"/>
        </label>
        <button type="button" @click="setDemoBackground">设背景(FromFile)</button>
        <button type="button" @click="setBackgroundByLastId">按上次id设背景</button>
        <button type="button" @click="clearDemoBackground">清背景</button>
        <button type="button" @click="addDemoScore">添加曲谱</button>
        <button type="button" @click="startDrawSession">
          {{ mode === 'show' ? '开始标注' : '开始绘制' }}
        </button>
        <button type="button" @click="usePen">笔</button>
        <button type="button" @click="useEraser">橡皮</button>
        <button type="button" @click="endDrawSession">
          {{ mode === 'show' ? '结束标注' : '结束绘制' }}
        </button>
        <button type="button" @click="clearPageDrawings">
          {{ mode === 'show' ? '清空标注' : '清空笔迹' }}
        </button>
        <button type="button" @click="checkAssets">检测资源引用</button>
        <button type="button" @click="exportDemo">导出 sjw</button>
        <button type="button" @click="exportImagesDemo">导出图片(zip)</button>
        <button type="button" @click="exportPdfDemo">导出 PDF</button>
        <button type="button" @click="cropDemo">裁剪(图片1/4·曲谱上半)</button>
        <button type="button" @click="clearCropDemo">取消裁剪</button>
        <button type="button" @click="toggleCropMode">裁剪模式(选中项)</button>
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
          @range-change="onRangeChange"
          @selection-change="onSelectionChange"
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
