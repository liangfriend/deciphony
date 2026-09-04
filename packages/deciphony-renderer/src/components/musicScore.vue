<template>
  <svg ref="svgRef" :height="data.height" :style="{touchAction:'none'}"
       :viewBox="`0 0 ${data.width} ${data.height}`"
       :width="data.width" preserveAspectRatio="none"
       xmlns="http://www.w3.org/2000/svg"
       @click="onTopClick"
       @pointerdown="onTopDown"
       @pointerenter="onTopSvgEnter"
       @pointerleave="onTopSvgLeave"
       @pointermove="onTopMove"
       @pointerup="onTopUp">
    <template v-for="(node, domIndex) in vDom"
              :key="vdomDomId(node, domIndex)">
      <g
          v-if="!AFFILIATION_TAGS.has(node.tag)"
          :id="vdomDomId(node, domIndex)"
          @click="onDrClick($event, node)"
          @pointerdown="onDrDown($event, node)"
          @pointerenter="onDrEnter($event, node)"
          @pointerleave="onDrLeave($event, node)"
          @pointermove="onDrMove($event, node)"
          @pointerup="onDrUp($event, node)"
      >
        <Group :node="node" :notation-type="data.type" :skin="skin"/>
      </g>
      <g
          v-else-if="AFFILIATION_TAGS.has(node.tag)"
          :id="vdomDomId(node, domIndex)"
          :data-comment="node.dataComment"
          :data-slot-name="node.slotName??''"
          :data-target-id="node.targetId"
          :transform="`translate(${node.x}, ${node.y})`"
          @click="onDrClick($event, node)"
          @pointerdown="onDrDown($event, node)"
          @pointerenter="onDrEnter($event, node)"
          @pointerleave="onDrLeave($event, node)"
          @pointermove="onDrMove($event, node)"
          @pointerup="onDrUp($event, node)"
      >
        <Slur v-if="node.special?.slur" :notation-type="notationType" :skin="skin" :v-dom="node"/>
        <Volta v-else-if="node.special?.volta !== undefined" :notation-type="notationType" :skin="skin" :v-dom="node"/>
        <Beam v-else-if="node.special?.beam" :notation-type="notationType" :skin="skin" :v-dom="node"/>
        <Arpeggio v-else-if="node.tag === 'arpeggio'" :notation-type="notationType" :skin="skin" :v-dom="node"/>
        <Strumming v-else-if="node.tag === 'strumming'" :notation-type="notationType" :skin="skin" :v-dom="node"/>
        <TabChord v-else-if="node.tag === 'tabChord'" :notation-type="notationType" :skin="skin" :v-dom="node"/>
        <TabSlap v-else-if="node.tag === 'tabSlap'" :notation-type="notationType" :skin="skin" :v-dom="node"/>
        <Bend v-else-if="node.tag === 'bend'" :notation-type="notationType" :skin="skin" :v-dom="node"/>
        <slot v-else-if="node.tag === 'slot'" :name="node.slotName" v-bind="{ node }">
          <component
              v-for="item in extensionsForSlot(node.slotName)"
              :key="`${item.name}:${node.targetId}`"
              :is="item.component"
              :music-score="data"
              :node="node"
              v-bind="resolveExtensionProps(item.extension)"
          />
        </slot>
        <Group v-else :node="node" :notation-type="data.type" :skin="skin"/>
      </g>
    </template>
  </svg>
</template>

<script lang="ts" setup>
import {computed, onMounted, ref, watch, type Component} from 'vue'
import {resolveMusicScoreToVDom} from '@/render/resolveNotation'
import {applyVDomUpdate, diffAndMergeVDom} from '@/render/update'
import {mergeSlotConfig} from '@/render/mergeSlotConfig'
import {fanoutExtensionEvent} from '@/render/fanoutExtensionEvent'
import defaultSkin from '@/skins/default.json'
import {MusicScoreTypeEnum} from '@/enums/musicScoreEnum'
import Group from './group.vue'
import Slur from './slur.vue'
import Volta from './volta.vue'
import Beam from './beam.vue'
import Arpeggio from './arpeggio.vue'
import Strumming from './strumming.vue'
import TabChord from './tabChord.vue'
import TabSlap from './tabSlap.vue'
import Bend from './bend.vue'
import {resolveVDomFromEvent} from '@/render/resolveVDomFromEvent'
import {findElementByVdomDomId, vdomDomId, vdomSelectionKey} from '@/render/vdomDomId'
import type {MusicScore} from '@/types/MusicScoreType'
import type {Skin, SkinPack, SlotConfig, SlotName, VDom} from '@/types/common'
import type {DrExtension, DrExtensionEvents} from '@/types/extension'

const AFFILIATION_TAGS = new Set<string>(['slot', 'affiliation', 'beam', 'noteBeam', 'arpeggio', 'strumming', 'tabChord', 'tabSlap', 'bend'])

const props = defineProps<{
  data: MusicScore
  /** 插槽配置，由扩展插件组合提供（如歌词、符号注释等），可随意开关；会覆盖 extensions 里的同名字段 */
  slotConfig?: SlotConfig
  /** 扩展贡献：自动合并 slotConfig，并在对应插槽渲染组件 */
  extensions?: DrExtension[]
  /** 多套皮肤包：{ default: SkinPack, active?: SkinPack }；default 覆盖内置；用于符号级 skinName 切换 */
  skin?: Skin
  skinName?: string
}>()
// 测试：更改谱子类型
const notationType = computed(() => props.data?.type ?? MusicScoreTypeEnum.StandardStaff)

const data = computed(() => props.data)//?? defaultMock.value
const skin = computed<Skin>(() =>
        props.skin ?? {
          default: defaultSkin as SkinPack,
        }
)

/** skinName 在 skin 中查得到则用 skinName，否则用 default */
const effectiveSkinName = computed(() => {
  const sn = props.skinName
  const s = skin.value
  return sn && s && sn in s ? sn : 'default'
})
onMounted(() => {
})
const skinPackForLayout = computed<SkinPack>(() => skin.value?.[effectiveSkinName.value] ?? defaultSkin)

type SlotExtensionItem = {
  name: string
  component: Component
  extension: DrExtension
}

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
    for (const [slotName, component] of Object.entries(ext.slots) as [SlotName, Component | undefined][]) {
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
  renderMusicScore: [vDom: VDom[]]
  'dr-click': [event: MouseEvent, vDom: VDom]
  'dr-down': [event: PointerEvent, vDom: VDom]
  'dr-up': [event: PointerEvent, vDom: VDom]
  'dr-move': [event: PointerEvent, vDom: VDom]
  'dr-enter': [event: PointerEvent, vDom: VDom]
  'dr-leave': [event: PointerEvent, vDom: VDom]
  /** 绑定在顶层 svg：命中解析为 vDom，空白区域 vDom 为 null */
  'top-click': [event: MouseEvent, vDom: VDom | null]
  'top-down': [event: PointerEvent, vDom: VDom | null]
  'top-up': [event: PointerEvent, vDom: VDom | null]
  'top-move': [event: PointerEvent, vDom: VDom | null]
  'top-enter': [event: PointerEvent, vDom: VDom]
  'top-leave': [event: PointerEvent, vDom: VDom]
}>()
const vDom = ref<VDom[]>([])
const svgRef = ref<SVGSVGElement | null>(null)
const topHoverVDom = ref<VDom | null>(null)

function findElementByVDom(node: VDom): SVGElement | null {
  const root = svgRef.value
  return root ? findElementByVdomDomId(root, node) : null
}

function onDrClick(event: MouseEvent, node: VDom) {
  dispatchExtension('dr-click', event, node)
  emit('dr-click', event, node)
}

function onDrDown(event: PointerEvent, node: VDom) {
  dispatchExtension('dr-down', event, node)
  emit('dr-down', event, node)
}

function onDrUp(event: PointerEvent, node: VDom) {
  dispatchExtension('dr-up', event, node)
  emit('dr-up', event, node)
}

function onDrMove(event: PointerEvent, node: VDom) {
  dispatchExtension('dr-move', event, node)
  emit('dr-move', event, node)
}

function onDrEnter(event: PointerEvent, node: VDom) {
  dispatchExtension('dr-enter', event, node)
  emit('dr-enter', event, node)
}

function onDrLeave(event: PointerEvent, node: VDom) {
  dispatchExtension('dr-leave', event, node)
  emit('dr-leave', event, node)
}

function resolveTopVDom(event: Event): VDom | null {
  return resolveVDomFromEvent(event, vDom.value)
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

const musicScoreToVDom = computed(() => resolveMusicScoreToVDom(notationType.value))

// data、slotConfig、skin、skinName 变化时重新计算 vDom，使用 diff 原地更新以提升性能
watch(
    [data, mergedSlotConfig, skinPackForLayout, effectiveSkinName],
    ([d, slotConfig]) => {
      const next = d
          ? musicScoreToVDom.value(d, slotConfig, {skin: skin.value, skinName: effectiveSkinName.value})
          : []
      vDom.value = diffAndMergeVDom(vDom.value, next)//next//
      dispatchExtension('renderMusicScore', vDom.value)
      emit('renderMusicScore', vDom.value)
    },
    {immediate: true, deep: true}
)

/**
 * 更新 VDom：传入 updater 对深拷贝后的 vDom 做修改（如替换某符号 skinName），仅替换有变化的节点，实现部分重渲染
 * @param updater (vDom: VDom[]) => VDom[] 用户修改后 return
 */
function updateVDomHandler(updater: (vDom: VDom[]) => VDom[]) {
  vDom.value = applyVDomUpdate(vDom.value, updater)
}

defineExpose({
  updateVDom: updateVDomHandler,
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
