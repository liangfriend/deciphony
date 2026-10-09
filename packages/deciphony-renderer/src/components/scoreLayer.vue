<template>
  <g :data-layer="layerKey">
    <template v-for="(node, i) in nodes" :key="keys[i]">
      <g
          v-if="!AFFILIATION_TAGS.has(node.tag)"
          :id="nodeDomId(node, i)"
          @click="ctx.onClick($event, node)"
          @contextmenu="ctx.onContextMenu($event, node)"
          @pointerdown="ctx.onDown($event, node)"
          @pointerenter="ctx.onEnter($event, node)"
          @pointerleave="ctx.onLeave($event, node)"
          @pointermove="ctx.onMove($event, node)"
          @pointerup="ctx.onUp($event, node)"
      >
        <Group :node="node" :notation-type="ctx.notationType.value" :skin="ctx.skin.value"/>
      </g>
      <g
          v-else
          :id="nodeDomId(node, i)"
          :data-comment="node.dataComment"
          :data-slot-name="node.slotName??''"
          :data-target-id="node.targetId"
          :transform="`translate(${node.x}, ${node.y})`"
          @click="ctx.onClick($event, node)"
          @contextmenu="ctx.onContextMenu($event, node)"
          @pointerdown="ctx.onDown($event, node)"
          @pointerenter="ctx.onEnter($event, node)"
          @pointerleave="ctx.onLeave($event, node)"
          @pointermove="ctx.onMove($event, node)"
          @pointerup="ctx.onUp($event, node)"
      >
        <Slur v-if="node.special?.slur" :notation-type="ctx.notationType.value" :skin="ctx.skin.value" :v-dom="node"/>
        <Volta v-else-if="node.special?.volta !== undefined" :notation-type="ctx.notationType.value"
               :skin="ctx.skin.value" :v-dom="node"/>
        <Beam v-else-if="node.special?.beam" :notation-type="ctx.notationType.value" :skin="ctx.skin.value"
              :v-dom="node"/>
        <Arpeggio v-else-if="node.special?.arpeggio || node.tag === 'arpeggio'" :notation-type="ctx.notationType.value"
                  :skin="ctx.skin.value" :v-dom="node"/>
        <Strumming v-else-if="node.special?.strumming || node.tag === 'strumming'"
                   :notation-type="ctx.notationType.value" :skin="ctx.skin.value" :v-dom="node"/>
        <Pedal v-else-if="node.special?.pedal" :notation-type="ctx.notationType.value" :skin="ctx.skin.value"
               :v-dom="node"/>
        <Pitch v-else-if="node.special?.pitch" :notation-type="ctx.notationType.value" :skin="ctx.skin.value"
               :v-dom="node"/>
        <Trill v-else-if="node.special?.trill" :notation-type="ctx.notationType.value" :skin="ctx.skin.value"
               :v-dom="node"/>
        <Hairpin v-else-if="node.special?.hairpin" :notation-type="ctx.notationType.value" :skin="ctx.skin.value"
                 :v-dom="node"/>
        <LongRestNumber v-else-if="node.special?.longRestNumber" :notation-type="ctx.notationType.value"
                        :skin="ctx.skin.value" :v-dom="node"/>
        <MeasureNumber v-else-if="node.special?.measureNumber" :v-dom="node"/>
        <TabChord v-else-if="node.tag === 'tabChord'" :notation-type="ctx.notationType.value" :skin="ctx.skin.value"
                  :v-dom="node"/>
        <TabSlap v-else-if="node.tag === 'tabSlap'" :notation-type="ctx.notationType.value" :skin="ctx.skin.value"
                 :v-dom="node"/>
        <Bend v-else-if="node.tag === 'bend'" :notation-type="ctx.notationType.value" :skin="ctx.skin.value"
              :v-dom="node"/>
        <SlotOutlet v-else-if="node.tag === 'slot'" :node="node"/>
        <Group v-else :node="node" :notation-type="ctx.notationType.value" :skin="ctx.skin.value" local/>
      </g>
    </template>
  </g>
</template>

<script lang="ts" setup>
import {computed, inject, provide, toRef} from 'vue'
import Group from './group.vue'
import Slur from './slur.vue'
import Volta from './volta.vue'
import Beam from './beam.vue'
import Arpeggio from './arpeggio.vue'
import Strumming from './strumming.vue'
import Pedal from './pedal.vue'
import Pitch from './pitch.vue'
import Trill from './trill.vue'
import Hairpin from './hairpin.vue'
import LongRestNumber from './longRestNumber.vue'
import MeasureNumber from './measureNumber.vue'
import TabChord from './tabChord.vue'
import TabSlap from './tabSlap.vue'
import Bend from './bend.vue'
import SlotOutlet from './slotOutlet'
import {vdomDomId} from '@/render/vdomDomId'
import {DR_ROW_VDOMS_KEY, SCORE_LAYER_CONTEXT} from '@/render/incremental/layerContext'
import type {VDom} from '@/types/common'

defineOptions({name: 'ScoreLayer'})

const AFFILIATION_TAGS = new Set<string>(['slot', 'affiliation', 'beam', 'noteBeam', 'arpeggio', 'strumming', 'tabChord', 'tabSlap', 'bend', 'longRestNumber', 'measureNumber'])

const props = defineProps<{
  layerKey: string
  /** 本层要画的节点 */
  nodes: VDom[]
  /** 所在复谱表的全部节点（插槽组件 inject DR_ROW_VDOMS_KEY 取用） */
  rowNodes: VDom[]
}>()

const ctx = inject(SCORE_LAYER_CONTEXT)!
provide(DR_ROW_VDOMS_KEY, toRef(props, 'rowNodes'))

/** 无 targetId 的节点（边距等）按层内下标区分，带上层键避免跨行重复 id */
function nodeDomId(node: VDom, index: number): string {
  return node.targetId ? vdomDomId(node) : `${vdomDomId(node, index)}-${props.layerKey}`
}

/** v-for key：同 id 的多个节点（如简谱同一音的多个八度点）按出现次序再区分，避免重复 key 残留 DOM */
const keys = computed(() => {
  const seen = new Map<string, number>()
  return props.nodes.map((node, i) => {
    const id = nodeDomId(node, i)
    const n = seen.get(id) ?? 0
    seen.set(id, n + 1)
    return n ? `${id}#${n}` : id
  })
})
</script>
