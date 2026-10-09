import type {DrExtension, MusicScore, VDom} from '@deciphony/renderer'
import {shallowRef} from 'vue'
import MarkSlot from './components/MarkSlot.vue'
import {FLUTE_SLOT_H} from './flute/constants'
import {buildMarkPitchInfo, type MarkPitchInfo} from './markPitch'
import {ocarinaSlotHeight} from './ocarina/geometry'
import type {DrMarkOptions} from './types'
import {xiaoSlotHeight} from './xiao/constants'

/** 用于定位的音符 vDom（符头 / 简谱数字 / 品格数字） */
const NOTE_TAGS = new Set(['noteHead', 'noteNumber', 'tabNoteNumber'])

/** 各标记类型在 m-d 中需要的高度（未缩放） */
function markSlotHeight(options: DrMarkOptions): number {
  switch (options.type) {
    case 'flute':
      return FLUTE_SLOT_H
    case 'ocarina':
      return ocarinaSlotHeight(options.ocarina.model)
    case 'xiao':
      return xiaoSlotHeight(options.xiao.model)
  }
}

/**
 * 标记扩展：挂 m-d，在每个 noteSlot 第一个音符下方画标记。
 * type = 'flute'：按实际音高与 flute.key 对应笛子筒音的距离画六孔笛指法图（flute.key 必填）。
 * type = 'ocarina'：按 ocarina.model / key 画陶笛指法（单张图、吹口朝下；12 孔三角形，背面拇指孔画在底部两侧；吊坠椭圆）。
 * type = 'xiao'：按 xiao.model / key 画箫指法；单张图，背孔画在最上并左偏。
 * m-d 高度由扩展 slotConfig 给出（宿主可覆盖）；曲谱 height 需宿主自行留够。
 */
export function drMark(options: DrMarkOptions): DrExtension {
  const scale = options.scale ?? 1
  const noteVDomMap = shallowRef(new Map<string, VDom>())
  const pitchInfo = shallowRef<MarkPitchInfo>({midi: new Map(), tieEnds: new Set()})
  let pitchSource: MusicScore | null = null

  return {
    name: 'dr-mark',
    slotConfig: {'m-d': {h: Math.ceil(markSlotHeight(options) * scale)}},
    slots: {'m-d': MarkSlot},
    props: () => ({
      type: options.type,
      flute: options.type === 'flute' ? options.flute : undefined,
      ocarina: options.type === 'ocarina' ? options.ocarina : undefined,
      xiao: options.type === 'xiao' ? options.xiao : undefined,
      staves: options.staves,
      scale,
      color: options.color ?? '#303133',
      noteVDomMap,
      pitchInfo,
    }),
    on: {
      renderMusicScore(list) {
        const map = new Map<string, VDom>()
        let score: MusicScore | null = null
        for (const vdom of list) {
          if (vdom.targetId && NOTE_TAGS.has(vdom.tag) && !map.has(vdom.targetId)) map.set(vdom.targetId, vdom)
          score ??= vdom.slotData?.musicScore ?? null
        }
        noteVDomMap.value = map
        pitchSource = score ?? pitchSource
        if (pitchSource) pitchInfo.value = buildMarkPitchInfo(pitchSource)
      },
    },
  }
}

export {default as MarkSlot} from './components/MarkSlot.vue'
export {default as FluteFingeringView} from './flute/FluteFingering.vue'
export {
  FLUTE_FINGERINGS,
  FLUTE_KEYS,
  FLUTE_TUBE_MIDI,
  resolveFluteFingering,
} from './flute/fingering'
export {FLUTE_FINGERING_H, FLUTE_SLOT_H} from './flute/constants'
export {default as OcarinaFingeringView} from './ocarina/OcarinaFingering.vue'
export {OCARINA_FINGERINGS, OCARINA_TONIC_MIDI, resolveOcarinaFingering} from './ocarina/fingering'
export {OCARINA_SHAPES, ocarinaFingeringHeight, ocarinaSlotHeight} from './ocarina/geometry'
export type {OcarinaHole, OcarinaShape} from './ocarina/geometry'
export {default as XiaoFingeringView} from './xiao/XiaoFingering.vue'
export {XIAO_FINGERINGS, XIAO_KEYS, XIAO_TUBE_MIDI, resolveXiaoFingering} from './xiao/fingering'
export {XIAO_FINGERING_W, XIAO_FRONT_HOLES, xiaoFingeringHeight, xiaoSlotHeight} from './xiao/constants'
export {buildMarkPitchInfo, firstNoteId, measureFirstNoteIds} from './markPitch'
export type {MarkPitchInfo} from './markPitch'
export type {
  DrMarkOptions,
  DrMarkType,
  FluteFingering,
  FluteHolePattern,
  FluteKey,
  FluteMarkOptions,
  OcarinaHolePattern,
  OcarinaKey,
  OcarinaMarkOptions,
  OcarinaModel,
  XiaoFingering,
  XiaoKey,
  XiaoMarkOptions,
  XiaoModel,
} from './types'
