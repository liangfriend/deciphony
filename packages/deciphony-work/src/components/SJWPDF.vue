<script lang="ts" setup>
import {computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch} from 'vue'
import type {ToneColor} from '@deciphony/player'
import type {Skin} from '@deciphony/renderer'
import {DrawToolEnum} from '../enums/drawToolEnum'
import type {
  CropArea,
  CropOptions,
  DrawBrushOptions,
  RemoveAssetOptions,
  ScoreAudioRef,
  ScoreRangeChangePayload,
  ScoreRangeSelect,
  SElement,
  SJW,
  SjwMode,
  SjwSelection,
  SPage,
  SScore,
} from '../types/types'
import type {
  ContextMenuEntry,
  ElementContextMenuItem,
  ElementContextMenuPayload,
  ResolvedScoreAudio,
} from '../types/contextMenu'
import {
  addAudio,
  type AddAudioOptions,
  addImage,
  type AddImageOptions,
  addText,
  type AddTextOptions,
  addVideo,
  type AddVideoOptions,
  removeElement,
} from '../api/elements'
import {clearBackground, setBackground} from '../api/background'
import {
  addScore,
  type AddScoreHostOptions,
  type AddScoreOptions,
  collectScoreAssetSrcs,
  removeScore,
  type ScoreSkinHostInput,
} from '../api/scores'
import {isSkinPack, resolveSkinPack, skinPackToFile} from '../assets/skinAsset'
import {addPage, type AddPageOptions, insertPage, removePage,} from '../api/pages'
import {createAssetStore} from '../assets/assetStore'
import {buildSjwBlob, downloadSjw, parseSjw} from '../assets/sjwIO'
import {createScorePlayback, type ScorePlayHost, type ScorePlayOptions} from '../play/scorePlayback'
import {clearCrop, cropImage, cropScore, ensureImageNaturalSize} from '../api/crop'
import {
  cropScoreByGrandStaff,
  getScoreVerticalBands,
  type CropScoreByGrandStaffOptions,
} from '../api/scoreGrandStaffCrop'
import {parseSkinFile} from '../assets/skinAsset'
import {
  downloadBlob,
  exportPageImage,
  exportPagesAsImages,
  exportPagesAsPdf,
  type ExportImagesOptions,
  type ExportPdfOptions,
} from '../export/exportWork'
import type {ExportAssetContext} from '../export/renderPage'
import AnnotateLayer from './AnnotateLayer.vue'
import ContextMenu from './ContextMenu.vue'
import Page from './Page.vue'

/** 白板四周留白，保证滚动内容区始终大于 page */
const PAGE_GUTTER_PX = 48

const props = withDefaults(
    defineProps<{
      data: SJW
      /** 当前页码（0-based） */
      pageIndex: number
      /** show | edit，编辑模式显示通用编辑框 */
      mode?: SjwMode
      /**
       * 元素右键自定义菜单项（自带「删除」）。
       * 回调入参含 element / page / pageIndex / data / mode。
       */
      contextMenu?: ElementContextMenuItem[]
    }>(),
    {
      mode: 'show',
      contextMenu: () => [],
    },
)

const emit = defineEmits<{
  loaded: [payload: { data: SJW }]
  /**
   * 打开自定义菜单前触发；payload 与菜单项 callback 相同。
   * 可在此同步改写 `:context-menu`，随后按最新 props 弹菜单。
   */
  beforeContextMenu: [payload: ElementContextMenuPayload]
  /** 选段模式下点击音符改变起止后触发（clearRangeSelect 也会触发） */
  rangeChange: [payload: ScoreRangeChangePayload]
  /** 选中目标变化：选中 / 取消选中 / 换页 / 切到 show / 选中项被删除 */
  selectionChange: [payload: SjwSelection]
  /** 进入 / 退出裁剪模式（退出为 null）；选中项变化、换页、切 show、开始绘制都会退出 */
  cropModeChange: [payload: SjwSelection]
}>()

const store = createAssetStore()
const scoreHosts = ref(new Map<string, ScorePlayHost>())
const rootRef = ref<HTMLElement | null>(null)
const pageRef = ref<InstanceType<typeof Page> | null>(null)
/** 展示模式教学标注层（铺满内容区，可画到白板外） */
const annotateRef = ref<InstanceType<typeof AnnotateLayer> | null>(null)
/** 绘制/标注会话由宿主 startDraw/endDraw 驱动：edit → Page 持久层；show → AnnotateLayer */
const inkSession = ref(false)

watch(
    () => props.mode,
    () => {
      inkSession.value = false
    },
)

/** 工具状态留在 SJWPDF，Page / AnnotateLayer 重新挂载后补发 */
let activeDrawTool: DrawToolEnum = DrawToolEnum.Pen
const brushOptionsByTool: Partial<Record<DrawToolEnum, DrawBrushOptions>> = {}

function setDrawTool(tool: DrawToolEnum, options: DrawBrushOptions = {}) {
  pageRef.value?.setTool(tool, options)
  annotateRef.value?.setTool(tool, options)
  activeDrawTool = tool
  brushOptionsByTool[tool] = {...brushOptionsByTool[tool], ...options}
}

watch([pageRef, annotateRef], () => {
  for (const tool of [DrawToolEnum.Pen, DrawToolEnum.Eraser]) {
    const opts = brushOptionsByTool[tool]
    if (!opts) continue
    pageRef.value?.setTool(tool, opts)
    annotateRef.value?.setTool(tool, opts)
  }
  pageRef.value?.setTool(activeDrawTool)
  annotateRef.value?.setTool(activeDrawTool)
})

type OpenMenu = {
  x: number
  y: number
  kind: 'element' | 'score'
  element?: SElement
  score?: SScore
}

const openMenu = ref<OpenMenu | null>(null)

const currentPage = computed<SPage | null>(() => {
  const list = props.data.pages ?? []
  return list[props.pageIndex] ?? null
})

/** 显式计算，避免模板里 mode 被其它同名绑定干扰 */
const sjwMode = computed<SjwMode>(() => props.mode ?? 'show')

/** Page 内部选中的 id（经 selectionChange 同步） */
const selectedId = ref<string | null>(null)

const selection = computed<SjwSelection>(() => {
  const id = selectedId.value
  const page = currentPage.value
  if (!id || !page || sjwMode.value !== 'edit') return null
  const score = page.scores?.find((s) => s.id === id)
  if (score) return {kind: 'score', score}
  const element = page.elements?.find((e) => e.id === id)
  return element ? {kind: 'element', element} : null
})

function clearSelection() {
  pageRef.value?.clearSelection()
  selectedId.value = null
}

/** 只在选中目标（对象引用）变化时发事件；改选中项自身属性不重复触发 */
watch(
    () => {
      const s = selection.value
      return s ? (s.kind === 'score' ? s.score : s.element) : null
    },
    () => {
      // 选中项被删除：同步清掉 Page 里残留的 id
      if (!selection.value && selectedId.value && sjwMode.value === 'edit') clearSelection()
      emit('selectionChange', selection.value)
    },
)

/** Page 内部裁剪模式的目标 id（经 cropChange 同步）；只会是当前选中项 */
const cropId = ref<string | null>(null)

const cropTarget = computed<SjwSelection>(() => {
  const s = selection.value
  if (!s || !cropId.value) return null
  const id = s.kind === 'score' ? s.score.id : s.element.id
  return id === cropId.value ? s : null
})

watch(
    () => {
      const s = cropTarget.value
      return s ? (s.kind === 'score' ? s.score : s.element) : null
    },
    () => emit('cropModeChange', cropTarget.value),
)

function canCrop(target: { kind: 'score' | 'element'; element?: SElement }): boolean {
  return target.kind === 'score' || target.element?.type === 'image'
}

/**
 * 进入裁剪模式（默认当前选中项）：仅 edit 模式、曲谱或图片；图片没记录原始尺寸时先读取。
 * 绘制中不能裁剪；会结束选段。
 */
async function startCrop(id: string | null = selectedId.value) {
  if (sjwMode.value !== 'edit') throw new Error('仅编辑模式可以裁剪')
  if (inkSession.value) throw new Error('绘制中不能裁剪，请先 endDraw')
  if (!id) throw new Error('没有选中要裁剪的曲谱或图片')
  const page = requirePage()
  if (!page.scores?.some((s) => s.id === id)) {
    const el = page.elements?.find((e) => e.id === id)
    if (!el) throw new Error(`当前页不存在曲谱或元素: ${id}`)
    if (el.type !== 'image') throw new Error(`元素 ${id} 不是图片，无法裁剪`)
    await ensureImageNaturalSize(el, (src) => store.getAsset(src))
  }
  endRangeSelect()
  pageRef.value?.startCrop(id)
}

function endCrop() {
  pageRef.value?.endCrop()
}

function onCropKeydown(ev: KeyboardEvent) {
  if (!cropTarget.value || (ev.key !== 'Escape' && ev.key !== 'Enter')) return
  const el = ev.target as HTMLElement | null
  if (el?.closest('input, textarea, select, [contenteditable="true"]')) return
  ev.preventDefault()
  endCrop()
}

function resolveScoreAudio(ref: ScoreAudioRef | undefined): ResolvedScoreAudio | undefined {
  if (!ref) return undefined
  return {
    src: ref.src,
    name: ref.name,
    author: ref.author,
    url: store.resolveSrc(ref.src),
    file: store.getAsset(ref.src),
  }
}

function buildContextPayload(menu: OpenMenu): ElementContextMenuPayload {
  const payload: ElementContextMenuPayload = {
    kind: menu.kind,
    element: menu.element,
    score: menu.score,
    page: requirePage(),
    pageIndex: props.pageIndex,
    data: props.data,
    mode: props.mode,
  }
  if (menu.kind === 'score' && menu.score) {
    payload.vocalPerformance = resolveScoreAudio(menu.score.vocalPerformance)
    payload.accompaniment = resolveScoreAudio(menu.score.accompaniment)
  }
  return payload
}

/** SJWPDF 层：范唱/伴奏可传 File 或已有 ScoreAudioRef */
function resolveScoreAudioInput(
    input: AddScoreHostOptions['vocalPerformance'],
): ScoreAudioRef | undefined {
  if (!input) return undefined
  if ('src' in input && typeof (input as ScoreAudioRef).src === 'string') {
    const ref = input as ScoreAudioRef
    requireAsset(ref.src)
    return {
      src: ref.src,
      name: ref.name,
      ...(ref.author !== undefined ? {author: ref.author} : {}),
    }
  }
  if ('assetId' in input && input.assetId) {
    requireAsset(input.assetId)
    const rec = store.getAssetRecord(input.assetId)!
    return {
      src: input.assetId,
      name: input.name ?? rec.name,
      ...(input.author !== undefined ? {author: input.author} : {}),
    }
  }
  if ('file' in input && input.file) {
    const rec = loadAsset(input.file, input.name)
    return {
      src: rec.id,
      name: input.name ?? rec.name,
      ...(input.author !== undefined ? {author: input.author} : {}),
    }
  }
  throw new Error('范唱/伴奏需提供 src、assetId 或 file')
}

/** SJWPDF 层：皮肤可传资源 id / File / SkinPack / Skin（对象会序列化成新 .json） */
function resolveScoreSkinInput(input: ScoreSkinHostInput | undefined): string | undefined {
  if (input == null) return undefined
  if (typeof input === 'string') {
    if (!input) return undefined
    requireAsset(input)
    return input
  }
  // Skin 是 Record<string, SkinPack>，`in` 收窄后字段仍可能是 SkinPack，需再按 typeof 判断
  const name = 'name' in input && typeof input.name === 'string' ? input.name : undefined
  if ('assetId' in input && typeof input.assetId === 'string' && input.assetId) {
    requireAsset(input.assetId)
    return input.assetId
  }
  if ('file' in input && input.file instanceof File) {
    const rec = loadAsset(input.file, name)
    return rec.id
  }
  if ('skin' in input && input.skin) {
    const skinName = 'skinName' in input && typeof input.skinName === 'string' ? input.skinName : undefined
    const pack = resolveSkinPack(input.skin, skinName)
    const rec = loadAsset(skinPackToFile(pack, name ?? 'skin.json'), name)
    return rec.id
  }
  if (isSkinPack(input)) {
    const rec = loadAsset(skinPackToFile(input), 'skin.json')
    return rec.id
  }
  const pack = resolveSkinPack(input as Skin)
  const rec = loadAsset(skinPackToFile(pack), 'skin.json')
  return rec.id
}

function menuEntries(menu: OpenMenu): ContextMenuEntry[] {
  const payload = buildContextPayload(menu)
  const customs: ContextMenuEntry[] = (props.contextMenu ?? [])
      .filter((item) => item.visible?.(payload) !== false)
      .map((item) => {
        const disabled =
            typeof item.disabled === 'function'
                ? item.disabled(payload)
                : !!item.disabled
        return {
          text: item.text,
          disabled,
          action: () => item.callback(payload),
        }
      })
  // 展示模式不提供裁剪 / 删除
  if (props.mode !== 'edit') return customs
  const builtins: ContextMenuEntry[] = []
  if (canCrop(menu)) {
    const id = menu.kind === 'score' ? menu.score?.id : menu.element?.id
    const active = !!id && cropId.value === id
    builtins.push({
      text: active ? '完成裁剪' : '裁剪',
      action: () => {
        if (active) endCrop()
        else void startCrop(id).catch((e) => console.warn('[SJWPDF] startCrop', e))
      },
    })
  }
  return [
    ...customs,
    ...builtins,
    {
      text: '删除',
      danger: true,
      action: () => {
        if (menu.kind === 'score' && menu.score) {
          removeScoreAndOrphanAudios(menu.score.id)
        } else if (menu.element) {
          removeElement(requirePage(), menu.element.id)
        }
      },
    },
  ]
}

async function tryOpenMenu(menu: OpenMenu) {
  const payload = buildContextPayload(menu)
  emit('beforeContextMenu', payload)
  await nextTick()
  if (menuEntries(menu).length === 0) {
    openMenu.value = null
    return
  }
  openMenu.value = menu
}

function onElementContextmenu(payload: { element: SElement; event: MouseEvent }) {
  const {element, event} = payload
  tryOpenMenu({
    kind: 'element',
    x: event.clientX,
    y: event.clientY,
    element,
  })
}

function onScoreContextmenu(payload: { score: SScore; event: MouseEvent }) {
  const {score, event} = payload
  tryOpenMenu({
    kind: 'score',
    x: event.clientX,
    y: event.clientY,
    score,
  })
}

function closeContextMenu() {
  openMenu.value = null
}

/**
 * 删除曲谱；若范唱/伴奏/皮肤资源已无其它引用，则从缓存中删除。
 */
function removeScoreAndOrphanAudios(scoreId: string): boolean {
  const page = requirePage()
  const score = page.scores?.find((s) => s.id === scoreId)
  if (!score) return false
  const assetSrcs = collectScoreAssetSrcs(score)
  const ok = removeScore(page, scoreId)
  if (!ok) return false
  for (const src of assetSrcs) {
    if (store.isUsed(props.data, src)) continue
    store.removeAsset(src, props.data)
  }
  store.syncAssetNamesToData(props.data)
  return true
}

/** 背景图被替换/清除后，若已无其它引用则删缓存，避免反复换背景撑爆存储 */
function removeOrphanBackgroundAsset(assetId: string | undefined) {
  if (!assetId) return
  if (store.isUsed(props.data, assetId)) return
  store.removeAsset(assetId, props.data)
  store.syncAssetNamesToData(props.data)
}

function requirePage(): SPage {
  const page = currentPage.value
  if (!page) throw new Error(`pageIndex ${props.pageIndex} out of range`)
  return page
}

function requireAsset(assetId: string) {
  if (!store.hasAsset(assetId)) {
    throw new Error(`缓存中不存在资源: ${assetId}`)
  }
}

const playback = createScorePlayback({
  getScores: () => currentPage.value?.scores ?? [],
  getHost: (scoreId) => scoreHosts.value.get(scoreId),
  resolveSrc: (src) => store.resolveSrc(src),
})

provide('sjwScoreRegistry', {
  register(host: ScorePlayHost) {
    scoreHosts.value.set(host.scoreId, host)
  },
  unregister(scoreId: string) {
    scoreHosts.value.delete(scoreId)
  },
})
provide('sjwGetBpm', () => playback.getBpm())
provide('sjwGetAsset', (id: string) => store.getAsset(id))

/** 选段模式：同一时刻只对一份曲谱开启；内存态，换页自动结束 */
const rangeSelect = ref<ScoreRangeSelect | null>(null)

function emitRangeChange() {
  const state = rangeSelect.value
  if (!state) return
  const scoreIndex = (currentPage.value?.scores ?? []).findIndex((s) => s.id === state.scoreId)
  emit('rangeChange', {...state, scoreIndex})
}

/** 第 1 次点击设起点、第 2 次设终点、第 3 次重设起点 */
function onRangeNoteClick(scoreId: string, noteId: string) {
  const state = rangeSelect.value
  if (!state || state.scoreId !== scoreId) return
  if (state.startNoteId && !state.endNoteId) {
    state.endNoteId = noteId
  } else {
    state.startNoteId = noteId
    state.endNoteId = null
  }
  emitRangeChange()
}

provide('sjwRangeSelect', {
  state: rangeSelect,
  onNoteClick: onRangeNoteClick,
})

function startRangeSelect(scoreId: string, initial: Partial<Pick<ScoreRangeSelect, 'startNoteId' | 'endNoteId'>> = {}) {
  if (!currentPage.value?.scores?.some((s) => s.id === scoreId)) {
    throw new Error(`当前页不存在曲谱: ${scoreId}`)
  }
  endCrop()
  rangeSelect.value = {
    scoreId,
    startNoteId: initial.startNoteId ?? null,
    endNoteId: initial.endNoteId ?? null,
  }
}

function endRangeSelect() {
  rangeSelect.value = null
}

function clearRangeSelect() {
  const state = rangeSelect.value
  if (!state) return
  state.startNoteId = null
  state.endNoteId = null
  emitRangeChange()
}

watch(
    () => currentPage.value?.id,
    () => endRangeSelect(),
)

async function loadSjw(file: Blob): Promise<SJW> {
  const {data, assets} = await parseSjw(file)
  store.loadAssetMap(assets, data.assetNames)
  store.syncAssetNamesToData(data)
  emit('loaded', {data})
  return data
}

async function exportSjw(filename?: string): Promise<Blob> {
  store.restoreUsedRemoved(props.data)
  store.syncAssetNamesToData(props.data)
  const blob = await buildSjwBlob(props.data, store.getMap())
  if (filename) downloadSjw(blob, filename)
  return blob
}

const exportAssets: ExportAssetContext = {
  getAsset: (id) => store.getAsset(id),
  resolveSrc: (src) => store.resolveSrc(src),
}

/** 导出图片：单页直接 png/jpeg，多页打 zip（01.png…）；传 filename 时直接下载 */
async function exportImages(options: ExportImagesOptions & { filename?: string } = {}): Promise<Blob> {
  const blob = await exportPagesAsImages(props.data, exportAssets, options)
  if (options.filename) {
    const type = options.type ?? 'png'
    const pageCount = options.pages?.length ?? props.data.pages?.length ?? 0
    const ext = pageCount === 1 ? (type === 'jpeg' ? 'jpg' : 'png') : 'zip'
    downloadBlob(blob, options.filename, ext)
  }
  return blob
}

/** 各页导出为一个 PDF（每页一张图）；传 filename 时直接下载 */
async function exportPdf(options: ExportPdfOptions & { filename?: string } = {}): Promise<Blob> {
  const blob = await exportPagesAsPdf(props.data, exportAssets, options)
  if (options.filename) downloadBlob(blob, options.filename, 'pdf')
  return blob
}

/** 单页导出为图片 Blob（默认当前页） */
async function exportPageImageBlob(
    pageIndex = props.pageIndex,
    options: Omit<ExportImagesOptions, 'pages' | 'onProgress'> = {},
): Promise<Blob> {
  const page = props.data.pages?.[pageIndex]
  if (!page) throw new Error(`页码越界: ${pageIndex}`)
  return exportPageImage(page, exportAssets, options)
}

/** 原始载入：File → 缓存，返回 { id, name } */
function loadAsset(file: File, name?: string) {
  const rec = store.loadAsset(file, name)
  store.syncAssetNamesToData(props.data)
  return {id: rec.id, name: rec.name}
}

function getPageEl(): HTMLElement | null {
  const el = (pageRef.value as { $el?: unknown } | null)?.$el
  return el instanceof HTMLElement ? el : null
}

/** 将白板滚到滚动视口正中 */
function centerPageInView() {
  const scroller = rootRef.value
  const pageEl = getPageEl()
  if (!scroller || !pageEl) return

  const sRect = scroller.getBoundingClientRect()
  const pRect = pageEl.getBoundingClientRect()
  const pageLeft = pRect.left - sRect.left + scroller.scrollLeft
  const pageTop = pRect.top - sRect.top + scroller.scrollTop

  scroller.scrollLeft = pageLeft + pageEl.offsetWidth / 2 - scroller.clientWidth / 2
  scroller.scrollTop = pageTop + pageEl.offsetHeight / 2 - scroller.clientHeight / 2
}

async function scheduleCenterPage() {
  await nextTick()
  requestAnimationFrame(() => {
    centerPageInView()
  })
}

onMounted(() => {
  scheduleCenterPage()
  window.addEventListener('keydown', onCropKeydown)
})

watch(
    () =>
        [
          props.pageIndex,
          currentPage.value?.id,
          currentPage.value?.width,
          currentPage.value?.height,
        ] as const,
    () => {
      closeContextMenu()
      scheduleCenterPage()
    },
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onCropKeydown)
  playback.dispose()
  store.clear()
})

defineExpose({
  getPage: () => currentPage.value,
  /** 当前选中项（edit 模式；未选中 / show 模式为 null），对象即 data 里的原对象，可直接改属性 */
  getSelection: (): SjwSelection => selection.value,
  /** 取消选中（会触发 selectionChange(null)） */
  clearSelection,
  addText: (options: AddTextOptions) => addText(requirePage(), options),

  /**
   * 按缓存 id 添加图片；缓存没有则失败。
   */
  addImage: async (options: AddImageOptions) => {
    requireAsset(options.assetId)
    return addImage(requirePage(), options, (id) => store.getAsset(id))
  },
  /**
   * 传入 File：先 loadAsset，再放到当前页。
   * @returns { elementId, assetId, name }
   */
  addImageFromFile: async (options: {
    x: number
    y: number
    file: File
    /** 自定义名称，默认 file.name */
    name?: string
    width?: number
    height?: number
    rotation?: number
    id?: string
  }) => {
    const {id: assetId, name} = loadAsset(options.file, options.name)
    const imageOpts: AddImageOptions = {
      x: options.x,
      y: options.y,
      assetId,
    }
    if (options.width !== undefined) imageOpts.width = options.width
    if (options.height !== undefined) imageOpts.height = options.height
    if (options.rotation !== undefined) imageOpts.rotation = options.rotation
    if (options.id !== undefined) imageOpts.id = options.id
    const elementId = await addImage(requirePage(), imageOpts, (id) => store.getAsset(id))
    return {elementId, assetId, name}
  },

  /** 按缓存 id 添加音频 */
  addAudio: (options: AddAudioOptions) => {
    requireAsset(options.assetId)
    return addAudio(requirePage(), options)
  },
  /** File → loadAsset + 放到当前页 */
  addAudioFromFile: (options: {
    x: number
    y: number
    file: File
    name?: string
    width?: number
    height?: number
    rotation?: number
    id?: string
  }) => {
    const {id: assetId, name} = loadAsset(options.file, options.name)
    const audioOpts: AddAudioOptions = {
      x: options.x,
      y: options.y,
      assetId,
    }
    if (options.width !== undefined) audioOpts.width = options.width
    if (options.height !== undefined) audioOpts.height = options.height
    if (options.rotation !== undefined) audioOpts.rotation = options.rotation
    if (options.id !== undefined) audioOpts.id = options.id
    const elementId = addAudio(requirePage(), audioOpts)
    return {elementId, assetId, name}
  },

  /** 按缓存 id 添加视频；缓存没有则失败 */
  addVideo: async (options: AddVideoOptions) => {
    requireAsset(options.assetId)
    return addVideo(requirePage(), options, (id) => store.getAsset(id))
  },
  /**
   * 传入 File：先 loadAsset，再放到当前页。
   * @returns { elementId, assetId, name }
   */
  addVideoFromFile: async (options: {
    x: number
    y: number
    file: File
    name?: string
    width?: number
    height?: number
    rotation?: number
    id?: string
  }) => {
    const {id: assetId, name} = loadAsset(options.file, options.name)
    const videoOpts: AddVideoOptions = {
      x: options.x,
      y: options.y,
      assetId,
    }
    if (options.width !== undefined) videoOpts.width = options.width
    if (options.height !== undefined) videoOpts.height = options.height
    if (options.rotation !== undefined) videoOpts.rotation = options.rotation
    if (options.id !== undefined) videoOpts.id = options.id
    const elementId = await addVideo(requirePage(), videoOpts, (id) => store.getAsset(id))
    return {elementId, assetId, name}
  },

  removeElement: (elementId: string) => removeElement(requirePage(), elementId),
  /**
   * 添加曲谱。范唱/伴奏可传：
   * - `{ src, name, author? }` 已缓存资源
   * - `{ assetId, name?, author? }` 已缓存 id
   * - `{ file, name?, author? }` 自动 loadAsset 写入 zip 根目录
   * 皮肤可传：资源 id / `{ assetId }` / `{ file }` / SkinPack / Skin（对象每次序列化为新 .json）
   */
  addScore: (options: AddScoreHostOptions) => {
    const vocalPerformance = resolveScoreAudioInput(options.vocalPerformance)
    const accompaniment = resolveScoreAudioInput(options.accompaniment)
    const skin = resolveScoreSkinInput(options.skin)
    const opts: AddScoreOptions = {
      x: options.x,
      y: options.y,
      musicScore: options.musicScore,
    }
    if (skin !== undefined) opts.skin = skin
    if (options.rotation !== undefined) opts.rotation = options.rotation
    if (options.id !== undefined) opts.id = options.id
    if (vocalPerformance) opts.vocalPerformance = vocalPerformance
    if (accompaniment) opts.accompaniment = accompaniment
    return addScore(requirePage(), opts)
  },
  /** 删除曲谱；范唱/伴奏若已无其它引用则从缓存删除 */
  removeScore: (scoreId: string) => removeScoreAndOrphanAudios(scoreId),
  /** 解析曲谱范唱/伴奏（含 url、file） */
  resolveScoreAudio: (ref: ScoreAudioRef | undefined) => resolveScoreAudio(ref),
  getScoreAudios: (score: SScore) => ({
    vocalPerformance: resolveScoreAudio(score.vocalPerformance),
    accompaniment: resolveScoreAudio(score.accompaniment),
  }),

  addPage: (options?: AddPageOptions) => addPage(props.data, options),
  insertPage: (index: number, options?: AddPageOptions) =>
      insertPage(props.data, index, options),
  removePage: (index = props.pageIndex) => removePage(props.data, index),

  /** 按缓存 id 设背景；没有则失败。替换时若旧图已无引用则从缓存删除 */
  setBackground: (assetId: string) => {
    requireAsset(assetId)
    const prev = setBackground(requirePage(), {assetId})
    removeOrphanBackgroundAsset(prev)
  },
  /** File → loadAsset + 设为当前页背景；替换时清理旧图孤儿资源 */
  setBackgroundFromFile: (file: File, name?: string) => {
    const {id: assetId, name: displayName} = loadAsset(file, name)
    const prev = setBackground(requirePage(), {assetId})
    removeOrphanBackgroundAsset(prev)
    return {assetId, name: displayName}
  },
  /** 清除背景；原背景图若已无其它引用则从缓存删除 */
  clearBackground: () => {
    const prev = clearBackground(requirePage())
    removeOrphanBackgroundAsset(prev)
  },

  /** 原始载入静态资源（宿主可自行缓存后再用 id 添加） */
  loadAsset,
  /** @deprecated 同 loadAsset，返回 id */
  addAsset: (file: File, name?: string) => loadAsset(file, name).id,

  listAssets: () => store.listAssets(),
  listAssetIds: () => store.listAssetIds(),
  hasAsset: (id: string) => store.hasAsset(id),
  getAsset: (id: string) => store.getAsset(id),
  getAssetRecord: (id: string) => store.getAssetRecord(id),
  getAssetName: (id: string) => store.getAssetName(id),
  getAssetMap: () => store.getMap(),
  getAssetNames: () => store.getAssetNames(),
  loadAssetMap: store.loadAssetMap,
  /** 删除资源：先进回收站（列表 / 导出不再包含），按 id 仍可读，便于宿主撤销 */
  removeAsset: (id: string, options?: RemoveAssetOptions) =>
      store.removeAsset(id, props.data, options),
  /** 宿主撤销 / 恢复改写 data 后调用：回收站里又被引用的资源移回正式缓存 */
  restoreRemovedAssets: () => {
    const restored = store.restoreUsedRemoved(props.data)
    if (restored.length) store.syncAssetNamesToData(props.data)
    return restored
  },
  listRemovedAssetIds: () => store.listRemovedAssetIds(),
  /** 彻底释放回收站；keep 返回 true 的 id 保留（如仍被撤销历史引用） */
  purgeRemovedAssets: (keep?: (id: string) => boolean) => store.purgeRemoved(keep),
  isAssetUsed: (id: string) => store.isUsed(props.data, id),
  findAssetUsages: (id: string) => store.findUsages(props.data, id),
  resolveSrc: (src: string) => store.resolveSrc(src),
  /** 暂停页面内音视频；传 elementId 时只暂停该元素 */
  pauseMedia: (elementId?: string) => {
    const root = rootRef.value
    if (!root) return
    const scope = elementId
      ? `[data-sjw-element-id="${CSS.escape(elementId)}"] `
      : ''
    root
      .querySelectorAll<HTMLMediaElement>(`${scope}video, ${scope}audio`)
      .forEach((el) => el.pause())
  },
  clearAssets: () => store.clear(),

  loadSjw,
  exportSjw,
  exportImages,
  exportPdf,
  exportPageImage: exportPageImageBlob,

  /** 裁剪当前页图片：area 为原始像素坐标的起点 / 终点 */
  cropImage: (elementId: string, area: CropArea, options?: CropOptions) =>
      cropImage(requirePage(), elementId, area, options, (id) => store.getAsset(id)),
  /** 裁剪当前页曲谱：area 为 musicScore.width/height 坐标系的起点 / 终点 */
  cropScore: (scoreId: string, area: CropArea, options?: CropOptions) =>
      cropScore(requirePage(), scoreId, area, options),
  /**
   * 按标题 / 复谱表区间裁剪曲谱。
   * from/to：0=标题区，1..n=第几个复谱表（先后不限）；例如 (0,2)=标题到第 2 个复谱表。
   * keepY: true → 框 x/y 不动（只改宽高）；默认 false 会把裁出区域留在原位（起点下移时 y 变大）。
   * 有 score.skin 时先读缓存皮肤再排版，保证高度与展示一致。
   */
  cropScoreByGrandStaff: async (
      scoreId: string,
      from: number,
      to: number,
      options: CropScoreByGrandStaffOptions = {},
  ) => {
    const page = requirePage()
    const score = page.scores?.find((s) => s.id === scoreId)
    if (!score) throw new Error(`当前页不存在曲谱: ${scoreId}`)
    let skin = options.skin
    if (!skin && score.skin) {
      const file = store.getAsset(score.skin)
      if (file) {
        try {
          skin = await parseSkinFile(file)
        } catch {
          skin = undefined
        }
      }
    }
    return cropScoreByGrandStaff(page, scoreId, from, to, {...options, ...(skin ? {skin} : {})})
  },
  /** 曲谱标题区 + 各复谱表纵向条带（musicScore 坐标）；可选用于预览 */
  getScoreVerticalBands: async (scoreId: string) => {
    const score = requirePage().scores?.find((s) => s.id === scoreId)
    if (!score) throw new Error(`当前页不存在曲谱: ${scoreId}`)
    let skin
    if (score.skin) {
      const file = store.getAsset(score.skin)
      if (file) {
        try {
          skin = await parseSkinFile(file)
        } catch {
          skin = undefined
        }
      }
    }
    return getScoreVerticalBands(score, skin ? {skin} : {})
  },
  /** 取消当前页图片 / 曲谱的裁剪 */
  clearCrop: (id: string, options?: CropOptions) => clearCrop(requirePage(), id, options),
  /**
   * 进入裁剪模式（默认当前选中项，仅曲谱 / 图片）：框变橙色、不能旋转，
   * 四角分别拖 起点xy / 终点x+起点y / 终点xy / 起点x+终点y；Esc / Enter 或选中别的退出
   */
  startCrop,
  endCrop,
  /** 当前裁剪目标（未裁剪为 null） */
  getCropTarget: (): SjwSelection => cropTarget.value,

  /**
   * 开始绘制会话（同套 API，按 mode 分流）：
   * - edit → 持久层 page.drawings（可进 .sjw）
   * - show → 顶层教学标注 canvas（仅内存，不序列化）
   */
  startDraw: () => {
    inkSession.value = true
  },
  /** 结束绘制：对应层 canvas 不再拦截指针 */
  endDraw: () => {
    inkSession.value = false
  },
  /** 切换工具；第二参数为笔触等选项（如 lineWidth）。持久层与标注层同步 */
  setTool: (tool: DrawToolEnum, options?: DrawBrushOptions) => setDrawTool(tool, options),
  /**
   * @deprecated 同 setTool
   * 设置画笔并切到该工具。
   * @param tool 工具枚举（DrawToolEnum.Pen | DrawToolEnum.Eraser）
   * @param options color（仅笔）、lineWidth（笔触宽度）
   */
  setBrush: (tool: DrawToolEnum, options?: DrawBrushOptions) => setDrawTool(tool, options),
  /** 清空当前模式对应层：edit→page.drawings；show→当前页教学标注 */
  clearDrawings: () => {
    if (sjwMode.value === 'show') annotateRef.value?.clear()
    else pageRef.value?.clearDrawings()
  },
  /** 仅清空当前页教学标注（换页不自动清；不改 page.drawings） */
  clearAnnotations: () => annotateRef.value?.clear(),
  isDrawing: () => inkSession.value,
  getTool: () => annotateRef.value?.getTool() ?? pageRef.value?.getTool() ?? DrawToolEnum.Pen,

  /** 将当前白板滚到视口居中 */
  centerPage: () => scheduleCenterPage(),

  /**
   * 播放曲谱 MIDI；options.range 选段播放（如传 getRangeSelect() 的结果，起止任一为空 = 从头 / 到尾）。
   */
  play: (scoreIndex = 0, options?: ScorePlayOptions) => playback.play(scoreIndex, options),

  /**
   * 开启选段：该曲谱音符可点击（第 1 次设起点 / 第 2 次设终点 / 第 3 次重设起点），起止音符高亮，变化时抛 rangeChange。
   * edit 模式下该曲谱放置框暂不可拖拽；换页自动结束。
   */
  startRangeSelect,
  /** 结束选段：去掉起止高亮，音符恢复不可点击 */
  endRangeSelect,
  /** 选段中清空起止（保持选段模式） */
  clearRangeSelect,
  /** 当前选段（未开启为 null）；可直接作为 play 的 range */
  getRangeSelect: (): ScoreRangeSelect | null => (rangeSelect.value ? {...rangeSelect.value} : null),
  /** 伴奏播放（APlayer + slot.data.accompaniment 高亮）；与曲谱/范唱互斥 */
  playAccompaniment: (scoreIndex = 0) => playback.playAccompaniment(scoreIndex),
  /** 范唱播放（APlayer + slot.data.vocalPerformance 高亮）；与曲谱/伴奏互斥 */
  playVocal: (scoreIndex = 0) => playback.playVocal(scoreIndex),
  pause: () => playback.pause(),
  stop: () => playback.stop(),
  addToneColor: (name: string, toneColor: ToneColor) => playback.addToneColor(name, toneColor),
  setToneColorName: (name: string) => playback.setToneColorName(name),
  getToneColorName: () => playback.getToneColorName(),
  setBpm: (bpm: number) => playback.setBpm(bpm),
  getBpm: () => playback.getBpm(),
  getPlayer: () => playback.getPlayer(),
  getAPlayer: () => playback.getAPlayer(),
  getPlaybackMode: () => playback.getMode(),
})
</script>

<template>
  <div ref="rootRef" class="sjw-pdf" @contextmenu.prevent>
    <div
        v-if="currentPage"
        :style="{
        '--sjw-page-w': `${currentPage.width}px`,
        '--sjw-page-h': `${currentPage.height}px`,
        '--sjw-page-gutter': `${PAGE_GUTTER_PX}px`,
      }"
        class="sjw-pdf__page-wrap"
    >
      <Page
          ref="pageRef"
          :ink-session="inkSession"
          :mode="sjwMode"
          :page="currentPage"
          :resolve-src="store.resolveSrc"
          @element-contextmenu="onElementContextmenu"
          @score-contextmenu="onScoreContextmenu"
          @selection-change="selectedId = $event"
          @crop-change="cropId = $event"
      />
      <AnnotateLayer
          ref="annotateRef"
          :active="inkSession && sjwMode === 'show'"
          :get-page-el="getPageEl"
          :page-height="currentPage.height"
          :page-id="currentPage.id"
          :page-width="currentPage.width"
          :visible="sjwMode === 'show'"
      />
    </div>
    <div v-else class="sjw-pdf__empty">无页面</div>
    <ContextMenu
        v-if="openMenu"
        :items="menuEntries(openMenu)"
        :x="openMenu.x"
        :y="openMenu.y"
        @close="closeContextMenu"
    />
  </div>
</template>

<style scoped>
.sjw-pdf {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: auto;
  box-sizing: border-box;
  background: #f0f2f5;
  color: #303133;
}

.sjw-pdf__page-wrap {
  /*
   * 内容区被白板撑开，且四周至少留 gutter，故永远比白板大；
   * 同时 min 铺满视口，小页时也能居中摆放。
   */
  position: relative;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  padding: var(--sjw-page-gutter, 48px);
  width: max(100%, calc(var(--sjw-page-w, 0px) + 2 * var(--sjw-page-gutter, 48px)));
  height: max(100%, calc(var(--sjw-page-h, 0px) + 2 * var(--sjw-page-gutter, 48px)));
  min-width: 100%;
  min-height: 100%;
}

.sjw-pdf__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  font-size: 14px;
}
</style>
