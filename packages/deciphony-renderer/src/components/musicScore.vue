<template>
  <svg :height="data.height" :viewBox="`0 0 ${data.width} ${data.height}`" :width="data.width"
       :style="{touchAction:'none'}"
       preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"
       @click="onTopClick"
       @pointerdown="onTopDown"
       @pointerenter="onTopSvgEnter"
       @pointerleave="onTopSvgLeave"
       @pointermove="onTopMove"
       @pointerup="onTopUp"
       ref="svgRef">
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
        <Slur v-if="node.special?.slur" :v-dom="node"/>
        <Volta v-else-if="node.special?.volta !== undefined" :v-dom="node"/>
        <Beam v-else-if="node.special?.beam" :v-dom="node"/>
        <slot v-else-if="node.tag === 'slot'" :name="node.slotName" v-bind="{ node }">

        </slot>
        <Group v-else :node="node" :notation-type="data.type" :skin="skin"/>
      </g>
    </template>
  </svg>
</template>

<script lang="ts" setup>
import {computed, ref, watch} from 'vue'
import {musicScoreToVDom as musicScoreToVDomNumber} from '@/numberNotation/render/musicScoreToVDom'
import {musicScoreToVDom as musicScoreToVDomStandard} from '@/standardStaff/render/musicScoreToVDom'
import {applyVDomUpdate, diffAndMergeVDom} from '@/render/update'
import {defaultSkin, defaultSkinBlue, defaultSkinRed} from '@/skins/defaultSkin'
import {MusicScoreTypeEnum} from '@/enums/musicScoreEnum'
import Group from './group.vue'
import Slur from './slur.vue'
import Volta from './volta.vue'
import Beam from './beam.vue'
import {resolveVDomFromEvent} from '@/render/resolveVDomFromEvent'
import {findElementByVdomDomId, vdomDomId, vdomSelectionKey} from '@/render/vdomDomId'
import type {MusicScore} from '@/types/MusicScoreType'
import type {Skin, SkinPack, SlotConfig, VDom} from '@/types/common'

const AFFILIATION_TAGS = new Set<string>(['slot', 'affiliation', 'beam', 'noteBeam'])

const props = defineProps<{
  data: MusicScore
  /** 插槽配置，由扩展插件组合提供（如歌词、符号注释等），可随意开关 */
  slotConfig?: SlotConfig
  /** 多套皮肤包：{ default: SkinPack, active?: SkinPack }；default 覆盖内置；用于符号级 skinName 切换 */
  skin?: Skin
  skinName?: string
}>()
// 测试：更改谱子类型
const notationType = computed(() => props.data?.type ?? MusicScoreTypeEnum.NumberNotation)

const data = computed(() => props.data)//?? defaultMock.value
const skin = computed<Skin>(() =>
        props.skin ?? {
          default: defaultSkin,
          red: defaultSkinRed,
          blue: defaultSkinBlue,
        }
)

/** skinName 在 skin 中查得到则用 skinName，否则用 default */
const effectiveSkinName = computed(() => {
  const sn = props.skinName
  const s = skin.value
  return sn && s && sn in s ? sn : 'default'
})

const skinPackForLayout = computed<SkinPack>(() => skin.value?.[effectiveSkinName.value] ?? defaultSkin)

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
  emit('dr-click', event, node)
}

function onDrDown(event: PointerEvent, node: VDom) {
  emit('dr-down', event, node)
}

function onDrUp(event: PointerEvent, node: VDom) {
  emit('dr-up', event, node)
}

function onDrMove(event: PointerEvent, node: VDom) {
  emit('dr-move', event, node)
}

function onDrEnter(event: PointerEvent, node: VDom) {
  emit('dr-enter', event, node)
}

function onDrLeave(event: PointerEvent, node: VDom) {
  emit('dr-leave', event, node)
}

function resolveTopVDom(event: Event): VDom | null {
  return resolveVDomFromEvent(event, vDom.value)
}

function syncTopHover(event: PointerEvent) {
  const node = resolveTopVDom(event)
  const prev = topHoverVDom.value
  if (prev === node) return
  if (prev) emit('top-leave', event, prev)
  if (node) emit('top-enter', event, node)
  topHoverVDom.value = node
}

function onTopClick(event: MouseEvent) {
  emit('top-click', event, resolveTopVDom(event))
}

function onTopDown(event: PointerEvent) {
  syncTopHover(event)
  emit('top-down', event, resolveTopVDom(event))
}

function onTopUp(event: PointerEvent) {
  emit('top-up', event, resolveTopVDom(event))
}

function onTopMove(event: PointerEvent) {
  syncTopHover(event)
  emit('top-move', event, resolveTopVDom(event))
}

function onTopSvgEnter(event: PointerEvent) {
  syncTopHover(event)
}

function onTopSvgLeave(event: PointerEvent) {
  const prev = topHoverVDom.value
  if (prev) emit('top-leave', event, prev)
  topHoverVDom.value = null
}

const musicScoreToVDom = computed(() =>
    notationType.value === MusicScoreTypeEnum.NumberNotation ? musicScoreToVDomNumber : musicScoreToVDomStandard
)

// data、slotConfig、skin、skinName 变化时重新计算 vDom，使用 diff 原地更新以提升性能
watch(
    [data, () => props.slotConfig, skinPackForLayout, effectiveSkinName],
    ([d, slotConfig]) => {
      const next = d
          ? musicScoreToVDom.value(d, slotConfig, {skin: skin.value, skinName: effectiveSkinName.value})
          : []
      vDom.value = diffAndMergeVDom(vDom.value, next)//next//
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
