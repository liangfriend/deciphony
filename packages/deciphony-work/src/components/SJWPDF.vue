<script lang="ts" setup>
import {computed, onBeforeUnmount, provide, ref} from 'vue'
import type {ToneColor} from '@deciphony/player'
import type {RemoveAssetOptions, SJW, SPage, SjwMode} from '../types/types'
import {
  addAudio,
  addImage,
  addText,
  removeElement,
  type AddAudioOptions,
  type AddImageOptions,
  type AddTextOptions,
} from '../api/elements'
import {setBackground, clearBackground} from '../api/background'
import {addScore, removeScore, type AddScoreOptions} from '../api/scores'
import {
  addPage,
  insertPage,
  removePage,
  type AddPageOptions,
} from '../api/pages'
import {createAssetStore} from '../assets/assetStore'
import {buildSjwBlob, downloadSjw, parseSjw} from '../assets/sjwIO'
import {createScorePlayback, type ScorePlayHost} from '../play/scorePlayback'
import Page from './Page.vue'

const props = withDefaults(
  defineProps<{
    data: SJW
    /** 当前页码（0-based） */
    pageIndex: number
    /** show | edit，编辑模式显示通用编辑框 */
    mode?: SjwMode
  }>(),
  {
    mode: 'show',
  },
)

const emit = defineEmits<{
  loaded: [payload: {data: SJW}]
}>()

const store = createAssetStore()
const scoreHosts = ref(new Map<string, ScorePlayHost>())

const currentPage = computed<SPage | null>(() => {
  const list = props.data.pages ?? []
  return list[props.pageIndex] ?? null
})

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

  removeElement: (elementId: string) => removeElement(requirePage(), elementId),
  addScore: (options: AddScoreOptions) => addScore(requirePage(), options),
  removeScore: (scoreId: string) => removeScore(requirePage(), scoreId),

  addPage: (options?: AddPageOptions) => addPage(props.data, options),
  insertPage: (index: number, options?: AddPageOptions) =>
    insertPage(props.data, index, options),
  removePage: (index = props.pageIndex) => removePage(props.data, index),

  /** 按缓存 id 设背景；没有则失败 */
  setBackground: (assetId: string) => {
    requireAsset(assetId)
    setBackground(requirePage(), {assetId})
  },
  /** File → loadAsset + 设为当前页背景 */
  setBackgroundFromFile: (file: File, name?: string) => {
    const {id: assetId, name: displayName} = loadAsset(file, name)
    setBackground(requirePage(), {assetId})
    return {assetId, name: displayName}
  },
  clearBackground: () => clearBackground(requirePage()),

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

  play: (scoreIndex = 0) => playback.play(scoreIndex),
  pause: () => playback.pause(),
  stop: () => playback.stop(),
  addToneColor: (name: string, toneColor: ToneColor) => playback.addToneColor(name, toneColor),
  setToneColorName: (name: string) => playback.setToneColorName(name),
  getToneColorName: () => playback.getToneColorName(),
  setBpm: (bpm: number) => playback.setBpm(bpm),
  getBpm: () => playback.getBpm(),
  getPlayer: () => playback.getPlayer(),
})
</script>

<template>
  <div class="sjw-pdf">
    <div v-if="currentPage" class="sjw-pdf__page-wrap">
      <Page :mode="mode" :page="currentPage" :resolve-src="store.resolveSrc"/>
    </div>
    <div v-else class="sjw-pdf__empty">无页面</div>
  </div>
</template>

<style scoped>
.sjw-pdf {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: auto;
  box-sizing: border-box;
  padding: 24px;
  background: #f0f2f5;
  color: #303133;
}

.sjw-pdf__page-wrap {
  display: flex;
  justify-content: center;
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
