<script lang="ts" setup>
import type {MusicScore, VDom} from '@deciphony/renderer'
import {computed, unref, type Ref} from 'vue'
import FluteFingering from '../flute/FluteFingering.vue'
import {FLUTE_FINGERING_H, FLUTE_PAD_TOP} from '../flute/constants'
import {resolveFluteFingering} from '../flute/fingering'
import OcarinaFingering from '../ocarina/OcarinaFingering.vue'
import {OCARINA_PAD_TOP, ocarinaFingeringHeight} from '../ocarina/geometry'
import {resolveOcarinaFingering} from '../ocarina/fingering'
import XiaoFingering from '../xiao/XiaoFingering.vue'
import {XIAO_PAD_TOP, xiaoFingeringHeight} from '../xiao/constants'
import {resolveXiaoFingering} from '../xiao/fingering'
import {measureFirstNoteIds, type MarkPitchInfo} from '../markPitch'
import type {
  DrMarkType,
  FluteFingering as FluteFingeringType,
  FluteMarkOptions,
  OcarinaHolePattern,
  OcarinaMarkOptions,
  XiaoFingering as XiaoFingeringType,
  XiaoMarkOptions,
} from '../types'

const props = defineProps<{
  node: VDom
  musicScore: MusicScore
  type: DrMarkType
  flute?: FluteMarkOptions
  ocarina?: OcarinaMarkOptions
  xiao?: XiaoMarkOptions
  staves?: number[]
  scale: number
  color: string
  /** 音符 id → 符头 / 简谱数字 vDom */
  noteVDomMap: Ref<Map<string, VDom>> | Map<string, VDom>
  pitchInfo: Ref<MarkPitchInfo> | MarkPitchInfo
}>()

defineOptions({inheritAttrs: false})

const visible = computed(() => {
  const {grandStaff, singleStaff} = props.node.slotData ?? {}
  if (!props.staves || !grandStaff || !singleStaff) return true
  return props.staves.includes(grandStaff.staves.indexOf(singleStaff))
})

type NoteAnchor = {id: string; x: number; midi: number}

/** 本小节每个 noteSlot 的第一个音符：音高 + 相对插槽的中心 x */
function collectNotes(skipTieEnd: boolean): NoteAnchor[] {
  if (!visible.value) return []
  const vdoms = unref(props.noteVDomMap)
  const {midi, tieEnds} = unref(props.pitchInfo)
  const out: NoteAnchor[] = []
  for (const id of measureFirstNoteIds(props.node.slotData?.measure)) {
    const pitch = midi.get(id)
    const vdom = vdoms.get(id)
    if (pitch == null || !vdom) continue
    if (skipTieEnd && tieEnds.has(id)) continue
    out.push({id, x: vdom.x + vdom.w / 2 - props.node.x, midi: pitch})
  }
  return out
}

type FluteCell = {id: string; x: number; fingering: FluteFingeringType | null}

const fluteCells = computed((): FluteCell[] => {
  const opts = props.flute
  if (props.type !== 'flute' || !opts?.key) return []
  return collectNotes(opts.skipTieEnd ?? true)
    .map((n) => ({id: n.id, x: n.x, fingering: resolveFluteFingering(n.midi, opts)}))
    .filter((c) => c.fingering || opts.showOutOfRange)
})

type OcarinaCell = {id: string; x: number; holes: OcarinaHolePattern | null}

const ocarinaCells = computed((): OcarinaCell[] => {
  const opts = props.ocarina
  if (props.type !== 'ocarina' || !opts?.key || !opts.model) return []
  return collectNotes(opts.skipTieEnd ?? true)
    .map((n) => ({id: n.id, x: n.x, holes: resolveOcarinaFingering(n.midi, opts)}))
    .filter((c) => c.holes || opts.showOutOfRange)
})

const ocarinaH = computed(() => (props.ocarina?.model ? ocarinaFingeringHeight(props.ocarina.model) : 0))

type XiaoCell = {id: string; x: number; fingering: XiaoFingeringType | null}

const xiaoCells = computed((): XiaoCell[] => {
  const opts = props.xiao
  if (props.type !== 'xiao' || !opts?.key || !opts.model) return []
  return collectNotes(opts.skipTieEnd ?? true)
    .map((n) => ({id: n.id, x: n.x, fingering: resolveXiaoFingering(n.midi, opts)}))
    .filter((c) => c.fingering || opts.showOutOfRange)
})

const xiaoH = computed(() => (props.xiao?.model ? xiaoFingeringHeight(props.xiao.model) : 0))
</script>

<template>
  <g class="dr-mark-slot">
    <g
      v-for="cell in fluteCells"
      :key="cell.id"
      :transform="`translate(${cell.x}, ${FLUTE_PAD_TOP * scale}) scale(${scale})`"
    >
      <FluteFingering v-if="cell.fingering" :color="color" :fingering="cell.fingering"/>
      <text v-else :fill="color" :y="FLUTE_FINGERING_H / 2" font-size="12" text-anchor="middle">?</text>
    </g>
    <g
      v-for="cell in ocarinaCells"
      :key="cell.id"
      :transform="`translate(${cell.x}, ${OCARINA_PAD_TOP * scale}) scale(${scale})`"
    >
      <OcarinaFingering v-if="cell.holes && ocarina" :color="color" :holes="cell.holes" :model="ocarina.model"/>
      <text v-else :fill="color" :y="ocarinaH / 2" font-size="12" text-anchor="middle">?</text>
    </g>
    <g
      v-for="cell in xiaoCells"
      :key="cell.id"
      :transform="`translate(${cell.x}, ${XIAO_PAD_TOP * scale}) scale(${scale})`"
    >
      <XiaoFingering v-if="cell.fingering && xiao" :color="color" :fingering="cell.fingering" :model="xiao.model"/>
      <text v-else :fill="color" :y="xiaoH / 2" font-size="12" text-anchor="middle">?</text>
    </g>
  </g>
</template>
