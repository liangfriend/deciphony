<script lang="ts" setup>
import {computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch} from 'vue'
import type {ToneColor} from '@deciphony/player'
import {DrawToolEnum} from '../enums/drawToolEnum'
import type {
  DrawBrushOptions,
  RemoveAssetOptions,
  SJW,
  SPage,
  SElement,
  SScore,
  ScoreAudioRef,
  SjwMode,
} from '../types/types'
import type {
  ElementContextMenuItem,
  ElementContextMenuPayload,
  ResolvedScoreAudio,
} from '../types/contextMenu'
import {
  addAudio,
  addImage,
  addText,
  addVideo,
  removeElement,
  type AddAudioOptions,
  type AddImageOptions,
  type AddTextOptions,
  type AddVideoOptions,
} from '../api/elements'
import {setBackground, clearBackground} from '../api/background'
import {
  addScore,
  collectScoreAssetSrcs,
  removeScore,
  type AddScoreHostOptions,
  type AddScoreOptions,
  type ScoreSkinHostInput,
} from '../api/scores'
import {isSkinPack, resolveSkinPack, skinPackToFile} from '../assets/skinAsset'
import {
  addPage,
  insertPage,
  removePage,
  type AddPageOptions,
} from '../api/pages'
import {createAssetStore} from '../assets/assetStore'
import {buildSjwBlob, downloadSjw, parseSjw} from '../assets/sjwIO'
import {createScorePlayback, type ScorePlayHost} from '../play/scorePlayback'
import type {ContextMenuEntry} from '../types/contextMenu'
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
  loaded: [payload: {data: SJW}]
  /**
   * 打开自定义菜单前触发；payload 与菜单项 callback 相同。
   * 可在此同步改写 `:context-menu`，随后按最新 props 弹菜单。
   */
  beforeContextMenu: [payload: ElementContextMenuPayload]
}>()

const store = createAssetStore()
const scoreHosts = ref(new Map<string, ScorePlayHost>())
const rootRef = ref<HTMLElement | null>(null)
const pageRef = ref<InstanceType<typeof Page> | null>(null)

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
  if ('assetId' in input && input.assetId) {
    requireAsset(input.assetId)
    return input.assetId
  }
  if ('file' in input && input.file instanceof File) {
    const rec = loadAsset(input.file, input.name)
    return rec.id
  }
  if ('skin' in input && input.skin) {
    const pack = resolveSkinPack(input.skin, input.skinName)
    const rec = loadAsset(skinPackToFile(pack, input.name ?? 'skin.json'), input.name)
    return rec.id
  }
  if (isSkinPack(input)) {
    const rec = loadAsset(skinPackToFile(input), 'skin.json')
    return rec.id
  }
  const pack = resolveSkinPack(input)
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
  // 展示模式不提供删除
  if (props.mode !== 'edit') return customs
  return [
    ...customs,
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

function onElementContextmenu(payload: {element: SElement; event: MouseEvent}) {
  const {element, event} = payload
  tryOpenMenu({
    kind: 'element',
    x: event.clientX,
    y: event.clientY,
    element,
  })
}

function onScoreContextmenu(payload: {score: SScore; event: MouseEvent}) {
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

async function loadSjw(file: Blob): Promise<SJW> {
  const {data, assets} = await parseSjw(file)
  store.loadAssetMap(assets, data.assetNames)
  store.syncAssetNamesToData(data)
  emit('loaded', {data})
  return data
}

async function exportSjw(filename?: string): Promise<Blob> {
  store.syncAssetNamesToData(props.data)
  const blob = await buildSjwBlob(props.data, store.getMap())
  if (filename) downloadSjw(blob, filename)
  return blob
}

/** 原始载入：File → 缓存，返回 { id, name } */
function loadAsset(file: File, name?: string) {
  const rec = store.loadAsset(file, name)
  store.syncAssetNamesToData(props.data)
  return {id: rec.id, name: rec.name}
}

function getPageEl(): HTMLElement | null {
  const el = (pageRef.value as {$el?: unknown} | null)?.$el
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
  playback.dispose()
  store.clear()
})

defineExpose({
  getPage: () => currentPage.value,
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
  removeAsset: (id: string, options?: RemoveAssetOptions) =>
    store.removeAsset(id, props.data, options),
  isAssetUsed: (id: string) => store.isUsed(props.data, id),
  findAssetUsages: (id: string) => store.findUsages(props.data, id),
  resolveSrc: (src: string) => store.resolveSrc(src),
  clearAssets: () => store.clear(),

  loadSjw,
  exportSjw,

  /** 开始绘制：顶层透明 canvas 接收指针 */
  startDraw: () => pageRef.value?.startDraw(),
  /** 结束绘制：canvas 不再拦截指针 */
  endDraw: () => pageRef.value?.endDraw(),
  /** 切换工具；第二参数为笔触等选项（如 lineWidth） */
  setTool: (tool: DrawToolEnum, options?: DrawBrushOptions) =>
    pageRef.value?.setTool(tool, options),
  /**
   * @deprecated 同 setTool
   * 设置画笔并切到该工具。
   * @param tool 工具枚举（DrawToolEnum.Pen | DrawToolEnum.Eraser）
   * @param options color（仅笔）、lineWidth（笔触宽度）
   */
  setBrush: (tool: DrawToolEnum, options?: DrawBrushOptions) =>
    pageRef.value?.setTool(tool, options),
  clearDrawings: () => pageRef.value?.clearDrawings(),
  isDrawing: () => pageRef.value?.isDrawing() ?? false,
  getTool: () => pageRef.value?.getTool() ?? DrawToolEnum.Pen,

  /** 将当前白板滚到视口居中 */
  centerPage: () => scheduleCenterPage(),

  play: (scoreIndex = 0) => playback.play(scoreIndex),
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
      class="sjw-pdf__page-wrap"
      :style="{
        '--sjw-page-w': `${currentPage.width}px`,
        '--sjw-page-h': `${currentPage.height}px`,
        '--sjw-page-gutter': `${PAGE_GUTTER_PX}px`,
      }"
    >
      <Page
        ref="pageRef"
        :mode="mode"
        :page="currentPage"
        :resolve-src="store.resolveSrc"
        @element-contextmenu="onElementContextmenu"
        @score-contextmenu="onScoreContextmenu"
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
