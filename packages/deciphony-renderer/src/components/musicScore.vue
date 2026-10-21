<template>
  <svg ref="svgRef" :height="data.height" :style="{touchAction:'none'}"
       :viewBox="`0 0 ${data.width} ${data.height}`"
       :width="data.width" preserveAspectRatio="none"
       xmlns="http://www.w3.org/2000/svg"
       @click="onTopClick"
       @contextmenu="onTopContextMenu"
       @pointerdown="onTopDown"
       @pointerenter="onTopSvgEnter"
       @pointerleave="onTopSvgLeave"
       @pointermove="onTopMove"
       @pointerup="onTopUp">
    <template v-if="layers">
      <!-- 外层 g 只负责整行平移（行高变化时），平移不触发行内重渲染 -->
      <g v-for="row in layers.rows" :key="`b-${row.key}`" :transform="row.dy ? `translate(0, ${row.dy})` : undefined">
        <ScoreLayer :layer-key="`b-${row.key}`" :nodes="row.back" :row-nodes="row.nodes"/>
      </g>
      <ScoreLayer key="global" :nodes="layers.global.back" :row-nodes="layers.global.nodes" layer-key="global"/>
      <g v-for="row in layers.rows" :key="`f-${row.key}`" :transform="row.dy ? `translate(0, ${row.dy})` : undefined">
        <ScoreLayer :layer-key="`f-${row.key}`" :nodes="row.front" :row-nodes="row.nodes"/>
      </g>
    </template>
  </svg>
</template>

<script lang="ts" setup>
import {
  computed,
  type ComputedRef,
  effectScope,
  type EffectScope,
  onBeforeUnmount,
  provide,
  ref,
  shallowRef,
  toRaw,
  triggerRef,
  useSlots,
  watch,
} from 'vue'
import {resolveLayoutNotationPack, resolveNotationToVDom} from '@/render/resolveNotation'
import {mergeSlotConfig} from '@/render/mergeSlotConfig'
import {fanoutExtensionEvent} from '@/render/fanoutExtensionEvent'
import {defaultSkin} from '@/skins/defaultSkin'
import {withExtraSymbols} from '@/render/extraSymbols'
import {MusicScoreTypeEnum} from '@/enums/musicScoreEnum'
import ScoreLayer from './scoreLayer.vue'
import {resolveVDomFromEvent} from '@/render/resolveVDomFromEvent'
import {findElementByVdomDomId, vdomDomId, vdomSelectionKey} from '@/render/vdomDomId'
import {layoutGrandStaffRow, layoutScoreFrame, type RowLayoutResult} from '@/render/incremental/rowLayout'
import {ScoreAssembler, type ScoreAssembleOutput} from '@/render/incremental/scoreAssembler'
import {SCORE_LAYER_CONTEXT, type SlotExtensionItem} from '@/render/incremental/layerContext'
import type {VDomLookup} from '@/render/vdomIndex'
import type {GrandStaff, MusicScore} from '@/types/MusicScoreType'
import type {MusicScoreRenderOptions, Skin, SkinPack, SlotConfig, SlotName, VDom} from '@/types/common'
import type {DrExtension, DrExtensionEvents, RenderMusicScoreInfo} from '@/types/extension'

const props = defineProps<{
  data: MusicScore
  /** 插槽配置，由扩展插件组合提供（如歌词、符号注释等），可随意开关；会覆盖 extensions 里的同名字段 */
  slotConfig?: SlotConfig
  /** 扩展贡献：自动合并 slotConfig，并在对应插槽渲染组件 */
  extensions?: DrExtension[]
  /** 多套皮肤包：{ default: SkinPack, active?: SkinPack }；default 覆盖内置；用于符号级 skinName 切换 */
  skin?: Skin
  skinName?: string
  /** 渲染配置：只影响绘制，不触发重新排版 */
  options?: MusicScoreRenderOptions
}>()
const notationType = computed(() => props.data?.type ?? MusicScoreTypeEnum.StandardStaff)
const options = computed<Required<MusicScoreRenderOptions>>(() => ({
  onlyChordName: props.options?.onlyChordName ?? false,
}))

const data = computed(() => props.data)
/** 曲谱自定义符号（extraNoteSymbol / extraMeasureSymbol）注入各套皮肤包，排版与绘制共用 */
const skin = computed<Skin>(() =>
    withExtraSymbols(props.skin ?? {default: defaultSkin}, props.data)
)

/** skinName 在 skin 中查得到则用 skinName，否则用 default */
const effectiveSkinName = computed(() => {
  const sn = props.skinName
  const s = skin.value
  return sn && s && sn in s ? sn : 'default'
})
const skinPackForLayout = computed<SkinPack>(() => skin.value?.[effectiveSkinName.value] ?? defaultSkin)

const mergedSlotConfig = computed(() =>
    mergeSlotConfig(
        (props.extensions ?? []).flatMap((ext) => ext.slotConfig ? [ext.slotConfig] : []),
        props.slotConfig,
    ),
)

const slotContributions = computed(() => {
  const map = new Map<SlotName, SlotExtensionItem[]>()
  for (const ext of props.extensions ?? []) {
    if (!ext.slots) continue
    for (const [slotName, component] of Object.entries(ext.slots) as [SlotName, SlotExtensionItem['component'] | undefined][]) {
      if (!component) continue
      const list = map.get(slotName) ?? []
      list.push({name: ext.name, component, extension: ext})
      map.set(slotName, list)
    }
  }
  return map
})

function extensionsForSlot(slotName?: SlotName): SlotExtensionItem[] {
  if (!slotName) return []
  return slotContributions.value.get(slotName) ?? []
}

function resolveExtensionProps(ext: DrExtension): Record<string, unknown> {
  const raw = ext.props
  if (!raw) return {}
  return typeof raw === 'function' ? raw() : raw
}

function dispatchExtension<K extends keyof DrExtensionEvents>(
    name: K,
    ...args: Parameters<NonNullable<DrExtensionEvents[K]>>
) {
  fanoutExtensionEvent(props.extensions, name, ...args)
}

const emit = defineEmits<{
  renderMusicScore: [vDom: VDom[], info: RenderMusicScoreInfo]
  'dr-click': [event: MouseEvent, vDom: VDom]
  'dr-contextmenu': [event: MouseEvent, vDom: VDom]
  'dr-down': [event: PointerEvent, vDom: VDom]
  'dr-up': [event: PointerEvent, vDom: VDom]
  'dr-move': [event: PointerEvent, vDom: VDom]
  'dr-enter': [event: PointerEvent, vDom: VDom]
  'dr-leave': [event: PointerEvent, vDom: VDom]
  /** 绑定在顶层 svg：命中解析为 vDom，空白区域 vDom 为 null */
  'top-click': [event: MouseEvent, vDom: VDom | null]
  'top-contextmenu': [event: MouseEvent, vDom: VDom | null]
  'top-down': [event: PointerEvent, vDom: VDom | null]
  'top-up': [event: PointerEvent, vDom: VDom | null]
  'top-move': [event: PointerEvent, vDom: VDom | null]
  'top-enter': [event: PointerEvent, vDom: VDom]
  'top-leave': [event: PointerEvent, vDom: VDom]
}>()

const assembler = new ScoreAssembler()
const layers = shallowRef<ScoreAssembleOutput | null>(null)
const vDom = shallowRef<VDom[]>([])
const svgRef = ref<SVGSVGElement | null>(null)
const topHoverVDom = shallowRef<VDom | null>(null)

function findElementByVDom(node: VDom): SVGElement | null {
  const root = svgRef.value
  return root ? findElementByVdomDomId(root, node) : null
}

function toApiNode(node: VDom): VDom {
  return assembler.toApiNode(node)
}

function onDrClick(event: MouseEvent, node: VDom) {
  node = toApiNode(node)
  dispatchExtension('dr-click', event, node)
  emit('dr-click', event, node)
}

function onDrContextMenu(event: MouseEvent, node: VDom) {
  event.preventDefault()
  event.stopPropagation()
  node = toApiNode(node)
  dispatchExtension('dr-contextmenu', event, node)
  emit('dr-contextmenu', event, node)
}

function onDrDown(event: PointerEvent, node: VDom) {
  node = toApiNode(node)
  dispatchExtension('dr-down', event, node)
  emit('dr-down', event, node)
}

function onDrUp(event: PointerEvent, node: VDom) {
  node = toApiNode(node)
  dispatchExtension('dr-up', event, node)
  emit('dr-up', event, node)
}

function onDrMove(event: PointerEvent, node: VDom) {
  node = toApiNode(node)
  dispatchExtension('dr-move', event, node)
  emit('dr-move', event, node)
}

function onDrEnter(event: PointerEvent, node: VDom) {
  node = toApiNode(node)
  dispatchExtension('dr-enter', event, node)
  emit('dr-enter', event, node)
}

function onDrLeave(event: PointerEvent, node: VDom) {
  node = toApiNode(node)
  dispatchExtension('dr-leave', event, node)
  emit('dr-leave', event, node)
}

provide(SCORE_LAYER_CONTEXT, {
  data,
  skin,
  notationType,
  options,
  slots: useSlots(),
  extensionsForSlot,
  resolveExtensionProps,
  onClick: onDrClick,
  onContextMenu: onDrContextMenu,
  onDown: onDrDown,
  onUp: onDrUp,
  onMove: onDrMove,
  onEnter: onDrEnter,
  onLeave: onDrLeave,
})

function resolveTopVDom(event: Event): VDom | null {
  return resolveVDomFromEvent(event, assembler.lookup)
}

function syncTopHover(event: PointerEvent) {
  const node = resolveTopVDom(event)
  const prev = topHoverVDom.value
  if (prev === node) return
  if (prev) {
    dispatchExtension('top-leave', event, prev)
    emit('top-leave', event, prev)
  }
  if (node) {
    dispatchExtension('top-enter', event, node)
    emit('top-enter', event, node)
  }
  topHoverVDom.value = node
}

function onTopClick(event: MouseEvent) {
  const node = resolveTopVDom(event)
  dispatchExtension('top-click', event, node)
  emit('top-click', event, node)
}

function onTopContextMenu(event: MouseEvent) {
  event.preventDefault()
  const node = resolveTopVDom(event)
  dispatchExtension('top-contextmenu', event, node)
  emit('top-contextmenu', event, node)
}

function onTopDown(event: PointerEvent) {
  syncTopHover(event)
  const node = resolveTopVDom(event)
  dispatchExtension('top-down', event, node)
  emit('top-down', event, node)
}

function onTopUp(event: PointerEvent) {
  const node = resolveTopVDom(event)
  dispatchExtension('top-up', event, node)
  emit('top-up', event, node)
}

function onTopMove(event: PointerEvent) {
  syncTopHover(event)
  const node = resolveTopVDom(event)
  dispatchExtension('top-move', event, node)
  emit('top-move', event, node)
}

function onTopSvgEnter(event: PointerEvent) {
  syncTopHover(event)
}

function onTopSvgLeave(event: PointerEvent) {
  const prev = topHoverVDom.value
  if (prev) {
    dispatchExtension('top-leave', event, prev)
    emit('top-leave', event, prev)
  }
  topHoverVDom.value = null
}

/*
 * 增量排版：每个复谱表一个 computed（排版时读到的数据自动成为依赖），
 * 改哪行只重排哪行；行高变了后面的行只平移。跨行附属 / 小节号每次在组装时重算。
 */
const layoutFn = computed(() => resolveNotationToVDom(notationType.value))
const layoutOptions = computed(() => ({skin: skin.value, skinName: effectiveSkinName.value}))

type RowEntry = { scope: EffectScope; result: ComputedRef<RowLayoutResult> }
const rowEntries = new Map<GrandStaff, RowEntry>()

function emptyRow(): RowLayoutResult {
  return {nodes: [], height: 0, slotIndex: new Map(), noteIndex: {staffOf: new Map(), stemUp: new Set()}}
}

function rowEntry(grandStaff: GrandStaff): RowEntry {
  const raw = toRaw(grandStaff)
  const cached = rowEntries.get(raw)
  if (cached) return cached
  const scope = effectScope(true)
  let last: RowLayoutResult | null = null
  const result = scope.run(() => computed(() => {
    try {
      last = layoutGrandStaffRow(layoutFn.value, data.value, grandStaff, mergedSlotConfig.value, layoutOptions.value)
    } catch (err) {
      // 数据异常时这一行保留上一次结果，避免整个组件抛错白屏
      console.error('[musicScore] 复谱表渲染失败，保留上一次结果', err)
      last ??= emptyRow()
    }
    return last
  }))!
  const entry = {scope, result}
  rowEntries.set(raw, entry)
  return entry
}

const frameResult = computed(() =>
    layoutScoreFrame(layoutFn.value, data.value, mergedSlotConfig.value, layoutOptions.value))

/** 曲谱级附属 / 小节号的数据：只读不算，挂上依赖 */
function track(value: unknown, seen = new Set<unknown>()): void {
  if (value === null || typeof value !== 'object' || seen.has(value)) return
  seen.add(value)
  if (Array.isArray(value)) {
    for (const item of value) track(item, seen)
    return
  }
  for (const key in value as Record<string, unknown>) track((value as Record<string, unknown>)[key], seen)
}

function disposeRows(alive?: Set<GrandStaff>): void {
  for (const [raw, entry] of rowEntries) {
    if (alive?.has(raw)) continue
    entry.scope.stop()
    rowEntries.delete(raw)
  }
}

watch(
    () => {
      const musicScore = data.value
      if (!musicScore) return null
      const rows = (musicScore.grandStaffs ?? []).map((grandStaff) => ({
        grandStaff: toRaw(grandStaff),
        result: rowEntry(grandStaff).result.value,
      }))
      track(musicScore.affiliatedSymbols)
      track(musicScore.measureNumber)
      return {
        musicScore,
        rows,
        frame: frameResult.value,
        pack: skinPackForLayout.value,
        type: notationType.value,
        skinName: effectiveSkinName.value,
      }
    },
    (snapshot) => {
      if (!snapshot) {
        disposeRows()
        assembler.reset()
        layers.value = null
        vDom.value = []
        return
      }
      let out: ScoreAssembleOutput
      try {
        const pack = resolveLayoutNotationPack(snapshot.pack, snapshot.type) as unknown as Record<string, { w: number; h: number }>
        out = assembler.assemble({
          musicScore: snapshot.musicScore,
          frame: snapshot.frame,
          rows: snapshot.rows,
          skinName: snapshot.skinName,
          pack,
          measureHeight: pack.measure?.h ?? 45,
        })
      } catch (err) {
        console.error('[musicScore] 渲染失败，保留上一次结果', err)
        return
      }
      disposeRows(new Set(snapshot.rows.map((row) => row.grandStaff)))
      layers.value = out
      triggerRef(layers)
      vDom.value = out.list
      const info: RenderMusicScoreInfo = {lookup: assembler.lookup, changedRowIds: out.changedRowIds}
      dispatchExtension('renderMusicScore', out.list, info)
      emit('renderMusicScore', out.list, info)
    },
    {immediate: true},
)

onBeforeUnmount(() => disposeRows())

/**
 * 按 targetId 原地改某一个 vDom（不换对外节点引用，只重渲染它所在的那一层）。
 * 高频跟手（连音线拖拽等）必须用这个，不要整表 updater。
 */
function updateVDomHandler(targetId: string, patch: Partial<VDom>): boolean {
  const found = assembler.patch(targetId, patch)
  if (found) triggerRef(layers)
  return found
}

defineExpose({
  updateVDom: updateVDomHandler,
  /** 当前扁平 vDom 列表（与 renderMusicScore 回调同一个数组） */
  getVDomList: (): VDom[] => vDom.value,
  /** targetId → vDom 索引（O(1) 查找，替代对整表 find） */
  getVDomLookup: (): VDomLookup => assembler.lookup,
  vdomDomId,
  vdomSelectionKey,
  findElementByVDom,
})
</script>
<style scoped>
svg {
  user-select: none;
}
</style>
